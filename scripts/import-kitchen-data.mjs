/**
 * Kitchen data import script
 * Run: node scripts/import-kitchen-data.mjs
 */
import "dotenv/config";
import { createConnection } from "mysql2/promise";

const sql = `
DELETE FROM kitchen_cladding;
DELETE FROM kitchen_marble;
DELETE FROM kitchen_accessories;
DELETE FROM kitchen_materials;
`;

const materials = [
  ['First Wood', '(First Wood)UV LAC', 7100],
  ['First Wood', '(First Wood) POLY LAC تركي', 7950],
  ['First Wood', '(First Wood) POLY LAC هندي', 7850],
  ['First Wood', '(First Wood) HPL ألوان خشبية', 6400],
  ['First Wood', '(First Wood) HPL ألوان مميزة', 7000],
  ['First Wood', '(First Wood) HPLجود وود+ارجانيك', 7900],
  ['First Wood', '(First Wood) L.G +HPL+ اكليريك', 8400],
  ['First Wood', '(First Wood) pvc  أركوبا', 6900],
  ['First Wood', '(First Wood) ستار وود ميلامين', 6600],
  ['First Wood', '(First Wood) طبقات Lumber J', 7600],
  ['First Wood', '(First Wood) Gloss MAX', 7800],
  ['First Wood', '(First Wood)pvc تركي', 6700],
  ['First Wood', '(First Wood)- MW-UV LAC', 7600],
  ['Good Wood', '(Good Wood)UV LAC', 7350],
  ['Good Wood', '(Good Wood) POLY LAC تركي', 8200],
  ['Good Wood', '(Good Wood) POLY LAC هندي', 8100],
  ['Good Wood', '(Good Wood) HPL ألوان خشبية', 6650],
  ['Good Wood', '(Good Wood) HPL ألوان مميزة', 7250],
  ['Good Wood', '(Good Wood) HPLجود وود+ارجانيك', 8150],
  ['Good Wood', '(Good Wood) L.G +HPL+ اكليريك', 8650],
  ['Good Wood', '(Good Wood) pvc أركوبا', 7150],
  ['Good Wood', '(Good Wood) ستار وود ميلامين', 6850],
  ['Good Wood', '(Good Wood) طبقات Lumber J', 7850],
  ['Good Wood', '(Good Wood) Gloss MAX', 8050],
  ['Good Wood', '(good Wood)pvc تركي', 6950],
  ['Good Wood', '(good Wood)- MW-UV LAC', 7850],
];

