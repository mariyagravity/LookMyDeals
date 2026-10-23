import React, { useState, useEffect } from 'react';
import { BrochureProductCandidate, Category, EnrichedListing, OfferRequest, Store } from '../types';
import { BrochureUpload } from '../components/BrochureUpload';
import { ReviewTable } from '../components/ReviewTable';
import { formatINR, formatDate } from '../lib/format';
import { readApiJson } from '../lib/api';
import {
  Store as StoreIcon,
  Sparkles,
  Ticket,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface RetailerDashboardProps {
  listings: EnrichedListing[];
  stores: Store[];
  categories: Category[];
  onBrochureItemsPublished: (newItems: BrochureProductCandidate[], storeId: string) => Promise<void>;
}

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({
  listings,
  stores,
  categories,
  onBrochureItemsPublished,
}) => {
  const [activeTab, setActiveTab] = useState<'brochure' | 'listings' | 'requests'>('brochure');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [extractionError, setExtractionError] = useState(false);
  const [candidates, setCandidates] = useState<BrochureProductCandidate[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [customerRequests, setCustomerRequests] = useState<OfferRequest[]>([]);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState(false);

  // Load customer requests from the backend database.
  useEffect(() => {
    fetch('/api/offer-requests')
      .then(async (response) => {
        const requests = await readApiJson<OfferRequest[]>(response);
        if (!response.ok) throw new Error('Could not load requests.');
        return requests;
      })
      .then((requests: OfferRequest[]) => setCustomerRequests(requests))
      .catch((err) => console.error('Error loading requests', err));
  }, []);

  // Uploads are only considered extracted when the backend returns real candidates.
  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setExtractionError(false);
    setStatusText(`Uploading ${file.name} for extraction...`);

    // Do not create draft rows unless the backend returns extracted candidates.
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/brochure/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await readApiJson(res);
      if (!res.ok) {
        throw new Error(data.error?.message || 'Brochure extraction is unavailable.');
      }

      setCandidates(Array.isArray(data.items) ? data.items : []);
      setStatusText(data.isDemoExtraction
        ? 'Sample extraction data returned. Review it as demo content.'
        : 'Extraction complete. Review all candidates before publishing.');
    } catch (e) {
      setCandidates([]);
      setExtractionError(true);
      setStatusText(e instanceof Error ? e.message : 'Brochure extraction is unavailable.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(false);
  };

  const handleUpdateCandidate = (updated: BrochureProductCandidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleApproveAndPublish = async (approved: BrochureProductCandidate[]) => {
    if (!selectedStoreId) {
      setPublishError(true);
      setPublishSuccessMessage('Choose the store for these approved deals before publishing.');
      return;
    }

    try {
      await onBrochureItemsPublished(approved, selectedStoreId);
    } catch (error) {
      setPublishError(true);
      setPublishSuccessMessage(error instanceof Error ? error.message : 'Could not publish these listings.');
      return;
    }

    setPublishError(false);
    setPublishSuccessMessage(
      `Added ${approved.length} approved sample listing(s) to the demo shopper feed.`
    );

    // Remove published items from draft table
    setCandidates((prev) => prev.filter((c) => c.status !== 'approved'));

    setTimeout(() => {
      setPublishSuccessMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Illustrative Demo Environment Notice (FR-501, lmd-security) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <strong className="font-bold">Retailer Merchant Portal (Demo Access)</strong>:
          This portal simulates merchant tools for supermarkets in Kochi (e.g., LuLu, Bismi, Reliance). All analytics metrics below are illustrative sample data. AI brochure extractions require merchant review before publishing.
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Active Deals</span>
            <StoreIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-ink">{listings.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Sample listings in demo feed</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Shopper Impressions</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-ink">3,420</div>
          <p className="text-[11px] text-ink-muted font-medium mt-1">Sample demo metrics</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Claimed Codes</span>
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-ink">184</div>
          <p className="text-[11px] text-ink-muted font-medium mt-1">Demo claims only</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-semibold">Customer Requests</span>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-ink">{customerRequests.length}</div>
          <p className="text-[11px] text-primary-strong font-medium mt-1">From local shoppers</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('brochure')}
          className={`touch-target px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === 'brochure'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Brochure Digitizer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`touch-target px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === 'listings'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Active Store Listings ({listings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`touch-target px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === 'requests'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Shopper Demand ({customerRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: AI Brochure Digitizer */}
      {activeTab === 'brochure' && (
        <div className="space-y-5">
          {publishSuccessMessage && (
            <div className={`p-3 border text-xs font-semibold rounded-lg flex items-center gap-2 animate-fade-in ${publishError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {publishError ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              <span>{publishSuccessMessage}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-surface-border p-4">
            <label htmlFor="brochure-store" className="block text-xs font-semibold text-ink mb-1">
              Publish approved deals under store
            </label>
            <select
              id="brochure-store"
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
              className="w-full max-w-md px-3 py-2 text-sm border border-surface-border rounded-lg bg-white"
            >
              <option value="">Choose a store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name} — {store.address}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-ink-muted">This demo choice controls where the approved sample listing appears in the shopper feed.</p>
          </div>

          <BrochureUpload
            onFileSelected={handleFileSelected}
            isProcessing={isProcessing}
            statusText={statusText}
            statusError={extractionError}
          />

          <ReviewTable
            candidates={candidates}
            categories={categories}
            onUpdateCandidate={handleUpdateCandidate}
            onApproveAndPublish={handleApproveAndPublish}
            canPublish={Boolean(selectedStoreId)}
          />
        </div>
      )}

      {/* Tab 2: Active Store Listings */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-xs">
          <div className="p-4 border-b border-surface-border">
            <h3 className="text-sm font-bold text-ink">Demo Catalog in Kochi</h3>
            <p className="text-xs text-ink-muted">
              Sample listings currently shown in the demo shopper feed.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-ink-muted border-b border-surface-border uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Store</th>
                  <th className="py-2.5 px-3">Locality</th>
                  <th className="py-2.5 px-3">Regular Price</th>
                  <th className="py-2.5 px-3">Offer Price</th>
                  <th className="py-2.5 px-3">Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {listings.slice(0, 15).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-ink">
                      {l.product.name} ({l.product.packSize})
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">{l.product.category}</td>
                    <td className="py-2.5 px-3 font-semibold text-primary-strong">
                      {l.store.name}
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">{l.locality.name}</td>
                    <td className="py-2.5 px-3 font-mono line-through text-slate-400">
                      {formatINR(l.listedPriceMinor)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {l.offerPriceMinor ? formatINR(l.offerPriceMinor) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">{formatDate(l.validUntil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Deal Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-xs">
          <div className="p-4 border-b border-surface-border">
            <h3 className="text-sm font-bold text-ink">Shopper Offer Requests</h3>
            <p className="text-xs text-ink-muted">
              Live products requested by customers in Kochi who couldn't find a local deal.
            </p>
          </div>
          {customerRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              No customer requests logged yet. Shoppers can submit requests using the "Request an Offer" button.
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {customerRequests.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{req.itemName}</h4>
                    <p className="text-xs text-ink-muted">
                      Category: {req.category} • Target Locality: <span className="font-semibold text-ink">{req.locality} ({req.pinCode})</span>
                    </p>
                    {req.brand && (
                      <p className="text-xs text-ink-muted">Preferred Brand: {req.brand}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {req.targetPriceMinor && (
                      <p className="text-sm font-bold text-emerald-700">
                        Target: {formatINR(req.targetPriceMinor)}
                      </p>
                    )}
                    <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      Open Request
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
