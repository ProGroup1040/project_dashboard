import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ensureKitchenAccessorySchema } from "./db-migrations";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("production kitchen accessory schema guard", () => {
  let adminConnection: mysql.Connection | undefined;
  let testConnection: mysql.Connection | undefined;
  let testDatabase = "";
  let originalDatabaseUrl: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    originalNodeEnv = process.env.NODE_ENV;
    adminConnection = await mysql.createConnection(databaseUrl!);
    testDatabase = `pricing_schema_guard_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await adminConnection.query(`CREATE DATABASE \`${testDatabase}\``);
    const isolatedUrl = new URL(databaseUrl!);
    isolatedUrl.pathname = `/${testDatabase}`;
    process.env.DATABASE_URL = isolatedUrl.toString();
    process.env.NODE_ENV = "production";
    testConnection = await mysql.createConnection(isolatedUrl.toString());
  });

  afterAll(async () => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (testConnection) await testConnection.end();
    if (adminConnection) {
      await adminConnection.query(`DROP DATABASE IF EXISTS \`${testDatabase}\``);
      await adminConnection.end();
    }
  });

  it("adds only missing nullable accessory columns and is safe to rerun", async () => {
    await testConnection!.query(
      "CREATE TABLE kitchen_accessories (id INT AUTO_INCREMENT PRIMARY KEY, brand VARCHAR(32) NOT NULL, nameAr VARCHAR(255) NOT NULL, price INT NOT NULL, isActive BOOLEAN NOT NULL DEFAULT TRUE, sortOrder INT NOT NULL DEFAULT 0)",
    );

    await ensureKitchenAccessorySchema();
    await ensureKitchenAccessorySchema();

    const [columns] = await testConnection!.query("SHOW COLUMNS FROM kitchen_accessories");
    const names = (columns as Array<{ Field: string }>).map(column => column.Field);
    expect(names).toEqual(expect.arrayContaining(["videoUrl", "imageUrl", "salesScript"]));
  });
});