const accessories = [
  ['JT', '(JT) باسكت قمامه سوفت JT0528', 3500],
  ['JT', '(JT)اكسسوار مطبخ معلق', 7400],
  ['JT', '(JT)الفينتور مانيوال up and down', 8500],
  ['JT', '(JT)باسكت قمامة مميز 9200', 9200],
  ['JT', '(JT)باسكت قمامة مميز 9400', 9400],
  ['JT', '(JT)باسكت قمامة مميز 9600', 9600],
  ['JT', '(JT)باسكت قمامهA300', 3400],
  ['JT', '(JT)باسكت مهملات', 2300],
  ['JT', '(JT)بول اوت ميني محوري استالس', 6900],
  ['JT', '(JT)ترولي 3 رف استلس سوفت كلوز 35سم', 6400],
  ['JT', '(JT)ترولي 3 رف استلس سوفت كلوز 40سم', 6400],
  ['JT', '(JT)ترولي 3 رف زجاج اسود سوفت كلوز 40سم', 7400],
  ['JT', '(JT)ترولي 30cm الومنيوم بدرج متحرك', 9200],
  ['JT', '(JT)ترولي 35cm الومنيوم بدرج متحرك', 9600],
  ['JT', '(JT)ترولي 40cm الومنيوم بدرج متحرك', 10000],
  ['JT', '(JT)ترولي استالس 15cm', 4900],
  ['JT', '(JT)ترولي استالس 25cm', 5400],
  ['JT', '(JT)ترولي استالس 30cm', 5800],
  ['JT', '(JT)ترولي استالس 35cm', 6300],
  ['JT', '(JT)ترولي استانلس 3 رف 20cm', 5000],
  ['JT', '(JT)ترولي استانلس 3 رف 25cm', 5500],
  ['JT', '(JT)ترولي استانلس 3 رف 30cm', 5900],
  ['JT', '(JT)ترولي اكريليك سفلي 3 رف 15cm', 5100],
  ['JT', '(JT)ترولي جانبي اسود سوفت كلوز 15cm', 4800],
  ['JT', '(JT)ترولي جانبي اسود سوفت كلوز 20cm', 5100],
  ['JT', '(JT)ترولي جانبي اسود سوفت كلوز 25cm', 5400],
  ['JT', '(JT)ترولي جانبي اسود سوفت كلوز 30cm', 5750],
  ['JT', '(JT)ترولي جانبي اسود سوفت كلوز 35cm', 6000],
  ['JT', '(JT)ترولي جانبي اكريلليك 2 رف 10cm', 4300],
  ['JT', '(JT)ترولي جانبي اكريلليك 2 رف 15cm', 4800],
  ['JT', '(JT)ترولي جانبي اكريلليك 2 رف 20cm', 5300],
  ['JT', '(JT)ترولي جانبي قاعدة خشبية سوفت كلوز 15cm', 4300],
  ['JT', '(JT)ترولي جانبي قاعدة خشبية سوفت كلوز 20cm', 4600],
  ['JT', '(JT)ترولي جانبي قاعدة خشبية سوفت كلوز 25cm', 4800],
  ['JT', '(JT)ترولي جانبي قاعدة خشبية سوفت كلوز 30cm', 5100],
  ['JT', '(JT)ترولي جانبي قاعدة خشبية سوفت كلوز 35cm', 5400],
  ['JT', '(JT)حامل ادوات مطبخ 6 فرع سوفت كلوز', 2000],
  ['JT', '(JT)حامل مقاطع', 500],
  ['JT', '(JT)حامل هيدروليك معلق', 5700],
  ['JT', '(JT)دولاب 6 رف استلس سوفت كلوز اسود 45cm', 18600],
  ['JT', '(JT)دولاب 6 رف استلس سوفت كلوز فضي 45cm', 18000],
  ['JT', '(JT)رايز بوكس داخلي', 7400],
  ['JT', '(JT)رايز بوكس زجاجي', 6200],
  ['JT', '(JT)رايز بوكس مميز', 18400],
  ['JT', '(JT)سله 3/4 متحركه 90 سم JT-214', 8600],
  ['JT', '(JT)صفايه سمارت كهرباء 80cm', 48000],
  ['JT', '(JT)صفايه هيدروليك بخزنه باور 80cm', 9500],
  ['JT', '(JT)صفايه هيدروليك كهرباء 80cm', 48000],
  ['JT', '(JT)طاوله كهرباء سخان', 18900],
  ['JT', '(JT)ماجيك s يمين ويسار', 10900],
  ['JT', '(JT)ماجيك الحصان معدل اكريليك JT0151G', 15500],
  ['JT', '(JT)ماجيك فلاي مون رمادي 45cm', 9200],
  ['JT', '(JT)ماجيك يسار s الومنيوم FDR-901', 13800],
  ['JT', '(JT)ماجيك يمين s الومنيوم FDR-900', 13800],
  ['JT', '(JT)ماجيك يمين ويسار استانلس JT-0512 304', 13800],
  ['JT', '(JT)ماجيك يمين ويسار زجاج XGW-900', 13800],
  ['JT', '(JT)مطبقية ثابتة 100 ستانلس', 2300],
  ['JT', '(JT)مطبقية ثابتة 60 ستانلس', 1800],
  ['JT', '(JT)مطبقية ثابتة 70 ستانلس', 1900],
  ['JT', '(JT)مطبقية ثابتة 80 ستانلس', 2000],
  ['JT', '(JT)مطبقية ثابتة 90 ستانلس', 2100],
  ['JT', '(JT)مطبقيه هيدروليك اكريليك 70cm', 12500],
  ['JT', '(JT)مطبقيه هيدروليك اكريليك 80cm', 15000],
  ['JT', '(JT)مطبقيه بلت ان', 5700],
  ['JT', '(JT)مطبقيه سطح استانلس 50cm', 2000],
  ['JT', '(JT)مطبقيه سطح استانلس 60cm', 2300],
  ['JT', '(JT)مطبقيه سطح خشب 50cm', 3450],
  ['JT', '(JT)مطبقيه سطح خشب 70cm', 3600],
  ['JT', '(JT)مطبقيه سفليه 70cm اكريليك', 7700],
  ['JT', '(JT)مطبقيه سفليه 75cm اكريليك', 8000],
  ['JT', '(JT)مطبقيه سفليه 80cm استانلس', 8600],
  ['JT', '(JT)مطبقيه سفليه 80cm اكريليك', 8300],
  ['JT', '(JT)مطبقيه سفليه 80cm اكريليك مرحلتين', 17800],
  ['JT', '(JT)مطبقيه سفليه 90cm استانلس', 9700],
  ['JT', '(JT)مطبقيه سفليه 90cm اكريليك', 8700],
  ['JT', '(JT)مطبقيه سفليه 90cm اكريليك مرحلتين', 18400],
  ['JT', '(JT)مطبقيه هيدروليك بالرخام', 47000],
  ['JT', '(JT)منظم هيدروليك 8100', 8100],
  ['JT', '(JT)منظم هيدروليك 10300', 10300],
  ['JT', '(JT)منظم هيدروليك بالرخام 40700', 40700],
  ['JT', '(JT)منظم هيدروليك بالرخام 26400', 26400],
  ['JT', '(JT)منظم اطباق', 1100],
  ['JT', '(JT)ميكانزم تخزين 180 دبل فيس كورنر', 40000],
  ['JT', '(JT)ميكانزم طاوله متحركه BLTN الومنيوم', 20700],
  ['JT', '(JT)ميكانزم طاوله متحركه BLTN بتثبيت', 15000],
  ['SX', '(SX)باسكت القمامه 24 لتر عين', 5100],
  ['SX', '(SX)باسكت القمامه 32 لتر 2 عين', 5100],
  ['SX', '(SX)باسكت القمامه 35 لتر عين', 5100],
  ['SX', '(SX)ترابيزة بدون قائم', 19000],
  ['SX', '(SX)ترابيزة بقائم', 21000],
  ['SX', '(SX)ترولى زيت 15 سم سوفت جانبي', 2800],
  ['SX', '(SX)ترولى زيت 20 سم سوفت جانبي', 3400],
  ['SX', '(SX)ترولى زيت 25 سم سوفت جانبي', 4000],
  ['SX', '(SX)ترولى زيت 30 سم سوفت جانبي', 4600],
  ['SX', '(SX)ترولى زيت 40 سم سوفت جانبي', 5100],
  ['SX', '(SX)ترولى زيت 45 سم سوفت جانبي', 5750],
  ['SX', '(SX)تقسيم معالق 60 غامق', 1000],
  ['SX', '(SX)تقسيم معالق 70 غامق', 1200],
  ['SX', '(SX)تقسيم معالق 80 غامق', 1350],
  ['SX', '(SX)تقسيم معالق 90 غامق', 1450],
  ['SX', '(SX)سلة 3/4 دائرة 30 سم', 4600],
  ['SX', '(SX)سلة مهملات بلاستيك 12+12 لتر', 5100],
  ['SX', '(SX)كارجو 6 رف متحرك 180 درجه 35 سم', 12700],
  ['SX', '(SX)كارجو 6 رف متحرك 180 درجه 40 سم', 11600],
  ['SX', '(SX)كارجو 6 رف متحرك 180 درجه 45 سم', 13300],
  ['SX', '(SX)كارجو 6 رف ثابت 35 سم', 10400],
  ['SX', '(SX)كارجو 6 رف ثابت 40 سم', 11000],
  ['SX', '(SX)كارجو 6 رف متحرك 180 درجه 30 سم', 12100],
  ['SX', '(SX)كارجو 6 رف ثابت 45 سم', 11600],
  ['SX', '(SX)كارجو 6 رف ثابت 30 سم', 8600],
  ['SX', '(SX)مطبقية ثابتة 60', 3500],
  ['SX', '(SX)مطبقية ثابتة 70', 4000],
  ['SX', '(SX)مطبقية ثابتة 80', 4500],
  ['SX', '(SX)مطبقية ثابتة 90', 5000],
  ['SX', '(SX)مطبقية هيدروليك 60', 8200],
  ['SX', '(SX)مطبقية هيدروليك 70', 8900],
  ['SX', '(SX)مطبقية هيدروليك 80', 9400],
  ['SX', '(SX)مطبقية هيدروليك 90', 10400],
  ['SX', '(SX)مطبقيه سفلية 60', 9200],
  ['SX', '(SX)مطبقيه سفلية 70', 8700],
  ['SX', '(SX)مطبقيه سفلية 80', 10300],
  ['Other', 'باكم هيدروليك بلوموشن', 250],
  ['Other', 'تاتش', 230],
  ['Other', 'مقابض بلت ان', 550],
  ['Other', 'جريل تهوية', 250],
  ['Other', 'الليد بروفيل', 550],
  ['Other', 'مقابض او وزر مضيء', 900],
  ['Other', 'درج جانبي', 2800],
  ['Other', 'درج سفلي', 4000],
  ['Other', 'درج ميتال - JUST TOP + KAV', 4000],
  ['Other', 'درج ميتال - بلوم', 4600],
  ['Other', 'درج ميتال + زجاج سوكوريت - JUST TOP + KAV', 5100],
  ['Other', 'درج ميتال + زجاج سوكوريت - بلوم', 9200],
  ['Other', 'مفصلة بلوم', 230],
  ['Other', 'دراع افينتوس', 4800],
];

