import React, { useMemo, useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, ExternalLink, FileSpreadsheet, LayoutDashboard, MessageSquare, Package, Search, Sparkles, Store, Ticket } from 'lucide-react';
import { BrochureProductCandidate, Category, EnrichedListing, OfferRequest, Store as StoreType } from '../types';
import { BrochureUpload } from '../components/BrochureUpload';
import { ReviewTable } from '../components/ReviewTable';
import { formatDate, formatINR } from '../lib/format';
import { readApiJson } from '../lib/api';

interface RetailerDashboardProps {
  store: StoreType;
  locality: string;
  pinCode: string;
  listings: EnrichedListing[];
  brochures: { id: string; fileName: string; mimeType: string; fileSizeBytes: number; status: string; uploadedAt: string; itemCount: number }[];
  categories: Category[];
  requests: OfferRequest[];
  uniqueBrochureVisitors: number;
  offerClaims: number;
  onLogout: () => void;
  onBrochureItemsPublished: (items: BrochureProductCandidate[], storeId: string) => Promise<void>;
}

type Section = 'dashboard' | 'brochures' | 'brochure' | 'requests';
const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'brochures', label: 'Brochures', icon: BookOpen },
  { id: 'brochure', label: 'Upload / Edit', icon: Package },
  { id: 'requests', label: 'Customer Requests', icon: MessageSquare },
];

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ store, locality, pinCode, listings, brochures, categories, requests, uniqueBrochureVisitors, offerClaims, onLogout, onBrochureItemsPublished }) => {
  const [section, setSection] = useState<Section>('dashboard');
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [extractionError, setExtractionError] = useState(false);
  const [candidates, setCandidates] = useState<BrochureProductCandidate[]>([]);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishError, setPublishError] = useState(false);

  const q = query.trim().toLocaleLowerCase();
  const filteredListings = useMemo(() => listings.filter((item) =>
    !q || [item.product.name, item.product.brand, item.product.category, item.store.name, item.locality.name].some((value) => value.toLocaleLowerCase().includes(q))), [listings, q]);
  const filteredRequests = useMemo(() => requests.filter((item) =>
    !q || [item.itemName, item.brand || '', item.category, item.locality, item.pinCode].some((value) => value.toLocaleLowerCase().includes(q))), [requests, q]);
  const productCount = new Set(listings.map((item) => item.product.id)).size;
  const categoryCounts = listings.reduce<Record<string, number>>((acc, item) => {
    acc[item.product.category] = (acc[item.product.category] || 0) + 1;
    return acc;
  }, {});
  const categoriesByCount = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount = Math.max(1, ...categoriesByCount.map(([, count]) => count));
  const heading = navItems.find((item) => item.id === section)?.label || 'Dashboard';

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true); setExtractionError(false); setStatusText(`Uploading ${file.name} for extraction...`);
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/brochure/extract', { method: 'POST', body: form });
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.error?.message || 'Brochure extraction is unavailable.');
      setCandidates(Array.isArray(data.items) ? data.items : []);
      setStatusText(data.isDemoExtraction ? 'Sample extraction returned. Review it as demo content.' : 'Extraction complete. Review each candidate before publishing.');
    } catch (error) {
      setCandidates([]); setExtractionError(true); setStatusText(error instanceof Error ? error.message : 'Brochure extraction is unavailable.');
    } finally { setIsProcessing(false); }
  };

  const handlePublish = async (approved: BrochureProductCandidate[]) => {
    try {
      await onBrochureItemsPublished(approved, store.id);
      setPublishError(false); setPublishMessage(`Published ${approved.length} approved listing${approved.length === 1 ? '' : 's'} to the shopper catalog.`);
      setCandidates((current) => current.filter((candidate) => candidate.status !== 'approved'));
    } catch (error) {
      setPublishError(true); setPublishMessage(error instanceof Error ? error.message : 'Could not publish these listings.');
    }
  };

  return <div className="min-h-screen bg-slate-50 font-sans text-slate-900 lg:flex">
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[272px] lg:border-b-0 lg:border-r">
      <a href="/retailer" className="flex min-h-[88px] items-center gap-3 px-6" aria-label="LookMyDeals retailer dashboard">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white"><FileSpreadsheet className="h-6 w-6" /></span>
        <span className="text-xl font-black tracking-tight text-teal-800">LOOK MY DEALS</span>
      </a>
      <nav aria-label="Retailer navigation" className="flex gap-2 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-4 lg:py-5">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? 'page' : undefined}
          className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold transition-colors lg:w-full ${section === id ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'}`}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${section === id ? 'bg-white/15' : 'bg-slate-100'}`}><Icon className="h-[18px] w-[18px]" /></span>{label}
        </button>)}
      </nav>
      <div className="hidden border-t border-slate-200 p-5 lg:block">
        <div className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-800"><Store className="h-5 w-5" /></span><span><strong className="block text-sm">{store.name}</strong><span className="text-xs text-slate-500">Store Manager · {locality}</span></span></div>
        <a href="/" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"><Store className="h-4 w-4" /> Shopper view</a>
        <button type="button" onClick={onLogout} className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Sign out</button>
      </div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 border-b border-teal-100 bg-teal-50/95 px-4 py-3 backdrop-blur sm:px-7 lg:px-9">
        <div className="flex items-center justify-between gap-4">
          <label className="flex min-h-12 w-full max-w-3xl items-center gap-3 rounded-full border border-white bg-white px-5 shadow-sm"><Search className="h-5 w-5 shrink-0 text-slate-500" /><span className="sr-only">Search brochures, offers, and requests</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brochures, offers, requests..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" /></label>
          <div className="hidden shrink-0 items-center gap-3 sm:flex"><span className="text-sm font-semibold text-slate-700">{store.name}</span><a href="/" className="inline-flex min-h-11 items-center rounded-lg border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50">Shopper view</a><button type="button" onClick={onLogout} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50">Sign out</button></div>
          <button type="button" onClick={onLogout} className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50 sm:hidden">Sign out</button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-7 lg:p-9">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal-700">{store.name} · Retailer portal</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1><p className="mt-1 text-sm text-slate-500">{locality}, {pinCode}</p></div><span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">Demo data · sample catalog</span></div>

        {section === 'dashboard' && <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><p><strong>LuLu demo workspace.</strong> Listings, claims, and brochure visits are scoped to this store. Customer requests are shown for the {locality} service area because requests are not assigned to individual stores. Brochure candidates stay private until approved.</p></div></div>
          <section aria-label="Catalog summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Metric icon={BookOpen} label="Published offers" value={listings.length} detail="In the shopper catalog" />
            <Metric icon={Package} label="Products" value={productCount} detail="Distinct catalog products" />
            <Metric icon={Store} label="Store" value={store.name.replace(' Hypermarket', '')} detail={`${locality} · ${pinCode}`} />
            <Metric icon={MessageSquare} label="Customer requests" value={requests.length} detail={`From ${locality} service area`} />
            <Metric icon={Ticket} label="Offers claimed" value={offerClaims} detail="LuLu demo claims · all browsers" />
            <Metric icon={BookOpen} label="Brochure visitors" value={uniqueBrochureVisitors} detail="Unique browsers · demo count" />
          </section>
          <section className="grid gap-6 xl:grid-cols-2">
            <Panel title="Catalog overview" subtitle="Current listings grouped by category" action="View brochures" onAction={() => setSection('brochures')}>
              {categoriesByCount.length ? <div className="space-y-5">{categoriesByCount.map(([category, count]) => <div key={category}><div className="mb-2 flex justify-between text-sm"><span className="font-medium">{category}</span><strong className="text-teal-800">{count}</strong></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.max(5, count / maxCount * 100)}%` }} /></div></div>)}</div> : <EmptyState>Catalog data will appear here when available.</EmptyState>}
            </Panel>
            <Panel title="Recent customer requests" subtitle={`Requests for the ${locality} service area`} action="View requests" onAction={() => setSection('requests')}>
              {requests.length ? <div className="divide-y divide-slate-100">{requests.slice(0, 5).map((request) => <RequestRow key={request.id} request={request} compact />)}</div> : <EmptyState>No customer requests in this service area yet.</EmptyState>}
            </Panel>
          </section>
          <Panel title={`${store.name} brochure visitors`} subtitle="Each browser is counted once for this store’s brochure. This demo count is not a verified people count.">
            <div className="flex items-center justify-between gap-4"><a href={`/brochure/${encodeURIComponent(store.id)}`} className="font-medium text-teal-800 hover:underline">Open public brochure</a><span className="rounded-full bg-teal-50 px-4 py-2 text-lg font-bold text-teal-800">{uniqueBrochureVisitors}</span></div>
          </Panel>
        </>}

        {section === 'brochures' && <section className="space-y-5">
          <Panel title={`${store.name} brochures`} subtitle="Browse uploaded brochures and the live digital brochure for this store.">
            <a href={`/brochure/${encodeURIComponent(store.id)}`} target="_blank" rel="noreferrer" className="group flex flex-col justify-between gap-5 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white"><BookOpen className="h-6 w-6" /></span><div><h3 className="font-bold text-slate-900">Current offers brochure</h3><p className="mt-1 text-sm text-slate-600">Digital brochure with {listings.length} published {listings.length === 1 ? 'offer' : 'offers'} from {store.name}.</p><p className="mt-1 text-xs text-slate-500">{uniqueBrochureVisitors} unique brochure visitors</p></div></div>
              <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white group-hover:bg-teal-800">Open brochure <ExternalLink className="h-4 w-4" /></span>
            </a>
          </Panel>
          <Panel title="Uploaded brochures" subtitle="Brochure files and review status for this store.">
            {brochures.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{brochures.filter((item) => !q || item.fileName.toLocaleLowerCase().includes(q) || item.status.toLocaleLowerCase().includes(q)).map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><FileSpreadsheet className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{item.status.replaceAll('_', ' ')}</span></div><h3 className="mt-4 break-words font-semibold">{item.fileName}</h3><p className="mt-1 text-sm text-slate-500">{item.itemCount} extracted {item.itemCount === 1 ? 'item' : 'items'}</p><p className="mt-3 text-xs text-slate-500">Uploaded {new Date(item.uploadedAt).toLocaleDateString()}</p></article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><BookOpen className="mx-auto h-8 w-8 text-teal-700" /><p className="mt-3 font-semibold">No uploaded brochure records yet</p><p className="mt-1 text-sm text-slate-500">The public digital brochure is generated from published offers. Uploaded source files are not archived in this version.</p><button type="button" onClick={() => setSection('brochure')} className="mt-4 min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">Upload a brochure</button></div>}
          </Panel>
          {filteredListings.length > 0 && <Panel title="Offers in the current brochure" subtitle="Published offers included in the digital brochure.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredListings.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.product.name}</h3><p className="mt-1 text-sm text-slate-500">{[item.product.brand, item.product.category, item.product.packSize].filter(Boolean).join(' · ')}</p></div><span className="shrink-0 font-bold text-teal-800">{formatINR(item.offerPriceMinor || item.listedPriceMinor)}</span></div><p className="mt-3 text-xs text-slate-500">Valid until {formatDate(item.validUntil)}</p></article>)}</div>
          </Panel>}
        </section>}

        {section === 'brochure' && <section className="space-y-5">
          <Panel title={`Upload a brochure for ${store.name}`} subtitle={`Approved listings will be published to the ${store.name} catalog.`}>
            <p className="mb-5 text-sm text-slate-600">{store.address}</p>
            <BrochureUpload onFileSelected={handleFileSelected} isProcessing={isProcessing} statusText={statusText} statusError={extractionError} />
          </Panel>
          {publishMessage && <div role="status" className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${publishError ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{publishError ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}<span>{publishMessage}</span></div>}
          {candidates.length ? <ReviewTable candidates={candidates} categories={categories} onUpdateCandidate={(updated) => setCandidates((current) => current.map((item) => item.id === updated.id ? updated : item))} onApproveAndPublish={handlePublish} canPublish /> : !isProcessing && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600"><Sparkles className="mx-auto mb-2 h-5 w-5 text-teal-700" />Upload a brochure to review extracted product and offer details.</div>}
        </section>}

        {section === 'requests' && <Panel title="Customer requests" subtitle="Products shoppers have requested for their local area.">
          {filteredRequests.length ? <div className="-mx-5 divide-y divide-slate-100 sm:-mx-6">{filteredRequests.map((request) => <RequestRow key={request.id} request={request} />)}</div> : <EmptyState>{requests.length ? `No requests match “${query}”.` : `There are no customer requests in ${locality}.`}</EmptyState>}
        </Panel>}
      </main>
    </div>
  </div>;
};

const Metric: React.FC<{ icon: typeof Package; label: string; value: number | string; detail: string }> = ({ icon: Icon, label, value, detail }) => <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-800"><Icon className="h-5 w-5" /></span><span className="text-xs font-medium text-teal-800">Demo data</span></div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;

const Panel: React.FC<{ title: string; subtitle?: string; action?: string; onAction?: () => void; children: React.ReactNode }> = ({ title, subtitle, action, onAction, children }) => <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{action && onAction && <button type="button" onClick={onAction} className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50">{action}</button>}</div>{children}</section>;

const RequestRow: React.FC<{ request: OfferRequest; compact?: boolean }> = ({ request, compact = false }) => <article className={`flex flex-wrap items-center justify-between gap-3 ${compact ? 'py-3 first:pt-0 last:pb-0' : 'px-5 py-4 sm:px-6'}`}><div><h3 className="font-semibold">{request.itemName}</h3><p className="mt-1 text-sm text-slate-600">{request.category}{request.brand ? ` · ${request.brand}` : ''}</p><p className="mt-1 text-xs text-slate-500">{request.locality} · {request.pinCode}</p></div>{request.targetPriceMinor ? <span className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-800">Target {formatINR(request.targetPriceMinor)}</span> : <span className="text-xs text-slate-500">No target price</span>}</article>;
const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="p-8 text-center text-sm text-slate-500">{children}</p>;
