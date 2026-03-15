import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projectUsers, phaseStatuses, complaints, complaintReplies } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===================== PROJECT QUERIES =====================

export async function getProjectUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projectUsers).where(eq(projectUsers.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPhaseStatuses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(phaseStatuses);
}

export async function upsertPhaseStatus(phaseIndex: number, isCompleted: boolean, completedBy: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(phaseStatuses).where(eq(phaseStatuses.phaseIndex, phaseIndex)).limit(1);
  if (existing.length > 0) {
    await db.update(phaseStatuses)
      .set({ isCompleted, completedBy, completedAt: isCompleted ? new Date() : null })
      .where(eq(phaseStatuses.phaseIndex, phaseIndex));
  } else {
    await db.insert(phaseStatuses).values({
      phaseIndex,
      isCompleted,
      completedBy,
      completedAt: isCompleted ? new Date() : null,
    });
  }
}

export async function getComplaintsByPhase(phaseIndex: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complaints).where(eq(complaints.phaseIndex, phaseIndex)).orderBy(desc(complaints.createdAt));
}

export async function getAllComplaints() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complaints).orderBy(desc(complaints.createdAt));
}

export async function createComplaint(data: {
  phaseIndex: number;
  submittedBy: string;
  submitterName: string;
  title: string;
  description: string;
  imageUrl?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(complaints).values(data);
  return result;
}

export async function getComplaintReplies(complaintId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complaintReplies).where(eq(complaintReplies.complaintId, complaintId)).orderBy(complaintReplies.createdAt);
}

export async function addComplaintReply(data: {
  complaintId: number;
  repliedBy: string;
  replierName: string;
  replierRole: "admin" | "engineer" | "aftersales" | "client";
  message: string;
  imageUrl?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  return db.insert(complaintReplies).values(data);
}

export async function closeComplaint(complaintId: number, closedBy: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(complaints)
    .set({ status: "closed", closedBy, closedAt: new Date() })
    .where(eq(complaints.id, complaintId));
}

export async function updateComplaintStatus(complaintId: number, status: "open" | "in_review" | "closed") {
  const db = await getDb();
  if (!db) return;
  await db.update(complaints).set({ status }).where(eq(complaints.id, complaintId));
}
