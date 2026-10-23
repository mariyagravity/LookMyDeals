import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { db } from '../db';
import { createRateLimiter } from '../middleware/rateLimit';
import { getRetailerSession, requireRetailer } from '../middleware/retailerSession';

const router = Router();
const brochureVisitLimiter = createRateLimiter(120, 15 * 60 * 1000);
const BrochureVisitSchema = z.object({ visitorId: z.string().uuid() });

router.get('/brochure-visits', requireRetailer, async (req: Request, res: Response) => {
  const session = getRetailerSession(req);
  if (!session) return res.status(401).json({ error: { code: 'RETAILER_LOGIN_REQUIRED', message: 'Sign in to view brochure analytics.' } });
  try {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT s.id AS store_id, s.name AS store_name, COUNT(v.visitor_id) AS unique_visitors
      FROM stores s
      LEFT JOIN brochure_visitors v ON v.store_id = s.id
      WHERE s.id = ?
      GROUP BY s.id, s.name
      ORDER BY s.name
    `, [session.storeId]);
    return res.json(rows.map((row) => ({
      storeId: String(row.store_id),
      storeName: String(row.store_name),
      uniqueVisitors: Number(row.unique_visitors),
    })));
  } catch {
    return res.status(500).json({ error: { code: 'BROCHURE_STATS_FAILED', message: 'Could not load brochure visit counts.' } });
  }
});

router.post('/stores/:storeId/brochure-visits', brochureVisitLimiter, async (req: Request, res: Response) => {
  const parsed = BrochureVisitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_VISITOR_ID', message: 'A valid browser visit ID is required.' } });
  }

  try {
    const [stores] = await db.execute<RowDataPacket[]>('SELECT id FROM stores WHERE id = ?', [req.params.storeId]);
    if (!stores.length) return res.status(404).json({ error: { code: 'STORE_NOT_FOUND', message: 'This store brochure was not found.' } });

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT IGNORE INTO brochure_visitors (store_id, visitor_id) VALUES (?, ?)',
      [req.params.storeId, parsed.data.visitorId]
    );
    return res.status(result.affectedRows > 0 ? 201 : 200).json({ recorded: result.affectedRows > 0 });
  } catch {
    return res.status(500).json({ error: { code: 'BROCHURE_VISIT_FAILED', message: 'Could not record this brochure visit.' } });
  }
});

const PublishSchema = z.object({
  storeId: z.string().min(1).max(64),
  items: z.array(z.object({
    productName: z.string().trim().min(1).max(200),
    brand: z.string().max(120).nullable().optional(),
    packSize: z.string().max(80).nullable().optional(),
    unit: z.string().max(40).nullable().optional(),
    category: z.string().trim().min(1).max(80),
    regularPrice: z.number().positive().nullable(),
    offerPrice: z.number().positive().nullable(),
    validFrom: z.string().date().nullable().optional(),
    validUntil: z.string().date().nullable().optional(),
  }).refine((item) => item.regularPrice !== null || item.offerPrice !== null)
    .refine((item) => item.regularPrice === null || item.offerPrice === null || item.offerPrice <= item.regularPrice)
  ).min(1).max(100),
});

function localityId(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [storeRows] = await db.query<RowDataPacket[]>(
      'SELECT id, name, locality, pin_code, address, verification_status FROM stores ORDER BY name'
    );
    const [productRows] = await db.query<RowDataPacket[]>(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    const [listingRows] = await db.query<RowDataPacket[]>(`
      SELECT
        l.id, l.store_id, l.product_id, l.listed_price_minor, l.offer_price_minor,
        l.currency, l.source_type, l.verification_status, l.valid_from, l.valid_until,
        l.price_checked_at, s.name AS store_name, s.locality, s.pin_code, s.address,
        s.verification_status AS store_verification_status,
        p.name AS product_name, p.brand, p.category, p.pack_size, p.unit
      FROM store_listings l
      JOIN stores s ON s.id = l.store_id
      JOIN products p ON p.id = l.product_id
      ORDER BY l.id
    `);

    const stores = storeRows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      localityId: localityId(String(row.locality)),
      address: String(row.address || ''),
      verificationStatus: String(row.verification_status),
    }));
    const localityMap = new Map<string, { id: string; name: string; pinCode: string; landmark: string }>();
    for (const row of storeRows) {
      const name = String(row.locality);
      const id = localityId(name);
      if (!localityMap.has(id)) localityMap.set(id, {
        id,
        name,
        pinCode: String(row.pin_code),
        landmark: '',
      });
    }

    const listings = listingRows.map((row) => {
      const locality = localityMap.get(localityId(String(row.locality)))!;
      const listedPriceMinor = Number(row.listed_price_minor);
      const offerPriceMinor = row.offer_price_minor === null ? undefined : Number(row.offer_price_minor);
      const discountPercent = offerPriceMinor && listedPriceMinor > 0
        ? Math.round(((listedPriceMinor - offerPriceMinor) / listedPriceMinor) * 100)
        : 0;
      const dateValue = (value: unknown) => value instanceof Date
        ? value.toISOString().slice(0, 10)
        : value ? String(value).slice(0, 10) : undefined;

      return {
        id: String(row.id),
        storeId: String(row.store_id),
        productId: String(row.product_id),
        listedPriceMinor,
        offerPriceMinor,
        currency: String(row.currency),
        sourceType: String(row.source_type),
        verificationStatus: String(row.verification_status),
        validFrom: dateValue(row.valid_from),
        validUntil: dateValue(row.valid_until),
        priceCheckedAt: dateValue(row.price_checked_at) || '',
        product: {
          id: String(row.product_id),
          name: String(row.product_name),
          brand: String(row.brand || ''),
          category: String(row.category),
          packSize: String(row.pack_size || ''),
          unit: String(row.unit || ''),
        },
        store: {
          id: String(row.store_id),
          name: String(row.store_name),
          localityId: locality.id,
          address: String(row.address || ''),
          verificationStatus: String(row.store_verification_status),
        },
        locality,
        discountPercent,
        savingsMinor: offerPriceMinor ? Math.max(0, listedPriceMinor - offerPriceMinor) : 0,
      };
    });

    return res.json({
      stores,
      localities: [
        { id: 'all', name: 'All Kochi', pinCode: '682000', landmark: '' },
        ...localityMap.values(),
      ],
      categories: productRows.map((row) => String(row.category)),
      listings,
    });
  } catch {
    return res.status(500).json({ error: { code: 'CATALOG_LOAD_FAILED', message: 'Could not load the catalog.' } });
  }
});

router.post('/brochure/publish', requireRetailer, async (req: Request, res: Response) => {
  const parsed = PublishSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_PUBLISH_DATA', message: 'Check the approved product details and prices.' } });
  }

  const { storeId, items } = parsed.data;
  const session = getRetailerSession(req);
  if (!session || session.storeId !== storeId) {
    return res.status(403).json({ error: { code: 'STORE_ACCESS_DENIED', message: 'You can only publish listings for your own store.' } });
  }
  const connection = await db.getConnection();
  try {
    const [stores] = await connection.execute<RowDataPacket[]>('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (!stores.length) return res.status(404).json({ error: { code: 'STORE_NOT_FOUND', message: 'Choose a store from the catalog.' } });

    await connection.beginTransaction();
    for (const item of items) {
      const productId = randomUUID();
      const listingId = randomUUID();
      const listedPriceMinor = Math.round((item.regularPrice ?? item.offerPrice!) * 100);
      const offerPriceMinor = item.offerPrice === null ? null : Math.round(item.offerPrice * 100);
      await connection.execute(
        `INSERT INTO products (id, name, brand, category, pack_size, unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, item.productName, item.brand || null, item.category, item.packSize || null, item.unit || null]
      );
      await connection.execute(
        `INSERT INTO store_listings
          (id, store_id, product_id, listed_price_minor, offer_price_minor, currency,
           source_type, verification_status, valid_from, valid_until, price_checked_at)
         VALUES (?, ?, ?, ?, ?, 'INR', 'brochure', 'demo', ?, ?, CURRENT_DATE)`,
        [listingId, storeId, productId, listedPriceMinor, offerPriceMinor, item.validFrom || null, item.validUntil || null]
      );
    }
    await connection.commit();
    return res.status(201).json({ published: items.length });
  } catch {
    await connection.rollback();
    return res.status(500).json({ error: { code: 'PUBLISH_FAILED', message: 'Could not publish the approved listings.' } });
  } finally {
    connection.release();
  }
});

export default router;
