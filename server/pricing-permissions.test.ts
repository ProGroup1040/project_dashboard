import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

function makeCaller(permissions: { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }) {
  const ctx = {
    user: null,
    pricingActor: {
      userId: "viewer-1",
      displayName: "Pricing Viewer",
      role: "sales_engineer",
      engineerId: 1,
      scope: "own" as const,
      permissions,
      catalogPermissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    },
    req: { headers: {}, protocol: "https" },
    res: { clearCookie: () => undefined },
  } as never;
  return appRouter.createCaller(ctx);
}

describe("kitchen quotation write permissions", () => {
  const viewOnly = { canView: true, canAdd: false, canEdit: false, canDelete: false };

  it("denies quotation creation to a view-only pricing user", async () => {
    const caller = makeCaller(viewOnly);
    await expect(caller.kitchen.createQuotation({ quotationCode: "VIEW-ONLY" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies adding units to a view-only pricing user", async () => {
    const caller = makeCaller(viewOnly);
    await expect(caller.kitchen.addUnit({
      quotationId: 1,
      unitNumber: 1,
      location: "lower",
      width: 60,
      height: 85,
      totalArea: "0.51",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies deleting units without delete permission", async () => {
    const caller = makeCaller({ canView: true, canAdd: true, canEdit: true, canDelete: false });
    await expect(caller.kitchen.deleteUnit({ id: 1 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
