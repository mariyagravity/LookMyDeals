import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, ExternalLink, LayoutDashboard, MessageSquare, Package, Search, Sparkles, Store, Ticket, MessageCircle, Phone, Send, X, Check } from 'lucide-react';
import { BrochureProductCandidate, Category, EnrichedListing, OfferRequest, Store as StoreType } from '../types';
import { BrochureUpload } from '../components/BrochureUpload';
import { ReviewTable } from '../components/ReviewTable';
import { formatINR } from '../lib/format';
import { readApiJson } from '../lib/api';
import { addGridFallbackCropBoxes, cropBrochureProducts, validateBrochureFile } from '../lib/brochureCrops';

interface RetailerDashboardProps {
  store: StoreType;
  locality: string;
  pinCode: string;
  listings: EnrichedListing[];
  brochures: RetailerBrochure[];
  categories: Category[];
  requests: OfferRequest[];
  uniqueBrochureVisitors: number;
  offerClaims: number;
  onLogout: () => void;
  onBrochureUploaded: () => Promise<void>;
  onRefreshRequests: () => Promise<void>;
  onBrochureItemsPublished: (items: BrochureProductCandidate[], storeId: string, brochureId: string) => Promise<void>;
}

interface RetailerBrochure {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileUrl: string;
  previewUrl: string;
  status: string;
  uploadedAt: string;
  expiresAt: string;
  couponCode?: string;
  itemCount: number;
  items: {
    id: string;
    productName: string;
    brand: string;
    packSize: string;
    category: string;
    regularPriceMinor: number | null;
    offerPriceMinor: number | null;
    couponCode?: string;
    validFrom: string;
    validUntil: string;
    status: string;
    cropUrl: string;
  }[];
}

