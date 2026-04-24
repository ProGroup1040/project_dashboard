import { eq, desc, asc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  crmLeads,
  negotiationSessions,
  excelImports,
  sessionAccessories,
  sessionObjections,
  sessionChanges,
} from "../drizzle/schema";

// ===================== CRM LEADS =====================

export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crmLeads).orderBy(desc(crmLeads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
  return rows[0] || null;
}

export async function createLead(input: {
  clientName: string;
  clientPhone?: string;
  projectType: "kitchen" | "dressing" | "furniture" | "finishing" | "smart_home" | "full";
  quotationValue?: number;
  assignedEngineer?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const leadNumber = `LD-${dateStr}-${rand}`;

  const result = await db.insert(crmLeads).values({
    leadNumber,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    projectType: input.projectType,
    quotationValue: input.quotationValue || 0,
    assignedEngineer: input.assignedEngineer,
    notes: input.notes,
  });

  return { id: (result as any).insertId as number, leadNumber };
}

export async function updateLeadStage(id: number, stage: "new_lead" | "design_in_progress" | "design_approved" | "negotiation_session" | "proposal" | "closing" | "won" | "lost") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crmLeads).set({ pipelineStage: stage }).where(eq(crmLeads.id, id));
  return { success: true };
}

export async function updateLead(id: number, input: {
  clientName?: string;
  clientPhone?: string;
  projectType?: "kitchen" | "dressing" | "furniture" | "finishing" | "smart_home" | "full";
  quotationValue?: number;
  assignedEngineer?: string;
  pipelineStage?: "new_lead" | "design_in_progress" | "design_approved" | "negotiation_session" | "proposal" | "closing" | "won" | "lost";
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = {};
  if (input.clientName !== undefined) updateData.clientName = input.clientName;
  if (input.clientPhone !== undefined) updateData.clientPhone = input.clientPhone;
  if (input.projectType !== undefined) updateData.projectType = input.projectType;
  if (input.quotationValue !== undefined) updateData.quotationValue = input.quotationValue;
  if (input.assignedEngineer !== undefined) updateData.assignedEngineer = input.assignedEngineer;
  if (input.pipelineStage !== undefined) updateData.pipelineStage = input.pipelineStage;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (Object.keys(updateData).length > 0) {
    await db.update(crmLeads).set(updateData).where(eq(crmLeads.id, id));
  }
  return { success: true };
}

export async function getLeadStats() {
  const db = await getDb();
  if (!db) return { total: 0, won: 0, lost: 0, totalValue: 0 };
  const rows = await db.select().from(crmLeads);
  const stats = {
    total: rows.length,
    new_lead: 0,
    design_in_progress: 0,
    design_approved: 0,
    negotiation_session: 0,
    proposal: 0,
    closing: 0,
    won: 0,
    lost: 0,
    totalValue: 0,
  };
  for (const row of rows) {
    stats[row.pipelineStage as keyof typeof stats] = (stats[row.pipelineStage as keyof typeof stats] as number) + 1;
    stats.totalValue += row.quotationValue || 0;
  }
  return stats;
}

// ===================== NEGOTIATION SESSIONS =====================

export async function createSession(input: {
  leadId: number;
  engineerName?: string;
  sessionNumber?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(negotiationSessions).values({
    leadId: input.leadId,
    engineerName: input.engineerName,
    sessionNumber: input.sessionNumber || 1,
  });
  return { id: (result as any).insertId as number };
}

export async function getSessionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(negotiationSessions).where(eq(negotiationSessions.id, id));
  if (!rows[0]) return null;
  const session = rows[0];
  // Also get lead info
  const leads = await db.select().from(crmLeads).where(eq(crmLeads.id, session.leadId));
  return { ...session, lead: leads[0] || null };
}

export async function getSessionsByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(negotiationSessions).where(eq(negotiationSessions.leadId, leadId)).orderBy(desc(negotiationSessions.createdAt));
}

export async function updateSession(id: number, input: Partial<{
  status: "in_progress" | "completed" | "abandoned";
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
  step4Completed: boolean;
  step5Completed: boolean;
  step6Completed: boolean;
  step7Completed: boolean;
  clientStyle: string;
  clientBudget: number;
  clientPriority: string;
  clientNeedsConfirmed: boolean;
  layoutExplained: boolean;
  storageExplained: boolean;
  materialsExplained: boolean;
  lightingExplained: boolean;
  quotationBreakdownJson: string;
  closingStatus: "ready_to_close" | "needs_revision" | "needs_time" | "lost";
  nextAction: "follow_up_call" | "send_revision" | "visit_showroom" | "apply_discount" | "wait_for_decision";
  originalTotal: number;
  finalTotal: number;
  totalDiscount: number;
  recordingUrl: string;
  sessionDurationSeconds: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (Object.keys(input).length > 0) {
    await db.update(negotiationSessions).set(input as any).where(eq(negotiationSessions.id, id));
  }
  return { success: true };
}

export async function completeSession(id: number, finalTotal: number, closingStatus: "ready_to_close" | "needs_revision" | "needs_time" | "lost", nextAction: "follow_up_call" | "send_revision" | "visit_showroom" | "apply_discount" | "wait_for_decision") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(negotiationSessions).set({
    status: "completed",
    finalTotal,
    closingStatus,
    nextAction,
    completedAt: new Date(),
  }).where(eq(negotiationSessions.id, id));
  return { success: true };
}

