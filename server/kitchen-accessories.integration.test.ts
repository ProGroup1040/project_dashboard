import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "./db";
import {
  createKitchenAccessory,
  getAllKitchenAccessoriesAdmin,
  getKitchenAccessories,
} from "./db-kitchen";
import { kitchenAccessories } from "../drizzle/schema";

const databaseUrl = process.env.DATABASE_URL;
const nameAr = `اختبار إكسسوار ${randomUUID()}`;

describe.skipIf(!databaseUrl)("kitchen accessory create and GET flow", () => {
  afterAll(async () => {
    const db = await getDb();
    if (db) await db.delete(kitchenAccessories).where(eq(kitchenAccessories.nameAr, nameAr));
  });

  it("returns the inserted row and exposes it through both catalog reads", async () => {
    const created = await createKitchenAccessory({
      brand: "JT",
      nameAr,
      price: 12345,
      sortOrder: 999999,
      videoUrl: null,
      imageUrl: null,
      salesScript: null,
      isActive: true,
    });

    expect(created).toMatchObject({ nameAr, brand: "JT", price: 12345 });
    expect(Number(created?.id)).toBeGreaterThan(0);

    const [pricingRead, adminRead] = await Promise.all([
      getKitchenAccessories(),
      getAllKitchenAccessoriesAdmin(),
    ]);
    expect(pricingRead.find(item => item.nameAr === nameAr)).toMatchObject({
      id: created!.id,
      nameAr,
      price: 12345,
      isActive: true,
    });
    expect(adminRead.find(item => item.nameAr === nameAr)).toMatchObject({
      id: created!.id,
      nameAr,
      price: 12345,
    });
  });
});
