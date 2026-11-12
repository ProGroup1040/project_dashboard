import { eq, asc } from "drizzle-orm";
import { getDb } from "./db";
import type { PricingRecordScope } from "./db-platform";
import {
  kitchenMaterials,
  kitchenAccessories,
  kitchenMarble,
  kitchenCladding,
  kitchenQuotations,
  kitchenUnits,
} from "../drizzle/schema";

export async function getKitchenMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kitchenMaterials).where(eq(kitchenMaterials.isActive, true)).orderBy(asc(kitchenMaterials.sortOrder));
}

export async function getKitchenAccessories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kitchenAccessories).where(eq(kitchenAccessories.isActive, true)).orderBy(asc(kitchenAccessories.sortOrder));
}

/** Admin-only catalog read. Includes inactive items so they can be restored or reviewed. */
export async function getAllKitchenAccessoriesAdmin() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.select().from(kitchenAccessories).orderBy(asc(kitchenAccessories.sortOrder));
}

export async function createKitchenAccessory(data: typeof kitchenAccessories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const inserted = await db.insert(kitchenAccessories).values(data).$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Failed to create kitchen accessory: insert ID was not returned");
  const rows = await db.select().from(kitchenAccessories).where(eq(kitchenAccessories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateKitchenAccessory(id: number, data: Partial<typeof kitchenAccessories.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(kitchenAccessories).set(data).where(eq(kitchenAccessories.id, id));
  const rows = await db.select().from(kitchenAccessories).where(eq(kitchenAccessories.id, id));
  return rows[0] ?? null;
}

/** Soft-delete to preserve historical quotation references. */
export async function deactivateKitchenAccessory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(kitchenAccessories).set({ isActive: false }).where(eq(kitchenAccessories.id, id));
  return { success: true };
}

export async function getKitchenMarble() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kitchenMarble).where(eq(kitchenMarble.isActive, true)).orderBy(asc(kitchenMarble.sortOrder));
}

export async function getKitchenCladding() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kitchenCladding).where(eq(kitchenCladding.isActive, true)).orderBy(asc(kitchenCladding.sortOrder));
}

export async function createKitchenQuotation(data: Omit<typeof kitchenQuotations.$inferInsert, "createdByUserId">, actor: PricingRecordScope) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const inserted = await db.insert(kitchenQuotations).values({ ...data, createdByUserId: actor.userId }).$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Failed to create kitchen quotation: insert ID was not returned");
  const rows = await db.select().from(kitchenQuotations).where(eq(kitchenQuotations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getKitchenQuotations(actor: PricingRecordScope) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const query = db.select().from(kitchenQuotations).orderBy(asc(kitchenQuotations.createdAt));
  if (actor.scope === "all") return query;
  return db.select().from(kitchenQuotations).where(eq(kitchenQuotations.createdByUserId, actor.userId)).orderBy(asc(kitchenQuotations.createdAt));
}

export async function getKitchenQuotationById(id: number, actor: PricingRecordScope) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select().from(kitchenQuotations).where(eq(kitchenQuotations.id, id)).limit(1);
  if (!rows[0] || (actor.scope === "own" && rows[0].createdByUserId !== actor.userId)) return null;
  return rows[0];
}

export async function addKitchenUnit(data: typeof kitchenUnits.$inferInsert, actor: PricingRecordScope) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (!(await getKitchenQuotationById(data.quotationId, actor))) throw new Error("Quotation not found or access denied");
  const inserted = await db.insert(kitchenUnits).values(data).$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Failed to create kitchen unit: insert ID was not returned");
  const rows = await db.select().from(kitchenUnits).where(eq(kitchenUnits.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getKitchenUnitsByQuotation(quotationId: number, actor: PricingRecordScope) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (!(await getKitchenQuotationById(quotationId, actor))) throw new Error("Quotation not found or access denied");
  return db.select().from(kitchenUnits).where(eq(kitchenUnits.quotationId, quotationId)).orderBy(asc(kitchenUnits.sortOrder));
}

export async function deleteKitchenUnit(id: number, actor: PricingRecordScope) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select().from(kitchenUnits).where(eq(kitchenUnits.id, id)).limit(1);
  if (!rows[0]) return;
  if (!(await getKitchenQuotationById(rows[0].quotationId, actor))) throw new Error("Quotation not found or access denied");
  await db.delete(kitchenUnits).where(eq(kitchenUnits.id, id));
}
