import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db, checkDatabaseConnection } from './db';

const sqlDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sql');
const migrations = [
  '001_init_mysql.sql',
  '002_catalog_dates_and_requests.sql',
  '003_brochure_visitors.sql',
  '004_listing_claim_events.sql',
  '005_brochure_crops.sql',
  '006_brochure_expiry.sql',
];

async function migrate() {
  await checkDatabaseConnection();
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(160) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  for (const name of migrations) {
    const [existing] = await db.execute('SELECT name FROM schema_migrations WHERE name = ?', [name]);
    if (Array.isArray(existing) && existing.length > 0) continue;

    const sql = await readFile(path.join(sqlDirectory, name), 'utf8');
    for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
      await db.query(statement);
    }
    await db.execute('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
    console.log(`[LookMyDeals DB] applied ${name}`);
  }
}

migrate()
  .catch((error) => {
    console.error('[LookMyDeals DB] migration failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(async () => db.end());
