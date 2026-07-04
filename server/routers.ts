import { z } from "zod";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getProjectUserByUsername,
  getAllPhaseStatuses,
  upsertPhaseStatus,
  getComplaintsByPhase,
  getAllComplaints,
  createComplaint,
  getComplaintReplies,
  addComplaintReply,
  closeComplaint,
  updateComplaintStatus,
} from "./db";
import { storagePut } from "./storage";
import { parseSkpFile } from "./skpParser";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  getKitchenMaterials,
  getKitchenAccessories,
  getKitchenMarble,
  getKitchenCladding,
  createKitchenQuotation,
  getKitchenQuotations,
  getKitchenQuotationById,
  addKitchenUnit,
  getKitchenUnitsByQuotation,
  deleteKitchenUnit,
} from "./db-kitchen";
import {
  getAllLeads,
  getLeadById,
  createLead,
  updateLeadStage,
  updateLead,
  getLeadStats,
  createSession,
  getSessionById,
  getSessionsByLead,
  updateSession,
  completeSession,
  addSessionAccessory,
  getSessionAccessories,
  updateAccessoryDecision,
  logObjection,
  getSessionObjections,
  updateObjectionResponse,
  logChange,
  getSessionChanges,
  createExcelImport,
  getExcelImportsBySession,
} from "./db-negotiation";
import {
  getAllBrands,
  getSpacesByBrand,
  getProductsBySpace,
  getProductTypesByProduct,
  getVariablesByProductType,
  getComplexityByProductType,
  getBasketItems,
  addBasketItem,
  removeBasketItem,
  clearBasket,
  saveQuotation,
  getQuotationsBySession,
} from "./db-pricing";

// Simple project session cookie name
const PROJECT_SESSION_COOKIE = "proj_session";