const marbleItems = [
  ['G01', 'اسود اسواني', 'granite'],
  ['G02', 'جندولا', 'granite'],
  ['G03', 'رمادي فاتح', 'granite'],
  ['G04', 'فيردي أصفر', 'granite'],
  ['G05', 'فيردي أخضر', 'granite'],
  ['G06', 'دبل بلاك', 'granite'],
  ['G07', 'جلاكسي', 'granite'],
  ['G08', 'فانتستيك وايت', 'granite'],
  ['G09', 'براديسيو', 'granite'],
  ['G10', 'ابلادور ايطالي', 'granite'],
  ['G11', 'بيلتيك براون', 'granite'],
  ['G12', 'هيمالايا براون', 'granite'],
  ['G13', 'كشمير جولد', 'granite'],
  ['G14', 'شيفا جولد', 'granite'],
  ['B01', 'بورسيلين', 'porcelain'],
  ['B02', 'Golden Portoro', 'porcelain'],
  ['B03', 'Statuario Lucidato', 'porcelain'],
  ['B04', 'Silver Dragon', 'porcelain'],
  ['B05', 'Statuario Bianco', 'porcelain'],
  ['B06', 'Spider White', 'porcelain'],
  ['B07', 'Black Eden', 'porcelain'],
  ['B08', 'Blue Pearl', 'porcelain'],
  ['B09', 'Niro Antico', 'porcelain'],
  ['B10', 'Statuario Lincolin', 'porcelain'],
  ['Q01', 'Aziza Noir', 'quartz'],
  ['Q02', 'Royal Gold', 'quartz'],
  ['Q03', 'Thin Grey', 'quartz'],
  ['Q04', 'Ocean Storm', 'quartz'],
  ['N01', 'نانو جلاس', 'other'],
  ['K01', 'كوارتز هندي', 'other'],
  ['K02', 'كوارتز الماني بلوتو', 'other'],
  ['K03', 'كوارتز تركي', 'other'],
];

