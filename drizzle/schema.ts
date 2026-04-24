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

// ===================== KITCHEN MODULE TABLES =====================

/**
 * Kitchen materials (خامات المطبخ) - priced per m²
 */
export const kitchenMaterials = mysqlTable("kitchen_materials", {
  id: int("id").autoincrement().primaryKey(),
  brand: varchar("brand", { length: 64 }).notNull(), // "First Wood" | "Good Wood"
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  pricePerMeter: int("pricePerMeter").notNull(), // EGP per m²
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type KitchenMaterial = typeof kitchenMaterials.$inferSelect;

/**
 * Kitchen accessories (اكسسوارات) - fixed price per piece
 */
export const kitchenAccessories = mysqlTable("kitchen_accessories", {
  id: int("id").autoincrement().primaryKey(),
  brand: varchar("brand", { length: 32 }).notNull(), // "JT" | "SX" | "Other"
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  price: int("price").notNull(), // EGP per piece
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type KitchenAccessory = typeof kitchenAccessories.$inferSelect;

/**
 * Kitchen marble types (خامة الرخام)
 */
export const kitchenMarble = mysqlTable("kitchen_marble", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 16 }).notNull(), // G01, B01, Q01
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["granite", "porcelain", "quartz", "other"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type KitchenMarble = typeof kitchenMarble.$inferSelect;

/**
 * Kitchen cladding & decor (التجاليد والديكور) - priced per piece/unit
 */
export const kitchenCladding = mysqlTable("kitchen_cladding", {
  id: int("id").autoincrement().primaryKey(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  price: int("price").notNull(), // EGP per unit
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type KitchenCladding = typeof kitchenCladding.$inferSelect;

/**
 * Kitchen units table - each row is one cabinet unit in the kitchen
 * Linked to a kitchen quotation
 */
export const kitchenUnits = mysqlTable("kitchen_units", {
  id: int("id").autoincrement().primaryKey(),
  quotationId: int("quotationId").notNull(),
  unitNumber: int("unitNumber").notNull(), // رقم القطعة في التصميم
  location: mysqlEnum("location", ["upper", "lower", "tall", "placard", "placard_deep"]).notNull(), // علوي/سفلي/طولي/بلاكار
  width: int("width").notNull(), // cm
  height: int("height").notNull(), // cm
  totalArea: varchar("totalArea", { length: 16 }).notNull(), // calculated m²
  description: text("description"),
  materialId: int("materialId"), // FK to kitchen_materials
  wallLabel: varchar("wallLabel", { length: 4 }), // A, B, C, D, E, F, G, H
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type KitchenUnit = typeof kitchenUnits.$inferSelect;

/**
 * Kitchen quotations (مقايسة مطبخ)
 */
export const kitchenQuotations = mysqlTable("kitchen_quotations", {
  id: int("id").autoincrement().primaryKey(),
  quotationCode: varchar("quotationCode", { length: 32 }).notNull(), // P2026-X
  clientName: varchar("clientName", { length: 128 }),
  clientPhone: varchar("clientPhone", { length: 32 }),
  address: text("address"),
  engineerName: varchar("engineerName", { length: 128 }),
  quotationDate: timestamp("quotationDate").defaultNow().notNull(),

  // Materials
  material1Id: int("material1Id"),
  material1Meters: varchar("material1Meters", { length: 16 }),
  material2Id: int("material2Id"),
  material2Meters: varchar("material2Meters", { length: 16 }),
  material3Id: int("material3Id"),
  material3Meters: varchar("material3Meters", { length: 16 }),

  // Hardware selections (stored as JSON)
  hingeType: varchar("hingeType", { length: 128 }),
  drawerSlideType: varchar("drawerSlideType", { length: 128 }),
  handleTypeLower: varchar("handleTypeLower", { length: 128 }),
  handleTypeUpper: varchar("handleTypeUpper", { length: 128 }),
  chassisType: varchar("chassisType", { length: 128 }),
  plinthColor: varchar("plinthColor", { length: 64 }),
  lightingColor: varchar("lightingColor", { length: 64 }),
  glassColor: varchar("glassColor", { length: 64 }),
  innerBoxColor: varchar("innerBoxColor", { length: 64 }),
  handleColor: varchar("handleColor", { length: 64 }),
  glassFrameColor: varchar("glassFrameColor", { length: 64 }),

  // Marble
  marbleId: int("marbleId"),
  marblePricePerMeter: int("marblePricePerMeter"),
  marbleMeters: varchar("marbleMeters", { length: 16 }),

  // Accessories (stored as JSON array: [{id, qty, price}])
  accessoriesJson: text("accessoriesJson"),

  // Cladding (stored as JSON array: [{id, qty, price}])
  claddingJson: text("claddingJson"),

  // Totals
  materialsTotalPrice: int("materialsTotalPrice").default(0),
  accessoriesTotalPrice: int("accessoriesTotalPrice").default(0),
  marbleTotalPrice: int("marbleTotalPrice").default(0),
  claddingTotalPrice: int("claddingTotalPrice").default(0),
  grandTotal: int("grandTotal").default(0),

  notes: text("notes"),
  status: mysqlEnum("status", ["draft", "sent", "approved"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KitchenQuotation = typeof kitchenQuotations.$inferSelect;

/**
 * Kitchen work orders (امر شغل)
 */
export const kitchenWorkOrders = mysqlTable("kitchen_work_orders", {
  id: int("id").autoincrement().primaryKey(),
  quotationId: int("quotationId").notNull(),
  workOrderCode: varchar("workOrderCode", { length: 32 }).notNull(),
  salesEngineer: varchar("salesEngineer", { length: 128 }),
  technicalEngineer: varchar("technicalEngineer", { length: 128 }),
  contractDate: timestamp("contractDate"),
  executionDate: timestamp("executionDate"),
  deliveryDate: timestamp("deliveryDate"),
  workOrderDate: timestamp("workOrderDate"),

  // Door codes
  doorCode1: varchar("doorCode1", { length: 64 }),
  doorCode1Company: varchar("doorCode1Company", { length: 64 }),
  doorCode2: varchar("doorCode2", { length: 64 }),
  doorCode2Company: varchar("doorCode2Company", { length: 64 }),
  doorCode3: varchar("doorCode3", { length: 64 }),
  doorCode3Company: varchar("doorCode3Company", { length: 64 }),

  // Areas (m²)
  lowerUnitsArea: varchar("lowerUnitsArea", { length: 16 }),
  upperUnitsArea: varchar("upperUnitsArea", { length: 16 }),
  placardArea: varchar("placardArea", { length: 16 }),
  tallUnitsArea: varchar("tallUnitsArea", { length: 16 }),

  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KitchenWorkOrder = typeof kitchenWorkOrders.$inferSelect;

// ===================== NEGOTIATION SESSION MODULE TABLES =====================

/**
 * CRM Leads - pipeline management
 */
export const crmLeads = mysqlTable("crm_leads", {
  id: int("id").autoincrement().primaryKey(),
  leadNumber: varchar("leadNumber", { length: 32 }).notNull().unique(),
  clientName: varchar("clientName", { length: 128 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 32 }),
  projectType: mysqlEnum("projectType", ["kitchen", "dressing", "furniture", "finishing", "smart_home", "full"]).notNull(),
  quotationValue: int("quotationValue").default(0),
  designScore: int("designScore").default(0), // 0-100
  assignedEngineer: varchar("assignedEngineer", { length: 128 }),
  pipelineStage: mysqlEnum("pipelineStage", [
    "new_lead",
    "design_in_progress",
    "design_approved",
    "negotiation_session",
    "proposal",
    "closing",
    "won",
    "lost"
  ]).default("new_lead").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmLead = typeof crmLeads.$inferSelect;

/**
 * Negotiation sessions - one per lead per attempt
 */
export const negotiationSessions = mysqlTable("negotiation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  sessionNumber: int("sessionNumber").default(1).notNull(),
  engineerName: varchar("engineerName", { length: 128 }),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),

  // Step completion flags
  step1Completed: boolean("step1Completed").default(false).notNull(),
  step2Completed: boolean("step2Completed").default(false).notNull(),
  step3Completed: boolean("step3Completed").default(false).notNull(),
  step4Completed: boolean("step4Completed").default(false).notNull(),
  step5Completed: boolean("step5Completed").default(false).notNull(),
  step6Completed: boolean("step6Completed").default(false).notNull(),
  step7Completed: boolean("step7Completed").default(false).notNull(),

  // Step 1: Recap
  clientStyle: varchar("clientStyle", { length: 128 }),
  clientBudget: int("clientBudget"),
  clientPriority: text("clientPriority"),
  clientNeedsConfirmed: boolean("clientNeedsConfirmed").default(false).notNull(),

  // Step 2: Design Walkthrough
  layoutExplained: boolean("layoutExplained").default(false).notNull(),
  storageExplained: boolean("storageExplained").default(false).notNull(),
  materialsExplained: boolean("materialsExplained").default(false).notNull(),
  lightingExplained: boolean("lightingExplained").default(false).notNull(),

  // Step 4: Quotation Breakdown (stored as JSON)
  quotationBreakdownJson: text("quotationBreakdownJson"),

  // Step 7: Closing
  closingStatus: mysqlEnum("closingStatus", ["ready_to_close", "needs_revision", "needs_time", "lost"]),
  nextAction: mysqlEnum("nextAction", ["follow_up_call", "send_revision", "visit_showroom", "apply_discount", "wait_for_decision"]),

  // Totals
  originalTotal: int("originalTotal").default(0),
  finalTotal: int("finalTotal").default(0),
  totalDiscount: int("totalDiscount").default(0),

  // Recording
  recordingUrl: text("recordingUrl"),
  sessionDurationSeconds: int("sessionDurationSeconds"),

  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NegotiationSession = typeof negotiationSessions.$inferSelect;

/**
 * Excel imports - uploaded quotation files
 */
export const excelImports = mysqlTable("excel_imports", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  parsedItemsJson: text("parsedItemsJson"), // JSON array of parsed rows
  totalMaterials: int("totalMaterials").default(0),
  totalAccessories: int("totalAccessories").default(0),
  totalLabor: int("totalLabor").default(0),
  totalTransport: int("totalTransport").default(0),
  grandTotal: int("grandTotal").default(0),
  status: mysqlEnum("status", ["pending", "parsed", "error"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExcelImport = typeof excelImports.$inferSelect;

/**
 * Session accessories - each accessory reviewed during step 3
 */
export const sessionAccessories = mysqlTable("session_accessories", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  accessoryName: varchar("accessoryName", { length: 255 }).notNull(),
  price: int("price").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  benefit1: text("benefit1"),
  benefit2: text("benefit2"),
  benefit3: text("benefit3"),
  categoryTag: mysqlEnum("categoryTag", ["storage", "luxury", "convenience", "other"]).default("other"),
  alternativeId: int("alternativeId"), // self-referencing for alternative
  decision: mysqlEnum("decision", ["approved", "hesitant", "rejected", "pending"]).default("pending").notNull(),
  rejectionReason: mysqlEnum("rejectionReason", ["price", "not_useful", "needs_alternative", "not_convinced"]),
  multimediaPlayed: boolean("multimediaPlayed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionAccessory = typeof sessionAccessories.$inferSelect;

/**
 * Session objections - logged during step 5
 */
export const sessionObjections = mysqlTable("session_objections", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  objectionType: mysqlEnum("objectionType", [
    "total_price",
    "accessories_price",
    "transportation",
    "delivery_time",
    "materials",
    "payment_method",
    "competitor_comparison",
    "needs_partner_approval",
    "not_convinced_value"
  ]).notNull(),
  relatedItemName: varchar("relatedItemName", { length: 255 }),
  engineerResponse: text("engineerResponse"),
  clientReaction: mysqlEnum("clientReaction", ["accepted", "still_hesitant", "rejected"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionObjection = typeof sessionObjections.$inferSelect;

/**
 * Session change log - every modification to the quotation
 */
export const sessionChanges = mysqlTable("session_changes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  changeType: mysqlEnum("changeType", ["remove_item", "replace_item", "adjust_quantity", "apply_discount", "change_material"]).notNull(),
  itemName: varchar("itemName", { length: 255 }),
  beforePrice: int("beforePrice").notNull(),
  afterPrice: int("afterPrice").notNull(),
  changeDetail: text("changeDetail"), // JSON with details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionChange = typeof sessionChanges.$inferSelect;
