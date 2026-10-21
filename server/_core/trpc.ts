import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);


export type PricingCatalogAction = "canView" | "canAdd" | "canEdit" | "canDelete";

/** Enforces the signed Sales Team Platform grant for ordinary pricing operations. */
export function pricingSystemProcedure(action: PricingCatalogAction) {
  return t.procedure.use(
    t.middleware(async ({ ctx, next }) => {
      const actor = ctx.pricingActor;
      if (!actor) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "انتهت جلسة التسعير أو لم يتم تسجيل الدخول من منصة المبيعات" });
      }
      if (!actor.permissions.canView || !actor.permissions[action]) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتنفيذ هذه العملية في منظومة التسعير" });
      }
      return next();
    }),
  );
}

/** Enforces permissions issued by the Sales Team Platform on every catalog API call. */
export function pricingCatalogProcedure(action: PricingCatalogAction) {
  return t.procedure.use(
    t.middleware(async ({ ctx, next }) => {
      const actor = ctx.pricingActor;
      if (!actor) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "انتهت جلسة التسعير أو لم يتم تسجيل الدخول من منصة المبيعات" });
      }
      if (!actor.catalogPermissions.canView || !actor.catalogPermissions[action]) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لتنفيذ هذه العملية في منظومة التسعير" });
      }
      if (action !== "canView" && actor.scope !== "all") {
        throw new TRPCError({ code: "FORBIDDEN", message: "تعديل الكتالوج المشترك يتطلب نطاق صلاحية all" });
      }
      return next();
    }),
  );
}
