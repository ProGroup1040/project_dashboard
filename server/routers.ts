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
});

export type AppRouter = typeof appRouter;
