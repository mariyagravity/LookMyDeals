import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { db } from '../db';
import { getRetailerSession, requireRetailer } from '../middleware/retailerSession';

const router = Router();

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 5) return '••••••';
  return `${cleaned.slice(0, 2)}•••••${cleaned.slice(-3)}`;
}

const RequestSchema = z.object({
  itemName: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().min(1).max(80),
  locality: z.string().trim().min(1).max(120),
  pinCode: z.string().regex(/^\d{6}$/),
  targetPriceMinor: z.number().int().nonnegative().optional(),
  contactPhone: z.string().trim().optional(),
  contactMasked: z.string().trim().min(1, 'Contact number is required').max(30),
});

router.get('/', requireRetailer, async (req: Request, res: Response) => {
  const session = getRetailerSession(req);
  if (!session) return res.status(401).json({ error: { code: 'RETAILER_LOGIN_REQUIRED', message: 'Sign in to view customer requests.' } });
  try {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT id, item_name, brand, category, locality, pin_code, target_price_minor,
             contact_reference, status, created_at
      FROM offer_requests ORDER BY created_at DESC
    `);
    return res.json(rows.map((row) => {
      const rawContact = String(row.contact_reference || '');
      const digitsOnly = rawContact.replace(/\D/g, '');
      const isFullPhone = digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91'));
      const contactPhone = isFullPhone ? (digitsOnly.length === 12 ? digitsOnly.slice(2) : digitsOnly) : undefined;
      return {
        id: String(row.id),
        itemName: String(row.item_name),
        brand: String(row.brand || '') || undefined,
        category: String(row.category),
        locality: String(row.locality),
        pinCode: String(row.pin_code),
        targetPriceMinor: row.target_price_minor === null ? undefined : Number(row.target_price_minor),
        contactMasked: contactPhone ? maskPhone(contactPhone) : (rawContact || undefined),
        contactPhone,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        status: String(row.status),
      };
    }));
  } catch {
    return res.status(500).json({ error: { code: 'REQUESTS_LOAD_FAILED', message: 'Could not load offer requests.' } });
  }
});

router.patch('/:id/status', requireRetailer, async (req: Request, res: Response) => {
  const session = getRetailerSession(req);
  if (!session) return res.status(401).json({ error: { code: 'RETAILER_LOGIN_REQUIRED', message: 'Sign in required.' } });
  const { status } = req.body;
  if (!['open', 'responded', 'closed'].includes(status)) {
    return res.status(400).json({ error: { message: 'Invalid status value.' } });
  }
  try {
    await db.execute('UPDATE offer_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, status });
  } catch {
    return res.status(500).json({ error: { message: 'Failed to update request status.' } });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_OFFER_REQUEST', message: 'Check the offer request details and try again.' } });
  }
  const data = parsed.data;
  const id = randomUUID();
  const contactToSave = data.contactPhone || data.contactMasked;
  try {
    await db.execute(
      `INSERT INTO offer_requests
        (id, item_name, brand, category, locality, pin_code, target_price_minor, contact_reference, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [id, data.itemName, data.brand || null, data.category, data.locality, data.pinCode,
        data.targetPriceMinor ?? null, contactToSave]
    );
    return res.status(201).json({
      id,
      ...data,
      createdAt: new Date().toISOString(),
      status: 'open',
    });
  } catch {
    return res.status(500).json({ error: { code: 'REQUEST_SAVE_FAILED', message: 'Could not save your request.' } });
  }
});

export default router;
