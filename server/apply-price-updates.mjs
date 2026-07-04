// Price update script - reads from extracted JSON and updates DB
// Column names match schema.ts: nameAr, pricePerMeter, price, brand, code, category
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const pricesData = JSON.parse(readFileSync('/home/ubuntu/upload/all_prices.json', 'utf-8'));

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse MySQL URL
const url = new URL(dbUrl);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

console.log('Connected to DB ✓');

// === 1. Update Materials (kitchen_materials) ===
// Columns: nameAr, pricePerMeter, brand
console.log('\n=== Updating Materials (kitchen_materials) ===');
let matUpdated = 0, matInserted = 0;

for (const mat of pricesData.materials) {
  const name = mat.name.trim();
  const price = mat.price;
  const brand = name.includes('Good Wood') || name.includes('good Wood') ? 'Good Wood' : 'First Wood';
  
  const [existing] = await conn.execute(
    'SELECT id FROM kitchen_materials WHERE nameAr = ?',
    [name]
  );
  
  if (existing.length > 0) {
    await conn.execute(
      'UPDATE kitchen_materials SET pricePerMeter = ? WHERE nameAr = ?',
      [price, name]
    );
    console.log(`  ✓ Updated: ${name} -> ${price} جنيه/م²`);
    matUpdated++;
  } else {
    await conn.execute(
      'INSERT INTO kitchen_materials (brand, nameAr, pricePerMeter, isActive, sortOrder) VALUES (?, ?, ?, 1, 0)',
      [brand, name, price]
    );
    console.log(`  + Inserted: ${name} -> ${price} جنيه/م²`);
    matInserted++;
  }
}
console.log(`Materials: ${matUpdated} updated, ${matInserted} inserted`);

// === 2. Update Accessories (kitchen_accessories) ===
// Columns: nameAr, price, brand
console.log('\n=== Updating Accessories (kitchen_accessories) ===');
let accUpdated = 0, accInserted = 0;

for (const acc of pricesData.accessories) {
  const name = acc.name.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const price = acc.price;
  
  // Determine brand
  let brand = 'Other';
  if (name.startsWith('(JT)')) brand = 'JT';
  else if (name.startsWith('(SX)')) brand = 'SX';
  
  const [existing] = await conn.execute(
    'SELECT id FROM kitchen_accessories WHERE nameAr = ?',
    [name]
  );
  
  if (existing.length > 0) {
    await conn.execute(
      'UPDATE kitchen_accessories SET price = ? WHERE nameAr = ?',
      [price, name]
    );
    console.log(`  ✓ Updated: ${name} -> ${price} جنيه`);
    accUpdated++;
  } else {
    await conn.execute(
      'INSERT INTO kitchen_accessories (brand, nameAr, price, isActive, sortOrder) VALUES (?, ?, ?, 1, 0)',
      [brand, name, price]
    );
    console.log(`  + Inserted: ${name} -> ${price} جنيه`);
    accInserted++;
  }
}
console.log(`Accessories: ${accUpdated} updated, ${accInserted} inserted`);

// === 3. Update Cladding (kitchen_cladding) ===
// Columns: nameAr, price
console.log('\n=== Updating Cladding (kitchen_cladding) ===');
let cladUpdated = 0, cladInserted = 0;

for (const clad of pricesData.cladding) {
  const name = clad.name.trim();
  const price = clad.price;
  
  const [existing] = await conn.execute(
    'SELECT id FROM kitchen_cladding WHERE nameAr = ?',
    [name]
  );
  
  if (existing.length > 0) {
    await conn.execute(
      'UPDATE kitchen_cladding SET price = ? WHERE nameAr = ?',
      [price, name]
    );
    console.log(`  ✓ Updated: ${name} -> ${price} جنيه`);
    cladUpdated++;
  } else {
    await conn.execute(
      'INSERT INTO kitchen_cladding (nameAr, price, isActive) VALUES (?, ?, 1)',
      [name, price]
    );
    console.log(`  + Inserted: ${name} -> ${price} جنيه`);
    cladInserted++;
  }
}
console.log(`Cladding: ${cladUpdated} updated, ${cladInserted} inserted`);

// === 4. Update Granite/Marble (kitchen_marble) ===
// Columns: nameAr, code, category
// NOTE: kitchen_marble has NO price column in schema!
// We need to check if price column exists or add it
console.log('\n=== Checking kitchen_marble schema ===');
const [marbleColumns] = await conn.execute('DESCRIBE kitchen_marble');
const colNames = marbleColumns.map(c => c.Field);
console.log('Columns:', colNames);

const hasPriceCol = colNames.includes('price');
if (!hasPriceCol) {
  console.log('Adding price column to kitchen_marble...');
  await conn.execute('ALTER TABLE kitchen_marble ADD COLUMN price INT DEFAULT 0');
  console.log('Price column added ✓');
}

console.log('\n=== Updating Granite/Marble (kitchen_marble) ===');
let granUpdated = 0, granInserted = 0;

for (const gran of pricesData.granite) {
  const name = gran.name.trim();
  const code = gran.code.trim() === '_' ? '' : gran.code.trim();
  const price = gran.price;
  
  // Determine category from code
  let category = 'granite';
  if (code.startsWith('B')) category = 'porcelain';
  else if (code.startsWith('Q')) category = 'quartz';
  else if (name.includes('كوارتز') || name.includes('نانو')) category = 'quartz';
  
  const [existing] = await conn.execute(
    'SELECT id FROM kitchen_marble WHERE nameAr = ?',
    [name]
  );
  
  if (existing.length > 0) {
    await conn.execute(
      'UPDATE kitchen_marble SET price = ? WHERE nameAr = ?',
      [price, name]
    );
    console.log(`  ✓ Updated: ${name} (${code}) -> ${price} جنيه/م²`);
    granUpdated++;
  } else {
    const finalCode = code || `G${String(granInserted + 100).padStart(2, '0')}`;
    await conn.execute(
      'INSERT INTO kitchen_marble (code, nameAr, category, price, isActive, sortOrder) VALUES (?, ?, ?, ?, 1, 0)',
      [finalCode, name, category, price]
    );
    console.log(`  + Inserted: ${name} (${finalCode}) -> ${price} جنيه/م²`);
    granInserted++;
  }
}
console.log(`Granite/Marble: ${granUpdated} updated, ${granInserted} inserted`);

await conn.end();

console.log('\n' + '='.repeat(50));
console.log('✅ All price updates applied successfully!');
console.log(`   Materials: ${matUpdated} updated, ${matInserted} new`);
console.log(`   Accessories: ${accUpdated} updated, ${accInserted} new`);
console.log(`   Cladding: ${cladUpdated} updated, ${cladInserted} new`);
console.log(`   Granite/Marble: ${granUpdated} updated, ${granInserted} new`);
console.log('='.repeat(50));