type Section = 'dashboard' | 'coupons' | 'brochures' | 'brochure' | 'requests';
const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'coupons', label: 'Coupons & Deals', icon: Ticket },
  { id: 'brochures', label: 'Brochures', icon: BookOpen },
  { id: 'brochure', label: 'Upload / Edit', icon: Package },
  { id: 'requests', label: 'Customer Requests', icon: MessageSquare },
];

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ store, locality, pinCode, listings, brochures, categories, requests, uniqueBrochureVisitors, offerClaims, onLogout, onBrochureUploaded, onRefreshRequests, onBrochureItemsPublished }) => {
  const [section, setSection] = useState<Section>('dashboard');
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [extractionError, setExtractionError] = useState(false);
  const [candidates, setCandidates] = useState<BrochureProductCandidate[]>([]);
  const [activeBrochureId, setActiveBrochureId] = useState('');
  const [activeBrochureFile, setActiveBrochureFile] = useState<File | null>(null);
  const cropPreviewUrls = useRef<string[]>([]);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishError, setPublishError] = useState(false);
  const [brochureExpiryDrafts, setBrochureExpiryDrafts] = useState<Record<string, string>>({});
  const [expirySavingId, setExpirySavingId] = useState<string | null>(null);
  const [expiryMessage, setExpiryMessage] = useState('');
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null);
  const [deletingBrochureId, setDeletingBrochureId] = useState<string | null>(null);

  // Customer Enquiry Reply State (WhatsApp & SMS)
  const [activeReplyRequest, setActiveReplyRequest] = useState<OfferRequest | null>(null);
  const [replyPhone, setReplyPhone] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [replySentSuccess, setReplySentSuccess] = useState('');

  useEffect(() => {
    if (activeReplyRequest) {
      const phone = getPhoneDigits(activeReplyRequest);
      setReplyPhone(phone);
      setReplyMessage(getEnquiryMessage(activeReplyRequest, store.name, locality));
      setReplySentSuccess('');
    }
  }, [activeReplyRequest, store.name, locality]);

  const handleSendWhatsApp = (phone: string, text: string, requestId?: string) => {
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      alert('Please enter a valid 10-digit mobile number to open WhatsApp.');
      return;
    }
    const url = `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    if (requestId) {
      void handleMarkResponded(requestId);
    }
    setReplySentSuccess('WhatsApp chat opened! Request status updated.');
  };

  const handleSendSMS = (phone: string, text: string, requestId?: string) => {
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      alert('Please enter a valid 10-digit mobile number to send SMS.');
      return;
    }
    const url = `sms:+91${digits}?body=${encodeURIComponent(text)}`;
    window.location.href = url;
    if (requestId) {
      void handleMarkResponded(requestId);
    }
    setReplySentSuccess('SMS composer opened! Request status updated.');
  };

  const handleMarkResponded = async (requestId: string) => {
    try {
      setIsUpdatingStatus(true);
      await fetch(`/api/offer-requests/${encodeURIComponent(requestId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'responded' }),
      });
      await onRefreshRequests();
    } catch (err) {
      console.error('Failed to update request status', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Coupon Allotment & Management State
  const [couponModalListing, setCouponModalListing] = useState<EnrichedListing | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponFilter, setCouponFilter] = useState<'all' | 'with_coupon' | 'without_coupon'>('all');

  const [brochureCouponModal, setBrochureCouponModal] = useState<RetailerBrochure | null>(null);
  const [brochureCouponInput, setBrochureCouponInput] = useState('');
  const [brochureCouponApplyAll, setBrochureCouponApplyAll] = useState(true);
  const [brochureCouponSaving, setBrochureCouponSaving] = useState(false);
  const [brochureCouponMessage, setBrochureCouponMessage] = useState('');

  const handleOpenListingCoupon = (item: EnrichedListing) => {
    setCouponModalListing(item);
    setCouponInput(item.couponCode || '');
    setCouponMessage('');
  };

  const handleSaveListingCoupon = async () => {
    if (!couponModalListing) return;
    setCouponSaving(true);
    setCouponMessage('');
    try {
      const code = couponInput.trim() ? couponInput.trim().toUpperCase() : null;
      const response = await fetch(`/api/retailer/listings/${encodeURIComponent(couponModalListing.id)}/coupon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code }),
      });
      const result = await readApiJson<{ error?: { message?: string } }>(response);
      if (!response.ok) throw new Error(result.error?.message || 'Could not save coupon code.');
      await onBrochureUploaded();
      setCouponModalListing(null);
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : 'Failed to save coupon code.');
    } finally {
      setCouponSaving(false);
    }
  };

  const handleRemoveListingCoupon = async (listingId: string) => {
    setCouponSaving(true);
    setCouponMessage('');
    try {
      const response = await fetch(`/api/retailer/listings/${encodeURIComponent(listingId)}/coupon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: null }),
      });
      const result = await readApiJson<{ error?: { message?: string } }>(response);
      if (!response.ok) throw new Error(result.error?.message || 'Could not remove coupon code.');
      await onBrochureUploaded();
      setCouponModalListing(null);
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : 'Failed to remove coupon code.');
    } finally {
      setCouponSaving(false);
    }
  };

  const handleOpenBrochureCoupon = (b: RetailerBrochure) => {
    setBrochureCouponModal(b);
    setBrochureCouponInput(b.couponCode || '');
    setBrochureCouponApplyAll(true);
    setBrochureCouponMessage('');
  };

  const handleSaveBrochureCoupon = async () => {
    if (!brochureCouponModal) return;
    setBrochureCouponSaving(true);
    setBrochureCouponMessage('');
    try {
      const code = brochureCouponInput.trim() ? brochureCouponInput.trim().toUpperCase() : null;
      const response = await fetch(`/api/retailer/brochures/${encodeURIComponent(brochureCouponModal.id)}/coupon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code, applyToItems: brochureCouponApplyAll }),
      });
      const result = await readApiJson<{ error?: { message?: string } }>(response);
      if (!response.ok) throw new Error(result.error?.message || 'Could not update brochure coupon code.');
      await onBrochureUploaded();
      setBrochureCouponModal(null);
    } catch (err) {
      setBrochureCouponMessage(err instanceof Error ? err.message : 'Failed to save brochure coupon.');
    } finally {
      setBrochureCouponSaving(false);
    }
  };

  const q = query.trim().toLocaleLowerCase();
  const filteredListings = useMemo(() => listings.filter((item) =>
    !q || [item.product.name, item.product.brand, item.product.category, item.store.name, item.locality.name, item.couponCode || ''].some((value) => value.toLocaleLowerCase().includes(q))), [listings, q]);
  const filteredRequests = useMemo(() => requests.filter((item) =>
    !q || [item.itemName, item.brand || '', item.category, item.locality, item.pinCode].some((value) => value.toLocaleLowerCase().includes(q))), [requests, q]);
  const productCount = new Set(listings.map((item) => item.product.id)).size;
  const listingsWithCouponCount = listings.filter((item) => Boolean(item.couponCode)).length;
  const listingsWithoutCouponCount = listings.length - listingsWithCouponCount;
  const couponViewListings = useMemo(() => {
    return filteredListings.filter((item) => {
      if (couponFilter === 'with_coupon') return Boolean(item.couponCode);
      if (couponFilter === 'without_coupon') return !item.couponCode;
      return true;
    });
  }, [filteredListings, couponFilter]);
  const categoryCounts = listings.reduce<Record<string, number>>((acc, item) => {
    acc[item.product.category] = (acc[item.product.category] || 0) + 1;
    return acc;
  }, {});
  const categoriesByCount = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount = Math.max(1, ...categoriesByCount.map(([, count]) => count));
  const heading = navItems.find((item) => item.id === section)?.label || 'Dashboard';

  useEffect(() => () => cropPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true); setExtractionError(false); setStatusText(`Uploading ${file.name} for extraction...`);
    cropPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    cropPreviewUrls.current = [];
    setCandidates([]); setActiveBrochureId('');
    setActiveBrochureFile(file);
    try {
      await validateBrochureFile(file);
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/brochure/extract', { method: 'POST', body: form });
      const data = await readApiJson<{ items?: BrochureProductCandidate[]; brochureId?: string; error?: { message?: string } }>(response);
      if (!response.ok) throw new Error(data.error?.message || 'Brochure extraction is unavailable.');
      const extracted = addGridFallbackCropBoxes(Array.isArray(data.items) ? data.items : []);
      if (!data.brochureId) throw new Error('Extraction returned no saved brochure record. Restart the backend and try again.');
      setActiveBrochureId(data.brochureId);
      await onBrochureUploaded().catch(() => undefined);
      let reviewedCandidates = extracted;
      let cropMessage = '';
      try {
        const crops = await cropBrochureProducts(file, extracted);
        const cropForm = new FormData();
        for (const [candidateId, blob] of crops) {
          cropForm.append('crops', blob, `${candidateId}.jpg`);
          const candidate = reviewedCandidates.find((item) => item.id === candidateId);
          if (candidate?.cropBox) cropForm.append(`cropBox_${candidateId}`, JSON.stringify(candidate.cropBox));
          const previewUrl = URL.createObjectURL(blob);
          cropPreviewUrls.current.push(previewUrl);
          reviewedCandidates = reviewedCandidates.map((candidate) => candidate.id === candidateId ? { ...candidate, cropPreviewUrl: previewUrl } : candidate);
        }
        if (crops.size > 0) {
          const cropResponse = await fetch(`/api/brochure/${encodeURIComponent(data.brochureId)}/crops`, { method: 'POST', body: cropForm });
          const cropResult = await readApiJson<{ error?: { message?: string } }>(cropResponse);
          if (!cropResponse.ok) cropMessage = cropResult.error?.message || 'Product crops could not be saved.';
          else cropMessage = ` Saved ${crops.size} product crop${crops.size === 1 ? '' : 's'} with the brochure.`;
        } else cropMessage = ' No product images were detected for cropping.';
      } catch (cropError) {
        cropMessage = ` Product photos could not be cropped: ${cropError instanceof Error ? cropError.message : 'unknown crop error'}`;
      }
      setCandidates(reviewedCandidates);
      setStatusText(`Extracted ${extracted.length} candidate${extracted.length === 1 ? '' : 's'} and saved the brochure. Review all names and prices before publishing.${cropMessage}`);
    } catch (error) {
      setCandidates([]); setExtractionError(true); setStatusText(error instanceof Error ? error.message : 'Brochure extraction is unavailable.');
    } finally { setIsProcessing(false); }
  };

  const handlePublish = async (approved: BrochureProductCandidate[]) => {
    try {
      if (!activeBrochureId) throw new Error('Upload and extract a brochure before publishing these items.');
      await onBrochureItemsPublished(approved, store.id, activeBrochureId);
      setPublishError(false); setPublishMessage(`Published ${approved.length} approved listing${approved.length === 1 ? '' : 's'} to the shopper catalog.`);
      setCandidates((current) => current.filter((candidate) => candidate.status !== 'approved'));
    } catch (error) {
      setPublishError(true); setPublishMessage(error instanceof Error ? error.message : 'Could not publish these listings.');
    }
  };

  const handleDeleteCandidate = async (candidate: BrochureProductCandidate) => {
    if (!activeBrochureId) throw new Error('Upload a brochure before deleting review items.');
    const response = await fetch(`/api/brochure/${encodeURIComponent(activeBrochureId)}/items/${encodeURIComponent(candidate.id)}`, { method: 'DELETE' });
    const result = await readApiJson<{ error?: { message?: string } }>(response);
    if (!response.ok) throw new Error(result.error?.message || 'Could not delete this item.');
    setCandidates((current) => current.filter((item) => item.id !== candidate.id));
    if (candidate.cropPreviewUrl) {
      URL.revokeObjectURL(candidate.cropPreviewUrl);
      cropPreviewUrls.current = cropPreviewUrls.current.filter((url) => url !== candidate.cropPreviewUrl);
    }
  };

  const handleSaveCrop = async (candidate: BrochureProductCandidate, cropBox: NonNullable<BrochureProductCandidate['cropBox']>, blob: Blob) => {
    if (!activeBrochureId) throw new Error('Upload a brochure before editing product crops.');
    const cropForm = new FormData();
    cropForm.append('crops', blob, `${candidate.id}.jpg`);
    cropForm.append(`cropBox_${candidate.id}`, JSON.stringify(cropBox));
    const response = await fetch(`/api/brochure/${encodeURIComponent(activeBrochureId)}/crops`, { method: 'POST', body: cropForm });
    const result = await readApiJson<{ error?: { message?: string } }>(response);
    if (!response.ok) throw new Error(result.error?.message || 'Could not save this crop.');
    const previewUrl = URL.createObjectURL(blob);
    if (candidate.cropPreviewUrl) {
      URL.revokeObjectURL(candidate.cropPreviewUrl);
      cropPreviewUrls.current = cropPreviewUrls.current.filter((url) => url !== candidate.cropPreviewUrl);
    }
    cropPreviewUrls.current.push(previewUrl);
    setCandidates((current) => current.map((item) => item.id === candidate.id ? { ...item, cropBox, cropPreviewUrl: previewUrl } : item));
  };

  const saveBrochureExpiry = async (brochure: RetailerBrochure) => {
    const expiresAt = brochureExpiryDrafts[brochure.id] ?? brochure.expiresAt;
    setExpirySavingId(brochure.id);
    setExpiryMessage('');
    try {
      const response = await fetch(`/api/retailer/brochures/${encodeURIComponent(brochure.id)}/expiry`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresAt }),
      });
      const result = await readApiJson<{ error?: { message?: string } }>(response);
      if (!response.ok) throw new Error(result.error?.message || 'Could not update the expiry date.');
      setExpiryMessage('Brochure expiry date saved.');
      setEditingExpiryId(null);
      await onBrochureUploaded();
    } catch (error) {
      setExpiryMessage(error instanceof Error ? error.message : 'Could not update the expiry date.');
    } finally { setExpirySavingId(null); }
  };

  const deleteBrochure = async (brochure: RetailerBrochure) => {
    const confirmed = window.confirm(`Permanently delete “${brochure.fileName}”, all ${brochure.itemCount} extracted products, and any published offers from this brochure? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingBrochureId(brochure.id);
    setExpiryMessage('');
    try {
      const response = await fetch(`/api/brochure/${encodeURIComponent(brochure.id)}`, { method: 'DELETE' });
      const result = await readApiJson<{ error?: { message?: string } }>(response);
      if (!response.ok) throw new Error(result.error?.message || 'Could not delete this brochure.');
      setBrochureExpiryDrafts((current) => { const next = { ...current }; delete next[brochure.id]; return next; });
      setExpiryMessage(`“${brochure.fileName}” and its brochure products were permanently deleted.`);
      await onBrochureUploaded();
    } catch (error) {
      setExpiryMessage(error instanceof Error ? error.message : 'Could not delete this brochure.');
    } finally { setDeletingBrochureId(null); }
  };

  return <div className="min-h-screen bg-slate-50 font-sans text-slate-900 lg:flex">
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[272px] lg:border-b-0 lg:border-r">
      <a href="/retailer" className="flex min-h-[88px] items-center gap-3 px-6" aria-label="LookMyDeals retailer dashboard">
        <img src="/Logo.png" alt="LOOK MY DEALS" className="h-12 w-auto max-w-[250px] object-contain" />
      </a>
      <nav aria-label="Retailer navigation" className="flex gap-2 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-4 lg:py-5">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { setSection(id); if (id === 'requests') void onRefreshRequests(); }} aria-current={section === id ? 'page' : undefined}
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><p><strong>LuLu demo workspace.</strong> Listings, claims, and brochure visits are scoped to this store. Customer requests include all Kochi localities because they are not assigned to a specific store; each request shows its selected location. Brochure candidates stay private until approved.</p></div></div>
          <section aria-label="Catalog summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
            <Metric icon={BookOpen} label="Published offers" value={listings.length} detail="In the shopper catalog" />
            <Metric icon={Ticket} label="Coupons allotted" value={listingsWithCouponCount} detail="Live coupon deals for shoppers" />
            <Metric icon={Package} label="Products" value={productCount} detail="Distinct catalog products" />
            <Metric icon={Store} label="Store" value={store.name.replace(' Hypermarket', '')} detail={`${locality} · ${pinCode}`} />
            <Metric icon={MessageSquare} label="Customer requests" value={requests.length} detail="Across Kochi localities" />
            <Metric icon={Ticket} label="Offers claimed" value={offerClaims} detail="LuLu demo claims · all browsers" />
            <Metric icon={BookOpen} label="Brochure visitors" value={uniqueBrochureVisitors} detail="Unique browsers · demo count" />
          </section>
          <section className="grid gap-6 xl:grid-cols-3">
            <Panel title="Active coupon deals" subtitle={`${listingsWithCouponCount} of ${listings.length} items have coupons allotted`} action="Manage coupons" onAction={() => setSection('coupons')}>
              {listingsWithCouponCount ? (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {listings.filter((item) => Boolean(item.couponCode)).slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.product.name}</p>
                        <p className="text-xs text-slate-500">{item.product.packSize} · {formatINR(item.offerPriceMinor || item.listedPriceMinor)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-xs text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          🎟️ {item.couponCode}
                        </span>
                        <button type="button" onClick={() => handleOpenListingCoupon(item)} className="text-xs font-semibold text-teal-800 hover:underline">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  <p className="mb-2">No coupons allotted yet.</p>
                  <button type="button" onClick={() => setSection('coupons')} className="rounded-lg bg-teal-700 px-3 py-1.5 font-bold text-white hover:bg-teal-800">
                    Allot coupons
                  </button>
                </div>
              )}
            </Panel>
            <Panel title="Catalog overview" subtitle="Current listings grouped by category" action="View brochures" onAction={() => setSection('brochures')}>
              {categoriesByCount.length ? <div className="space-y-5">{categoriesByCount.map(([category, count]) => <div key={category}><div className="mb-2 flex justify-between text-sm"><span className="font-medium">{category}</span><strong className="text-teal-800">{count}</strong></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.max(5, count / maxCount * 100)}%` }} /></div></div>)}</div> : <EmptyState>Catalog data will appear here when available.</EmptyState>}
            </Panel>
            <Panel title="Recent customer requests" subtitle={`Requests for the ${locality} service area`} action="View requests" onAction={() => setSection('requests')}>
              {requests.length ? <div className="divide-y divide-slate-100">{requests.slice(0, 5).map((request) => <RequestRow key={request.id} request={request} storeName={store.name} locality={locality} compact onOpenReply={(r) => setActiveReplyRequest(r)} onSendWhatsApp={handleSendWhatsApp} onSendSMS={handleSendSMS} />)}</div> : <EmptyState>No customer requests in this service area yet.</EmptyState>}
            </Panel>
          </section>
          <Panel title={`${store.name} brochure visitors`} subtitle="Each browser is counted once for this store’s brochure. This demo count is not a verified people count.">
            <div className="flex items-center justify-between gap-4"><a href={`/brochure/${encodeURIComponent(store.id)}`} className="font-medium text-teal-800 hover:underline">Open public brochure</a><span className="rounded-full bg-teal-50 px-4 py-2 text-lg font-bold text-teal-800">{uniqueBrochureVisitors}</span></div>
          </Panel>
        </>}

        {section === 'coupons' && <section className="space-y-5">
          <Panel title="Allot & Manage Coupon Codes" subtitle="Promo codes assigned to your store products and brochures. Only products with allotted coupon codes allow shoppers to claim in-store deals.">
            {/* Filter & Summary Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCouponFilter('all')}
                  className={`min-h-9 rounded-lg px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                    couponFilter === 'all'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Products ({listings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCouponFilter('with_coupon')}
                  className={`min-h-9 rounded-lg px-3.5 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    couponFilter === 'with_coupon'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>With Coupon ({listingsWithCouponCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCouponFilter('without_coupon')}
                  className={`min-h-9 rounded-lg px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                    couponFilter === 'without_coupon'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Without Coupon ({listingsWithoutCouponCount})
                </button>
              </div>

              <span className="text-xs font-medium text-slate-500">
                Showing {couponViewListings.length} of {listings.length} catalog items
              </span>
            </div>

            {/* Listings with coupon allotment controls */}
            {couponViewListings.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-3 py-3">Product Name & Category</th>
                      <th className="px-3 py-3">Pack Size</th>
                      <th className="px-3 py-3">Price & Savings</th>
                      <th className="px-3 py-3">Allotted Coupon Code</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {couponViewListings.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="min-w-[220px] px-3 py-3.5">
                          <p className="font-bold text-slate-900 text-sm leading-snug">{item.product.name}</p>
                          <p className="text-xs text-slate-500">{[item.product.brand, item.product.category].filter(Boolean).join(' · ')}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                            {item.product.packSize || '1 unit'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <span className="font-bold text-teal-800 text-sm">
                            {formatINR(item.offerPriceMinor || item.listedPriceMinor)}
                          </span>
                          {item.savingsMinor > 0 && (
                            <span className="ml-1.5 text-[11px] font-semibold text-emerald-600">
                              Save {formatINR(item.savingsMinor)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5">
                          {item.couponCode ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 font-mono font-black text-amber-950 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md text-xs shadow-2xs">
                                <Ticket className="h-3.5 w-3.5 text-amber-600" />
                                {item.couponCode}
                              </span>
                              <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                Shoppers can claim
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">
                              No coupon allotted (Shoppers cannot claim)
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenListingCoupon(item)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                item.couponCode
                                  ? 'border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100'
                                  : 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
                              }`}
                            >
                              {item.couponCode ? 'Edit Code' : '+ Allot Coupon'}
                            </button>
                            {item.couponCode && (
                              <button
                                type="button"
                                onClick={() => void handleRemoveListingCoupon(item.id)}
                                disabled={couponSaving}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove coupon code from this product"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>No products found matching the selected filter or search.</EmptyState>
            )}
          </Panel>
        </section>}

        {section === 'brochures' && <section className="space-y-5">
          <Panel title={`${store.name} brochures`} subtitle="Browse uploaded brochures and the live digital brochure for this store.">
            <a href={`/brochure/${encodeURIComponent(store.id)}`} target="_blank" rel="noreferrer" className="group flex flex-col justify-between gap-5 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white"><BookOpen className="h-6 w-6" /></span><div><h3 className="font-bold text-slate-900">Current offers brochure</h3><p className="mt-1 text-sm text-slate-600">Digital brochure with {listings.length} published {listings.length === 1 ? 'offer' : 'offers'} from {store.name}.</p><p className="mt-1 text-xs text-slate-500">{uniqueBrochureVisitors} unique brochure visitors</p></div></div>
              <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white group-hover:bg-teal-800">Open brochure <ExternalLink className="h-4 w-4" /></span>
            </a>
          </Panel>
          <Panel title="Uploaded brochures" subtitle="Brochure files and review status for this store.">
            {expiryMessage && <p role="status" className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{expiryMessage}</p>}
            {brochures.length ? <div className="grid gap-5 xl:grid-cols-2">{brochures.filter((item) => !q || item.fileName.toLocaleLowerCase().includes(q) || item.status.toLocaleLowerCase().includes(q) || item.items.some((product) => product.productName.toLocaleLowerCase().includes(q))).map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid sm:grid-cols-[180px_1fr]">
                <div className="h-56 bg-slate-100 sm:h-full sm:min-h-64">{item.mimeType === 'application/pdf' ? <iframe title={`Preview of ${item.fileName}`} src={item.previewUrl} className="h-full min-h-56 w-full border-0" /> : <img src={item.previewUrl} alt={`Brochure ${item.fileName}`} className="h-full min-h-56 w-full object-contain" />}</div>
                <div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="break-words font-semibold text-slate-900">{item.fileName}</h3><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{item.status.replace(/_/g, ' ')}</span></div>
                  <p className="mt-1 text-sm text-slate-500">{item.itemCount} extracted {item.itemCount === 1 ? 'product' : 'products'} · Uploaded {new Date(item.uploadedAt).toLocaleDateString()}</p>
                  {item.couponCode && (
                    <p className="mt-2 text-xs font-mono font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded inline-flex items-center gap-1.5 shadow-2xs">
                      <Ticket className="h-3.5 w-3.5 text-amber-700" />
                      Brochure Coupon: {item.couponCode}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <button type="button" onClick={() => handleOpenBrochureCoupon(item)} className="min-h-10 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer">
                      <Ticket className="h-4 w-4 text-amber-700" />
                      {item.couponCode ? 'Edit Brochure Coupon' : 'Allot Brochure Coupon'}
                    </button>
                    {editingExpiryId === item.id ? <><label className="text-xs font-semibold text-slate-600">Brochure expiry date<input type="date" value={brochureExpiryDrafts[item.id] ?? item.expiresAt} onChange={(event) => setBrochureExpiryDrafts((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 block min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label><button type="button" onClick={() => void saveBrochureExpiry(item)} disabled={expirySavingId === item.id} className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{expirySavingId === item.id ? 'Saving…' : 'Save'}</button><button type="button" onClick={() => { setBrochureExpiryDrafts((current) => { const next = { ...current }; delete next[item.id]; return next; }); setEditingExpiryId(null); }} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700">Cancel</button></> : <><p className="mr-1 text-xs text-slate-600">Expires: <strong>{item.expiresAt ? new Date(`${item.expiresAt}T00:00:00`).toLocaleDateString() : 'Not set'}</strong></p><button type="button" onClick={() => { setBrochureExpiryDrafts((current) => ({ ...current, [item.id]: item.expiresAt })); setEditingExpiryId(item.id); }} className="min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50">Edit</button></>}
                    <button type="button" onClick={() => void deleteBrochure(item)} disabled={deletingBrochureId === item.id} className="min-h-10 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{deletingBrochureId === item.id ? 'Deleting…' : 'Delete'}</button>
                    <a href={item.fileUrl} className="min-h-10 inline-flex items-center px-2 text-sm font-semibold text-teal-800 hover:underline">Download flyer</a>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 p-4"><h4 className="mb-3 text-sm font-bold text-slate-800">Products in this brochure</h4>{item.items.length ? <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">{item.items.map((product) => <div key={product.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{product.cropUrl ? <img src={product.cropUrl} alt={product.productName} className="h-full w-full object-contain" /> : <Package className="h-5 w-5 text-slate-400" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{product.productName}</p><p className="truncate text-xs text-slate-500">{[product.brand, product.category, product.packSize].filter(Boolean).join(' · ') || 'Category not set'} · <span className="capitalize">{product.status.replace(/_/g, ' ')}</span></p>{product.couponCode && <p className="mt-0.5 text-[11px] font-mono font-bold text-amber-900">🎟️ {product.couponCode}</p>}</div><div className="shrink-0 text-right">{product.offerPriceMinor !== null && <p className="text-sm font-bold text-teal-800">{formatINR(product.offerPriceMinor)}</p>}{product.regularPriceMinor !== null && <p className="text-xs text-slate-500 line-through">{formatINR(product.regularPriceMinor)}</p>}</div></div>)}</div> : <p className="text-sm text-slate-500">No product details saved for this brochure.</p>}</div>
            </article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><BookOpen className="mx-auto h-8 w-8 text-teal-700" /><p className="mt-3 font-semibold">No uploaded brochures yet</p><p className="mt-1 text-sm text-slate-500">Uploaded source files and extracted product data will be saved here after extraction.</p><button type="button" onClick={() => setSection('brochure')} className="mt-4 min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">Upload a brochure</button></div>}
          </Panel>
        </section>}

        {section === 'brochure' && <section className="space-y-5">
          <Panel title={`Upload a brochure for ${store.name}`} subtitle={`Approved listings will be published to the ${store.name} catalog.`}>
            <p className="mb-5 text-sm text-slate-600">{store.address}</p>
            <BrochureUpload onFileSelected={handleFileSelected} isProcessing={isProcessing} statusText={statusText} statusError={extractionError} />
          </Panel>
          {publishMessage && <div role="status" className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${publishError ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{publishError ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}<span>{publishMessage}</span></div>}
          {candidates.length ? <ReviewTable candidates={candidates} categories={categories} sourceFile={activeBrochureFile} onSaveCrop={handleSaveCrop} onUpdateCandidate={(updated) => setCandidates((current) => current.map((item) => item.id === updated.id ? updated : item))} onApproveAndPublish={handlePublish} onDeleteCandidate={handleDeleteCandidate} canPublish /> : !isProcessing && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600"><Sparkles className="mx-auto mb-2 h-5 w-5 text-teal-700" />Upload a brochure to review extracted product and offer details.</div>}
        </section>}

        {section === 'requests' && <Panel title="Customer requests" subtitle="Requests shoppers submitted across Kochi. Each includes their selected locality and PIN." action="Refresh" onAction={() => void onRefreshRequests()}>
          {filteredRequests.length ? <div className="-mx-5 divide-y divide-slate-100 sm:-mx-6">{filteredRequests.map((request) => <RequestRow key={request.id} request={request} storeName={store.name} locality={locality} onOpenReply={(r) => setActiveReplyRequest(r)} onSendWhatsApp={handleSendWhatsApp} onSendSMS={handleSendSMS} />)}</div> : <EmptyState>{requests.length ? `No requests match “${query}”.` : `There are no customer requests in ${locality}.`}</EmptyState>}
        </Panel>}
      </main>

      {/* Customer Enquiry Reply Modal (WhatsApp & SMS) */}
      {activeReplyRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Respond to Customer Enquiry</h3>
                  <p className="text-xs text-slate-500">Contact shopper directly via WhatsApp or SMS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReplyRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Product Details Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{activeReplyRequest.itemName}</h4>
                    <p className="text-xs text-slate-500">{activeReplyRequest.category}{activeReplyRequest.brand ? ` · ${activeReplyRequest.brand}` : ''}</p>
                  </div>
                  {activeReplyRequest.targetPriceMinor && (
                    <span className="font-bold text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                      Target: {formatINR(activeReplyRequest.targetPriceMinor)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  📍 Shopper Locality: <strong>{activeReplyRequest.locality} ({activeReplyRequest.pinCode})</strong>
                </p>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-slate-100 text-xs font-semibold rounded-lg text-slate-600 border border-slate-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={replyPhone}
                    onChange={(e) => setReplyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {replyPhone.length === 10 && (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> Ready to contact (+91 {replyPhone})
                  </p>
                )}
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enquiry Response Message
                </label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                  placeholder="Type your response to the customer..."
                />
              </div>

              {replySentSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{replySentSuccess}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void handleMarkResponded(activeReplyRequest.id)}
                disabled={isUpdatingStatus || activeReplyRequest.status === 'responded'}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {activeReplyRequest.status === 'responded' ? '✓ Marked Responded' : 'Mark as Responded'}
              </button>

              <div className="flex items-center gap-2">
                {/* WhatsApp Action */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(replyPhone, replyMessage, activeReplyRequest.id)}
                  style={{ backgroundColor: '#25D366' }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg hover:brightness-95 transition-all shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send WhatsApp</span>
                </button>

                {/* SMS Action */}
                <button
                  type="button"
                  onClick={() => handleSendSMS(replyPhone, replyMessage, activeReplyRequest.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send SMS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Coupon Allotment Modal */}
      {couponModalListing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {couponModalListing.couponCode ? 'Edit Coupon Code' : 'Allot Product Coupon'}
                  </h3>
                  <p className="text-xs text-slate-500">Only products with coupons can be claimed by shoppers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCouponModalListing(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 text-sm">{couponModalListing.product.name}</p>
                <p className="text-xs text-slate-500">
                  {[couponModalListing.product.brand, couponModalListing.product.category, couponModalListing.product.packSize].filter(Boolean).join(' · ')}
                </p>
                <div className="pt-1 flex items-baseline gap-2">
                  <span className="font-bold text-teal-800 text-sm">
                    {formatINR(couponModalListing.offerPriceMinor || couponModalListing.listedPriceMinor)}
                  </span>
                  {couponModalListing.savingsMinor > 0 && (
                    <span className="text-xs font-semibold text-emerald-600">
                      Save {formatINR(couponModalListing.savingsMinor)}
                    </span>
                  )}
                </div>
              </div>

              {/* Coupon Code Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. LULU50, FRESHDEAL"
                    maxLength={30}
                    className="w-full px-3 py-2 text-sm font-mono uppercase tracking-wider font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCouponInput(`LMD-LULU-${Math.floor(100 + Math.random() * 900)}`)}
                    className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Shoppers will see and copy this exact code to redeem at checkout.
                </p>
              </div>

              {/* Quick suggestion tags */}
              <div>
                <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['LULU10', 'LULU20', 'FRESHDEAL', 'WEEKEND50'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCouponInput(preset)}
                      className="px-2 py-1 text-xs font-mono font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {couponMessage && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-1.5 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{couponMessage}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {couponModalListing.couponCode ? (
                <button
                  type="button"
                  onClick={() => void handleRemoveListingCoupon(couponModalListing.id)}
                  disabled={couponSaving}
                  className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Remove Coupon
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCouponModalListing(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveListingCoupon()}
                  disabled={couponSaving || !couponInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {couponSaving ? 'Saving…' : 'Save Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brochure Coupon Allotment Modal */}
      {brochureCouponModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Allot Brochure Coupon</h3>
                  <p className="text-xs text-slate-500">{brochureCouponModal.fileName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBrochureCouponModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brochure Coupon Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={brochureCouponInput}
                    onChange={(e) => setBrochureCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. LULUFLYER, WEEKEND25"
                    maxLength={30}
                    className="w-full px-3 py-2 text-sm font-mono uppercase tracking-wider font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setBrochureCouponInput(`LMD-FLYER-${Math.floor(100 + Math.random() * 900)}`)}
                    className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={brochureCouponApplyAll}
                  onChange={(e) => setBrochureCouponApplyAll(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-teal-700 focus:ring-teal-500"
                />
                <span>
                  <strong>Apply to all products in this brochure</strong>
                  <span className="block text-slate-600 mt-0.5">
                    Automatically assigns this coupon code to all {brochureCouponModal.itemCount} extracted products so shoppers can claim deals on any item from this brochure.
                  </span>
                </span>
              </label>

              {brochureCouponMessage && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-1.5 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{brochureCouponMessage}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBrochureCouponModal(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveBrochureCoupon()}
                disabled={brochureCouponSaving || !brochureCouponInput.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {brochureCouponSaving ? 'Saving…' : 'Save Brochure Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>;
};

function getPhoneDigits(req: OfferRequest): string {
  const raw = (req.contactPhone || req.contactMasked || '').replace(/\D/g, '');
  if (raw.length === 10) return raw;
  if (raw.length === 12 && raw.startsWith('91')) return raw.slice(2);
  return '';
}

function getEnquiryMessage(req: OfferRequest, storeName: string, locality: string): string {
  const target = req.targetPriceMinor ? ` (Target: ${formatINR(req.targetPriceMinor)})` : '';
  const brand = req.brand ? ` ${req.brand}` : '';
  return `Hello! Regarding your enquiry for "${req.itemName}"${brand}${target} in ${req.locality} on LookMyDeals: We have this item available at ${storeName} (${locality}). Please visit our store or reply here for current in-store pricing and offers!`;
}

const Metric: React.FC<{ icon: typeof Package; label: string; value: number | string; detail: string }> = ({ icon: Icon, label, value, detail }) => <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-800"><Icon className="h-5 w-5" /></span><span className="text-xs font-medium text-teal-800">Demo data</span></div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;

const Panel: React.FC<{ title: string; subtitle?: string; action?: string; onAction?: () => void; children: React.ReactNode }> = ({ title, subtitle, action, onAction, children }) => <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{action && onAction && <button type="button" onClick={onAction} className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50">{action}</button>}</div>{children}</section>;

const RequestRow: React.FC<{
  request: OfferRequest;
  storeName: string;
  locality: string;
  compact?: boolean;
  onOpenReply?: (req: OfferRequest) => void;
  onSendWhatsApp?: (phone: string, text: string, reqId: string) => void;
  onSendSMS?: (phone: string, text: string, reqId: string) => void;
}> = ({ request, storeName, locality, compact = false, onOpenReply, onSendWhatsApp, onSendSMS }) => {
  const phone = getPhoneDigits(request);
  const displayContact = phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : (request.contactMasked || 'Contact provided');
  const defaultMsg = getEnquiryMessage(request, storeName, locality);
  const isResponded = request.status === 'responded';

  return (
    <article className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${compact ? 'py-3.5 first:pt-0 last:pb-0' : 'px-5 py-4 sm:px-6'}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{request.itemName}</h3>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isResponded ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
            {isResponded ? 'Responded' : 'Open Enquiry'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          {request.category}{request.brand ? ` · ${request.brand}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
          <span>{request.locality} · {request.pinCode}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            <Phone className="w-3 h-3 text-slate-400" />
            {displayContact}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
        {request.targetPriceMinor ? (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs sm:text-sm font-bold text-teal-800 border border-teal-200/50">
            Target {formatINR(request.targetPriceMinor)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">No target price</span>
        )}

        {/* WhatsApp Button */}
        <button
          type="button"
          onClick={() => {
            if (phone) {
              onSendWhatsApp?.(phone, defaultMsg, request.id);
            } else {
              onOpenReply?.(request);
            }
          }}
          style={{ backgroundColor: '#25D366' }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg hover:brightness-95 transition-all shadow-xs cursor-pointer"
          title="Send WhatsApp message about this enquiry"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        {/* SMS Button */}
        <button
          type="button"
          onClick={() => {
            if (phone) {
              onSendSMS?.(phone, defaultMsg, request.id);
            } else {
              onOpenReply?.(request);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Send SMS message about this enquiry"
        >
          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
          <span>SMS</span>
        </button>

        {/* Reply Dialog Button */}
        <button
          type="button"
          onClick={() => onOpenReply?.(request)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 rounded-lg transition-colors cursor-pointer"
          title="Customize response message"
        >
          <Send className="w-3 h-3 text-teal-700" />
          <span>Reply</span>
        </button>
      </div>
    </article>
  );
};

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="p-8 text-center text-sm text-slate-500">{children}</p>;
