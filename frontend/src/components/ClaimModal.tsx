import React, { useState } from 'react';
import { EnrichedListing, OfferClaim } from '../types';
import { formatINR, generateClaimCode, maskPhoneNumber } from '../lib/format';
import { CLAIMS_STORAGE_KEY } from '../lib/cartStorage';
import { X, Copy, Check, Ticket, AlertCircle } from 'lucide-react';

interface ClaimModalProps {
  listing: EnrichedListing | null;
  onClose: () => void;
  onClaimSuccess?: (claim: OfferClaim) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  listing,
  onClose,
  onClaimSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generatedClaim, setGeneratedClaim] = useState<OfferClaim | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!listing) return null;

  const finalPriceMinor = listing.offerPriceMinor || listing.listedPriceMinor;
  const discountMinor = listing.savingsMinor || 0;

  const handleGenerateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Phone is optional or requires 10 digits if provided
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number or leave blank for instant demo claim.');
      return;
    }

    const now = new Date();
    const expiry = new Date();
    const claimCode = listing.couponCode ? listing.couponCode.trim().toUpperCase() : generateClaimCode();

    const newClaim: OfferClaim = {
      id: crypto.randomUUID(),
      listingId: listing.id,
      productName: listing.product.name,
      storeName: listing.store.name,
      localityName: listing.locality.name,
      claimCode,
      couponCode: listing.couponCode || undefined,
      discountMinor,
      finalPriceMinor,
      claimedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      maskedPhone: cleanPhone.length === 10 ? maskPhoneNumber(cleanPhone) : undefined,
      status: 'demo',
    };

    // Save claim locally
    try {
      const existingRaw = localStorage.getItem(CLAIMS_STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify([newClaim, ...existing]));
    } catch (err) {
      console.error('Failed saving claim to storage', err);
    }

    setGeneratedClaim(newClaim);
    if (onClaimSuccess) onClaimSuccess(newClaim);
  };

  const handleCopyCode = () => {
    if (!generatedClaim) return;
    navigator.clipboard.writeText(generatedClaim.claimCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border relative">
        <button
          type="button"
          onClick={onClose}
          className="touch-target absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors rounded-full p-1"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {!generatedClaim ? (
          <div>
            <div className="flex items-center gap-2 text-primary-strong mb-2">
              <Ticket className="w-6 h-6" />
              <h2 id="claim-modal-title" className="text-xl font-bold text-ink">
                {listing.couponCode ? 'Claim Store Coupon' : 'Claim In-Store Deal'}
              </h2>
            </div>

            <p className="text-xs text-ink-muted mb-4">
              {listing.couponCode
                ? `Redeem this store coupon code at ${listing.store.name} checkout.`
                : 'Preview a generated demo code. It is not redeemable at checkout.'}
            </p>

            {listing.couponCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-amber-700" />
                  Store Allotted Coupon:
                </span>
                <span className="font-mono font-black text-sm text-amber-950 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">
                  {listing.couponCode}
                </span>
              </div>
            )}

            {/* Deal Snapshot Box */}
            <div className="bg-surface p-3.5 rounded-xl border border-surface-border mb-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                {listing.product.brand}
              </p>
              <h3 className="text-sm font-bold text-ink mb-1">
                {listing.product.name} ({listing.product.packSize})
              </h3>
              <p className="text-xs text-ink-muted">
                Store: <span className="font-semibold text-ink">{listing.store.name}</span> — {listing.locality.name}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-ink">
                  {formatINR(finalPriceMinor)}
                </span>
                {listing.offerPriceMinor && (
                  <span className="text-xs text-ink-muted line-through">
                    {formatINR(listing.listedPriceMinor)}
                  </span>
                )}
                {discountMinor > 0 && (
                  <span className="text-xs font-semibold text-emerald-600">
                    Save {formatINR(discountMinor)}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleGenerateClaim} className="space-y-4">
              <div>
                <label
                  htmlFor="claim-phone-input"
                  className="block text-xs font-semibold text-ink mb-1"
                >
                  Mobile Number (Optional for Demo)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-slate-100 text-xs font-semibold rounded-lg text-ink-muted border border-surface-border">
                    +91
                  </span>
                  <input
                    id="claim-phone-input"
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. 9847012345"
                    className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
                {phoneNumber.length > 0 && phoneNumber.length === 10 && (
                  <p className="text-[11px] text-ink-muted mt-1">
                    Privacy masked: <span className="font-mono">{maskPhoneNumber(phoneNumber)}</span>
                  </p>
                )}
                {error && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </p>
                )}
              </div>

              {/* Honest Notice */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Demo Mode</strong>: A demo code will be generated immediately for on-screen presentation. No SMS or WhatsApp message is sent.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="touch-target px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-target px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-strong rounded-lg shadow-sm transition-colors"
                >
                  Generate Claim Code
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Code Generated */
          <div className="text-center py-2 animate-fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-ink mb-1">
              {listing.couponCode ? 'Store Coupon Claimed!' : 'Demo Code Claimed!'}
            </h2>
            <p className="text-xs text-ink-muted mb-4">
              Show this coupon code to the cashier at{' '}
              <span className="font-semibold text-ink">{listing.store.name}</span>, {listing.locality.name}.
            </p>

            {/* Generated Code Display Box */}
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 mb-4 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-widest block">
                  {listing.couponCode ? 'Store Allotted Coupon Code' : 'Demo Voucher Code'}
                </span>
                <span className="text-2xl font-black tracking-wider text-ink font-mono">
                  {generatedClaim.claimCode}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="touch-target px-3 py-2 bg-white text-ink border border-surface-border rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-left bg-surface p-3 rounded-lg text-xs space-y-1 mb-4 border border-surface-border">
              <div className="flex justify-between text-ink-muted">
                <span>Offer Price:</span>
                <span className="font-bold text-ink">{formatINR(generatedClaim.finalPriceMinor)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Status:</span>
                <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                  Demo Code
                </span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Expires:</span>
                <span className="font-medium text-ink">
                  {new Date(generatedClaim.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="touch-target w-full py-2.5 bg-ink text-white font-bold text-xs rounded-lg hover:bg-ink-light transition-colors"
            >
              Done & Return to Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
