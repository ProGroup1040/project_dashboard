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
