import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

type MigrationEntry = {
  idx: number;
  when: number;
  tag: string;
};

type Journal = {
  entries: MigrationEntry[];
};

const requiredTables = [
  "users",
  "complaint_replies",
  "complaints",
  "phase_statuses",
  "project_users",
  "pricing_basket_items",
  "pricing_brands",
  "pricing_complexity",
  "pricing_product_types",
  "pricing_products",
  "pricing_quotations",
  "pricing_spaces",
  "pricing_variables",
  "kitchen_accessories",
  "kitchen_cladding",
  "kitchen_marble",
  "kitchen_materials",
  "kitchen_quotations",
  "kitchen_units",
  "kitchen_work_orders",
  "crm_leads",
  "excel_imports",
  "negotiation_sessions",
  "session_accessories",
  "session_changes",
  "session_objections",
  "approval_logs",
  "media_library",
  "playbook_items",
  "quotations_v2",
  "sales_scripts",
  "transport_rules",
] as const;

const requiredColumns = [
  ["kitchen_accessories", "videoUrl"],
  ["quotations_v2", "brandKey"],
  ["quotations_v2", "engineStateJson"],
  ["kitchen_accessories", "imageUrl"],
  ["kitchen_accessories", "salesScript"],
] as const;

async function main() {
  if (!process.argv.includes("--confirm-imported-schema")) {
    throw new Error("Refusing to baseline without --confirm-imported-schema");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const root = process.cwd();
  const journalText = await readFile(path.join(root, "drizzle/meta/_journal.json"), "utf8");
  const journal = JSON.parse(journalText) as Journal;
  const baselineEntry = journal.entries.find(entry => entry.idx === 0);
  const lastHistoricalEntry = journal.entries.find(entry => entry.idx === 8);
  if (!baselineEntry || !lastHistoricalEntry) {
    throw new Error("Expected migrations 0000 through 0008 in the Drizzle journal");
  }

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [tableRows] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
    );
    const existingTables = new Set(
      (tableRows as Array<{ TABLE_NAME: string }>).map(row => row.TABLE_NAME),
    );
    const missingTables = requiredTables.filter(table => !existingTables.has(table));
    if (missingTables.length > 0) {
      throw new Error(`Imported schema is incomplete; missing tables: ${missingTables.join(", ")}`);
    }

    const missingColumns: string[] = [];
    for (const [table, column] of requiredColumns) {
      const [rows] = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
        [table, column],
      );
      if ((rows as Array<{ COLUMN_NAME: string }>).length === 0) {
        missingColumns.push(`${table}.${column}`);
      }
    }
    if (missingColumns.length > 0) {
      throw new Error(`Imported schema is incomplete; missing columns: ${missingColumns.join(", ")}`);
    }

    const [migrationRows] = await connection.query(
      "SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1",
    );
    const latest = (migrationRows as Array<{ created_at: number }>)[0]?.created_at;
    if (Number(latest) >= lastHistoricalEntry.when) {
      console.log("[Drizzle] Historical migrations 0000-0008 are already baselined");
      return;
    }
    if (Number(latest) !== baselineEntry.when) {
      throw new Error(
        "Refusing to baseline: the latest Drizzle migration timestamp is not 0000. Inspect migration history manually.",
      );
    }

    const migrations = journal.entries
      .filter(entry => entry.idx > 0 && entry.idx <= 8)
      .sort((a, b) => a.idx - b.idx);
    const prepared: Array<{ hash: string; createdAt: number }> = [];
    for (const entry of migrations) {
      const sql = await readFile(path.join(root, "drizzle", `${entry.tag}.sql`), "utf8");
      prepared.push({
        hash: createHash("sha256").update(sql).digest("hex"),
        createdAt: entry.when,
      });
    }

    await connection.beginTransaction();
    try {
      for (const migration of prepared) {
        await connection.execute(
          "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
          [migration.hash, migration.createdAt],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log("[Drizzle] Verified imported schema and baselined migrations 0001-0008");
    console.log("[Drizzle] Run pnpm drizzle-kit migrate next to apply pending migration 0009");
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error("[Drizzle] Imported database baseline failed:", error);
  process.exitCode = 1;
});
