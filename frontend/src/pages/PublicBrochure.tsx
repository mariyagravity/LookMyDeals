import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  MapPin,
  Share2,
  Store,
  CheckCircle2,
} from 'lucide-react';
import { Store as StoreType } from '../types';
import { readApiJson } from '../lib/api';
import { formatDate } from '../lib/format';
import { getOrCreateVisitorId } from '../lib/visitorId';
import {
  LuluLogo,
  NestoLogo,
  MyGLogo,
  SmartBazaarLogo,
  KalyanLogo,
  SafariLogo,
  CarrefourLogo,
  OxygenLogo,
} from '../components/BrandLogos';

interface CatalogResponse {
  stores: StoreType[];
}

interface StoreBrochure {
  id: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  fileUrl: string;
  items: { id: string; validUntil: string }[];
}

interface PublicBrochureProps {
  storeId: string;
  onNavigateHome?: () => void;
}

function brochureExpiry(brochure: StoreBrochure): string {
  if (brochure.expiresAt) return brochure.expiresAt;
  const productDates = brochure.items.map((item) => item.validUntil).filter(Boolean).sort();
  return productDates[productDates.length - 1] || '';
}

function getStoreLogo(storeName: string, storeId: string) {
  const s = (storeName + ' ' + storeId).toLowerCase();
  if (s.includes('lulu')) return <LuluLogo />;
  if (s.includes('nesto')) return <NestoLogo />;
  if (s.includes('myg')) return <MyGLogo />;
  if (s.includes('smart') || s.includes('bazaar')) return <SmartBazaarLogo />;
  if (s.includes('kalyan')) return <KalyanLogo />;
  if (s.includes('safari')) return <SafariLogo />;
  if (s.includes('carrefour')) return <CarrefourLogo />;
  if (s.includes('oxygen')) return <OxygenLogo />;
  return <Store className="w-8 h-8 text-teal-700" />;
}

export const PublicBrochure: React.FC<PublicBrochureProps> = ({
  storeId,
  onNavigateHome,
}) => {
  const [store, setStore] = useState<StoreType | null>(null);
  const [brochures, setBrochures] = useState<StoreBrochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [catalogResponse, brochuresResponse] = await Promise.all([
          fetch('/api/catalog'),
          fetch(`/api/catalog/stores/${encodeURIComponent(storeId)}/brochures`),
        ]);
        const [catalog, brochureData] = await Promise.all([
          readApiJson<CatalogResponse>(catalogResponse),
          readApiJson<{ brochures?: StoreBrochure[]; error?: { message?: string } }>(brochuresResponse),
        ]);
        if (!catalogResponse.ok) throw new Error('Could not load this store page.');
        if (!brochuresResponse.ok) throw new Error(brochureData.error?.message || 'Could not load store flyers.');
        const selectedStore = catalog.stores.find((item) => item.id === storeId);
        if (!selectedStore) throw new Error('This store was not found in LookMyDeals catalog.');
        if (!cancelled) {
          setStore(selectedStore);
          setBrochures(Array.isArray(brochureData.brochures) ? brochureData.brochures : []);
          setError('');
        }

        const visitorId = getOrCreateVisitorId();
        if (visitorId) {
          const visitResponse = await fetch(`/api/catalog/stores/${encodeURIComponent(storeId)}/brochure-visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorId }),
          });
          if (!visitResponse.ok && !cancelled) setError('Flyer visit tracking is temporarily unavailable.');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load store flyers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const handleShare = async (title: string, url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Check out flyers at ${store?.name || 'Store'}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage('Link copied to clipboard!');
        window.setTimeout(() => setShareMessage(''), 2500);
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== 'AbortError') {
        setShareMessage('Could not share link.');
        window.setTimeout(() => setShareMessage(''), 2500);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-r-transparent mb-4" />
        <p className="text-slate-600 font-medium">Loading store flyers…</p>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h2 className="text-lg font-bold mb-2">Store Not Found</h2>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Deals
          </button>
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500">
        <button
          type="button"
          onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
          className="hover:text-teal-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer text-slate-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> All Deals
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500">Stores</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-900">{store.name}</span>
      </nav>

      {/* 2. Store Header Hero Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Store Avatar Logo */}
            <div className="grid h-16 w-16 sm:h-20 sm:w-20 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-2xs">
              {getStoreLogo(store.name, store.id)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {store.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Store
                </span>
              </div>

              <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{store.address || store.localityId}</span>
              </p>

              {/* Stats badge */}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                {brochures.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/70 px-2.5 py-1 font-semibold text-amber-900">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    {brochures.length} Weekly {brochures.length === 1 ? 'Flyer' : 'Flyers'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action: Share Store */}
          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleShare(store.name, window.location.href)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Share Store</span>
            </button>
            {shareMessage && (
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                {shareMessage}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Weekly Circulars & Flyers Section */}
      <section aria-labelledby="flyers-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 id="flyers-heading" className="text-lg sm:text-xl font-black text-slate-900">
                Weekly Circulars & Flyers
              </h2>
              <p className="text-xs text-slate-500">
                Official published print circulars from {store.name}
              </p>
            </div>
          </div>
        </div>

        {brochures.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brochures.map((brochure) => {
              const expiry = brochureExpiry(brochure);
              const title = brochure.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
              return (
                <article
                  key={brochure.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="relative flex aspect-[0.9] items-center justify-center overflow-hidden bg-slate-100">
                    {brochure.mimeType === 'application/pdf' ? (
                      <iframe
                        title={`Preview of ${brochure.fileName}`}
                        src={brochure.fileUrl}
                        className="h-full w-full border-0 pointer-events-none"
                      />
                    ) : (
                      <img
                        src={brochure.fileUrl}
                        alt={`Flyer: ${title}`}
                        className="h-full w-full object-contain p-2 group-hover:scale-102 transition-transform duration-300"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleShare(title, new URL(brochure.fileUrl, window.location.origin).toString())}
                      aria-label={`Share ${title}`}
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-700 shadow-md hover:bg-white hover:text-teal-700 transition-colors cursor-pointer"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded">
                        Weekly circular
                      </span>
                      <h3 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 leading-snug">
                        {title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {expiry ? `Valid until ${formatDate(expiry)}` : 'Current promotion'}
                      </p>
                    </div>

                    <a
                      href={brochure.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#fbbb12',
                        border: '1px solid #d89e05',
                        color: '#000',
                      }}
                      className="mt-4 flex min-h-10 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all hover:brightness-95 cursor-pointer"
                    >
                      View Full Flyer
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            <Store className="mx-auto h-8 w-8 text-teal-700 mb-2" />
            <h3 className="font-bold text-slate-800 text-base">No flyers available yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Official circulars and promotional flyers for {store.name} will appear here once published.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