const claddingItems = [
  ['تاج U/C', 2800],
  ['شيت دواخل خشابي HPL', 5000],
  ['شيت تجاليد ارضيات علوي خشابي HPL', 2000],
  ['شيت HPL جراي (فروميكا)', 900],
  ['تجاليد HPL+MDF', 4000],
  ['تجاليد HPL+كونتر', 5000],
  ['تجاليد Polylac+MDF', 7100],
  ['تجاليد Lumber J', 6300],
  ['تجاليد ميلامين+كرونوسبان MDF', 3500],
  ['تجاليد جوود وود', 6300],
  ['تجاليد UV lac', 5000],
  ['تجاليد أركوبا PET/pvc', 5000],
  ['ارفف ديكوريه MDF', 4000],
  ['ارفف ديكوريه كونتر', 5000],
  ['تجاليد استربات يوفي لاك-MW', 6300],
  ['تجاليد استربات HPL', 5100],
  ['تجاليد استربات Polylac', 12600],
  ['تجاليد استربات كرونوسبان', 6300],
  ['شيت خارجي', 880],
  ['تجاليد بديل رخام', 1250],
  ['تجاليد بديل حجر', 5750],
  ['قاعدة بوتجاز او تلاجه', 2500],
  ['ضلفة زجاج عادي - صغيرة حتى 80سم', 1300],
  ['ضلفة زجاج عادي - متوسطة 80-160 سم', 2100],
  ['ضلفة زجاج عادي - كبير 160-300 سم', 2800],
  ['ضلفة زجاج سوكوريت - صغيرة حتى 80سم', 2800],
  ['ضلفة زجاج سوكوريت - متوسطة 80-160 سم', 3500],
  ['ضلفة زجاج سوكوريت - كبير 160-300 سم', 5700],
  ['رف زجاج شفاف 6 مم', 700],
  ['رف زجاج شفاف 8 مم', 1000],
  ['رف زجاج شفاف 10 مم', 1300],
  ['رف زجاج مصنفر/مضيء 6 مم', 1300],
  ['رف زجاج مصنفر/مضيء 8 مم', 2000],
  ['رف زجاج مصنفر/مضيء 10 مم', 2600],
  ['رف زجاج اخضر مضيء 6 مم', 1300],
  ['رف زجاج اخضر مضيء 8 مم', 2100],
  ['رف زجاج اخضر مضيء 10 مم', 2800],
  ['زجاج ديكور مصنفر', 3500],
  ['زجاج ديكور عادي', 2100],
  ['زجاج ديكور سوكوريت', 4200],
  ['مرأيا', 4300],
];

