import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ===== KITCHEN MATERIALS =====
const materials = [
  // First Wood
  { brand: "First Wood", nameAr: "(First Wood) UV LAC", pricePerMeter: 7100, sortOrder: 1 },
  { brand: "First Wood", nameAr: "(First Wood) POLY LAC تركي", pricePerMeter: 7950, sortOrder: 2 },
  { brand: "First Wood", nameAr: "(First Wood) POLY LAC هندي", pricePerMeter: 7850, sortOrder: 3 },
  { brand: "First Wood", nameAr: "(First Wood) HPL ألوان خشبية", pricePerMeter: 6400, sortOrder: 4 },
  { brand: "First Wood", nameAr: "(First Wood) HPL ألوان مميزة", pricePerMeter: 7000, sortOrder: 5 },
  { brand: "First Wood", nameAr: "(First Wood) HPL جود وود+ارجانيك", pricePerMeter: 7900, sortOrder: 6 },
  { brand: "First Wood", nameAr: "(First Wood) L.G +HPL+ اكليريك", pricePerMeter: 8400, sortOrder: 7 },
  { brand: "First Wood", nameAr: "(First Wood) pvc أركوبا", pricePerMeter: 6900, sortOrder: 8 },
  { brand: "First Wood", nameAr: "(First Wood) ستار وود ميلامين", pricePerMeter: 6600, sortOrder: 9 },
  { brand: "First Wood", nameAr: "(First Wood) طبقات Lumber J", pricePerMeter: 7600, sortOrder: 10 },
  { brand: "First Wood", nameAr: "(First Wood) Gloss MAX", pricePerMeter: 7800, sortOrder: 11 },
  { brand: "First Wood", nameAr: "(First Wood) pvc تركي", pricePerMeter: 6700, sortOrder: 12 },
  { brand: "First Wood", nameAr: "(First Wood) MW-UV LAC", pricePerMeter: 7600, sortOrder: 13 },
  // Good Wood
  { brand: "Good Wood", nameAr: "(Good Wood) UV LAC", pricePerMeter: 7350, sortOrder: 14 },
  { brand: "Good Wood", nameAr: "(Good Wood) POLY LAC تركي", pricePerMeter: 8200, sortOrder: 15 },
  { brand: "Good Wood", nameAr: "(Good Wood) POLY LAC هندي", pricePerMeter: 8100, sortOrder: 16 },
  { brand: "Good Wood", nameAr: "(Good Wood) HPL ألوان خشبية", pricePerMeter: 6650, sortOrder: 17 },
  { brand: "Good Wood", nameAr: "(Good Wood) HPL ألوان مميزة", pricePerMeter: 7250, sortOrder: 18 },
  { brand: "Good Wood", nameAr: "(Good Wood) HPL جود وود+ارجانيك", pricePerMeter: 8150, sortOrder: 19 },
  { brand: "Good Wood", nameAr: "(Good Wood) L.G +HPL+ اكليريك", pricePerMeter: 8650, sortOrder: 20 },
  { brand: "Good Wood", nameAr: "(Good Wood) pvc أركوبا", pricePerMeter: 7150, sortOrder: 21 },
  { brand: "Good Wood", nameAr: "(Good Wood) ستار وود ميلامين", pricePerMeter: 6850, sortOrder: 22 },
  { brand: "Good Wood", nameAr: "(Good Wood) طبقات Lumber J", pricePerMeter: 7850, sortOrder: 23 },
  { brand: "Good Wood", nameAr: "(Good Wood) Gloss MAX", pricePerMeter: 8050, sortOrder: 24 },
  { brand: "Good Wood", nameAr: "(Good Wood) pvc تركي", pricePerMeter: 6950, sortOrder: 25 },
  { brand: "Good Wood", nameAr: "(Good Wood) MW-UV LAC", pricePerMeter: 7850, sortOrder: 26 },
];

