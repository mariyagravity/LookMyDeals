import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, ChevronRight, MapPin, Share2, Store, Ticket } from 'lucide-react';
import { EnrichedListing, Store as StoreType } from '../types';
import { readApiJson } from '../lib/api';
import { formatDate, formatINR } from '../lib/format';
import { getOrCreateVisitorId } from '../lib/visitorId';
import { ClaimModal } from '../components/ClaimModal';
import { LuluLogo } from '../components/BrandLogos';

interface CatalogResponse { stores: StoreType[]; listings: EnrichedListing[] }
interface StoreBrochure {
  id: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  fileUrl: string;
  items: { id: string; validUntil: string }[];
}
interface PublicBrochureProps { storeId: string }

function brochureExpiry(brochure: StoreBrochure): string {
  if (brochure.expiresAt) return brochure.expiresAt;
  const productDates = brochure.items.map((item) => item.validUntil).filter(Boolean).sort();
  return productDates[productDates.length - 1] || '';
}

export const PublicBrochure: React.FC<PublicBrochureProps> = ({ storeId }) => {
  const [store, setStore] = useState<StoreType | null>(null);
  const [listings, setListings] = useState<EnrichedListing[]>([]);
  const [brochures, setBrochures] = useState<StoreBrochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [claimingListing, setClaimingListing] = useState<EnrichedListing | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [catalogResponse, brochuresResponse] = await Promise.all([
          fetch('/api/catalog'),
          fetch(`/api/catalog/stores/${encodeURIComponent(storeId)}/brochures`),
        ]);
        const [catalog, brochureData] = await Promise.all([
          readApiJson<CatalogResponse>(catalogResponse),
          readApiJson<{ brochures?: StoreBrochure[]; error?: { message?: string } }>(brochuresResponse),
        ]);
        if (!catalogResponse.ok) throw new Error('Could not load this store page.');
        if (!brochuresResponse.ok) throw new Error(brochureData.error?.message || 'Could not load this store’s flyers.');
        const selectedStore = catalog.stores.find((item) => item.id === storeId);
        if (!selectedStore) throw new Error('This store was not found.');
        if (!cancelled) {
          setStore(selectedStore);
          setListings(catalog.listings.filter((item) => item.store.id === storeId));
          setBrochures(Array.isArray(brochureData.brochures) ? brochureData.brochures : []);
          setError('');
        }

        const visitorId = getOrCreateVisitorId();
        if (visitorId) {
          const visitResponse = await fetch(`/api/catalog/stores/${encodeURIComponent(storeId)}/brochure-visits`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId }),
          });
          if (!visitResponse.ok && !cancelled) setError('Flyer visit tracking is temporarily unavailable.');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load this store’s flyers.');
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

  const shareBrochure = async (brochure: StoreBrochure) => {
    const url = new URL(brochure.fileUrl, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: brochure.fileName, text: `${store?.name || 'Store'} flyer`, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage('Flyer link copied.');
        window.setTimeout(() => setShareMessage(''), 2500);
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== 'AbortError') setShareMessage('Could not share this flyer.');
    }
  };

  return <div className="min-h-screen bg-[#f6f9fa] pb-16 text-slate-900">
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-slate-200 bg-[#f6f9fa]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-full max-w-4xl items-center px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <a href="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 font-semibold text-slate-600 hover:bg-white hover:text-teal-800"><ArrowLeft className="h-4 w-4" /> All deals</a>
          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" /><span className="text-slate-500">Stores</span>
          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" /><span aria-current="page" className="font-bold text-slate-900">{store?.name.replace(/\s+Hypermarket$/i, '') || 'Flyers'}</span>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-4xl space-y-7 px-4 pb-10 pt-20 sm:px-6">
      {loading ? <div className="p-10 text-center text-sm text-slate-600">Loading store flyers…</div> : error && !store ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}</div> : store && <>
        <section className="mx-auto flex max-w-3xl items-center gap-4 sm:gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-slate-300 bg-white sm:h-24 sm:w-24"><LuluLogo /></div>
          <div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{store.name.replace(/\s+Hypermarket$/i, '')}</h1><p className="mt-1 flex items-center gap-2 text-base text-slate-600 sm:text-lg"><MapPin className="h-4 w-4 shrink-0" />Explore current flyers and offers near you.</p></div>
        </section>
        {shareMessage && <p role="status" className="mx-auto max-w-3xl text-sm font-medium text-teal-800">{shareMessage}</p>}
        {error && <p role="status" className="mx-auto max-w-3xl text-sm text-amber-800">{error}</p>}

        <section aria-label={`${store.name} flyers`}>
          <h2 className="mx-auto mb-4 max-w-3xl flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-teal-800" />Flyers</h2>
          {brochures.length ? <div className="mx-auto grid max-w-3xl justify-items-center gap-5 sm:grid-cols-2 sm:gap-6">
            {brochures.map((brochure) => {
              const expiry = brochureExpiry(brochure);
              const title = brochure.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
              return <article key={brochure.id} className="w-full max-w-[300px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm sm:max-w-[320px]">
                <div className="relative flex aspect-[0.8] items-center justify-center overflow-hidden bg-slate-100">
                  {brochure.mimeType === 'application/pdf' ? <iframe title={`Preview of ${brochure.fileName}`} src={brochure.fileUrl} className="h-full w-full border-0" /> : <img src={brochure.fileUrl} alt={`Flyer: ${title}`} className="h-full w-full object-contain" />}
                  <button type="button" onClick={() => void shareBrochure(brochure)} aria-label={`Share ${title}`} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-teal-800 shadow-md hover:bg-white"><Share2 className="h-5 w-5" /></button>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Weekly circular</p>
                  <h3 className="mt-1.5 line-clamp-2 min-h-12 text-lg font-bold leading-6">{title}</h3>
                  <p className="mt-1 flex min-h-6 items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4 shrink-0" />{expiry ? `Valid until ${formatDate(expiry)}` : 'Expiry date not set'}</p>
                  <a href={brochure.fileUrl} target="_blank" rel="noreferrer" className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-amber-500 bg-amber-400 px-4 text-sm font-bold text-slate-950 hover:bg-amber-300">View Full Flyer</a>
                </div>
              </article>;
            })}
          </div> : <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Store className="mx-auto h-8 w-8 text-teal-700" /><h3 className="mt-3 text-lg font-bold">No flyers available yet</h3><p className="mt-1 text-sm text-slate-500">This store’s approved flyers will appear here.</p></div>}
        </section>

        <section className="mx-auto max-w-3xl space-y-5" aria-label={`${store.name} published offers`}>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Ticket className="h-5 w-5 text-teal-800" />Published offers</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Offers shown here are from this store’s published catalog. Confirm prices and availability in store.</div>
          {listings.length ? sections.map(([category, categoryListings]) => <section key={category} className="space-y-3">
            <div className="flex items-end justify-between"><h3 className="text-lg font-bold">{category}</h3><span className="text-sm text-slate-500">{categoryListings.length} {categoryListings.length === 1 ? 'offer' : 'offers'}</span></div>
            <div className="grid gap-4 sm:grid-cols-2">{categoryListings.map((listing) => <article key={listing.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {listing.product.image && <img src={listing.product.image} alt={`${listing.product.name} product`} loading="lazy" className="mb-3 h-36 w-full rounded-lg bg-slate-50 object-contain" />}
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{listing.product.brand || category}</p>
              <h4 className="mt-1 font-bold">{listing.product.name}</h4>
              <p className="mt-1 text-sm text-slate-500">{listing.product.packSize}</p>
              <div className="mt-3 flex items-baseline gap-2"><strong className="text-lg text-teal-800">{formatINR(listing.offerPriceMinor || listing.listedPriceMinor)}</strong>{listing.offerPriceMinor && listing.offerPriceMinor < listing.listedPriceMinor ? <span className="text-sm text-slate-400 line-through">{formatINR(listing.listedPriceMinor)}</span> : null}</div>
              {listing.couponCode && <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950"><span className="flex items-center gap-1 font-bold"><Ticket className="h-3.5 w-3.5" />Coupon</span><span className="rounded border border-amber-200 bg-white px-2 py-0.5 font-mono font-black">{listing.couponCode}</span></div>}
              {listing.validUntil && <p className="mt-2 text-xs text-slate-500">Valid until {formatDate(listing.validUntil)}</p>}
              {listing.couponCode && <button type="button" onClick={() => setClaimingListing(listing)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700 text-sm font-bold text-white transition-colors hover:bg-teal-800"><Ticket className="h-4 w-4" />Claim Coupon</button>}
            </article>)}</div>
          </section>) : <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">There are no published offers for this store yet.</div>}
        </section>
      </>}
    </main>
    {claimingListing && <ClaimModal listing={claimingListing} onClose={() => setClaimingListing(null)} onClaimSuccess={(claim) => {
      void fetch('/api/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ claimId: claim.id, listingId: claim.listingId }) }).catch(() => undefined);
    }} />}
    <footer className="fixed inset-x-0 bottom-0 z-40 flex h-10 items-center border-t border-slate-200 bg-white/95 px-4 text-[11px] text-slate-500 backdrop-blur"><div className="mx-auto flex w-full max-w-4xl items-center justify-between"><span>© 2026 LOOK MY DEALS</span><a href="/" className="font-semibold text-teal-800 hover:underline">Browse all deals</a></div></footer>
  </div>;
};
