import { Router, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { db } from '../db';
import { createRateLimiter } from '../middleware/rateLimit';
import { clearRetailerSession, createRetailerSession, getRetailerSession, requireRetailer } from '../middleware/retailerSession';

const router = Router();
const loginLimiter = createRateLimiter(5, 15 * 60 * 1000);
const LoginSchema = z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(1).max(200) });
const LULU_STORE_ID = process.env.DEMO_LULU_STORE_ID || 'store_lulu_edappally';

function passwordMatches(provided: string, expected: string): boolean {
  const actualBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function localityId(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function dateValue(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value ? String(value).slice(0, 10) : undefined;
}

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_LOGIN', message: 'Enter a username and password.' } });

  if (process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: { code: 'DEMO_LOGIN_DISABLED', message: 'The demo retailer login is disabled in production.' } });
  }

  const demoPassword = process.env.DEMO_LULU_PASSWORD || '';
  if (!demoPassword || parsed.data.username.toLowerCase() !== 'lulu' || !passwordMatches(parsed.data.password, demoPassword)) {
    return res.status(401).json({ error: { code: 'INVALID_LOGIN', message: 'Username or password is incorrect.' } });
  }

  try {
    const [stores] = await db.execute<RowDataPacket[]>('SELECT id FROM stores WHERE id = ?', [LULU_STORE_ID]);
    if (!stores.length) return res.status(503).json({ error: { code: 'RETAILER_STORE_UNAVAILABLE', message: 'The LuLu demo store is not available in the catalog.' } });
    createRetailerSession(res, LULU_STORE_ID);
    return res.json({ authenticated: true });
  } catch {
    return res.status(503).json({ error: { code: 'RETAILER_LOGIN_UNAVAILABLE', message: 'Could not sign in right now.' } });
  }
});

router.get('/session', (req: Request, res: Response) => {
  return res.json({ authenticated: Boolean(getRetailerSession(req)) });
});

router.post('/logout', (req: Request, res: Response) => {
  clearRetailerSession(req, res);
  return res.json({ authenticated: false });
});

router.get('/dashboard', requireRetailer, async (req: Request, res: Response) => {
  const session = getRetailerSession(req);
  if (!session) return res.status(401).json({ error: { code: 'RETAILER_LOGIN_REQUIRED', message: 'Sign in to access the retailer workspace.' } });

  try {
    const [storeRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, name, locality, pin_code, address, verification_status FROM stores WHERE id = ?',
      [session.storeId]
    );
    const storeRow = storeRows[0];
    if (!storeRow) return res.status(403).json({ error: { code: 'RETAILER_STORE_UNAVAILABLE', message: 'The retailer store is no longer available.' } });

    const [listingRows] = await db.execute<RowDataPacket[]>(`
      SELECT l.id, l.store_id, l.product_id, l.listed_price_minor, l.offer_price_minor,
             l.currency, l.source_type, l.verification_status, l.valid_from, l.valid_until,
             l.price_checked_at, s.name AS store_name, s.locality, s.pin_code, s.address,
             s.verification_status AS store_verification_status,
             p.name AS product_name, p.brand, p.category, p.pack_size, p.unit
      FROM store_listings l
      JOIN stores s ON s.id = l.store_id
      JOIN products p ON p.id = l.product_id
      WHERE l.store_id = ?
      ORDER BY l.id
    `, [session.storeId]);

    const [requestRows] = await db.execute<RowDataPacket[]>(`
      SELECT id, item_name, brand, category, locality, pin_code, target_price_minor,
             contact_reference, status, created_at
      FROM offer_requests
      WHERE pin_code = ? OR LOWER(locality) = LOWER(?)
      ORDER BY created_at DESC
    `, [String(storeRow.pin_code), String(storeRow.locality)]);
    const [visitorRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS unique_visitors FROM brochure_visitors WHERE store_id = ?',
      [session.storeId]
    );
    const [claimRows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total_claims FROM listing_claim_events WHERE store_id = ?',
      [session.storeId]
    );
    const [brochureRows] = await db.execute<RowDataPacket[]>(`
      SELECT b.id, b.original_file_name, b.mime_type, b.file_size_bytes,
             b.processing_status, b.uploaded_at, COUNT(bi.id) AS item_count
      FROM brochures b
      LEFT JOIN brochure_items bi ON bi.brochure_id = b.id
      WHERE b.store_id = ?
      GROUP BY b.id, b.original_file_name, b.mime_type, b.file_size_bytes,
               b.processing_status, b.uploaded_at
      ORDER BY b.uploaded_at DESC
    `, [session.storeId]);

    const storeLocality = String(storeRow.locality);
    const listings = listingRows.map((row) => {
      const listedPriceMinor = Number(row.listed_price_minor);
      const offerPriceMinor = row.offer_price_minor === null ? undefined : Number(row.offer_price_minor);
      const discountPercent = offerPriceMinor && listedPriceMinor > 0
        ? Math.round(((listedPriceMinor - offerPriceMinor) / listedPriceMinor) * 100)
        : 0;
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
          localityId: localityId(storeLocality),
          address: String(row.address || ''),
          verificationStatus: String(row.store_verification_status),
        },
        locality: { id: localityId(storeLocality), name: storeLocality, pinCode: String(storeRow.pin_code), landmark: '' },
        discountPercent,
        savingsMinor: offerPriceMinor ? Math.max(0, listedPriceMinor - offerPriceMinor) : 0,
      };
    });

    const categories = [...new Set(listings.map((listing) => listing.product.category))].sort();
    return res.json({
      retailer: { username: 'lulu', storeId: session.storeId },
      store: {
        id: session.storeId,
        name: String(storeRow.name),
        localityId: localityId(storeLocality),
        address: String(storeRow.address || ''),
        verificationStatus: String(storeRow.verification_status),
      },
      locality: storeLocality,
      pinCode: String(storeRow.pin_code),
      listings,
      brochures: brochureRows.map((row) => ({
        id: String(row.id),
        fileName: String(row.original_file_name),
        mimeType: String(row.mime_type),
        fileSizeBytes: Number(row.file_size_bytes),
        status: String(row.processing_status),
        uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : String(row.uploaded_at),
        itemCount: Number(row.item_count || 0),
      })),
      categories,
      requests: requestRows.map((row) => ({
        id: String(row.id),
        itemName: String(row.item_name),
        brand: String(row.brand || '') || undefined,
        category: String(row.category),
        locality: String(row.locality),
        pinCode: String(row.pin_code),
        targetPriceMinor: row.target_price_minor === null ? undefined : Number(row.target_price_minor),
        contactMasked: String(row.contact_reference || '') || undefined,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        status: String(row.status),
      })),
      uniqueBrochureVisitors: Number(visitorRows[0]?.unique_visitors || 0),
      offerClaims: Number(claimRows[0]?.total_claims || 0),
    });
  } catch {
    return res.status(500).json({ error: { code: 'RETAILER_DASHBOARD_FAILED', message: 'Could not load the retailer dashboard.' } });
  }
});

export default router;