await conn.execute("DELETE FROM kitchen_materials");
for (const m of materials) {
  await conn.execute(
    "INSERT INTO kitchen_materials (brand, nameAr, pricePerMeter, sortOrder) VALUES (?, ?, ?, ?)",
    [m.brand, m.nameAr, m.pricePerMeter, m.sortOrder]
  );
}
console.log(`✓ Inserted ${materials.length} kitchen materials`);

// ===== KITCHEN ACCESSORIES =====
const accessories = [
  // JT Brand
  { brand: "JT", nameAr: "(JT) ماجيك يسار الومنيوم معدل FDR-900", price: 13800, sortOrder: 1 },
  { brand: "JT", nameAr: "(JT) ماجيك يسار s الومنيوم معدل FDR-901", price: 13800, sortOrder: 2 },
  { brand: "JT", nameAr: "(JT) ماجيك يمين s الومنيوم معدل FDR-900", price: 13800, sortOrder: 3 },
  { brand: "JT", nameAr: "(JT) ماجيك يمين ويسار معدل استانلس JT-0512", price: 13800, sortOrder: 4 },
  { brand: "JT", nameAr: "(JT) ماجيك يمين ويسار معدل زجاج XGW-900", price: 13800, sortOrder: 5 },
  { brand: "JT", nameAr: "(JT) مطبقية ثابتة 60 ستانلس", price: 1800, sortOrder: 6 },
  { brand: "JT", nameAr: "(JT) مطبقية ثابتة 70 ستانلس", price: 1900, sortOrder: 7 },
  { brand: "JT", nameAr: "(JT) مطبقية ثابتة 80 ستانلس", price: 2000, sortOrder: 8 },
  { brand: "JT", nameAr: "(JT) مطبقية ثابتة 90 ستانلس", price: 2100, sortOrder: 9 },
  { brand: "JT", nameAr: "(JT) مطبقية ثابتة 100 ستانلس", price: 2300, sortOrder: 10 },
  { brand: "JT", nameAr: "(JT) مطبقيه هيدروليك اكريليك مستويات 70cm", price: 12500, sortOrder: 11 },
  { brand: "JT", nameAr: "(JT) مطبقيه هيدروليك اكريليك مستويات 80cm", price: 15000, sortOrder: 12 },
  { brand: "JT", nameAr: "(JT) مطبقيه بلت ان", price: 5700, sortOrder: 13 },
  { brand: "JT", nameAr: "(JT) مطبقيه سطح استانلس 50cm", price: 2000, sortOrder: 14 },
  { brand: "JT", nameAr: "(JT) مطبقيه سطح استانلس 60cm", price: 2300, sortOrder: 15 },
  { brand: "JT", nameAr: "(JT) مطبقيه سطح خشب 50cm", price: 3450, sortOrder: 16 },
  { brand: "JT", nameAr: "(JT) مطبقيه سطح خشب 70cm", price: 3600, sortOrder: 17 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 70cm اكريليك", price: 7700, sortOrder: 18 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 75cm اكريليك", price: 8000, sortOrder: 19 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 80cm استانلس", price: 8600, sortOrder: 20 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 80cm اكريليك", price: 8300, sortOrder: 21 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 80cm اكريليك مرحلتين", price: 17800, sortOrder: 22 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 90cm استانلس", price: 9700, sortOrder: 23 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 90cm اكريليك", price: 8700, sortOrder: 24 },
  { brand: "JT", nameAr: "(JT) مطبقيه سفليه 90cm اكريليك مرحلتين", price: 18400, sortOrder: 25 },
  { brand: "JT", nameAr: "(JT) مطبقيه هيدروليك بالرخام", price: 47000, sortOrder: 26 },
  { brand: "JT", nameAr: "(JT) منظم هيدروليك (1)", price: 8100, sortOrder: 27 },
  { brand: "JT", nameAr: "(JT) منظم هيدروليك (2)", price: 10300, sortOrder: 28 },
  { brand: "JT", nameAr: "(JT) منظم هيدروليك بالرخام (1)", price: 40700, sortOrder: 29 },
  { brand: "JT", nameAr: "(JT) منظم هيدروليك بالرخام (2)", price: 26400, sortOrder: 30 },
  { brand: "JT", nameAr: "(JT) منظم اطباق", price: 1100, sortOrder: 31 },
  { brand: "JT", nameAr: "(JT) ميكانزم تخزين 180 دبل فيس كورنر", price: 40000, sortOrder: 32 },
  { brand: "JT", nameAr: "(JT) ميكانزم طاوله متحركه BLTN الومنيوم", price: 20700, sortOrder: 33 },
  { brand: "JT", nameAr: "(JT) ميكانزم طاوله متحركه BLTN بتثبيت", price: 15000, sortOrder: 34 },
  // SX Brand
  { brand: "SX", nameAr: "(SX) باسكت القمامه 24 لتر عين", price: 5100, sortOrder: 35 },
  { brand: "SX", nameAr: "(SX) باسكت القمامه 32 لتر 2 عين", price: 5100, sortOrder: 36 },
  { brand: "SX", nameAr: "(SX) باسكت القمامه 35 لتر عين", price: 5100, sortOrder: 37 },
  { brand: "SX", nameAr: "(SX) ترابيزة بدون قائم", price: 19000, sortOrder: 38 },
  { brand: "SX", nameAr: "(SX) ترابيزة بقائم", price: 21000, sortOrder: 39 },
  { brand: "SX", nameAr: "(SX) ترولى زيت 15 سم مجري سوفت جانبي مرحلتين", price: 2800, sortOrder: 40 },
  { brand: "SX", nameAr: "(SX) ترولى زيت 20 سم مجري سوفت جانبي مرحلتين", price: 3400, sortOrder: 41 },
  { brand: "SX", nameAr: "(SX) ترولى زيت 25 سم مجري سوفت جانبي مرحلتين", price: 4000, sortOrder: 42 },
  { brand: "SX", nameAr: "(SX) ترولى زيت 30 سم مجري سوفت جانبي مرحلتين", price: 4600, sortOrder: 43 },
  { brand: "SX", nameAr: "(SX) ترولى زيت مجري سوفت جانبي 40 سم", price: 5100, sortOrder: 44 },
  { brand: "SX", nameAr: "(SX) ترولى زيت مجري سوفت جانبي 45 سم", price: 5750, sortOrder: 45 },
  { brand: "SX", nameAr: "(SX) تقسيم معالق 60 غامق", price: 1000, sortOrder: 46 },
  { brand: "SX", nameAr: "(SX) تقسيم معالق 70 غامق", price: 1200, sortOrder: 47 },
  { brand: "SX", nameAr: "(SX) تقسيم معالق 80 غامق", price: 1350, sortOrder: 48 },
  { brand: "SX", nameAr: "(SX) تقسيم معالق 90 غامق", price: 1450, sortOrder: 49 },
  { brand: "SX", nameAr: "(SX) سلة 3/4 دائرة 30 سم 74x86 سم (1)", price: 4600, sortOrder: 50 },
  { brand: "SX", nameAr: "(SX) سلة 3/4 دائرة 30 سم 74x86 سم (2)", price: 5100, sortOrder: 51 },
  { brand: "SX", nameAr: "(SX) سلة مهملات بلاستيك تليسكوبي 12+12 لتر 2 عين", price: 5100, sortOrder: 52 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف متحرك 180 درجه 30 سم", price: 12100, sortOrder: 53 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف متحرك 180 درجه 35 سم", price: 12700, sortOrder: 54 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف متحرك 180 درجه 40 سم", price: 11600, sortOrder: 55 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف متحرك 180 درجه 45 سم", price: 13300, sortOrder: 56 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف ثابت 30 سم", price: 8600, sortOrder: 57 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف ثابت 35 سم", price: 10400, sortOrder: 58 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف ثابت 40 سم", price: 11000, sortOrder: 59 },
  { brand: "SX", nameAr: "(SX) كارجو 6 رف ثابت 45 سم", price: 11600, sortOrder: 60 },
  { brand: "SX", nameAr: "(SX) مطبقية ثابتة 60", price: 3500, sortOrder: 61 },
  { brand: "SX", nameAr: "(SX) مطبقية ثابتة 70", price: 4000, sortOrder: 62 },
  { brand: "SX", nameAr: "(SX) مطبقية ثابتة 80", price: 4500, sortOrder: 63 },
  { brand: "SX", nameAr: "(SX) مطبقية ثابتة 90", price: 5000, sortOrder: 64 },
  { brand: "SX", nameAr: "(SX) مطبقية هيدروليك 60", price: 8200, sortOrder: 65 },
  { brand: "SX", nameAr: "(SX) مطبقية هيدروليك 70", price: 8900, sortOrder: 66 },
  { brand: "SX", nameAr: "(SX) مطبقية هيدروليك 80", price: 9400, sortOrder: 67 },
  { brand: "SX", nameAr: "(SX) مطبقية هيدروليك 90", price: 10400, sortOrder: 68 },
  { brand: "SX", nameAr: "(SX) مطبقيه سفلية 60", price: 9200, sortOrder: 69 },
  { brand: "SX", nameAr: "(SX) مطبقيه سفلية 70", price: 8700, sortOrder: 70 },
  { brand: "SX", nameAr: "(SX) مطبقيه سفلية 80", price: 10300, sortOrder: 71 },
  // Other accessories
  { brand: "Other", nameAr: "باكم هيدروليك بلوموشن", price: 250, sortOrder: 72 },
  { brand: "Other", nameAr: "تاتش", price: 230, sortOrder: 73 },
  { brand: "Other", nameAr: "مقابض بلت ان", price: 550, sortOrder: 74 },
  { brand: "Other", nameAr: "جريل تهوية", price: 250, sortOrder: 75 },
  { brand: "Other", nameAr: "الليد بروفيل", price: 550, sortOrder: 76 },
  { brand: "Other", nameAr: "مقابض او وزر مضيء", price: 900, sortOrder: 77 },
  { brand: "Other", nameAr: "درج جانبي", price: 2800, sortOrder: 78 },
  { brand: "Other", nameAr: "درج سفلي", price: 4000, sortOrder: 79 },
  { brand: "Other", nameAr: "درج ميتال JUST TOP + KAV", price: 4000, sortOrder: 80 },
  { brand: "Other", nameAr: "درج ميتال بلوم", price: 4600, sortOrder: 81 },
  { brand: "Other", nameAr: "درج ميتال + زجاج سوكوريت JUST TOP + KAV", price: 5100, sortOrder: 82 },
  { brand: "Other", nameAr: "درج ميتال + زجاج سوكوريت بلوم", price: 9200, sortOrder: 83 },
  { brand: "Other", nameAr: "مفصلة بلوم", price: 230, sortOrder: 84 },
  { brand: "Other", nameAr: "دراع افينتوس", price: 4800, sortOrder: 85 },
];

await conn.execute("DELETE FROM kitchen_accessories");
for (const a of accessories) {
  await conn.execute(
    "INSERT INTO kitchen_accessories (brand, nameAr, price, sortOrder) VALUES (?, ?, ?, ?)",
    [a.brand, a.nameAr, a.price, a.sortOrder]
  );
}
console.log(`✓ Inserted ${accessories.length} kitchen accessories`);

// ===== KITCHEN MARBLE =====
const marbles = [
  // Granite
  { code: "G01", nameAr: "اسود اسواني", category: "granite", sortOrder: 1 },
  { code: "G02", nameAr: "جندولا", category: "granite", sortOrder: 2 },
  { code: "G03", nameAr: "رمادي فاتح", category: "granite", sortOrder: 3 },
  { code: "G04", nameAr: "فيردي أصفر", category: "granite", sortOrder: 4 },
  { code: "G05", nameAr: "فيردي أخضر", category: "granite", sortOrder: 5 },
  { code: "G06", nameAr: "دبل بلاك", category: "granite", sortOrder: 6 },
  { code: "G07", nameAr: "جلاكسي", category: "granite", sortOrder: 7 },
  { code: "G08", nameAr: "فانتستيك وايت", category: "granite", sortOrder: 8 },
  { code: "G09", nameAr: "براديسيو", category: "granite", sortOrder: 9 },
  { code: "G10", nameAr: "ابلادور ايطالي", category: "granite", sortOrder: 10 },
  { code: "G11", nameAr: "بيلتيك براون", category: "granite", sortOrder: 11 },
  { code: "G12", nameAr: "هيمالايا براون", category: "granite", sortOrder: 12 },
  { code: "G13", nameAr: "كشمير جولد", category: "granite", sortOrder: 13 },
  { code: "G14", nameAr: "شيفا جولد", category: "granite", sortOrder: 14 },
  // Porcelain
  { code: "B01", nameAr: "بورسيلين", category: "porcelain", sortOrder: 15 },
  { code: "B02", nameAr: "Golden Portoro", category: "porcelain", sortOrder: 16 },
  { code: "B03", nameAr: "Statuario Lucidato", category: "porcelain", sortOrder: 17 },
  { code: "B04", nameAr: "Silver Dragon", category: "porcelain", sortOrder: 18 },
  { code: "B05", nameAr: "Statuario Bianco", category: "porcelain", sortOrder: 19 },
  { code: "B06", nameAr: "Spider White", category: "porcelain", sortOrder: 20 },
  { code: "B07", nameAr: "Black Eden", category: "porcelain", sortOrder: 21 },
  { code: "B08", nameAr: "Blue Pearl", category: "porcelain", sortOrder: 22 },
  { code: "B09", nameAr: "Niro Antico", category: "porcelain", sortOrder: 23 },
  { code: "B10", nameAr: "Statuario Lincolin", category: "porcelain", sortOrder: 24 },
  // Quartz
  { code: "Q01", nameAr: "Aziza Noir", category: "quartz", sortOrder: 25 },
  { code: "Q02", nameAr: "Royal Gold", category: "quartz", sortOrder: 26 },
  { code: "Q03", nameAr: "Thin Grey", category: "quartz", sortOrder: 27 },
  { code: "Q04", nameAr: "Ocean Storm", category: "quartz", sortOrder: 28 },
  { code: "QX1", nameAr: "نانو جلاس", category: "quartz", sortOrder: 29 },
  { code: "QX2", nameAr: "كوارتز هندي", category: "quartz", sortOrder: 30 },
  { code: "QX3", nameAr: "كوارتز الماني بلوتو", category: "quartz", sortOrder: 31 },
  { code: "QX4", nameAr: "كوارتز تركي", category: "quartz", sortOrder: 32 },
];

await conn.execute("DELETE FROM kitchen_marble");
for (const m of marbles) {
  await conn.execute(
    "INSERT INTO kitchen_marble (code, nameAr, category, sortOrder) VALUES (?, ?, ?, ?)",
    [m.code, m.nameAr, m.category, m.sortOrder]
  );
}
console.log(`✓ Inserted ${marbles.length} marble types`);

// ===== KITCHEN CLADDING =====
const cladding = [
  { nameAr: "تاج U/C", price: 2300, sortOrder: 1 },
  { nameAr: "شيت دواخل خشابي HPL", price: 4000, sortOrder: 2 },
  { nameAr: "شيت تجاليد ارضيات علوي خشابي HPL", price: 1700, sortOrder: 3 },
  { nameAr: "شيت HPL جراي (فروميكا)", price: 700, sortOrder: 4 },
  { nameAr: "تجاليد HPL+MDF", price: 3200, sortOrder: 5 },
  { nameAr: "تجاليد HPL+كونتر", price: 4000, sortOrder: 6 },
  { nameAr: "تجاليد Polylac+MDF", price: 5700, sortOrder: 7 },
  { nameAr: "تجاليد Lumber J", price: 5100, sortOrder: 8 },
  { nameAr: "تجاليد ميلامين+كرونوسبان MDF", price: 2800, sortOrder: 9 },
  { nameAr: "تجاليد جوود وود", price: 5100, sortOrder: 10 },
  { nameAr: "تجاليد UV lac", price: 4000, sortOrder: 11 },
  { nameAr: "تجاليد أركوبا PET/pvc", price: 4000, sortOrder: 12 },
  { nameAr: "ارفف ديكوريه MDF", price: 3200, sortOrder: 13 },
  { nameAr: "ارفف ديكوريه كونتر", price: 4000, sortOrder: 14 },
  { nameAr: "تجاليد استربات يوفي لاك MW", price: 5100, sortOrder: 15 },
  { nameAr: "تجاليد استربات HPL", price: 5100, sortOrder: 16 },
  { nameAr: "تجاليد استربات Polylac", price: 10100, sortOrder: 17 },
  { nameAr: "تجاليد استربات كرونوسبان", price: 5100, sortOrder: 18 },
  { nameAr: "شيت خارجي", price: 700, sortOrder: 19 },
  { nameAr: "تجاليد بديل رخام", price: 1000, sortOrder: 20 },
  { nameAr: "تجاليد بديل حجر", price: 4600, sortOrder: 21 },
  { nameAr: "قاعدة بوتجاز او تلاجه", price: 2000, sortOrder: 22 },
  { nameAr: "ضلفة زجاج عادي - صغيرة (حتى 80سم)", price: 1100, sortOrder: 23 },
  { nameAr: "ضلفة زجاج عادي - متوسطة (80-160سم)", price: 1700, sortOrder: 24 },
  { nameAr: "ضلفة زجاج عادي - كبير (160-300سم)", price: 2300, sortOrder: 25 },
  { nameAr: "ضلفة زجاج سوكوريت - صغيرة (حتى 80سم)", price: 2300, sortOrder: 26 },
  { nameAr: "ضلفة زجاج سوكوريت - متوسطة (80-160سم)", price: 2800, sortOrder: 27 },
  { nameAr: "ضلفة زجاج سوكوريت - كبير (160-300سم)", price: 4600, sortOrder: 28 },
  { nameAr: "رف زجاج شفاف 6مم", price: 550, sortOrder: 29 },
  { nameAr: "رف زجاج شفاف 8مم", price: 800, sortOrder: 30 },
  { nameAr: "رف زجاج شفاف 10مم", price: 1000, sortOrder: 31 },
  { nameAr: "رف زجاج مصنفر/مضيء 6مم", price: 1000, sortOrder: 32 },
  { nameAr: "رف زجاج مصنفر/مضيء 8مم", price: 1600, sortOrder: 33 },
  { nameAr: "رف زجاج مصنفر/مضيء 10مم", price: 2100, sortOrder: 34 },
  { nameAr: "رف زجاج اخضر مضيء 6مم", price: 1100, sortOrder: 35 },
  { nameAr: "رف زجاج اخضر مضيء 8مم", price: 1700, sortOrder: 36 },
  { nameAr: "رف زجاج اخضر مضيء 10مم", price: 2300, sortOrder: 37 },
  { nameAr: "زجاج ديكور مصنفر", price: 2800, sortOrder: 38 },
  { nameAr: "زجاج ديكور عادي", price: 1700, sortOrder: 39 },
  { nameAr: "زجاج ديكور سوكوريت", price: 3400, sortOrder: 40 },
];

await conn.execute("DELETE FROM kitchen_cladding");
for (const c of cladding) {
  await conn.execute(
    "INSERT INTO kitchen_cladding (nameAr, price, sortOrder) VALUES (?, ?, ?)",
    [c.nameAr, c.price, c.sortOrder]
  );
}
console.log(`✓ Inserted ${cladding.length} cladding items`);

await conn.end();
console.log("\n✅ Kitchen data seeding complete!");
