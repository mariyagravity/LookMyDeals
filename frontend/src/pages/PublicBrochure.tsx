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
  Ticket,
  X,
} from 'lucide-react';
import { EnrichedListing, Store as StoreType } from '../types';
import { readApiJson } from '../lib/api';
import { formatDate, formatINR } from '../lib/format';
import { getOrCreateVisitorId } from '../lib/visitorId';
import { ClaimModal } from '../components/ClaimModal';
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
  listings: EnrichedListing[];
}

interface StoreBrochure {
  id: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  fileUrl: string;
  items: {
    id: string;
    productName: string;
    brand: string;
    category: string;
    packSize: string;
    listedPriceMinor: number | null;
    offerPriceMinor: number | null;
    validUntil: string;
    cropUrl: string;
    pageNumber: number;
    cropBox: { x: number; y: number; width: number; height: number } | null;
  }[];
}

interface PublicBrochureProps {
  storeId: string;
  brochureId?: string;
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
  brochureId,
  onNavigateHome,
}) => {
  const [store, setStore] = useState<StoreType | null>(null);
  const [listings, setListings] = useState<EnrichedListing[]>([]);
  const [brochures, setBrochures] = useState<StoreBrochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [claimingListing, setClaimingListing] = useState<EnrichedListing | null>(null);
  const [selectedBrochureProduct, setSelectedBrochureProduct] = useState<StoreBrochure['items'][number] | null>(null);

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
          setListings(catalog.listings.filter((item) => item.store.id === storeId));
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

  const selectedBrochure = brochures.find((brochure) => brochure.id === brochureId) || null;
  const detailProducts = selectedBrochure?.items || [];
  const detailCategories = [...new Set(detailProducts.map((item) => item.category).filter(Boolean))];
  const listingForProduct = (product: StoreBrochure['items'][number]) =>
    listings.find((listing) => listing.product.name === product.productName && listing.product.brand === product.brand);

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
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 flex-wrap">
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
        {brochureId ? (
          <>
            <a
              href={`/brochure/${encodeURIComponent(storeId)}`}
              className="text-slate-700 hover:text-teal-700 hover:underline"
            >
              {store.name}
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">
              {selectedBrochure?.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ') || 'Flyer'}
            </span>
          </>
        ) : (
          <span className="font-bold text-slate-900">{store.name}</span>
        )}
      </nav>

      {/* VIEW A: SPECIFIC FLYER VIEW (/brochure/:storeId/:brochureId) */}
      {brochureId ? (
        selectedBrochure ? (
          <div className="space-y-8">
            {/* Flyer Title & Details Card */}
            <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded">
                    Verified flyer · {store.name}
                  </span>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                    {selectedBrochure.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ')}
                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                    {brochureExpiry(selectedBrochure)
                      ? `Valid until ${formatDate(brochureExpiry(selectedBrochure))}`
                      : 'Validity not specified'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/brochure/${encodeURIComponent(storeId)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> All {store.name} Flyers
                  </a>
                  <button
                    type="button"
                    onClick={() => handleShare(selectedBrochure.fileName, window.location.href)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share Flyer
                  </button>
                </div>
              </div>

              {/* Flyer Viewer Container */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 sm:p-4">
                {selectedBrochure.mimeType.startsWith('image/') ? (
                  <div className="relative mx-auto w-fit max-w-full">
                    <img
                      src={selectedBrochure.fileUrl}
                      alt={selectedBrochure.fileName}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      className="block h-auto max-h-[75vh] max-w-full object-contain rounded-lg"
                    />
                    <div className="hidden h-64 w-full flex-col items-center justify-center p-6 text-center text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                      <BookOpen className="h-16 w-16 text-teal-600 mb-3" />
                      <span className="text-sm font-semibold text-slate-600">{selectedBrochure.fileName}</span>
                    </div>
                    {detailProducts
                      .filter((product) => product.pageNumber <= 1 && product.cropBox)
                      .map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setSelectedBrochureProduct(product)}
                          aria-label={`View ${product.productName}`}
                          title={product.productName}
                          className="absolute z-10 rounded-md border-2 border-dashed border-teal-700/50 bg-teal-500/10 transition hover:border-teal-700 hover:bg-teal-500/25 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                          style={{
                            left: `${product.cropBox!.x * 100}%`,
                            top: `${product.cropBox!.y * 100}%`,
                            width: `${product.cropBox!.width * 100}%`,
                            height: `${product.cropBox!.height * 100}%`,
                          }}
                        />
                      ))}
                  </div>
                ) : (
                  <iframe
                    title={selectedBrochure.fileName}
                    src={selectedBrochure.fileUrl}
                    className="h-[75vh] w-full border-0 bg-white rounded-lg"
                  />
                )}
              </div>
            </section>

            {/* Category Filter Pills (if categories exist) */}
            {detailCategories.length > 0 && (
              <section aria-labelledby="detail-categories-heading" className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Browse by type</p>
                <div className="flex flex-wrap gap-2">
                  {detailCategories.map((category) => (
                    <a
                      key={category}
                      href={`#category-${encodeURIComponent(category)}`}
                      className="rounded-full border border-teal-200/70 bg-white px-3.5 py-1.5 text-xs font-bold text-teal-800 shadow-2xs hover:bg-teal-50 transition-colors"
                    >
                      {category}{' '}
                      <span className="ml-1 text-slate-400 font-normal">
                        ({detailProducts.filter((item) => item.category === category).length})
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Products in this Flyer Grid */}
            {detailCategories.length > 0 && (
              <section aria-labelledby="flyer-products-heading" className="space-y-6">
                <h2 id="flyer-products-heading" className="text-xl font-black text-slate-900">
                  Products in this flyer
                </h2>
                {detailCategories.map((category) => (
                  <div key={category} id={`category-${category}`} className="scroll-mt-24 space-y-3">
                    <h3 className="text-base font-bold text-slate-800">{category}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {detailProducts
                        .filter((item) => item.category === category)
                        .map((product) => (
                          <article
                            key={product.id}
                            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:shadow-md transition-shadow"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedBrochureProduct(product)}
                              className="w-full text-left cursor-pointer"
                            >
                              <span className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-2">
                                {product.cropUrl ? (
                                  <img
                                    src={product.cropUrl}
                                    alt={product.productName}
                                    loading="lazy"
                                    className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <BookOpen className="h-8 w-8 text-slate-300" />
                                )}
                              </span>
                              <span className="mt-2.5 block line-clamp-2 min-h-10 text-sm font-bold text-slate-900 leading-snug">
                                {product.productName}
                              </span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {[product.brand, product.packSize].filter(Boolean).join(' · ')}
                              </span>
                            </button>

                            <div className="mt-3 flex items-baseline gap-2 pt-2 border-t border-slate-100">
                              <strong className="text-base font-extrabold text-teal-800">
                                {product.offerPriceMinor !== null
                                  ? formatINR(product.offerPriceMinor)
                                  : product.listedPriceMinor !== null
                                  ? formatINR(product.listedPriceMinor)
                                  : 'See flyer'}
                              </strong>
                              {product.offerPriceMinor !== null &&
                                product.listedPriceMinor !== null &&
                                product.offerPriceMinor < product.listedPriceMinor && (
                                  <span className="text-xs text-slate-400 line-through">
                                    {formatINR(product.listedPriceMinor)}
                                  </span>
                                )}
                            </div>
                          </article>
                        ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Visit Store Section */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">Visit {store.name}</h2>
                <p className="mt-1 flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-800" />
                  {store.address || 'Store address unavailable'}
                </p>
              </div>
              {store.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-800 px-4 text-xs font-bold text-white hover:bg-teal-900 transition-colors"
                >
                  Get Directions
                </a>
              )}
            </section>
          </div>
        ) : (
          <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            This flyer was not found or is no longer published.{' '}
            <a className="font-bold text-teal-800 underline" href={`/brochure/${encodeURIComponent(storeId)}`}>
              Return to store flyers
            </a>.
          </div>
        )
      ) : (
        /* VIEW B: STORE FLYER LIST VIEW (/brochure/:storeId) */
        <div className="space-y-8">
          {/* Store Header Hero Card */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
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

          {/* Weekly Circulars & Flyers Section */}
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
                          <>
                            <img
                              src={brochure.fileUrl}
                              alt={`Flyer: ${title}`}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              className="h-full w-full object-contain p-2 group-hover:scale-102 transition-transform duration-300"
                            />
                            <div className="hidden h-full w-full flex-col items-center justify-center p-6 text-center text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100">
                              <BookOpen className="h-12 w-12 text-teal-600 mb-2" />
                              <span className="text-xs font-semibold text-slate-600 line-clamp-2">{title}</span>
                            </div>
                          </>
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
                          href={`/brochure/${encodeURIComponent(storeId)}/${encodeURIComponent(brochure.id)}`}
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
      )}

      {/* Product Detail Modal */}
      {selectedBrochureProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedBrochureProduct(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="flyer-product-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => setSelectedBrochureProduct(null)}
              aria-label="Close product details"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 p-3">
              {selectedBrochureProduct.cropUrl ? (
                <img
                  src={selectedBrochureProduct.cropUrl}
                  alt={selectedBrochureProduct.productName}
                  className="h-full w-full object-contain"
                />
              ) : (
                <BookOpen className="h-12 w-12 text-slate-300" />
              )}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-teal-800">
              {selectedBrochureProduct.category}
            </p>
            <h2 id="flyer-product-title" className="mt-1 text-xl font-bold text-slate-900">
              {selectedBrochureProduct.productName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {[selectedBrochureProduct.brand, selectedBrochureProduct.packSize].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <strong className="text-2xl font-black text-teal-800">
                {selectedBrochureProduct.offerPriceMinor !== null
                  ? formatINR(selectedBrochureProduct.offerPriceMinor)
                  : selectedBrochureProduct.listedPriceMinor !== null
                  ? formatINR(selectedBrochureProduct.listedPriceMinor)
                  : 'See flyer'}
              </strong>
              {selectedBrochureProduct.offerPriceMinor !== null &&
                selectedBrochureProduct.listedPriceMinor !== null &&
                selectedBrochureProduct.offerPriceMinor < selectedBrochureProduct.listedPriceMinor && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatINR(selectedBrochureProduct.listedPriceMinor)}
                  </span>
                )}
            </div>
            {selectedBrochureProduct.validUntil && (
              <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                Valid until {formatDate(selectedBrochureProduct.validUntil)}
              </p>
            )}
            {listingForProduct(selectedBrochureProduct)?.couponCode && (
              <button
                type="button"
                onClick={() => {
                  const listing = listingForProduct(selectedBrochureProduct);
                  if (listing) {
                    setSelectedBrochureProduct(null);
                    setClaimingListing(listing);
                  }
                }}
                className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-800 text-sm font-bold text-white hover:bg-teal-900 transition-colors cursor-pointer"
              >
                <Ticket className="h-4 w-4" /> Claim coupon code ({listingForProduct(selectedBrochureProduct)?.couponCode})
              </button>
            )}
          </section>
        </div>
      )}

      {/* Claim Modal for flyer product */}
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
    </div>
  );
};
