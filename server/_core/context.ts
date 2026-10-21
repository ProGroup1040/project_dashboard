import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type PricingSsoActor = {
  userId: string;
  displayName: string;
  role: string;
  engineerId: number | null;
  scope: "own" | "all";
  permissions: { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean };
  catalogPermissions: { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean };
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  pricingActor: PricingSsoActor | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  let pricingActor: PricingSsoActor | null = null;
  try {
    const cookie = parseCookieHeader(opts.req.headers.cookie ?? "").pricing_sso;
    const secretText = process.env.PRICING_SSO_SECRET?.trim() ?? "";
    if (cookie && new TextEncoder().encode(secretText).length >= 32) {
      const { payload } = await jwtVerify(cookie, new TextEncoder().encode(secretText), {
        issuer: "professor-kitchens",
        audience: "professor-kitchens-app",
        algorithms: ["HS256"],
      });
      const permissions = payload.permissions as Record<string, unknown> | undefined;
      const catalogPermissions = payload.catalogPermissions as Record<string, unknown> | undefined;
      if (
        typeof payload.sub === "string" &&
        typeof payload.displayName === "string" &&
        typeof payload.role === "string" &&
        (payload.scope === "own" || payload.scope === "all") &&
        permissions &&
        ["canView", "canAdd", "canEdit", "canDelete"].every(key => typeof permissions[key] === "boolean") &&
        catalogPermissions &&
        ["canView", "canAdd", "canEdit", "canDelete"].every(key => typeof catalogPermissions[key] === "boolean")
      ) {
        pricingActor = {
          userId: payload.sub,
          displayName: payload.displayName,
          role: payload.role,
          engineerId: typeof payload.engineerId === "number" ? payload.engineerId : null,
          scope: payload.scope,
          permissions: {
            canView: permissions.canView as boolean,
            canAdd: permissions.canAdd as boolean,
            canEdit: permissions.canEdit as boolean,
            canDelete: permissions.canDelete as boolean,
          },
          catalogPermissions: {
            canView: catalogPermissions.canView as boolean,
            canAdd: catalogPermissions.canAdd as boolean,
            canEdit: catalogPermissions.canEdit as boolean,
            canDelete: catalogPermissions.canDelete as boolean,
          },
        };
      }
    }
  } catch {
    // Invalid, expired, or absent SSO cookies fail closed.
    pricingActor = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    pricingActor,
  };
}
