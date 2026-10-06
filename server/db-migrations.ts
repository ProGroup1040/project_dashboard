import mysql from "mysql2/promise";

/**
 * Ensure the production database has the columns required by the quotation API.
 *
 * The repository migration remains the source of truth, but the managed runtime
 * currently starts the server without executing Drizzle migrations. Failing fast
 * for an absent required column prevents the API from serving a known-broken
 * schema, while applying the exact nullable migration needed for engine state.
 */
export async function ensureProductionQuotationSchema() {
  if (process.env.NODE_ENV !== "production") return;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before starting the production server");
  }

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [brandRows] = await connection.query(
      "SHOW COLUMNS FROM `quotations_v2` LIKE 'brandKey'",
    );
    if (!Array.isArray(brandRows) || brandRows.length === 0) {
      throw new Error(
        "Production schema is missing quotations_v2.brandKey; apply Drizzle migrations before startup",
      );
    }

    const [engineStateRows] = await connection.query(
      "SHOW COLUMNS FROM `quotations_v2` LIKE 'engineStateJson'",
    );
    if (!Array.isArray(engineStateRows) || engineStateRows.length === 0) {
      await connection.query(
        "ALTER TABLE `quotations_v2` ADD `engineStateJson` text",
      );
    }

    const [verifiedRows] = await connection.query(
      "SHOW COLUMNS FROM `quotations_v2` LIKE 'engineStateJson'",
    );
    if (!Array.isArray(verifiedRows) || verifiedRows.length === 0) {
      throw new Error(
        "Production schema migration failed: quotations_v2.engineStateJson is still missing",
      );
    }

    console.log("[Database] Production quotation schema verified");
  } finally {
    await connection.end();
  }
}
