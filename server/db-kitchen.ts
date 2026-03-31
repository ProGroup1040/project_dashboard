import { eq, asc } from "drizzle-orm";
import { getDb } from "./db";
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

export async function createKitchenQuotation(data: typeof kitchenQuotations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(kitchenQuotations).values(data);
  return result[0];
}

export async function getKitchenQuotations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kitchenQuotations).orderBy(asc(kitchenQuotations.createdAt));
}

export async function getKitchenQuotationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(kitchenQuotations).where(eq(kitchenQuotations.id, id));
  return rows[0] ?? null;
}

export async function addKitchenUnit(data: typeof kitchenUnits.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(kitchenUnits).values(data);
  return result[0];
}

export async function getKitchenUnitsByQuotation(quotationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kitchenUnits).where(eq(kitchenUnits.quotationId, quotationId)).orderBy(asc(kitchenUnits.sortOrder));
}

export async function deleteKitchenUnit(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(kitchenUnits).where(eq(kitchenUnits.id, id));
}
