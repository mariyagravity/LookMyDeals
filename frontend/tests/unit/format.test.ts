import { describe, it, expect } from 'vitest';
import {
  formatINR,
  calculateDiscount,
  maskPhoneNumber,
  generateClaimCode,
} from '../../src/lib/format';

describe('Format and Financial Utilities (lmd-tester)', () => {
  it('formats minor units (paise) into INR currency correctly', () => {
    expect(formatINR(18500)).toContain('185');
    expect(formatINR(0)).toContain('0');
    expect(formatINR(13550)).toContain('135.5');
  });

  it('calculates discount percentages correctly', () => {
    // Listed: ₹200 (20000), Offer: ₹150 (15000) -> 25% off
    expect(calculateDiscount(20000, 15000)).toBe(25);
    // Offer >= Listed -> 0%
    expect(calculateDiscount(20000, 20000)).toBe(0);
    expect(calculateDiscount(20000, 25000)).toBe(0);
  });

  it('masks phone numbers according to DPDP privacy requirements', () => {
    expect(maskPhoneNumber('9847012345')).toBe('98•••••345');
    expect(maskPhoneNumber('+91 9847012345')).toBe('98•••••345');
  });

  it('generates unambiguous CSPRNG claim codes', () => {
    const code = generateClaimCode('LMD');
    expect(code).toMatch(/^LMD-[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{3}$/);
    // Must not contain 0, 1, I, O
    expect(code).not.toMatch(/[01IO]/);
  });
});
