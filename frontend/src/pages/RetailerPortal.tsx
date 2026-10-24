import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { LockKeyhole, Store } from 'lucide-react';
import { readApiJson } from '../lib/api';
import { RetailerDashboard } from './RetailerDashboard';
import { BrochureProductCandidate, Category, EnrichedListing, OfferRequest, Store as StoreType } from '../types';

interface SessionResponse { authenticated: boolean }
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
  itemCount: number;
  items: {
    id: string;
    productName: string;
    brand: string;
    packSize: string;
    category: string;
    regularPriceMinor: number | null;
    offerPriceMinor: number | null;
    validFrom: string;
    validUntil: string;
    status: string;
    cropUrl: string;
  }[];
}
interface RetailerDashboardData {
  retailer: { username: string; storeId: string };
  store: StoreType;
  locality: string;
  pinCode: string;
  listings: EnrichedListing[];
  brochures: RetailerBrochure[];
  categories: Category[];
  requests: OfferRequest[];
  uniqueBrochureVisitors: number;
  offerClaims: number;
}

export const RetailerPortal: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [dashboard, setDashboard] = useState<RetailerDashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const [username, setUsername] = useState('lulu');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const loadDashboard = useCallback(async () => {
    const response = await fetch('/api/retailer/dashboard');
    const data = await readApiJson<RetailerDashboardData & { error?: { message?: string } }>(response);
    if (response.status === 401) {
      setAuthenticated(false);
      setDashboard(null);
      return;
    }
    if (!response.ok) throw new Error(data.error?.message || 'Could not load the retailer dashboard.');
    setDashboard(data);
    setDashboardError('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/retailer/session')
      .then(async (response) => {
        const data = await readApiJson<SessionResponse>(response);
        if (!response.ok) throw new Error('Could not check your retailer session.');
        return data;
      })
      .then(async (data) => {
        if (cancelled) return;
        setAuthenticated(data.authenticated);
        if (data.authenticated) await loadDashboard();
      })
      .catch((error: unknown) => {
        if (!cancelled) setDashboardError(error instanceof Error ? error.message : 'Could not connect to the retailer service.');
      })
      .finally(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
  }, [loadDashboard]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    try {
      const response = await fetch('/api/retailer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await readApiJson<{ error?: { message?: string } }>(response);
      if (!response.ok) throw new Error(result.error?.message || 'Sign in failed.');
      setAuthenticated(true);
      await loadDashboard();
    } catch (error) {
      setAuthenticated(false);
      setDashboard(null);
      setLoginError(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/retailer/logout', { method: 'POST' }); } finally {
      setAuthenticated(false);
      setDashboard(null);
      setPassword('');
    }
  };

  const publishApprovedItems = async (items: BrochureProductCandidate[], storeId: string, brochureId: string) => {
    const response = await fetch('/api/catalog/brochure/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        brochureId,
        items: items.map((item) => ({
          candidateId: item.id,
          productName: item.productName,
          brand: item.brand,
          packSize: item.packSize,
          unit: item.unit,
          category: item.category,
          regularPrice: item.regularPrice,
          offerPrice: item.offerPrice,
          validFrom: item.validFrom,
          validUntil: item.validUntil,
          notes: item.notes,
        })),
      }),
    });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error?.message || 'Could not publish these listings.');
    await loadDashboard();
  };

  if (checkingSession || (authenticated && !dashboard && !dashboardError)) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">Loading retailer workspace…</div>;
  }

  if (authenticated && dashboard) {
    return <RetailerDashboard
      store={dashboard.store}
      locality={dashboard.locality}
      pinCode={dashboard.pinCode}
      listings={dashboard.listings}
      brochures={dashboard.brochures || []}
      categories={dashboard.categories}
      requests={dashboard.requests}
      uniqueBrochureVisitors={dashboard.uniqueBrochureVisitors}
      offerClaims={dashboard.offerClaims}
      onLogout={handleLogout}
      onBrochureUploaded={loadDashboard}
      onRefreshRequests={loadDashboard}
      onBrochureItemsPublished={publishApprovedItems}
    />;
  }

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
      <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-800"><Store className="h-5 w-5" /> LOOK MY DEALS</a>
      <div className="mb-6"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-800"><LockKeyhole className="h-6 w-6" /></span><h1 className="text-2xl font-bold">Retailer sign in</h1><p className="mt-2 text-sm text-slate-600">Sign in to manage LuLu Hypermarket, Edappally.</p></div>
      {(loginError || dashboardError) && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loginError || dashboardError}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div><label htmlFor="retailer-username" className="mb-1.5 block text-sm font-medium">Username</label><input id="retailer-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required className="min-h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></div>
        <div><label htmlFor="retailer-password" className="mb-1.5 block text-sm font-medium">Password</label><input id="retailer-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="min-h-12 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></div>
        <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-lg bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Signing in…' : 'Sign in to LuLu dashboard'}</button>
      </form>
      <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">Demo retailer access for LuLu Hypermarket. Do not use demo credentials for a live retailer account.</p>
    </section>
  </main>;
};
