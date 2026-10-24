import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, MapPin, Ticket } from 'lucide-react';
import { EnrichedListing, Store } from '../types';
import { readApiJson } from '../lib/api';
import { formatDate, formatINR } from '../lib/format';
import { getOrCreateVisitorId } from '../lib/visitorId';
import { ClaimModal } from '../components/ClaimModal';

interface CatalogResponse {
  listings: EnrichedListing[];
  stores: Store[];
}

interface PublicBrochureProps {
  storeId: string;
}

export const PublicBrochure: React.FC<PublicBrochureProps> = ({ storeId }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [listings, setListings] = useState<EnrichedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingListing, setClaimingListing] = useState<EnrichedListing | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/catalog');
        const catalog = await readApiJson<CatalogResponse>(response);
        if (!response.ok) throw new Error('Could not load this store brochure.');
        const selectedStore = catalog.stores.find((item) => item.id === storeId);
        if (!selectedStore) throw new Error('This store brochure was not found.');
        const storeListings = catalog.listings.filter((item) => item.store.id === storeId);
        if (!cancelled) {
          setStore(selectedStore);
          setListings(storeListings);
          setError('');
        }

        const visitorId = getOrCreateVisitorId();
        if (visitorId) {
          const visitResponse = await fetch(`/api/catalog/stores/${encodeURIComponent(storeId)}/brochure-visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorId }),
          });
          if (!visitResponse.ok) throw new Error('Visit tracking is unavailable right now.');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load this store brochure.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [storeId]);

  const sections = useMemo(() => {
    const grouped = new Map<string, EnrichedListing[]>();
    for (const listing of listings) {
      const group = grouped.get(listing.product.category) || [];
      group.push(listing);
      grouped.set(listing.product.category, group);
    }
    return [...grouped.entries()];
  }, [listings]);

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-teal-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"><ArrowLeft className="h-4 w-4" /> All deals</a>
        <span className="flex items-center gap-2 text-sm font-black tracking-tight text-teal-800"><BookOpen className="h-5 w-5" /> LOOK MY DEALS</span>
      </div>
    </header>

    <main className="mx-auto max-w-6xl space-y-7 px-4 py-7 sm:px-6 sm:py-10">
      {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-600">Loading store brochure…</div> : error && !store ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}</div> : store && <>
        <section className="rounded-2xl bg-gradient-to-r from-teal-800 to-teal-600 p-6 text-white shadow-sm sm:p-9">
          <p className="text-sm font-semibold text-teal-100">Store offers brochure · Demo</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{store.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-teal-50"><MapPin className="h-4 w-4" />{store.address} · {listings[0]?.locality.name || ''}</p>
        </section>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">This digital brochure is built from the store’s published catalog listings. Prices and stock should be confirmed in store.</div>
        {error && <p role="status" className="text-sm text-amber-800">{error}</p>}

        {listings.length ? sections.map(([category, categoryListings]) => <section key={category} className="space-y-3">
          <div className="flex items-end justify-between"><h2 className="text-xl font-bold">{category}</h2><span className="text-sm text-slate-500">{categoryListings.length} {categoryListings.length === 1 ? 'offer' : 'offers'}</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categoryListings.map((listing) => <article key={listing.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {listing.product.image && <img src={listing.product.image} alt={`${listing.product.name} product`} loading="lazy" className="mb-3 h-40 w-full rounded-lg bg-slate-50 object-contain" />}
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{listing.product.brand || category}</p>
            <h3 className="mt-1 text-lg font-bold">{listing.product.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{listing.product.packSize}</p>
            <div className="mt-4 flex items-baseline gap-2"><strong className="text-xl text-teal-800">{formatINR(listing.offerPriceMinor || listing.listedPriceMinor)}</strong>{listing.offerPriceMinor && listing.offerPriceMinor < listing.listedPriceMinor ? <span className="text-sm text-slate-400 line-through">{formatINR(listing.listedPriceMinor)}</span> : null}</div>
            {listing.couponCode && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950">
                <span className="flex items-center gap-1 font-bold">
                  <Ticket className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span>Coupon:</span>
                </span>
                <span className="font-mono font-black text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                  {listing.couponCode}
                </span>
              </div>
            )}
            {listing.validUntil && <p className="mt-2 text-xs text-slate-500">Valid until {formatDate(listing.validUntil)}</p>}
            {listing.couponCode && (
              <button
                type="button"
                onClick={() => setClaimingListing(listing)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-sm"
              >
                <Ticket className="h-3.5 w-3.5" />
                <span>Claim Coupon</span>
              </button>
            )}
          </article>)}</div>
        </section>) : <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">There are no published offers for this store yet.</div>}
      </>}
    </main>

    {claimingListing && (
      <ClaimModal
        listing={claimingListing}
        onClose={() => setClaimingListing(null)}
        onClaimSuccess={(claim) => {
          void fetch('/api/claims', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claimId: claim.id, listingId: claim.listingId }),
          }).catch(() => undefined);
        }}
      />
    )}
  </div>;
};
