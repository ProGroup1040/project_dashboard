/**
 * Public Pricing API — ERP Integration
 *
 * Endpoints (no auth required):
 *   GET /api/pricing/summary  → aggregate KPIs
 *   GET /api/pricing/list     → all projects with pricing details
 *   GET /api/pricing/kpi      → per-project margin performance
 *
 * Data sources:
 *   - kitchen_quotations  (grandTotal = selling price, materialsTotalPrice + accessoriesTotalPrice + marbleTotalPrice + claddingTotalPrice = cost)
 *   - pricing_quotations  (totalAmount = selling price; no cost breakdown → cost estimated at 65% of selling price as default)
 *
 * All monetary values are in EGP (Egyptian Pounds).
 */

import { Router, type Express } from "express";
import { getDb } from "./db";
import { kitchenQuotations, pricingQuotations } from "../drizzle/schema";
import { gt } from "drizzle-orm";

// ─── helpers ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Derive cost from a kitchen quotation row */
function kitchenCost(row: typeof kitchenQuotations.$inferSelect): number {
  return (
    (row.materialsTotalPrice ?? 0) +
    (row.accessoriesTotalPrice ?? 0) +
    (row.marbleTotalPrice ?? 0) +
    (row.claddingTotalPrice ?? 0)
  );
}

/** Margin % = (selling - cost) / selling × 100 */
function marginPct(selling: number, cost: number): number {
  if (selling <= 0) return 0;
  return round2(((selling - cost) / selling) * 100);
}

// ─── unified project record ──────────────────────────────────────────────────

interface ProjectRecord {
  id: string;
  source: "kitchen" | "pricing";
  client: string;
  selling_price: number;
  cost: number;
  margin: number; // %
  created_at: string;
}

async function fetchAllProjects(): Promise<ProjectRecord[]> {
  const db = await getDb();
  const records: ProjectRecord[] = [];
  if (!db) return records;

  // 1) Kitchen quotations
  const kitchenRows = await db
    .select()
    .from(kitchenQuotations)
    .where(gt(kitchenQuotations.grandTotal, 0));

  for (const row of kitchenRows) {
    const selling = row.grandTotal ?? 0;
    const cost = kitchenCost(row);
    records.push({
      id: `K-${row.id}`,
      source: "kitchen",
      client: row.clientName ?? "—",
      selling_price: selling,
      cost,
      margin: marginPct(selling, cost),
      created_at: row.createdAt.toISOString(),
    });
  }

  // 2) Pricing wizard quotations (no cost breakdown → estimate 65% cost ratio)
  const pricingRows = await db
    .select()
    .from(pricingQuotations)
    .where(gt(pricingQuotations.totalAmount, 0));

  for (const row of pricingRows) {
    const selling = row.totalAmount ?? 0;
    const cost = Math.round(selling * 0.65); // default cost ratio
    records.push({
      id: `P-${row.id}`,
      source: "pricing",
      client: row.clientName ?? "—",
      selling_price: selling,
      cost,
      margin: marginPct(selling, cost),
      created_at: row.createdAt.toISOString(),
    });
  }

  // Sort newest first
  records.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return records;
}

// ─── route registration ──────────────────────────────────────────────────────

export function registerPricingApiRoutes(app: Express): void {
  const router = Router();

  // CORS — allow any ERP origin
  router.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  /**
   * GET /api/pricing/summary
   * Returns aggregate KPIs across all projects.
   */
  router.get("/summary", async (_req, res) => {
    try {
      const projects = await fetchAllProjects();

      if (projects.length === 0) {
        return res.json({
          total_projects: 0,
          avg_project_value: 0,
          avg_cost: 0,
          avg_margin: 0,
          generated_at: new Date().toISOString(),
        });
      }

      const totalSelling = projects.reduce((s, p) => s + p.selling_price, 0);
      const totalCost = projects.reduce((s, p) => s + p.cost, 0);
      const totalMargin = projects.reduce((s, p) => s + p.margin, 0);
      const n = projects.length;

      return res.json({
        total_projects: n,
        avg_project_value: round2(totalSelling / n),
        avg_cost: round2(totalCost / n),
        avg_margin: round2(totalMargin / n),
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[/api/pricing/summary]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * GET /api/pricing/list
   * Returns all projects with per-project pricing details.
   */
  router.get("/list", async (_req, res) => {
    try {
      const projects = await fetchAllProjects();

      return res.json({
        total: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          client: p.client,
          selling_price: p.selling_price,
          cost: p.cost,
          margin: p.margin,
          source: p.source,
          created_at: p.created_at,
        })),
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[/api/pricing/list]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * GET /api/pricing/kpi
   * Returns pricing performance KPIs per project plus aggregates.
   */
  router.get("/kpi", async (_req, res) => {
    try {
      const projects = await fetchAllProjects();

      if (projects.length === 0) {
        return res.json({
          pricing_performance: {
            margin_per_project: [],
            avg_margin: 0,
            cost_efficiency: 0,
          },
          generated_at: new Date().toISOString(),
        });
      }

      const marginPerProject = projects.map((p) => ({
        id: p.id,
        client: p.client,
        selling_price: p.selling_price,
        cost: p.cost,
        margin: p.margin,
        profit: round2(p.selling_price - p.cost),
      }));

      const avgMargin = round2(
        projects.reduce((s, p) => s + p.margin, 0) / projects.length
      );

      // Cost efficiency = total profit / total cost × 100
      const totalProfit = projects.reduce(
        (s, p) => s + (p.selling_price - p.cost),
        0
      );
      const totalCost = projects.reduce((s, p) => s + p.cost, 0);
      const costEfficiency =
        totalCost > 0 ? round2((totalProfit / totalCost) * 100) : 0;

      return res.json({
        pricing_performance: {
          margin_per_project: marginPerProject,
          avg_margin: avgMargin,
          cost_efficiency: costEfficiency,
        },
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[/api/pricing/kpi]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mount under /api/pricing
  app.use("/api/pricing", router);

  console.log(
    "[PricingAPI] Public endpoints registered: /api/pricing/summary | /api/pricing/list | /api/pricing/kpi"
  );
}
