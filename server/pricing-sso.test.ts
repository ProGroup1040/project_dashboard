import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";
import { SignJWT } from "jose";
import { registerPricingSsoRoutes } from "./_core/pricingSso";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

const SECRET = "c9e6f14a72b08d3f5a1c9e4b6d2f8071a3c5e9b2d4f6087c1a5e3d9b7f2046c8";
let server: Server | undefined;
let baseUrl: string;

async function startApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  registerPricingSsoRoutes(app);
  const localServer = createServer(app);
  server = localServer;
  await new Promise<void>(resolve => localServer.listen(0, "127.0.0.1", resolve));
  const address = localServer.address();
  if (!address || typeof address === "string") throw new Error("Test server failed to bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function makeToken() {
  return new SignJWT({
    displayName: "Test User",
    role: "sales_engineer",
    engineerId: 17,
    scope: "own",
    permissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
    catalogPermissions: { canView: true, canAdd: false, canEdit: false, canDelete: false },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("sales-team-platform")
    .setAudience("professor-kitchens")
    .setSubject("user-17")
    .setJti("test-jti-unique")
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(new TextEncoder().encode(SECRET));
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  if (server?.listening) await new Promise<void>(resolve => server?.close(() => resolve()));
});

describe("Pricing SSO POST callback", () => {
  it("rejects GET callbacks so credentials cannot be supplied in a URL", async () => {
    await startApp();
    const response = await fetch(`${baseUrl}/sso/pricing?token=do-not-accept`);
    expect(response.status).toBe(405);
  });

  it("rejects malformed credentials when the legacy environment secret is missing", async () => {
    vi.stubEnv("PRICING_SSO_SECRET", "");
    await startApp();
    const response = await fetch(`${baseUrl}/sso/pricing`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: "x".repeat(32) }),
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("rejects invalid signatures without creating a session", async () => {
    vi.stubEnv("PRICING_SSO_SECRET", SECRET);
    vi.mocked(getDb).mockResolvedValue({ execute: vi.fn() } as never);
    await startApp();
    const response = await fetch(`${baseUrl}/sso/pricing`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: "x".repeat(32) }),
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("creates an HttpOnly session and redirects only to the fixed destination", async () => {
    vi.stubEnv("PRICING_SSO_SECRET", SECRET);
    vi.stubEnv("NODE_ENV", "production");
    const execute = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue({ execute } as never);
    await startApp();
    const token = await makeToken();
    const response = await fetch(`${baseUrl}/sso/pricing?next=https://evil.example`, {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token, next: "https://evil.example" }),
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/brand/professor_kitchens/kitchens");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("rejects replayed credentials atomically", async () => {
    vi.stubEnv("PRICING_SSO_SECRET", SECRET);
    const duplicate = Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" });
    const execute = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(duplicate);
    vi.mocked(getDb).mockResolvedValue({ execute } as never);
    await startApp();
    const token = await makeToken();
    const response = await fetch(`${baseUrl}/sso/pricing`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
    expect(response.status).toBe(409);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
