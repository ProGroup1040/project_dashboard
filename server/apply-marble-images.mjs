import mysql from 'mysql2/promise';

const MARBLE_IMAGES = {
  "G01": "/manus-storage/G01_0312c5bb.jpg",
  "G02": "/manus-storage/G02_e4f42c5e.jpg",
  "G03": "/manus-storage/G03_4e08b5f8.jpg",
  "G04": "/manus-storage/G04_f1578b55.jpg",
  "G05": "/manus-storage/G05_52f01737.jpg",
  "G06": "/manus-storage/G06_03897211.jpg",
  "G07": "/manus-storage/G07_cee71cc0.jpg",
  "G08": "/manus-storage/G08_9d1ee457.jpg",
  "G09": "/manus-storage/G09_e969fd98.jpg",
  "G10": "/manus-storage/G10_35c92668.jpg",
  "G11": "/manus-storage/G11_c7358dd6.jpg",
  "G12": "/manus-storage/G12_d1d7f878.jpg",
  "G13": "/manus-storage/G13_2c297790.jpg",
  "G14": "/manus-storage/G14_131efcc7.jpg",
  "B01": "/manus-storage/B01_3a9e030c.jpg",
  "B02": "/manus-storage/B02_93ed0aa7.jpg",
  "B03": "/manus-storage/B03_34044438.jpg",
  "B04": "/manus-storage/B04_09a6bbf9.jpg",
  "B05": "/manus-storage/B05_377f7dac.jpg",
  "B06": "/manus-storage/B06_fb6db640.jpg",
  "B07": "/manus-storage/B07_9fe6e843.jpg",
  "B08": "/manus-storage/B08_7a52c2de.jpg",
  "B09": "/manus-storage/B09_ae1005fc.jpg",
  "B10": "/manus-storage/B10_f7fca828.jpg",
  "Q01": "/manus-storage/Q01_392e23bd.jpg",
  "Q02": "/manus-storage/Q02_20fd1599.jpg",
  "Q03": "/manus-storage/Q03_562c8760.jpg",
  "Q04": "/manus-storage/Q04_161575c5.jpg",
};

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });

  // Add imageUrl column if not exists
  try {
    await conn.execute(`ALTER TABLE kitchen_marble ADD COLUMN imageUrl VARCHAR(255) DEFAULT NULL`);
    console.log('✓ Added imageUrl column');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('  imageUrl column already exists');
    } else {
      throw e;
    }
  }

  let updated = 0;
  for (const [code, imageUrl] of Object.entries(MARBLE_IMAGES)) {
    const [result] = await conn.execute(
      `UPDATE kitchen_marble SET imageUrl = ? WHERE code = ?`,
      [imageUrl, code]
    );
    if (result.affectedRows > 0) {
      console.log(`  ✓ ${code} → ${imageUrl}`);
      updated++;
    } else {
      console.log(`  ⚠ ${code} not found in DB`);
    }
  }

  await conn.end();
  console.log(`\n✅ Updated ${updated} marble image URLs`);
}

main().catch(console.error);
