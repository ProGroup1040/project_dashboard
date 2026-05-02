import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  playbookItems, mediaLibrary, salesScripts, transportRules,
  quotationsV2, approvalLogs,
  kitchenMaterials, kitchenAccessories, kitchenMarble, kitchenCladding,
} from "../drizzle/schema";

// ─── Transport Rules ─────────────────────────────────────────────────────────
export async function getTransportRules() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  return db.select().from(transportRules).where(eq(transportRules.isActive, true)).orderBy(transportRules.governorate);
}

export async function seedTransportRules() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  const GOVERNORATES = [
    { governorate: "القاهرة", basePrice: 800, carryingPrice: 200 },
    { governorate: "الجيزة", basePrice: 800, carryingPrice: 200 },
    { governorate: "الإسكندرية", basePrice: 1500, carryingPrice: 300 },
    { governorate: "الشرقية", basePrice: 1200, carryingPrice: 250 },
    { governorate: "القليوبية", basePrice: 900, carryingPrice: 200 },
    { governorate: "المنوفية", basePrice: 1100, carryingPrice: 250 },
    { governorate: "الغربية", basePrice: 1200, carryingPrice: 250 },
    { governorate: "كفر الشيخ", basePrice: 1400, carryingPrice: 300 },
    { governorate: "الدقهلية", basePrice: 1300, carryingPrice: 300 },
    { governorate: "دمياط", basePrice: 1400, carryingPrice: 300 },
    { governorate: "بورسعيد", basePrice: 1600, carryingPrice: 350 },
    { governorate: "الإسماعيلية", basePrice: 1400, carryingPrice: 300 },
    { governorate: "السويس", basePrice: 1500, carryingPrice: 300 },
    { governorate: "الفيوم", basePrice: 1200, carryingPrice: 250 },
    { governorate: "بني سويف", basePrice: 1300, carryingPrice: 300 },
    { governorate: "المنيا", basePrice: 1500, carryingPrice: 350 },
    { governorate: "أسيوط", basePrice: 1800, carryingPrice: 400 },
    { governorate: "سوهاج", basePrice: 2000, carryingPrice: 400 },
    { governorate: "قنا", basePrice: 2200, carryingPrice: 450 },
    { governorate: "الأقصر", basePrice: 2400, carryingPrice: 500 },
    { governorate: "أسوان", basePrice: 2600, carryingPrice: 500 },
    { governorate: "البحيرة", basePrice: 1300, carryingPrice: 300 },
    { governorate: "مرسى مطروح", basePrice: 2000, carryingPrice: 400 },
    { governorate: "شمال سيناء", basePrice: 2000, carryingPrice: 400 },
    { governorate: "جنوب سيناء", basePrice: 2200, carryingPrice: 450 },
    { governorate: "البحر الأحمر", basePrice: 2500, carryingPrice: 500 },
    { governorate: "الوادي الجديد", basePrice: 2800, carryingPrice: 500 },
  ];
  const existing = await db.select().from(transportRules);
  if (existing.length === 0) {
    await db.insert(transportRules).values(GOVERNORATES.map(g => ({ ...g, pricePerKm: 0, isActive: true })));
  }
}

// ─── Playbook ─────────────────────────────────────────────────────────────────
export async function getPlaybookItems(category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  if (category) {
    return db.select().from(playbookItems).where(
      and(eq(playbookItems.isActive, true), eq(playbookItems.category, category as any))
    );
  }
  return db.select().from(playbookItems).where(eq(playbookItems.isActive, true));
}

export async function getPlaybookItem(itemKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  const items = await db.select().from(playbookItems).where(eq(playbookItems.itemKey, itemKey));
  return items[0] || null;
}