function getProjectSessionOptions(req: { headers: { host?: string } }) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===================== PROJECT AUTH =====================
  project: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getProjectUserByUsername(input.username);
        if (!user) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
        // Store session in cookie
        const sessionData = JSON.stringify({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
        ctx.res.cookie(PROJECT_SESSION_COOKIE, Buffer.from(sessionData).toString("base64"), getProjectSessionOptions(ctx.req));
        return { success: true, user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role } };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(PROJECT_SESSION_COOKIE, { path: "/" });
      return { success: true };
    }),

    me: publicProcedure.query(({ ctx }) => {
      const cookie = (ctx.req as any).cookies?.[PROJECT_SESSION_COOKIE];
      if (!cookie) return null;
      try {
        const data = JSON.parse(Buffer.from(cookie, "base64").toString("utf8"));
        return data as { id: number; username: string; displayName: string; role: "admin" | "engineer" | "aftersales" | "client" };
      } catch {
        return null;
      }
    }),
  }),

  // ===================== PHASE STATUSES =====================
  phases: router({
    getAll: publicProcedure.query(async () => {
      return getAllPhaseStatuses();
    }),

    setStatus: publicProcedure
      .input(z.object({
        phaseIndex: z.number().min(1).max(17),
        isCompleted: z.boolean(),
        username: z.string(),
        role: z.enum(["admin", "engineer", "aftersales", "client"]),
      }))
      .mutation(async ({ input }) => {
        if (input.role !== "admin" && input.role !== "engineer") {
          throw new Error("غير مصرح لك بتغيير حالة المرحلة");
        }
        await upsertPhaseStatus(input.phaseIndex, input.isCompleted, input.username);
        return { success: true };
      }),
  }),

  // ===================== PRICING SYSTEM =====================
  pricing: router({
    getBrands: publicProcedure.query(async () => getAllBrands()),

    getSpaces: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => getSpacesByBrand(input.brandId)),

    getProducts: publicProcedure
      .input(z.object({ spaceId: z.number() }))
      .query(async ({ input }) => getProductsBySpace(input.spaceId)),

    getProductTypes: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => getProductTypesByProduct(input.productId)),

    getVariables: publicProcedure
      .input(z.object({ productTypeId: z.number() }))
      .query(async ({ input }) => getVariablesByProductType(input.productTypeId)),

    getComplexity: publicProcedure
      .input(z.object({ productTypeId: z.number() }))
      .query(async ({ input }) => getComplexityByProductType(input.productTypeId)),

    getBasket: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => getBasketItems(input.sessionId)),

    addToBasket: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        brandId: z.number(),
        spaceId: z.number(),
        productId: z.number(),
        productTypeId: z.number(),
        selectedVariables: z.string(),
        complexityLevel: z.enum(["basic", "standard", "premium", "custom"]),
        quantity: z.number().min(1),
        basePrice: z.number(),
        materialsTotal: z.number(),
        addonsTotal: z.number(),
        complexityMultiplier: z.string(),
        finalPrice: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => addBasketItem(input)),

    removeFromBasket: publicProcedure
      .input(z.object({ id: z.number(), sessionId: z.string() }))
      .mutation(async ({ input }) => removeBasketItem(input.id, input.sessionId)),

    clearBasket: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => clearBasket(input.sessionId)),

    saveQuotation: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        quotationNumber: z.string(),
        clientName: z.string().optional(),
        projectName: z.string().optional(),
        engineerName: z.string().optional(),
        totalAmount: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => saveQuotation(input)),

    getQuotations: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => getQuotationsBySession(input.sessionId)),
  }),

  complaints: router({
    getByPhase: publicProcedure
      .input(z.object({ phaseIndex: z.number() }))
      .query(async ({ input }) => {
        return getComplaintsByPhase(input.phaseIndex);
      }),

    getAll: publicProcedure.query(async () => {
      return getAllComplaints();
    }),

    create: publicProcedure
      .input(z.object({
        phaseIndex: z.number().min(1).max(17),
        submittedBy: z.string(),
        submitterName: z.string(),
        title: z.string().min(1),
        description: z.string().min(1),
        imageBase64: z.string().optional(), // base64 encoded image
        imageMimeType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        let imageUrl: string | undefined;
        if (input.imageBase64 && input.imageMimeType) {
          const buffer = Buffer.from(input.imageBase64, "base64");
          const ext = input.imageMimeType.split("/")[1] || "jpg";
          const key = `complaints/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const result = await storagePut(key, buffer, input.imageMimeType);
          imageUrl = result.url;
        }
        await createComplaint({
          phaseIndex: input.phaseIndex,
          submittedBy: input.submittedBy,
          submitterName: input.submitterName,
          title: input.title,
          description: input.description,
          imageUrl,
        });
        return { success: true };
      }),

    getReplies: publicProcedure
      .input(z.object({ complaintId: z.number() }))
      .query(async ({ input }) => {
        return getComplaintReplies(input.complaintId);
      }),

    addReply: publicProcedure
      .input(z.object({
        complaintId: z.number(),
        repliedBy: z.string(),
        replierName: z.string(),
        replierRole: z.enum(["admin", "engineer", "aftersales", "client"]),
        message: z.string().min(1),
        imageBase64: z.string().optional(),
        imageMimeType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        let imageUrl: string | undefined;
        if (input.imageBase64 && input.imageMimeType) {
          const buffer = Buffer.from(input.imageBase64, "base64");
          const ext = input.imageMimeType.split("/")[1] || "jpg";
          const key = `complaint-replies/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const result = await storagePut(key, buffer, input.imageMimeType);
          imageUrl = result.url;
        }
        // Mark complaint as in_review when engineer replies
        if (input.replierRole === "engineer" || input.replierRole === "admin") {
          await updateComplaintStatus(input.complaintId, "in_review");
        }
        await addComplaintReply({
          complaintId: input.complaintId,
          repliedBy: input.repliedBy,
          replierName: input.replierName,
          replierRole: input.replierRole,
          message: input.message,
          imageUrl,
        });
        return { success: true };
      }),

    close: publicProcedure
      .input(z.object({
        complaintId: z.number(),
        closedBy: z.string(),
        role: z.enum(["admin", "engineer", "aftersales", "client"]),
      }))
      .mutation(async ({ input }) => {
        if (input.role !== "admin" && input.role !== "aftersales") {
          throw new Error("فقط الإدارة (أ. ملك) أو المدير يمكنهم إغلاق الشكاوى");
        }
        await closeComplaint(input.complaintId, input.closedBy);
        return { success: true };
      }),

    uploadImage: publicProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string(),
        folder: z.string().default("uploads"),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `${input.folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const result = await storagePut(key, buffer, input.mimeType);
        return { url: result.url };
      }),
  }),

  // ===================== CRM & NEGOTIATION =====================
  crm: router({
    getLeads: publicProcedure.query(async () => getAllLeads()),

    getLead: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getLeadById(input.id)),

    getStats: publicProcedure.query(async () => getLeadStats()),

    createLead: publicProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientPhone: z.string().optional(),
        projectType: z.enum(["kitchen", "dressing", "furniture", "finishing", "smart_home", "full"]),
        quotationValue: z.number().optional(),
        assignedEngineer: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => createLead(input)),

    updateLead: publicProcedure
      .input(z.object({
        id: z.number(),
        clientName: z.string().optional(),
        clientPhone: z.string().optional(),
        projectType: z.enum(["kitchen", "dressing", "furniture", "finishing", "smart_home", "full"]).optional(),
        quotationValue: z.number().optional(),
        assignedEngineer: z.string().optional(),
        pipelineStage: z.enum(["new_lead", "design_in_progress", "design_approved", "negotiation_session", "proposal", "closing", "won", "lost"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateLead(id, data);
      }),

    updateStage: publicProcedure
      .input(z.object({
        id: z.number(),
        stage: z.enum(["new_lead", "design_in_progress", "design_approved", "negotiation_session", "proposal", "closing", "won", "lost"]),
      }))
      .mutation(async ({ input }) => updateLeadStage(input.id, input.stage)),
  }),

  negotiation: router({
    createSession: publicProcedure
      .input(z.object({
        leadId: z.number(),
        engineerName: z.string().optional(),
        sessionNumber: z.number().optional(),
      }))
      .mutation(async ({ input }) => createSession(input)),

    getSession: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getSessionById(input.id)),

    getSessionsByLead: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => getSessionsByLead(input.leadId)),

    updateSession: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
        step1Completed: z.boolean().optional(),
        step2Completed: z.boolean().optional(),
        step3Completed: z.boolean().optional(),
        step4Completed: z.boolean().optional(),
        step5Completed: z.boolean().optional(),
        step6Completed: z.boolean().optional(),
        step7Completed: z.boolean().optional(),
        clientStyle: z.string().optional(),
        clientBudget: z.number().optional(),
        clientPriority: z.string().optional(),
        clientNeedsConfirmed: z.boolean().optional(),
        layoutExplained: z.boolean().optional(),
        storageExplained: z.boolean().optional(),
        materialsExplained: z.boolean().optional(),
        lightingExplained: z.boolean().optional(),
        quotationBreakdownJson: z.string().optional(),
        closingStatus: z.enum(["ready_to_close", "needs_revision", "needs_time", "lost"]).optional(),
        nextAction: z.enum(["follow_up_call", "send_revision", "visit_showroom", "apply_discount", "wait_for_decision"]).optional(),
        originalTotal: z.number().optional(),
        finalTotal: z.number().optional(),
        totalDiscount: z.number().optional(),
        recordingUrl: z.string().optional(),
        sessionDurationSeconds: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSession(id, data);
      }),

    completeSession: publicProcedure
      .input(z.object({
        id: z.number(),
        finalTotal: z.number(),
        closingStatus: z.enum(["ready_to_close", "needs_revision", "needs_time", "lost"]),
        nextAction: z.enum(["follow_up_call", "send_revision", "visit_showroom", "apply_discount", "wait_for_decision"]),
      }))
      .mutation(async ({ input }) => completeSession(input.id, input.finalTotal, input.closingStatus, input.nextAction)),

    // Accessories
    addAccessory: publicProcedure
      .input(z.object({
        sessionId: z.number(),
        accessoryName: z.string(),
        price: z.number(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        benefit1: z.string().optional(),
        benefit2: z.string().optional(),
        benefit3: z.string().optional(),
        categoryTag: z.enum(["storage", "luxury", "convenience", "other"]).optional(),
      }))
      .mutation(async ({ input }) => addSessionAccessory(input)),

    getAccessories: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => getSessionAccessories(input.sessionId)),

    updateAccessoryDecision: publicProcedure
      .input(z.object({
        id: z.number(),
        decision: z.enum(["approved", "hesitant", "rejected", "pending"]),
        rejectionReason: z.enum(["price", "not_useful", "needs_alternative", "not_convinced"]).optional(),
        multimediaPlayed: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => updateAccessoryDecision(input.id, input.decision, input.rejectionReason, input.multimediaPlayed)),

    // Objections
    logObjection: publicProcedure
      .input(z.object({
        sessionId: z.number(),
        objectionType: z.enum(["total_price", "accessories_price", "transportation", "delivery_time", "materials", "payment_method", "competitor_comparison", "needs_partner_approval", "not_convinced_value"]),
        relatedItemName: z.string().optional(),
        engineerResponse: z.string().optional(),
        clientReaction: z.enum(["accepted", "still_hesitant", "rejected"]).optional(),
      }))
      .mutation(async ({ input }) => logObjection(input)),

    getObjections: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => getSessionObjections(input.sessionId)),

    updateObjectionResponse: publicProcedure
      .input(z.object({
        id: z.number(),
        engineerResponse: z.string(),
        clientReaction: z.enum(["accepted", "still_hesitant", "rejected"]),
      }))
      .mutation(async ({ input }) => updateObjectionResponse(input.id, input.engineerResponse, input.clientReaction)),

    // Changes
    logChange: publicProcedure
      .input(z.object({
        sessionId: z.number(),
        changeType: z.enum(["remove_item", "replace_item", "adjust_quantity", "apply_discount", "change_material"]),
        itemName: z.string().optional(),
        beforePrice: z.number(),
        afterPrice: z.number(),
        changeDetail: z.string().optional(),
      }))
      .mutation(async ({ input }) => logChange(input)),

    getChanges: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => getSessionChanges(input.sessionId)),

    // Excel imports
    createExcelImport: publicProcedure
      .input(z.object({
        sessionId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        parsedItemsJson: z.string().optional(),
        totalMaterials: z.number().optional(),
        totalAccessories: z.number().optional(),
        totalLabor: z.number().optional(),
        totalTransport: z.number().optional(),
        grandTotal: z.number().optional(),
      }))
      .mutation(async ({ input }) => createExcelImport(input)),

    getExcelImports: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => getExcelImportsBySession(input.sessionId)),
  }),

  kitchen: router({
    getMaterials: publicProcedure.query(async () => {
      return getKitchenMaterials();
    }),
    getAccessories: publicProcedure.query(async () => {
      return getKitchenAccessories();
    }),
    uploadAccessoryVideo: publicProcedure
      .input(z.object({
        accessoryId: z.number(),
        videoBase64: z.string(),
        mimeType: z.string().default("video/mp4"),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.videoBase64, "base64");
        const ext = input.mimeType.split("/")[1] || "mp4";
        const key = `accessories/videos/${input.accessoryId}-${Date.now()}.${ext}`;
        const result = await storagePut(key, buffer, input.mimeType);
        const { getDb } = await import("./db");
        const { kitchenAccessories } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) await db.update(kitchenAccessories).set({ videoUrl: result.url }).where(eq(kitchenAccessories.id, input.accessoryId));
        return { url: result.url };
      }),
    updateAccessoryVideo: publicProcedure
      .input(z.object({ id: z.number(), videoUrl: z.string().nullable() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { kitchenAccessories } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) await db.update(kitchenAccessories).set({ videoUrl: input.videoUrl }).where(eq(kitchenAccessories.id, input.id));
        return { success: true };
      }),
    getMarble: publicProcedure.query(async () => {
      return getKitchenMarble();
    }),
    getCladding: publicProcedure.query(async () => {
      return getKitchenCladding();
    }),
    getQuotations: publicProcedure.query(async () => {
      return getKitchenQuotations();
    }),
    getQuotationById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getKitchenQuotationById(input.id);
      }),
    getUnitsByQuotation: publicProcedure
      .input(z.object({ quotationId: z.number() }))
      .query(async ({ input }) => {
        return getKitchenUnitsByQuotation(input.quotationId);
      }),
    createQuotation: publicProcedure
      .input(z.object({
        quotationCode: z.string(),
        clientName: z.string().optional(),
        clientPhone: z.string().optional(),
        address: z.string().optional(),
        engineerName: z.string().optional(),
        material1Id: z.number().optional(),
        material1Meters: z.string().optional(),
        material2Id: z.number().optional(),
        material2Meters: z.string().optional(),
        material3Id: z.number().optional(),
        material3Meters: z.string().optional(),
        hingeType: z.string().optional(),
        drawerSlideType: z.string().optional(),
        handleTypeLower: z.string().optional(),
        handleTypeUpper: z.string().optional(),
        chassisType: z.string().optional(),
        plinthColor: z.string().optional(),
        lightingColor: z.string().optional(),
        glassColor: z.string().optional(),
        innerBoxColor: z.string().optional(),
        handleColor: z.string().optional(),
        glassFrameColor: z.string().optional(),
        marbleId: z.number().optional(),
        marblePricePerMeter: z.number().optional(),
        marbleMeters: z.string().optional(),
        accessoriesJson: z.string().optional(),
        claddingJson: z.string().optional(),
        materialsTotalPrice: z.number().optional(),
        accessoriesTotalPrice: z.number().optional(),
        marbleTotalPrice: z.number().optional(),
        claddingTotalPrice: z.number().optional(),
        grandTotal: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createKitchenQuotation(input);
      }),
    addUnit: publicProcedure
      .input(z.object({
        quotationId: z.number(),
        unitNumber: z.number(),
        location: z.enum(["upper", "lower", "tall", "placard", "placard_deep"]),
        width: z.number(),
        height: z.number(),
        totalArea: z.string(),
        description: z.string().optional(),
        materialId: z.number().optional(),
        wallLabel: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return addKitchenUnit(input);
      }),
        deleteUnit: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteKitchenUnit(input.id);
        return { success: true };
      }),

    parseSkp: publicProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skp_upload_'));
        const tmpFile = path.join(tmpDir, input.fileName);
        try {
          const buf = Buffer.from(input.fileBase64, 'base64');
          fs.writeFileSync(tmpFile, buf);
          const result = parseSkpFile(tmpFile);
          return { success: true, data: result };
        } catch (err: any) {
          return { success: false, error: err.message, data: null };
        } finally {
          try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
        }
      }),
  }),
  // ─── Platform Router ────────────────────────────────────────────────────────
  platform: router({
    // Transport rules
    getTransportRules: publicProcedure.query(async () => {
      const { getTransportRules, seedTransportRules } = await import("./db-platform");
      await seedTransportRules();
      return getTransportRules();
    }),

    // Playbook
    getPlaybookItems: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        const { getPlaybookItems } = await import("./db-platform");
        return getPlaybookItems(input.category);
      }),
    getPlaybookItem: publicProcedure
      .input(z.object({ itemKey: z.string() }))
      .query(async ({ input }) => {
        const { getPlaybookItem } = await import("./db-platform");
        return getPlaybookItem(input.itemKey);
      }),
    upsertPlaybookItem: publicProcedure
      .input(z.object({
        itemKey: z.string(), itemNameAr: z.string(), itemNameEn: z.string().optional(),
        category: z.enum(["material", "accessory", "cladding", "marble", "transport", "labor"]),
        technicalDescription: z.string().optional(), salesExplanation: z.string().optional(),
        whenToRecommend: z.string().optional(), whenNotToRecommend: z.string().optional(),
        commonObjections: z.string().optional(), objectionAnswers: z.string().optional(), tags: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { upsertPlaybookItem } = await import("./db-platform");
        await upsertPlaybookItem(input);
        return { success: true };
      }),

    // Media Library
    getMediaByItemKey: publicProcedure
      .input(z.object({ itemKey: z.string() }))
      .query(async ({ input }) => {
        const { getMediaByItemKey } = await import("./db-platform");
        return getMediaByItemKey(input.itemKey);
      }),
    addMediaItem: publicProcedure
      .input(z.object({
        itemKey: z.string(), nameAr: z.string(),
        fileType: z.enum(["image", "video", "render", "document"]),
        fileUrl: z.string(), thumbnailUrl: z.string().optional(),
        usageType: z.enum(["client_presentation", "training", "objection_handling", "showroom"]),
        script: z.string().optional(), priorityLevel: z.number().optional(), tags: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { addMediaItem } = await import("./db-platform");
        await addMediaItem(input);
        return { success: true };
      }),

    // Sales Scripts
    getSalesScript: publicProcedure
      .input(z.object({ itemKey: z.string() }))
      .query(async ({ input }) => {
        const { getSalesScript } = await import("./db-platform");
        return getSalesScript(input.itemKey);
      }),
    upsertSalesScript: publicProcedure
      .input(z.object({
        itemKey: z.string(), shortClientExplanation: z.string().optional(),
        premiumExplanation: z.string().optional(), objectionResponse: z.string().optional(),
        whatsappFollowUp: z.string().optional(), showroomPresentationLine: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { upsertSalesScript } = await import("./db-platform");
        await upsertSalesScript(input);
        return { success: true };
      }),

    // Quotations V2
    createQuotation: publicProcedure
      .input(z.object({
        quotationCode: z.string(), brandKey: z.string().optional(),
        clientName: z.string().optional(), clientPhone: z.string().optional(),
        address: z.string().optional(), governorate: z.string().optional(),
        projectCode: z.string().optional(), engineerName: z.string().optional(),
        engineerRole: z.enum(["sales_engineer", "designer", "technical_office", "sales_manager", "admin", "owner"]).optional(),
        kitchenLength: z.string().optional(), kitchenWidth: z.string().optional(),
        totalUnits: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createQuotationV2 } = await import("./db-platform");
        return createQuotationV2(input);
      }),
    updateQuotation: publicProcedure
      .input(z.object({
        id: z.number(),
        materialsJson: z.string().optional(), accessoriesJson: z.string().optional(),
        claddingJson: z.string().optional(), marbleJson: z.string().optional(),
        transportJson: z.string().optional(),
        discountType: z.enum(["none", "percentage", "fixed"]).optional(),
        discountValue: z.number().optional(), discountReason: z.string().optional(),
        materialsTotalPrice: z.number().optional(), accessoriesTotalPrice: z.number().optional(),
        claddingTotalPrice: z.number().optional(), marbleTotalPrice: z.number().optional(),
        transportTotalPrice: z.number().optional(), subtotal: z.number().optional(),
        discountAmount: z.number().optional(), grandTotal: z.number().optional(),
        warningsJson: z.string().optional(), status: z.string().optional(),
        notes: z.string().optional(), internalNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateQuotationV2 } = await import("./db-platform");
        const { id, ...data } = input;
        await updateQuotationV2(id, data as any);
        return { success: true };
      }),
    getQuotation: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getQuotationV2 } = await import("./db-platform");
        return getQuotationV2(input.id);
      }),
    listQuotations: publicProcedure
      .input(z.object({ brandKey: z.string().optional() }))
      .query(async ({ input }) => {
        const { listQuotationsV2 } = await import("./db-platform");
        return listQuotationsV2(input.brandKey);
      }),

    // Approval
    requestApproval: publicProcedure
      .input(z.object({
        quotationId: z.number(),
        requestType: z.enum(["discount", "free_item", "price_override", "final_approval"]),
        requestedBy: z.string(), requestedValue: z.string().optional(), reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createApprovalRequest } = await import("./db-platform");
        await createApprovalRequest(input);
        return { success: true };
      }),
    reviewApproval: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected"]),
        reviewedBy: z.string(), reviewNote: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { reviewApprovalRequest } = await import("./db-platform");
        await reviewApprovalRequest(input.id, input);
        return { success: true };
      }),
    getPendingApprovals: publicProcedure.query(async () => {
      const { getPendingApprovals } = await import("./db-platform");
      return getPendingApprovals();
    }),

    // KPIs
    getKPIs: publicProcedure
      .input(z.object({ brandKey: z.string().optional() }))
      .query(async ({ input }) => {
        const { getQuotationKPIs } = await import("./db-platform");
        return getQuotationKPIs(input.brandKey);
      }),

    // Save/Load Engine State
    saveEngineState: publicProcedure
      .input(z.object({
        id: z.number(),
        engineStateJson: z.string(),
        materialsTotalPrice: z.number().optional(),
        accessoriesTotalPrice: z.number().optional(),
        claddingTotalPrice: z.number().optional(),
        marbleTotalPrice: z.number().optional(),
        transportTotalPrice: z.number().optional(),
        subtotal: z.number().optional(),
        discountAmount: z.number().optional(),
        grandTotal: z.number().optional(),
        status: z.string().optional(),
        clientName: z.string().optional(),
        clientPhone: z.string().optional(),
        address: z.string().optional(),
        governorate: z.string().optional(),
        engineerName: z.string().optional(),
        lowerUnitsArea: z.string().optional(),
        upperUnitsArea: z.string().optional(),
        tallUnitsArea: z.string().optional(),
        specialUnitsArea: z.string().optional(),
        materialsJson: z.string().optional(),
        accessoriesJson: z.string().optional(),
        claddingJson: z.string().optional(),
        marbleJson: z.string().optional(),
        transportJson: z.string().optional(),
        discountType: z.string().optional(),
        discountValue: z.number().optional(),
        discountReason: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { saveEngineState } = await import("./db-platform");
        const { id, engineStateJson, ...meta } = input;
        return saveEngineState(id, engineStateJson, meta as any);
      }),

    getEngineState: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getEngineState } = await import("./db-platform");
        return getEngineState(input.id);
      }),

    searchQuotations: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        engineerName: z.string().optional(),
        status: z.string().optional(),
        brandKey: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { searchQuotationsV2 } = await import("./db-platform");
        return searchQuotationsV2(input);
      }),

    updateQuotationStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "pending_approval", "approved", "sent_to_client", "accepted", "rejected", "revised"]),
      }))
      .mutation(async ({ input }) => {
        const { updateQuotationV2 } = await import("./db-platform");
        await updateQuotationV2(input.id, { status: input.status });
        return { success: true };
      }),

    // Warnings
    generateWarnings: publicProcedure
      .input(z.object({
        selectedAccessories: z.array(z.object({ id: z.number(), qty: z.number() })),
        marbleSelected: z.boolean(), transportSelected: z.boolean(),
        discountPercentage: z.number(), freeItemsCount: z.number(),
        grandTotal: z.number(), minimumTarget: z.number().optional(),
        accessoriesTotalPrice: z.number(), totalPrice: z.number(),
        hasPlaybookForAllItems: z.boolean(),
      }))
      .query(async ({ input }) => {
        const { generateWarnings } = await import("./db-platform");
        return generateWarnings(input);
      }),

  }),
});
export type AppRouter = typeof appRouter;
