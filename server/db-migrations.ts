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

    const [ownerRows] = await connection.query(
      "SHOW COLUMNS FROM `quotations_v2` LIKE 'createdByUserId'",
    );
    if (!Array.isArray(ownerRows) || ownerRows.length === 0) {
      await connection.query("ALTER TABLE `quotations_v2` ADD COLUMN `createdByUserId` varchar(128) NULL");
    }
    const [ownerIndexRows] = await connection.query(
      "SHOW INDEX FROM `quotations_v2` WHERE Key_name = 'quotations_v2_created_by_user_id_idx'",
    );
    if (!Array.isArray(ownerIndexRows) || ownerIndexRows.length === 0) {
      await connection.query("CREATE INDEX `quotations_v2_created_by_user_id_idx` ON `quotations_v2` (`createdByUserId`)");
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


/**
 * Ensure the one-time SSO redemption table exists without replaying historical
 * migrations against databases imported from the managed TiDB instance.
 * This operation is idempotent and matches drizzle/0009_pricing_sso_one_time_tokens.sql.
 */
export async function ensurePricingSsoTokenSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const connection = await mysql.createConnection(databaseUrl);
  try {
    await connection.query(
      "CREATE TABLE IF NOT EXISTS `pricing_sso_used_tokens` (" +
        "`jti` varchar(128) NOT NULL," +
        "`expiresAt` timestamp NOT NULL," +
        "PRIMARY KEY (`jti`)," +
        "KEY `pricing_sso_used_tokens_expiresAt_idx` (`expiresAt`)" +
      ")",
    );
    console.log("[Database] Pricing SSO token schema verified");
  } finally {
    await connection.end();
  }
}

/**
 * Verify the accessory columns used by both catalog writes and pricing reads.
 * Imported databases may have a migration ledger that does not match the
 * physical schema. Add only missing nullable columns; never rewrite catalog data.
 */
export async function ensureKitchenAccessorySchema() {
  if (process.env.NODE_ENV !== "production") return;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required before verifying the kitchen accessory schema");

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [tableRows] = await connection.query("SHOW TABLES LIKE 'kitchen_accessories'");
    if (!Array.isArray(tableRows) || tableRows.length === 0) {
      throw new Error("Production schema is missing kitchen_accessories; apply the base Pricing migrations before startup");
    }

    const requiredColumns = [
      ["videoUrl", "text NULL"],
      ["imageUrl", "text NULL"],
      ["salesScript", "text NULL"],
    ] as const;

    for (const [column, definition] of requiredColumns) {
      const [rows] = await connection.query("SHOW COLUMNS FROM `kitchen_accessories` LIKE ?", [column]);
      if (!Array.isArray(rows) || rows.length === 0) {
        await connection.query(
          "ALTER TABLE `kitchen_accessories` ADD COLUMN " + "`" + column + "` " + definition,
        );
      }
    }

    const [verifiedRows] = await connection.query("SHOW COLUMNS FROM `kitchen_accessories`");
    const verifiedColumns = new Set((verifiedRows as Array<{ Field: string }>).map(row => row.Field));
    const missing = requiredColumns.map(([column]) => column).filter(column => !verifiedColumns.has(column));
    if (missing.length > 0) {
      throw new Error(`Production kitchen accessory schema verification failed; missing columns: ${missing.join(", ")}`);
    }
    console.log("[Database] Kitchen accessory catalog schema verified");
  } finally {
    await connection.end();
  }
}
