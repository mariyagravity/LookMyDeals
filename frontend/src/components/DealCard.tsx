import React from 'react';
import { EnrichedListing } from '../types';
import { SourceBadge } from './SourceBadge';
import { formatINR, formatDate } from '../lib/format';
import { MapPin, Calendar, Plus, Ticket, Check, BookOpen } from 'lucide-react';

interface DealCardProps {
  listing: EnrichedListing;
  onAddToCart: (listing: EnrichedListing) => void;
  onClaimOffer: (listing: EnrichedListing) => void;
  isInCart?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({
  listing,
  onAddToCart,
  onClaimOffer,
  isInCart = false,
}) => {
  const { product, store, locality, discountPercent, savingsMinor } = listing;

  // Generate store initials avatar (e.g. LuLu -> LL, Reliance -> RS)
  const storeInitials = store.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const finalPriceMinor = listing.offerPriceMinor || listing.listedPriceMinor;

  return (
    <div className="bg-white rounded-xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Header: Brand, Pack size & Badges */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-xs font-semibold tracking-wider uppercase text-primary-strong">
            {product.brand}
          </span>
          <SourceBadge
            sourceType={listing.sourceType}
            verificationStatus={listing.verificationStatus}
          />
        </div>

        {/* Product Title */}
        <h3 className="text-base font-bold text-ink line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Pack Size / Unit info badge */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded">
            Pack: {product.packSize}
          </span>
          <span className="text-xs text-ink-muted">
            Cat: {product.category}
          </span>
        </div>
      </div>

      {/* Middle Section: Store info & Price */}
      <div className="px-4 py-2 bg-surface/50 border-t border-b border-surface-border my-2">
        <div className="flex items-center gap-2 mb-2">
          {/* Store Initials Avatar */}
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary-strong flex items-center justify-center font-bold text-xs shrink-0">
            {storeInitials}
          </div>
          <div className="min-w-0">
            <a href={`/brochure/${encodeURIComponent(store.id)}`} className="group/store inline-flex min-h-7 items-center gap-1 text-sm font-semibold text-ink hover:text-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`View ${store.name} offers brochure`}>
              <span className="truncate leading-tight">{store.name}</span>
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary opacity-70 group-hover/store:opacity-100" />
            </a>
            <p className="text-xs text-ink-muted flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              {locality.name} ({locality.pinCode})
            </p>
          </div>
        </div>

        {/* Price & Savings Block */}
        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-ink">
                {formatINR(finalPriceMinor)}
              </span>
              {listing.offerPriceMinor && listing.offerPriceMinor < listing.listedPriceMinor && (
                <span className="text-sm text-ink-muted line-through">
                  {formatINR(listing.listedPriceMinor)}
                </span>
              )}
            </div>
            {savingsMinor && savingsMinor > 0 ? (
              <p className="text-xs font-medium text-emerald-600">
                You save {formatINR(savingsMinor)}
              </p>
            ) : null}
          </div>

          {discountPercent && discountPercent > 0 ? (
            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {listing.validUntil && (
          <div className="mt-2 text-[11px] text-ink-muted flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Valid till {formatDate(listing.validUntil)}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions: Reminder Cart & Claim Promo Code */}
      <div className="p-3 pt-1 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onAddToCart(listing)}
          className={`touch-target px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            isInCart
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
          }`}
          aria-label={isInCart ? 'In Reminder Cart' : 'Add to Reminder Cart'}
        >
          {isInCart ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>In Cart</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onClaimOffer(listing)}
          className="touch-target px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          aria-label="Claim Demo Offer"
        >
          <Ticket className="w-4 h-4" />
          <span>Claim Deal</span>
        </button>
      </div>
    </div>
  );
};