async function main() {
  const db = await createConnection(process.env.DATABASE_URL);
  console.log("✅ Connected to database");

  try {
    // Clear existing data
    await db.execute("DELETE FROM kitchen_cladding");
    await db.execute("DELETE FROM kitchen_marble");
    await db.execute("DELETE FROM kitchen_accessories");
    await db.execute("DELETE FROM kitchen_materials");
    console.log("✅ Cleared existing data");

    // Insert materials
    for (let i = 0; i < materials.length; i++) {
      const [brand, nameAr, price] = materials[i];
      await db.execute(
        "INSERT INTO kitchen_materials (brand, nameAr, pricePerMeter, isActive, sortOrder) VALUES (?, ?, ?, 1, ?)",
        [brand, nameAr, price, i + 1]
      );
    }
    console.log(`✅ Inserted ${materials.length} materials`);

    // Insert accessories
    for (let i = 0; i < accessories.length; i++) {
      const [brand, nameAr, price] = accessories[i];
      await db.execute(
        "INSERT INTO kitchen_accessories (brand, nameAr, price, isActive, sortOrder) VALUES (?, ?, ?, 1, ?)",
        [brand, nameAr, price, i + 1]
      );
    }
    console.log(`✅ Inserted ${accessories.length} accessories`);

    // Insert marble
    for (let i = 0; i < marbleItems.length; i++) {
      const [code, nameAr, category] = marbleItems[i];
      await db.execute(
        "INSERT INTO kitchen_marble (code, nameAr, category, isActive, sortOrder) VALUES (?, ?, ?, 1, ?)",
        [code, nameAr, category, i + 1]
      );
    }
    console.log(`✅ Inserted ${marbleItems.length} marble items`);

    // Insert cladding
    for (let i = 0; i < claddingItems.length; i++) {
      const [nameAr, price] = claddingItems[i];
      await db.execute(
        "INSERT INTO kitchen_cladding (nameAr, price, isActive, sortOrder) VALUES (?, ?, 1, ?)",
        [nameAr, price, i + 1]
      );
    }
    console.log(`✅ Inserted ${claddingItems.length} cladding items`);

    console.log("\n🎉 Import complete!");
    console.log(`   Materials: ${materials.length}`);
    console.log(`   Accessories: ${accessories.length}`);
    console.log(`   Marble: ${marbleItems.length}`);
    console.log(`   Cladding: ${claddingItems.length}`);
  } finally {
    await db.end();
  }
}

main().catch(console.error);
