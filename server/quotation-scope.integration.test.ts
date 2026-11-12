import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "./db";
import {
  addKitchenUnit,
  createApprovalRequest,
  createKitchenQuotation,
  deleteKitchenUnit,
  getKitchenQuotationById,
  getKitchenQuotations,
  getKitchenUnitsByQuotation,
  createQuotationV2,
  getEngineState,
  getPendingApprovals,
  getQuotationKPIs,
  getQuotationV2,
  listQuotationsV2,
  reviewApprovalRequest,
  saveEngineState,
  searchQuotationsV2,
  updateQuotationV2,
} from "./db-platform";
import { approvalLogs, kitchenQuotations, kitchenUnits, quotationsV2 } from "../drizzle/schema";

const databaseUrl = process.env.DATABASE_URL;
const suffix = randomUUID().replace(/-/g, "").slice(0, 10);
const codeA = `OWN-A-${suffix}`;
const codeB = `OWN-B-${suffix}`;
const legacyCode = `LEG-${suffix}`;
const actorA = { userId: `pricing-user-a-${suffix}`, scope: "own" as const };
const actorB = { userId: `pricing-user-b-${suffix}`, scope: "own" as const };
const manager = { userId: `pricing-manager-${suffix}`, scope: "all" as const };
let quotationA: Awaited<ReturnType<typeof createQuotationV2>> | null = null;
let quotationB: Awaited<ReturnType<typeof createQuotationV2>> | null = null;
let legacyQuotation: Awaited<ReturnType<typeof createKitchenQuotation>> | null = null;
let legacyUnitId: number | undefined;
let approvalId: number | undefined;

describe.skipIf(!databaseUrl)("pricing quotation own/all scope", () => {
  beforeAll(async () => {
    quotationA = await createQuotationV2({
      quotationCode: codeA,
      brandKey: "scope-test",
      createdByUserId: actorA.userId,
      engineerName: "Engineer A",
      clientName: "Scope Test A",
    });
    quotationB = await createQuotationV2({
      quotationCode: codeB,
      brandKey: "scope-test",
      createdByUserId: actorB.userId,
      engineerName: "Engineer B",
      clientName: "Scope Test B",
    });

    legacyQuotation = await createKitchenQuotation({
      quotationCode: legacyCode,
      clientName: "Legacy Scope Test",
      engineerName: "Engineer A",
    }, actorA);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    if (quotationA?.id) await db.delete(approvalLogs).where(eq(approvalLogs.quotationId, quotationA.id));
    if (quotationB?.id) await db.delete(approvalLogs).where(eq(approvalLogs.quotationId, quotationB.id));
    if (legacyQuotation?.id) await db.delete(kitchenUnits).where(eq(kitchenUnits.quotationId, legacyQuotation.id));
    if (legacyQuotation?.id) await db.delete(kitchenQuotations).where(eq(kitchenQuotations.id, legacyQuotation.id));
    await db.delete(quotationsV2).where(eq(quotationsV2.quotationCode, codeA));
    await db.delete(quotationsV2).where(eq(quotationsV2.quotationCode, codeB));
  });

  it("limits list, search, and direct reads to the authenticated owner", async () => {
    expect(quotationA?.id).toBeTypeOf("number");
    expect(quotationB?.id).toBeTypeOf("number");

    const ownRows = await listQuotationsV2(undefined, actorA);
    expect(ownRows.some(row => row.id === quotationA!.id)).toBe(true);
    expect(ownRows.some(row => row.id === quotationB!.id)).toBe(false);

    const ownBrandRows = await listQuotationsV2("scope-test", actorA);
    expect(ownBrandRows.map(row => row.id)).toEqual([quotationA!.id]);

    const managerRows = await listQuotationsV2(undefined, manager);
    expect(managerRows.some(row => row.id === quotationA!.id)).toBe(true);
    expect(managerRows.some(row => row.id === quotationB!.id)).toBe(true);

    expect(await getQuotationV2(quotationB!.id, actorA)).toBeNull();
    expect(await getQuotationV2(quotationB!.id, manager)).not.toBeNull();

    const ownSearch = await searchQuotationsV2({ query: suffix }, actorA);
    expect(ownSearch.some(row => row.id === quotationA!.id)).toBe(true);
    expect(ownSearch.some(row => row.id === quotationB!.id)).toBe(false);

    const ownKpis = await getQuotationKPIs("scope-test", actorA);
    const managerKpis = await getQuotationKPIs("scope-test", manager);
    expect(ownKpis.total).toBe(1);
    expect(managerKpis.total).toBe(2);
  });

  it("blocks cross-owner edits, engine-state reads, and approval actions", async () => {
    await expect(updateQuotationV2(quotationB!.id, { notes: "cross-owner" }, actorA))
      .rejects.toThrow("Quotation not found or access denied");
    expect(await getEngineState(quotationB!.id, actorA)).toBeNull();
    await expect(saveEngineState(quotationB!.id, "{}", {}, actorA))
      .rejects.toThrow("Quotation not found or access denied");

    await createApprovalRequest({
      quotationId: quotationA!.id,
      requestType: "discount",
      requestedBy: "ignored-client-value",
      reason: "scope test",
    }, actorA);

    const ownApprovals = await getPendingApprovals(actorA);
    const otherApprovals = await getPendingApprovals(actorB);
    const approval = ownApprovals.find(row => row.quotationId === quotationA!.id);
    expect(approval).toBeDefined();
    approvalId = approval?.id;
    expect(otherApprovals.some(row => row.id === approvalId)).toBe(false);

    await expect(reviewApprovalRequest(approvalId!, {
      status: "approved",
      reviewedBy: "forged-reviewer",
    }, actorB)).rejects.toThrow("Approval not found or access denied");
  });
  it("applies the same owner checks to legacy kitchen quotations and units", async () => {
    expect(legacyQuotation?.id).toBeTypeOf("number");
    const ownerList = await getKitchenQuotations(actorA);
    const otherList = await getKitchenQuotations(actorB);
    const managerList = await getKitchenQuotations(manager);
    expect(ownerList.some(row => row.id === legacyQuotation!.id)).toBe(true);
    expect(otherList.some(row => row.id === legacyQuotation!.id)).toBe(false);
    expect(managerList.some(row => row.id === legacyQuotation!.id)).toBe(true);
    expect(await getKitchenQuotationById(legacyQuotation!.id, actorB)).toBeNull();

    const unit = await addKitchenUnit({
      quotationId: legacyQuotation!.id,
      unitNumber: 1,
      location: "lower",
      width: 60,
      height: 85,
      totalArea: "0.51",
      sortOrder: 0,
    }, actorA);
    expect(unit?.id).toBeTypeOf("number");
    legacyUnitId = unit?.id;

    await expect(getKitchenUnitsByQuotation(legacyQuotation!.id, actorB))
      .rejects.toThrow("Quotation not found or access denied");
    await expect(addKitchenUnit({
      quotationId: legacyQuotation!.id,
      unitNumber: 2,
      location: "upper",
      width: 60,
      height: 70,
      totalArea: "0.42",
    }, actorB)).rejects.toThrow("Quotation not found or access denied");
    await expect(deleteKitchenUnit(legacyUnitId!, actorB))
      .rejects.toThrow("Quotation not found or access denied");
    await deleteKitchenUnit(legacyUnitId!, actorA);
    legacyUnitId = undefined;
  });

});
