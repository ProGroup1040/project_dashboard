import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===================== PROJECT TABLES =====================

/**
 * Project users with custom roles for the apartment project system.
 * Separate from OAuth users - uses username/password login.
 */
export const projectUsers = mysqlTable("project_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: text("displayName").notNull(),
  role: mysqlEnum("role", ["admin", "engineer", "aftersales", "client"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectUser = typeof projectUsers.$inferSelect;

/**
 * Phase completion status for each of the 17 project phases.
 */
export const phaseStatuses = mysqlTable("phase_statuses", {
  id: int("id").autoincrement().primaryKey(),
  phaseIndex: int("phaseIndex").notNull().unique(), // 1-17
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedBy: varchar("completedBy", { length: 64 }), // username of engineer who completed it
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PhaseStatus = typeof phaseStatuses.$inferSelect;

/**
 * Complaints submitted by the client on specific phases.
 */
export const complaints = mysqlTable("complaints", {
  id: int("id").autoincrement().primaryKey(),
  phaseIndex: int("phaseIndex").notNull(), // which phase (1-17)
  submittedBy: varchar("submittedBy", { length: 64 }).notNull(), // client username
  submitterName: text("submitterName").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl"), // optional S3 image URL
  status: mysqlEnum("status", ["open", "in_review", "closed"]).default("open").notNull(),
  closedBy: varchar("closedBy", { length: 64 }), // aftersales or admin username
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;

/**
 * Replies to complaints (from engineers or admins).
 */
export const complaintReplies = mysqlTable("complaint_replies", {
  id: int("id").autoincrement().primaryKey(),
  complaintId: int("complaintId").notNull(),
  repliedBy: varchar("repliedBy", { length: 64 }).notNull(),
  replierName: text("replierName").notNull(),
  replierRole: mysqlEnum("replierRole", ["admin", "engineer", "aftersales", "client"]).notNull(),
  message: text("message").notNull(),
  imageUrl: text("imageUrl"), // optional image in reply
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComplaintReply = typeof complaintReplies.$inferSelect;

// ===================== PRO GROUP PRICING SYSTEM TABLES =====================

/**
 * Brands: Professor, ProMax, Pro Dressing, Pro Porcelain, Pro Design Studio
 */
export const pricingBrands = mysqlTable("pricing_brands", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(), // e.g. "PRO_FURNITURE"
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  systemType: mysqlEnum("systemType", ["product", "modular", "area", "catalog"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type PricingBrand = typeof pricingBrands.$inferSelect;

/**
 * Spaces / Categories within a brand (e.g. Bedroom, Living Room)
 */
export const pricingSpaces = mysqlTable("pricing_spaces", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type PricingSpace = typeof pricingSpaces.$inferSelect;

/**
 * Products within a space (e.g. Bed, Wardrobe, Nightstand)
 */
export const pricingProducts = mysqlTable("pricing_products", {
  id: int("id").autoincrement().primaryKey(),
  spaceId: int("spaceId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type PricingProduct = typeof pricingProducts.$inferSelect;

/**
 * Product types (e.g. Upholstered Bed, Wooden Bed, Hydraulic Bed)
 */
export const pricingProductTypes = mysqlTable("pricing_product_types", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  basePrice: int("basePrice").notNull().default(0), // in EGP
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type PricingProductType = typeof pricingProductTypes.$inferSelect;

/**
 * Variable options (dimensions, materials, fabric, finish, add-ons, hardware)
 * Each option has a price modifier (added to base price)
 */
export const pricingVariables = mysqlTable("pricing_variables", {
  id: int("id").autoincrement().primaryKey(),
  productTypeId: int("productTypeId").notNull(),
  category: mysqlEnum("category", ["dimension", "material", "fabric", "finish", "hardware", "addon"]).notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  priceModifier: int("priceModifier").notNull().default(0), // added to base price in EGP
  isDefault: boolean("isDefault").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type PricingVariable = typeof pricingVariables.$inferSelect;

/**
 * Design complexity levels with multipliers
 */
export const pricingComplexity = mysqlTable("pricing_complexity", {
  id: int("id").autoincrement().primaryKey(),
  productTypeId: int("productTypeId").notNull(),
  level: mysqlEnum("level", ["basic", "standard", "premium", "custom"]).notNull(),
  nameAr: varchar("nameAr", { length: 64 }).notNull(),
  multiplier: varchar("multiplier", { length: 8 }).notNull(), // stored as string e.g. "1.00", "1.25"
  description: text("description"),
});

export type PricingComplexity = typeof pricingComplexity.$inferSelect;

/**
 * Basket items — saved selections per engineer session/quotation
 */
export const pricingBasketItems = mysqlTable("pricing_basket_items", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // UUID per engineer session
  brandId: int("brandId").notNull(),
  spaceId: int("spaceId").notNull(),
  productId: int("productId").notNull(),
  productTypeId: int("productTypeId").notNull(),
  selectedVariables: text("selectedVariables").notNull(), // JSON array of variable IDs
  complexityLevel: mysqlEnum("complexityLevel", ["basic", "standard", "premium", "custom"]).notNull(),
  quantity: int("quantity").notNull().default(1),
  basePrice: int("basePrice").notNull(),
  materialsTotal: int("materialsTotal").notNull().default(0),
  addonsTotal: int("addonsTotal").notNull().default(0),
  complexityMultiplier: varchar("complexityMultiplier", { length: 8 }).notNull(),
  finalPrice: int("finalPrice").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PricingBasketItem = typeof pricingBasketItems.$inferSelect;

/**
 * Saved quotations
 */
export const pricingQuotations = mysqlTable("pricing_quotations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  quotationNumber: varchar("quotationNumber", { length: 32 }).notNull(),
  clientName: varchar("clientName", { length: 128 }),
  projectName: varchar("projectName", { length: 128 }),
  engineerName: varchar("engineerName", { length: 128 }),
  totalAmount: int("totalAmount").notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["draft", "sent", "approved"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PricingQuotation = typeof pricingQuotations.$inferSelect;
