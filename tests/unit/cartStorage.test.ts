import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCartFromStorage,
  saveCartToStorage,
  calculateCartSummary,
  CART_STORAGE_KEY,
} from '../../src/lib/cartStorage';
import { CartItem } from '../../src/types';

describe('Cart Storage & Error Recovery (lmd-tester FR-301, FR-302)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockItem: CartItem = {
    id: 'item_1',
    listingId: 'list_1',
    productId: 'prod_1',
    storeId: 'store_1',
    productName: 'Fortune Sunflower Oil',
    brand: 'Fortune',
    packSize: '1 L',
    storeName: 'LuLu Hypermarket',
    localityName: 'Edappally',
    priceSnapshotMinor: 13900,
    listedPriceMinor: 15500,
    quantity: 2,
    addedAt: '2026-10-24T00:00:00Z',
  };

  it('saves and loads cart items accurately', () => {
    saveCartToStorage([mockItem]);
    const loaded = loadCartFromStorage();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].productName).toBe('Fortune Sunflower Oil');
    expect(loaded[0].quantity).toBe(2);
  });

  it('recovers gracefully from corrupted JSON in localStorage without throwing', () => {
    localStorage.setItem(CART_STORAGE_KEY, 'invalid-json{{{');
    const loaded = loadCartFromStorage();
    expect(loaded).toEqual([]);
  });

  it('recovers gracefully from schema-mismatched data in localStorage', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ invalidField: 123 }]));
    const loaded = loadCartFromStorage();
    expect(loaded).toEqual([]);
  });

  it('calculates total items, payable, and savings using exact integer math', () => {
    const summary = calculateCartSummary([mockItem]);
    expect(summary.totalItems).toBe(2);
    // 13900 * 2 = 27800
    expect(summary.totalPayableMinor).toBe(27800);
    // (15500 - 13900) * 2 = 1600 * 2 = 3200
    expect(summary.totalSavingsMinor).toBe(3200);
  });
});
