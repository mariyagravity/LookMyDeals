/**
 * LookMyDeals Formatting & Security Utilities
 * Rule: Money is stored as integer minor units (paise). 100 paise = 1 INR.
 */

export function formatINR(paise: number): string {
  const rupees = Math.round(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function calculateDiscount(listedMinor: number, offerMinor?: number): number {
  if (!offerMinor || offerMinor >= listedMinor || listedMinor <= 0) {
    return 0;
  }
  return Math.round(((listedMinor - offerMinor) / listedMinor) * 100);
}

/**
 * DPDP Act privacy requirement: Never display raw phone numbers in UI or logs.
 * Example: "9847012345" -> "98•••••345"
 */
export function maskPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.length < 5) return '••••••';
  const start = cleaned.slice(0, 2);
  const end = cleaned.slice(-3);
  return `${start}•••••${end}`;
}

/**
 * Generate cryptographically random, unambiguous demo claim code
 */
export function generateClaimCode(prefix = 'LMD'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // excludes 0, 1, I, O to prevent confusion
  const array = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 6; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[array[i] % chars.length];
  }
  return `${prefix}-${code.slice(0, 3)}-${code.slice(3)}`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
