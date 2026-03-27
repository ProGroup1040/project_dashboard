import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  pricingBrands,
  pricingSpaces,
  pricingProducts,
  pricingProductTypes,
  pricingVariables,
  pricingComplexity,
  pricingBasketItems,
  pricingQuotations,
} from "../drizzle/schema";

// ── Brands ──────────────────────────────────────────────────
export async function getAllBrands() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingBrands).where(eq(pricingBrands.isActive, true));
}

// ── Spaces ──────────────────────────────────────────────────
export async function getSpacesByBrand(brandId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingSpaces)
    .where(and(eq(pricingSpaces.brandId, brandId), eq(pricingSpaces.isActive, true)));
}

// ── Products ─────────────────────────────────────────────────
export async function getProductsBySpace(spaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingProducts)
    .where(and(eq(pricingProducts.spaceId, spaceId), eq(pricingProducts.isActive, true)));
}

// ── Product Types ────────────────────────────────────────────
export async function getProductTypesByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingProductTypes)
    .where(and(eq(pricingProductTypes.productId, productId), eq(pricingProductTypes.isActive, true)));
}

// ── Variables ────────────────────────────────────────────────
export async function getVariablesByProductType(productTypeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingVariables)
    .where(and(eq(pricingVariables.productTypeId, productTypeId), eq(pricingVariables.isActive, true)));
}

// ── Complexity ───────────────────────────────────────────────
export async function getComplexityByProductType(productTypeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingComplexity)
    .where(eq(pricingComplexity.productTypeId, productTypeId));
}

// ── Basket ───────────────────────────────────────────────────
export async function getBasketItems(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingBasketItems)
    .where(eq(pricingBasketItems.sessionId, sessionId));
}

export async function addBasketItem(item: {
  sessionId: string;
  brandId: number;
  spaceId: number;
  productId: number;
  productTypeId: number;
  selectedVariables: string; // JSON
  complexityLevel: "basic" | "standard" | "premium" | "custom";
  quantity: number;
  basePrice: number;
  materialsTotal: number;
  addonsTotal: number;
  complexityMultiplier: string;
  finalPrice: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(pricingBasketItems).values(item);
  return { success: true };
}

export async function removeBasketItem(id: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(pricingBasketItems)
    .where(and(eq(pricingBasketItems.id, id), eq(pricingBasketItems.sessionId, sessionId)));
  return { success: true };
}

export async function clearBasket(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(pricingBasketItems).where(eq(pricingBasketItems.sessionId, sessionId));
  return { success: true };
}

// ── Quotations ───────────────────────────────────────────────
export async function saveQuotation(q: {
  sessionId: string;
  quotationNumber: string;
  clientName?: string;
  projectName?: string;
  engineerName?: string;
  totalAmount: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(pricingQuotations).values(q);
  return { success: true };
}

export async function getQuotationsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingQuotations)
    .where(eq(pricingQuotations.sessionId, sessionId));
}