export async function upsertPlaybookItem(data: {
  itemKey: string; itemNameAr: string; itemNameEn?: string;
  category: "material" | "accessory" | "cladding" | "marble" | "transport" | "labor";
  technicalDescription?: string; salesExplanation?: string;
  whenToRecommend?: string; whenNotToRecommend?: string;
  commonObjections?: string; objectionAnswers?: string; tags?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(playbookItems).where(eq(playbookItems.itemKey, data.itemKey));
  if (existing.length > 0) {
    await db.update(playbookItems).set({ ...data, updatedAt: new Date() }).where(eq(playbookItems.itemKey, data.itemKey));
  } else {
    await db.insert(playbookItems).values(data);
  }
}

// ─── Media Library ────────────────────────────────────────────────────────────
export async function getMediaByItemKey(itemKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  return db.select().from(mediaLibrary).where(
    and(eq(mediaLibrary.itemKey, itemKey), eq(mediaLibrary.isActive, true))
  ).orderBy(desc(mediaLibrary.priorityLevel));
}

export async function addMediaItem(data: {
  itemKey: string; nameAr: string;
  fileType: "image" | "video" | "render" | "document";
  fileUrl: string; thumbnailUrl?: string;
  usageType: "client_presentation" | "training" | "objection_handling" | "showroom";
  script?: string; priorityLevel?: number; tags?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  await db.insert(mediaLibrary).values({ ...data, isActive: true });
}

// ─── Sales Scripts ────────────────────────────────────────────────────────────
export async function getSalesScript(itemKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  const scripts = await db.select().from(salesScripts).where(
    and(eq(salesScripts.itemKey, itemKey), eq(salesScripts.isActive, true))
  );
  return scripts[0] || null;
}

export async function upsertSalesScript(data: {
  itemKey: string; shortClientExplanation?: string; premiumExplanation?: string;
  objectionResponse?: string; whatsappFollowUp?: string; showroomPresentationLine?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(salesScripts).where(eq(salesScripts.itemKey, data.itemKey));
  if (existing.length > 0) {
    await db.update(salesScripts).set({ ...data, updatedAt: new Date() }).where(eq(salesScripts.itemKey, data.itemKey));
  } else {
    await db.insert(salesScripts).values({ ...data, language: "ar", isActive: true });
  }
}

// ─── Quotations V2 ────────────────────────────────────────────────────────────
export async function createQuotationV2(data: Partial<typeof quotationsV2.$inferInsert> & { quotationCode: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  await db.insert(quotationsV2).values({ ...data, status: "draft", approvalStatus: "not_required" });
  const result = await db.select().from(quotationsV2).where(eq(quotationsV2.quotationCode, data.quotationCode));
  return result[0];
}

export async function updateQuotationV2(id: number, data: Partial<typeof quotationsV2.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  await db.update(quotationsV2).set({ ...data, updatedAt: new Date() }).where(eq(quotationsV2.id, id));
}

export async function getQuotationV2(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(quotationsV2).where(eq(quotationsV2.id, id));
  return result[0] || null;
}

export async function listQuotationsV2(brandKey?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  if (brandKey) {
    return db.select().from(quotationsV2).where(eq(quotationsV2.brandKey, brandKey)).orderBy(desc(quotationsV2.createdAt));
  }
  return db.select().from(quotationsV2).orderBy(desc(quotationsV2.createdAt)).limit(50);
}

// ─── Approval Logs ────────────────────────────────────────────────────────────
export async function createApprovalRequest(data: {
  quotationId: number; requestType: "discount" | "free_item" | "price_override" | "final_approval";
  requestedBy: string; requestedValue?: string; reason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  await db.insert(approvalLogs).values({ ...data, status: "pending" });
}

export async function reviewApprovalRequest(id: number, data: {
  status: "approved" | "rejected"; reviewedBy: string; reviewNote?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  await db.update(approvalLogs).set({ ...data, reviewedAt: new Date() }).where(eq(approvalLogs.id, id));
}

export async function getPendingApprovals() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  return db.select().from(approvalLogs).where(eq(approvalLogs.status, "pending")).orderBy(desc(approvalLogs.createdAt));
}

// ─── Smart Warnings Engine ────────────────────────────────────────────────────
export function generateWarnings(data: {
  selectedAccessories: { id: number; qty: number }[];
  marbleSelected: boolean;
  transportSelected: boolean;
  discountPercentage: number;
  freeItemsCount: number;
  grandTotal: number;
  minimumTarget?: number;
  accessoriesTotalPrice: number;
  totalPrice: number;
  hasPlaybookForAllItems: boolean;
}): { type: string; message: string; severity: "error" | "warning" | "info" }[] {
  const warnings: { type: string; message: string; severity: "error" | "warning" | "info" }[] = [];

  if (data.selectedAccessories.length === 0) {
    warnings.push({ type: "missing_accessories", message: "لم يتم اختيار أي إكسسوارات", severity: "warning" });
  }
  if (!data.marbleSelected) {
    warnings.push({ type: "missing_marble", message: "لم يتم اختيار الرخام / الكونتر", severity: "warning" });
  }
  if (!data.transportSelected) {
    warnings.push({ type: "missing_transport", message: "لم يتم إضافة النقل والتركيب", severity: "warning" });
  }
  if (data.freeItemsCount > 2) {
    warnings.push({ type: "too_many_free_items", message: `عدد البنود المجانية (${data.freeItemsCount}) مرتفع — يحتاج موافقة`, severity: "error" });
  }
  if (data.discountPercentage > 15) {
    warnings.push({ type: "high_discount", message: `الخصم (${data.discountPercentage.toFixed(1)}%) يتجاوز الحد المسموح (15%) — يحتاج موافقة مدير`, severity: "error" });
  }
  if (data.totalPrice > 0 && data.accessoriesTotalPrice / data.totalPrice > 0.4) {
    warnings.push({ type: "high_accessories_ratio", message: "نسبة الإكسسوارات مرتفعة جداً (أكثر من 40% من الإجمالي)", severity: "warning" });
  }
  if (data.minimumTarget && data.grandTotal < data.minimumTarget) {
    warnings.push({ type: "below_minimum_price", message: `السعر النهائي أقل من الحد الأدنى المستهدف (${data.minimumTarget.toLocaleString()} ج)`, severity: "error" });
  }
  if (!data.hasPlaybookForAllItems) {
    warnings.push({ type: "missing_playbook", message: "بعض البنود لا تحتوي على Playbook أو سكريبت مبيعات", severity: "info" });
  }

  return warnings;
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
export async function getQuotationKPIs(brandKey?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!db) throw new Error("Database not available");
  const filter = brandKey ? eq(quotationsV2.brandKey, brandKey) : undefined;
  const all = filter
    ? await db.select().from(quotationsV2).where(filter)
    : await db.select().from(quotationsV2);

  const total = all.length;
  const totalValue = all.reduce((s: number, q) => s + (q.grandTotal || 0), 0);
  const avgValue = total > 0 ? Math.round(totalValue / total) : 0;
  const approved = all.filter(q => q.status === "approved" || q.status === "accepted").length;
  const drafts = all.filter(q => q.status === "draft").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sum = (key: string) => all.reduce((s: number, q: any) => s + (q[key] || 0), 0);
  const avgMaterials = total > 0 ? Math.round(sum("materialsTotalPrice") / total) : 0;
  const avgAccessories = total > 0 ? Math.round(sum("accessoriesTotalPrice") / total) : 0;
  const avgMarble = total > 0 ? Math.round(sum("marbleTotalPrice") / total) : 0;
  const avgTransport = total > 0 ? Math.round(sum("transportTotalPrice") / total) : 0;

  return { total, totalValue, avgValue, approved, drafts, avgMaterials, avgAccessories, avgMarble, avgTransport };
}
