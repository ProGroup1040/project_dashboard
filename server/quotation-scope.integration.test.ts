import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "./db";
import {
  createApprovalRequest,
  createQuotationV2,
  getEngineState,
  getPendingApprovals,
  getQuotationV2,
  listQuotationsV2,
  reviewApprovalRequest,
  saveEngineState,
  searchQuotationsV2,
  updateQuotationV2,
} from "./db-platform";
import { approvalLogs, quotationsV2 } from "../drizzle/schema";

const databaseUrl = process.env.DATABASE_URL;
const suffix = randomUUID().replace(/-/g, "").slice(0, 10);
const codeA = `OWN-A-${suffix}`;
const codeB = `OWN-B-${suffix}`;
const actorA = { userId: `pricing-user-a-${suffix}`, scope: "own" as const };
const actorB = { userId: `pricing-user-b-${suffix}`, scope: "own" as const };
const manager = { userId: `pricing-manager-${suffix}`, scope: "all" as const };
let quotationA: Awaited<ReturnType<typeof createQuotationV2>> | null = null;
let quotationB: Awaited<ReturnType<typeof createQuotationV2>> | null = null;
let approvalId: number | undefined;

describe.skipIf(!databaseUrl)("pricing quotation own/all scope", () => {
  beforeAll(async () => {
    quotationA = await createQuotationV2({
      quotationCode: codeA,
      createdByUserId: actorA.userId,
      engineerName: "Engineer A",
      clientName: "Scope Test A",
    });
    quotationB = await createQuotationV2({
      quotationCode: codeB,
      createdByUserId: actorB.userId,
      engineerName: "Engineer B",
      clientName: "Scope Test B",
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    if (quotationA?.id) await db.delete(approvalLogs).where(eq(approvalLogs.quotationId, quotationA.id));
    if (quotationB?.id) await db.delete(approvalLogs).where(eq(approvalLogs.quotationId, quotationB.id));
    await db.delete(quotationsV2).where(eq(quotationsV2.quotationCode, codeA));
    await db.delete(quotationsV2).where(eq(quotationsV2.quotationCode, codeB));
  });

  it("limits list, search, and direct reads to the authenticated owner", async () => {
    expect(quotationA?.id).toBeTypeOf("number");
    expect(quotationB?.id).toBeTypeOf("number");

    const ownRows = await listQuotationsV2(undefined, actorA);
    expect(ownRows.some(row => row.id === quotationA!.id)).toBe(true);
    expect(ownRows.some(row => row.id === quotationB!.id)).toBe(false);

    const managerRows = await listQuotationsV2(undefined, manager);
    expect(managerRows.some(row => row.id === quotationA!.id)).toBe(true);
    expect(managerRows.some(row => row.id === quotationB!.id)).toBe(true);

    expect(await getQuotationV2(quotationB!.id, actorA)).toBeNull();
    expect(await getQuotationV2(quotationB!.id, manager)).not.toBeNull();

    const ownSearch = await searchQuotationsV2({ query: suffix }, actorA);
    expect(ownSearch.some(row => row.id === quotationA!.id)).toBe(true);
    expect(ownSearch.some(row => row.id === quotationB!.id)).toBe(false);
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
});
