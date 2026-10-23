import { z } from 'zod';
import { CartItem } from '../types';

export const CART_STORAGE_KEY = 'lmd.cart.v1';
export const REQUESTS_STORAGE_KEY = 'lmd.requests.v1';
export const CLAIMS_STORAGE_KEY = 'lmd.claims.v1';
export const APPROVED_BROCHURE_STORAGE_KEY = 'lmd.approved_brochure_items.v1';

export const CART_DISCLAIMER_TEXT =
  'Items are not reserved; prices subject to in-store verification upon visit.';

const CartItemSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  productId: z.string(),
  storeId: z.string(),
  productName: z.string(),
  brand: z.string(),
  packSize: z.string(),
  storeName: z.string(),
  localityName: z.string(),
  priceSnapshotMinor: z.number().int().nonnegative(),
  listedPriceMinor: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  addedAt: z.string(),
});

const CartStateSchema = z.array(CartItemSchema);

export function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = CartStateSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[LookMyDeals] Corrupted cart in localStorage, resetting to empty.');
      return [];
    }
    return result.data;
  } catch (err) {
    console.error('[LookMyDeals] Failed reading cart from localStorage', err);
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[LookMyDeals] Failed saving cart to localStorage', err);
  }
}

export function calculateCartSummary(items: CartItem[]) {
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPayableMinor = items.reduce(
    (acc, item) => acc + item.priceSnapshotMinor * item.quantity,
    0
  );
  const totalOriginalMinor = items.reduce(
    (acc, item) => acc + item.listedPriceMinor * item.quantity,
    0
  );
  const totalSavingsMinor = Math.max(0, totalOriginalMinor - totalPayableMinor);

  return {
    totalItems,
    totalPayableMinor,
    totalOriginalMinor,
    totalSavingsMinor,
  };
}