// ===================== SESSION ACCESSORIES =====================

export async function addSessionAccessory(input: {
  sessionId: number;
  accessoryName: string;
  price: number;
  imageUrl?: string;
  videoUrl?: string;
  benefit1?: string;
  benefit2?: string;
  benefit3?: string;
  categoryTag?: "storage" | "luxury" | "convenience" | "other";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessionAccessories).values({
    sessionId: input.sessionId,
    accessoryName: input.accessoryName,
    price: input.price,
    imageUrl: input.imageUrl,
    videoUrl: input.videoUrl,
    benefit1: input.benefit1,
    benefit2: input.benefit2,
    benefit3: input.benefit3,
    categoryTag: input.categoryTag || "other",
  });
  return { id: (result as any).insertId as number };
}

export async function getSessionAccessories(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessionAccessories).where(eq(sessionAccessories.sessionId, sessionId)).orderBy(asc(sessionAccessories.createdAt));
}

export async function updateAccessoryDecision(id: number, decision: "approved" | "hesitant" | "rejected" | "pending", rejectionReason?: "price" | "not_useful" | "needs_alternative" | "not_convinced", multimediaPlayed?: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { decision };
  if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
  if (multimediaPlayed !== undefined) updateData.multimediaPlayed = multimediaPlayed;
  await db.update(sessionAccessories).set(updateData).where(eq(sessionAccessories.id, id));
  return { success: true };
}

// ===================== SESSION OBJECTIONS =====================

export async function logObjection(input: {
  sessionId: number;
  objectionType: "total_price" | "accessories_price" | "transportation" | "delivery_time" | "materials" | "payment_method" | "competitor_comparison" | "needs_partner_approval" | "not_convinced_value";
  relatedItemName?: string;
  engineerResponse?: string;
  clientReaction?: "accepted" | "still_hesitant" | "rejected";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessionObjections).values({
    sessionId: input.sessionId,
    objectionType: input.objectionType,
    relatedItemName: input.relatedItemName,
    engineerResponse: input.engineerResponse,
    clientReaction: input.clientReaction,
  });
  return { id: (result as any).insertId as number };
}

export async function getSessionObjections(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessionObjections).where(eq(sessionObjections.sessionId, sessionId)).orderBy(asc(sessionObjections.createdAt));
}

export async function updateObjectionResponse(id: number, engineerResponse: string, clientReaction: "accepted" | "still_hesitant" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessionObjections).set({ engineerResponse, clientReaction }).where(eq(sessionObjections.id, id));
  return { success: true };
}

// ===================== SESSION CHANGES =====================

export async function logChange(input: {
  sessionId: number;
  changeType: "remove_item" | "replace_item" | "adjust_quantity" | "apply_discount" | "change_material";
  itemName?: string;
  beforePrice: number;
  afterPrice: number;
  changeDetail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessionChanges).values({
    sessionId: input.sessionId,
    changeType: input.changeType,
    itemName: input.itemName,
    beforePrice: input.beforePrice,
    afterPrice: input.afterPrice,
    changeDetail: input.changeDetail,
  });
  return { id: (result as any).insertId as number };
}

export async function getSessionChanges(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessionChanges).where(eq(sessionChanges.sessionId, sessionId)).orderBy(asc(sessionChanges.createdAt));
}

// ===================== EXCEL IMPORTS =====================

export async function createExcelImport(input: {
  sessionId: number;
  fileName: string;
  fileUrl: string;
  parsedItemsJson?: string;
  totalMaterials?: number;
  totalAccessories?: number;
  totalLabor?: number;
  totalTransport?: number;
  grandTotal?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(excelImports).values({
    sessionId: input.sessionId,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    parsedItemsJson: input.parsedItemsJson,
    totalMaterials: input.totalMaterials || 0,
    totalAccessories: input.totalAccessories || 0,
    totalLabor: input.totalLabor || 0,
    totalTransport: input.totalTransport || 0,
    grandTotal: input.grandTotal || 0,
    status: "parsed",
  });
  return { id: (result as any).insertId as number };
}

export async function getExcelImportsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(excelImports).where(eq(excelImports.sessionId, sessionId)).orderBy(desc(excelImports.createdAt));
}
