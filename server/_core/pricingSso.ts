import type { Express, Request, Response } from "express";
import { jwtVerify, SignJWT } from "jose";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

const CALLBACK_PATH = "/sso/pricing";
const SAFE_DESTINATION = "/brand/professor_kitchens/kitchens";
const SESSION_COOKIE = "pricing_sso";

function setNoStoreHeaders(res: Response) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function fail(res: Response, status: number, message: string) {
  setNoStoreHeaders(res);
  return res.status(status).type("text/plain").send(message);
}

export function registerPricingSsoRoutes(app: Express) {
  app.get(CALLBACK_PATH, (_req: Request, res: Response) => fail(res, 405, "Use POST for SSO"));

  app.post(CALLBACK_PATH, async (req: Request, res: Response) => {
    setNoStoreHeaders(res);

    if (!req.is("application/x-www-form-urlencoded")) {
      return fail(res, 415, "Unsupported SSO request");
    }

    const token = typeof req.body?.token === "string" ? req.body.token : "";
    if (token.length < 20 || token.length > 8192) {
      return fail(res, 400, "Invalid SSO request");
    }

    const secretText = process.env.PRICING_SSO_SECRET?.trim() ?? "";
    const secret = new TextEncoder().encode(secretText);
    if (secret.length < 32) {
      return fail(res, 503, "Pricing SSO is not configured");
    }

    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: "sales-team-platform",
        audience: "professor-kitchens",
        algorithms: ["HS256"],
        clockTolerance: 2,
      });

      const permissions = payload.permissions as Record<string, unknown> | undefined;
      const catalogPermissions = payload.catalogPermissions as Record<string, unknown> | undefined;
      const jti = typeof payload.jti === "string" ? payload.jti : "";
      const exp = typeof payload.exp === "number" ? payload.exp : 0;

      if (
        !jti ||
        jti.length > 128 ||
        exp <= Math.floor(Date.now() / 1000) ||
        typeof payload.sub !== "string" ||
        payload.sub.length > 128 ||
        typeof payload.displayName !== "string" ||
        payload.displayName.length > 200 ||
        typeof payload.role !== "string" ||
        payload.role.length > 80 ||
        (payload.scope !== "own" && payload.scope !== "all") ||
        !permissions ||
        !["canView", "canAdd", "canEdit", "canDelete"].every(key => typeof permissions[key] === "boolean") ||
        permissions.canView !== true ||
        !catalogPermissions ||
        !["canView", "canAdd", "canEdit", "canDelete"].every(key => typeof catalogPermissions[key] === "boolean") ||
        catalogPermissions.canView !== true
      ) {
        return fail(res, 401, "Invalid SSO credentials");
      }

      const db = await getDb();
      if (!db) return fail(res, 503, "Pricing SSO is temporarily unavailable");

      // Opportunistically remove expired credentials; the primary key still makes redemption atomic.
      await db.execute(sql`DELETE FROM pricing_sso_used_tokens WHERE expiresAt < CURRENT_TIMESTAMP`);
      await db.execute(sql`INSERT INTO pricing_sso_used_tokens (jti, expiresAt)
        VALUES (${jti}, FROM_UNIXTIME(${exp}))`);

      const sessionToken = await new SignJWT({
        displayName: payload.displayName,
        role: payload.role,
        engineerId: typeof payload.engineerId === "number" ? payload.engineerId : null,
        scope: payload.scope,
        permissions,
        catalogPermissions,
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuer("professor-kitchens")
        .setAudience("professor-kitchens-app")
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime("30m")
        .sign(secret);

      res.cookie(SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 60 * 1000,
        path: "/",
      });

      return res.redirect(303, SAFE_DESTINATION);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === "ER_DUP_ENTRY" || code === "SQLITE_CONSTRAINT") {
        return fail(res, 409, "SSO credential has already been used");
      }
      if (error instanceof Error && /JWS|JWT|JOSE|signature|claim|exp|audience|issuer|compact/i.test(error.name + " " + error.message)) {
        return fail(res, 401, "Invalid or expired SSO credentials");
      }
      return fail(res, 503, "Pricing SSO is temporarily unavailable");
    }
  });
}
