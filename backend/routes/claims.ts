import { Router, Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { db } from '../db';
import { createRateLimiter } from '../middleware/rateLimit';

const router = Router();
const claimLimiter = createRateLimiter(20, 60 * 1000);
const ClaimEventSchema = z.object({
  claimId: z.string().uuid(),
  listingId: z.string().trim().min(1).max(64),
});

router.post('/', claimLimiter, async (req: Request, res: Response) => {
  const parsed = ClaimEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_CLAIM', message: 'The demo claim details are invalid.' } });

  try {
    const [listingRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, store_id FROM store_listings WHERE id = ?',
      [parsed.data.listingId]
    );
    if (!listingRows.length) return res.status(404).json({ error: { code: 'LISTING_NOT_FOUND', message: 'This offer is no longer available.' } });

    const [result] = await db.execute<ResultSetHeader>(
      'INSERT IGNORE INTO listing_claim_events (id, listing_id, store_id) VALUES (?, ?, ?)',
      [parsed.data.claimId, parsed.data.listingId, String(listingRows[0].store_id)]
    );
    return res.status(result.affectedRows > 0 ? 201 : 200).json({ recorded: result.affectedRows > 0, demo: true });
  } catch {
    return res.status(500).json({ error: { code: 'CLAIM_RECORD_FAILED', message: 'Could not record this demo claim.' } });
  }
});

export default router;
