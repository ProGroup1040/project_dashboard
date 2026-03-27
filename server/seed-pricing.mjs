// Seed script for Pro Group Pricing System
// Run: node server/seed-pricing.mjs

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding Pro Group Pricing System...");

  // ── 1. BRANDS ──────────────────────────────────────────────
  await db.execute(`DELETE FROM pricing_brands`);
  const [brandsResult] = await db.execute(`
    INSERT INTO pricing_brands (code, nameAr, nameEn, systemType, isActive) VALUES
    ('PRO_FURNITURE', 'ProMax - الأساس', 'ProMax Furniture', 'product', true),
    ('PROFESSOR',     'Professor - مطابخ', 'Professor Kitchens', 'modular', true),
    ('PRO_DRESSING',  'Pro Dressing - دريسنج', 'Pro Dressing', 'product', true),
    ('PRO_PORCELAIN', 'Pro Porcelain - بورسلين', 'Pro Porcelain', 'area', true),
    ('PRO_DESIGN',    'Pro Design Studio - تشطيب', 'Pro Design Studio', 'modular', true)
  `);
  console.log("✅ Brands seeded");

  // Get brand IDs
  const [[furnitureBrand]] = await db.execute(`SELECT id FROM pricing_brands WHERE code='PRO_FURNITURE'`);
  const brandId = furnitureBrand.id;

  // ── 2. SPACES ──────────────────────────────────────────────
  await db.execute(`DELETE FROM pricing_spaces`);
  await db.execute(`
    INSERT INTO pricing_spaces (brandId, code, nameAr, nameEn, sortOrder) VALUES
    (${brandId}, 'BEDROOM',    'غرفة نوم', 'Bedroom', 1),
    (${brandId}, 'LIVING',     'غرفة معيشة', 'Living Room', 2),
    (${brandId}, 'RECEPTION',  'ريسيبشن', 'Reception', 3),
    (${brandId}, 'DINING',     'سفرة', 'Dining Room', 4),
    (${brandId}, 'DRESSING',   'دريسنج', 'Dressing Room', 5),
    (${brandId}, 'OFFICE',     'مكتب', 'Office', 6),
    (${brandId}, 'TV_UNIT',    'وحدة TV', 'TV Unit', 7)
  `);
  console.log("✅ Spaces seeded");

  // Get bedroom ID
  const [[bedroomSpace]] = await db.execute(`SELECT id FROM pricing_spaces WHERE code='BEDROOM'`);
  const bedroomId = bedroomSpace.id;

  // ── 3. PRODUCTS ────────────────────────────────────────────
  await db.execute(`DELETE FROM pricing_products`);
  await db.execute(`
    INSERT INTO pricing_products (spaceId, code, nameAr, nameEn, sortOrder) VALUES
    (${bedroomId}, 'BED',        'سرير', 'Bed', 1),
    (${bedroomId}, 'WARDROBE',   'دولاب', 'Wardrobe', 2),
    (${bedroomId}, 'NIGHTSTAND', 'كومود', 'Nightstand', 3),
    (${bedroomId}, 'DRESSER',    'تسريحة', 'Dresser', 4),
    (${bedroomId}, 'BENCH',      'بانكيت', 'Bench', 5),
    (${bedroomId}, 'MIRROR',     'مراية', 'Mirror', 6)
  `);
  console.log("✅ Products seeded");

  // Get bed ID
  const [[bedProduct]] = await db.execute(`SELECT id FROM pricing_products WHERE code='BED'`);
  const bedId = bedProduct.id;

  // ── 4. PRODUCT TYPES ───────────────────────────────────────
  await db.execute(`DELETE FROM pricing_product_types`);
  await db.execute(`
    INSERT INTO pricing_product_types (productId, code, nameAr, nameEn, basePrice, sortOrder) VALUES
    (${bedId}, 'UPHOLSTERED', 'سرير منجد', 'Upholstered Bed', 8000, 1),
    (${bedId}, 'WOODEN',      'سرير خشب', 'Wooden Bed', 6500, 2),
    (${bedId}, 'HYDRAULIC',   'سرير بميكانيزم هيدروليك', 'Hydraulic Storage Bed', 11000, 3),
    (${bedId}, 'MODERN',      'سرير مودرن', 'Modern Bed', 7500, 4),
    (${bedId}, 'CLASSIC',     'سرير كلاسيك', 'Classic Bed', 9000, 5)
  `);
  console.log("✅ Product types seeded");

  // Get upholstered bed type ID (main example)
  const [[upholsteredType]] = await db.execute(`SELECT id FROM pricing_product_types WHERE code='UPHOLSTERED'`);
  const upholsteredId = upholsteredType.id;

  // Get all bed type IDs
  const [allBedTypes] = await db.execute(`SELECT id, code FROM pricing_product_types WHERE productId=${bedId}`);

  // ── 5. VARIABLES (for each bed type) ──────────────────────
  await db.execute(`DELETE FROM pricing_variables`);

  for (const bedType of allBedTypes) {
    const tid = bedType.id;

    // DIMENSIONS
    await db.execute(`
      INSERT INTO pricing_variables (productTypeId, category, code, nameAr, nameEn, priceModifier, isDefault, sortOrder) VALUES
      (${tid}, 'dimension', 'SIZE_120', '120 سم', '120 cm', 0, false, 1),
      (${tid}, 'dimension', 'SIZE_140', '140 سم', '140 cm', 500, false, 2),
      (${tid}, 'dimension', 'SIZE_160', '160 سم (قياسي)', '160 cm (Default)', 0, true, 3),
      (${tid}, 'dimension', 'SIZE_180', '180 سم', '180 cm', 1000, false, 4),
      (${tid}, 'dimension', 'SIZE_200', '200 سم', '200 cm', 1500, false, 5),
      (${tid}, 'dimension', 'SIZE_CUSTOM', 'مقاس خاص', 'Custom Size', 2000, false, 6)
    `);

    // MATERIALS (structure)
    await db.execute(`
      INSERT INTO pricing_variables (productTypeId, category, code, nameAr, nameEn, priceModifier, isDefault, sortOrder) VALUES
      (${tid}, 'material', 'MAT_MDF',    'MDF مدعم', 'Reinforced MDF', 0, true, 1),
      (${tid}, 'material', 'MAT_COUNTER','كونتر', 'Counter Wood', 800, false, 2),
      (${tid}, 'material', 'MAT_BEECH',  'زان طبيعي', 'Natural Beech', 1200, false, 3),
      (${tid}, 'material', 'MAT_WALNUT', 'موسكي', 'Walnut Wood', 2000, false, 4)
    `);

    // FABRIC (only for upholstered/hydraulic/classic)
    if (['UPHOLSTERED', 'HYDRAULIC', 'CLASSIC'].includes(bedType.code)) {
      await db.execute(`
        INSERT INTO pricing_variables (productTypeId, category, code, nameAr, nameEn, priceModifier, isDefault, sortOrder) VALUES
        (${tid}, 'fabric', 'FAB_LINEN',   'لينن', 'Linen', 0, true, 1),
        (${tid}, 'fabric', 'FAB_VELVET',  'فيلفيت', 'Velvet', 2000, false, 2),
        (${tid}, 'fabric', 'FAB_LEATHER', 'جلد طبيعي', 'Natural Leather', 4000, false, 3),
        (${tid}, 'fabric', 'FAB_PREMIUM', 'قماش بريميوم', 'Premium Fabric', 3000, false, 4)
      `);
    }

    // FINISH
    await db.execute(`
      INSERT INTO pricing_variables (productTypeId, category, code, nameAr, nameEn, priceModifier, isDefault, sortOrder) VALUES
      (${tid}, 'finish', 'FIN_LACQUER',  'لاكيه', 'Lacquer', 0, true, 1),
      (${tid}, 'finish', 'FIN_DUCO',     'دوكو', 'Duco', 500, false, 2),
      (${tid}, 'finish', 'FIN_VENEER',   'قشرة طبيعية', 'Natural Veneer', 1500, false, 3),
      (${tid}, 'finish', 'FIN_HPL',      'HPL', 'HPL', 800, false, 4)
    `);

    // HEADBOARD (hardware group)
    await db.execute(`
      INSERT INTO pricing_variables (productTypeId, category, code, nameAr, nameEn, priceModifier, isDefault, sortOrder) VALUES
      (${tid}, 'hardware', 'HB_STANDARD', 'هيد بورد عادي', 'Standard Headboard', 0, true, 1),
      (${tid}, 'hardware', 'HB_HIGH',     'هيد بورد عالي', 'High Headboard', 1500, false, 2),
      (${tid}, 'hardware', 'HB_PADDED',   'هيد بورد مبطن', 'Padded Headboard', 2000, false, 3),
      (${tid}, 'hardware', 'HB_CUSTOM',   'هيد بورد تصميم خاص', 'Custom Headboard', 3500, false, 4)
    `);

    // ADD-ONS
    await db.execute(`
      INSERT INTO pricing_variables (productTypeId, category, code, nameAr, nameEn, priceModifier, isDefault, sortOrder) VALUES
      (${tid}, 'addon', 'ADD_LED',       'إضاءة LED', 'LED Lighting', 800, false, 1),
      (${tid}, 'addon', 'ADD_USB',       'شحن USB', 'USB Charging', 400, false, 2),
      (${tid}, 'addon', 'ADD_METAL',     'تفاصيل معدنية', 'Metal Details', 600, false, 3),
      (${tid}, 'addon', 'ADD_CAPITONE',  'كابيتونيه', 'Capitone', 1200, false, 4),
      (${tid}, 'addon', 'ADD_CNC',       'شغل CNC', 'CNC Work', 2000, false, 5),
      (${tid}, 'addon', 'ADD_MECHANISM', 'ميكانيزم تخزين', 'Storage Mechanism', 3000, false, 6)
    `);
  }
  console.log("✅ Variables seeded");

  // ── 6. COMPLEXITY LEVELS ───────────────────────────────────
  await db.execute(`DELETE FROM pricing_complexity`);

  for (const bedType of allBedTypes) {
    const tid = bedType.id;
    await db.execute(`
      INSERT INTO pricing_complexity (productTypeId, level, nameAr, multiplier, description) VALUES
      (${tid}, 'basic',    'بيسيك - بسيط',     '1.00', 'تصميم بسيط بدون تفاصيل معقدة'),
      (${tid}, 'standard', 'ستاندرد - متوسط',   '1.25', 'تصميم متوسط مع تفاصيل معقولة'),
      (${tid}, 'premium',  'بريميوم - فاخر',    '1.60', 'تصميم فاخر مع تفاصيل عالية'),
      (${tid}, 'custom',   'كاستم - خاص',       '2.00', 'تصميم خاص بالكامل حسب طلب العميل')
    `);
  }
  console.log("✅ Complexity levels seeded");

  console.log("\n🎉 Seeding complete! Pro Furniture → Bedroom → Bed is ready.");
  await db.end();
}

seed().catch(console.error);
