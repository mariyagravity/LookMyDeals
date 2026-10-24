import React, { useState, useEffect } from 'react';
import { OfferClaim } from '../types';
import { formatINR } from '../lib/format';
import { CLAIMS_STORAGE_KEY } from '../lib/cartStorage';
import { X, Copy, Check, Ticket, Trash2, Store, Calendar, ArrowRight } from 'lucide-react';

interface MyClaimsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreDeals?: () => void;
}

export const MyClaimsModal: React.FC<MyClaimsModalProps> = ({
  isOpen,
  onClose,
  onExploreDeals,
}) => {
  const [claims, setClaims] = useState<OfferClaim[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sync claims from localStorage when opened
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setClaims(parsed);
          }
        } else {
          setClaims([]);
        }
      } catch (err) {
        console.error('Failed reading claims', err);
        setClaims([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClearClaims = () => {
    localStorage.removeItem(CLAIMS_STORAGE_KEY);
    setClaims([]);
  };

  const handleRemoveClaim = (id: string) => {
    const updated = claims.filter((c) => c.id !== id);
    setClaims(updated);
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claims-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/50">
              <Ticket className="h-5 w-5" />
            </span>
            <div>
              <h2 id="claims-modal-title" className="text-base font-bold text-slate-900">
                My Claimed Offers
              </h2>
              <p className="text-xs text-slate-500">
                {claims.length} {claims.length === 1 ? 'deal claimed' : 'deals claimed'} for in-store checkout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {claims.length > 0 && (
              <button
                type="button"
                onClick={handleClearClaims}
                title="Clear all claims"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close claims modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {claims.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Ticket className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Claimed Offers Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Click <strong>"Claim Offer"</strong> on any verified supermarket listing to generate a promo code. Present the code at store checkout for verified offline discounts.
              </p>
              {onExploreDeals && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreDeals();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span>Explore Verified Deals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <article
                  key={claim.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {claim.productName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Store className="w-3 h-3 text-slate-400" />
                        <span>{claim.storeName}</span>
                        <span>•</span>
                        <span>{claim.localityName}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveClaim(claim.id)}
                      className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
                      title="Remove claim"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Code Pill & Price */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold tracking-wider text-xs px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg flex items-center gap-1.5">
                        <span>{claim.claimCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(claim.claimCode)}
                          className="hover:text-amber-700 transition-colors"
                          title="Copy promo code"
                        >
                          {copiedCode === claim.claimCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                        Demo Claim
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-teal-800">
                        {formatINR(claim.finalPriceMinor)}
                      </span>
                      {claim.discountMinor > 0 && (
                        <span className="text-[11px] text-emerald-600 font-semibold ml-1.5">
                          Save {formatINR(claim.discountMinor)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Validity Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expires: {new Date(claim.expiresAt).toLocaleDateString()}
                    </span>
                    <span>Show code at checkout</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Honest disclosure: Claims are demo promo codes for offline validation.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
