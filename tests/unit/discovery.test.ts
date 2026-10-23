import { describe, it, expect } from 'vitest';
import { getEnrichedListings, PRODUCTS } from '../../src/data/seedData';

describe('Local Discovery & Pack-Size Correctness (lmd-tester FR-101..103)', () => {
  const listings = getEnrichedListings();

  it('populates enriched listings with valid store and locality data', () => {
    expect(listings.length).toBeGreaterThan(10);
    listings.forEach((l) => {
      expect(l.store.name).toBeDefined();
      expect(l.locality.name).toBeDefined();
      expect(l.product.name).toBeDefined();
      expect(l.listedPriceMinor).toBeGreaterThan(0);
    });
  });

  it('verifies that 1 L and 5 L oils are treated as distinct SKUs and not grouped together', () => {
    const oil1L = listings.filter((l) => l.product.id === 'prod_fortune_oil_1l');
    const oil5L = listings.filter((l) => l.product.id === 'prod_fortune_oil_5l');

    expect(oil1L.length).toBeGreaterThan(0);
    expect(oil5L.length).toBeGreaterThan(0);

    // Ensure pack sizes are strictly separated
    oil1L.forEach((l) => expect(l.product.packSize).toBe('1 L'));
    oil5L.forEach((l) => expect(l.product.packSize).toBe('5 L'));

    // Prices must not be conflated (5L is not priced as 1L)
    expect(oil5L[0].listedPriceMinor).toBeGreaterThan(oil1L[0].listedPriceMinor * 3);
  });

  it('filters listings by category accurately', () => {
    const groceryDeals = listings.filter(
      (l) => l.product.category === 'Groceries & Staples'
    );
    expect(groceryDeals.length).toBeGreaterThan(5);
    groceryDeals.forEach((l) => {
      expect(l.product.category).toBe('Groceries & Staples');
    });
  });

  it('filters listings by Kochi localities accurately', () => {
    const edappallyDeals = listings.filter(
      (l) => l.store.localityId === 'edappally'
    );
    expect(edappallyDeals.length).toBeGreaterThan(0);
    edappallyDeals.forEach((l) => {
      expect(l.locality.id).toBe('edappally');
    });
  });
});
