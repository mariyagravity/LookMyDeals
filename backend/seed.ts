import { db, checkDatabaseConnection } from './db';
import { INITIAL_LISTINGS, LOCALITIES, PRODUCTS, STORES } from './seed/demoCatalog';

async function seedDemoCatalog() {
  await checkDatabaseConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const localityById = new Map(LOCALITIES.map((locality) => [locality.id, locality]));
    for (const store of STORES) {
      const locality = localityById.get(store.localityId);
      if (!locality) throw new Error(`Missing locality for store ${store.id}`);
      await connection.execute(
        `INSERT IGNORE INTO stores
          (id, name, category, locality, pin_code, address, verification_status)
         VALUES (?, ?, ?, ?, ?, ?, 'demo')`,
        [store.id, store.name, store.categories?.[0] || 'Retail', locality.name, locality.pinCode, store.address]
      );
    }

    for (const product of PRODUCTS) {
      await connection.execute(
        `INSERT IGNORE INTO products (id, name, brand, category, pack_size, unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [product.id, product.name, product.brand || null, product.category, product.packSize || null, product.unit || null]
      );
    }

    for (const listing of INITIAL_LISTINGS) {
      await connection.execute(
        `INSERT IGNORE INTO store_listings
          (id, store_id, product_id, listed_price_minor, offer_price_minor, currency,
           source_type, verification_status, valid_from, valid_until, price_checked_at)
         VALUES (?, ?, ?, ?, ?, ?, 'demo', 'demo', ?, ?, ?)`,
        [
          listing.id,
          listing.storeId,
          listing.productId,
          listing.listedPriceMinor,
          listing.offerPriceMinor ?? null,
          listing.currency,
          listing.validFrom ?? null,
          listing.validUntil ?? null,
          listing.priceCheckedAt || null,
        ]
      );
    }

    await connection.commit();
    console.log(`[LookMyDeals DB] demo catalog seeded: ${STORES.length} stores, ${PRODUCTS.length} products, ${INITIAL_LISTINGS.length} listings.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

seedDemoCatalog()
  .catch((error) => {
    console.error('[LookMyDeals DB] demo catalog seed failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  })
  .finally(async () => db.end());
