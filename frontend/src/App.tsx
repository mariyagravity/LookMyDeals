import { useState, useEffect, useMemo } from 'react';
import {
  EnrichedListing,
  CartItem,
  Category,
  BrochureProductCandidate,
  Locality,
  Store,
} from './types';
import { loadCartFromStorage, saveCartToStorage } from './lib/cartStorage';
import { readApiJson } from './lib/api';
import { DealCard } from './components/DealCard';
import { LocalitySelector } from './components/LocalitySelector';
import { CategoryChips } from './components/CategoryChips';
import { ClaimModal } from './components/ClaimModal';
import { ReminderCartDrawer } from './components/ReminderCartDrawer';
import { RequestOfferModal } from './components/RequestOfferModal';
import { ExternalResults } from './components/ExternalResults';
import { RetailerDashboard } from './pages/RetailerDashboard';
import {
  ShoppingBag,
  Search,
  Tag,
  Store as StoreIcon,
  PlusCircle,
  MapPin,
  X,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Navigation mode: 'shopper' or 'retailer'
  const [viewMode, setViewMode] = useState<'shopper' | 'retailer'>('shopper');
  const [shopperTab, setShopperTab] = useState<'local' | 'external'>('local');

  // Filter state
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalog, setCatalog] = useState<{
    listings: EnrichedListing[];
    stores: Store[];
    localities: Locality[];
    categories: Category[];
  }>({ listings: [], stores: [], localities: [], categories: [] });
  const [catalogError, setCatalogError] = useState('');

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals state
  const [claimingListing, setClaimingListing] = useState<EnrichedListing | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadCatalog = async () => {
    try {
      const response = await fetch('/api/catalog');
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.error?.message || 'Could not load the catalog.');
      setCatalog(data);
      setCatalogError('');
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Could not load the catalog.');
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  // Save cart to localStorage on modification
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  // Save approved brochure listings through the database API, then refresh the shared catalog.
  const handleBrochureItemsPublished = async (newItems: BrochureProductCandidate[], storeId: string) => {
    const response = await fetch('/api/catalog/brochure/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, items: newItems }),
    });
    const result = await readApiJson(response);
    if (!response.ok) throw new Error(result.error?.message || 'Could not publish these listings.');
    await loadCatalog();
  };

  const allListings = catalog.listings;

  // Client-side filtering (<50ms target per lmd-frontend)
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allListings.filter((item) => {
      // Locality filter
      if (selectedLocalityId !== 'all' && item.store.localityId !== selectedLocalityId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && item.product.category !== selectedCategory) {
        return false;
      }

      // Search query over Product Name, Brand, Store, Category, and Locality
      if (q) {
        const matchesName = item.product.name.toLowerCase().includes(q);
        const matchesBrand = item.product.brand.toLowerCase().includes(q);
        const matchesStore = item.store.name.toLowerCase().includes(q);
        const matchesCat = item.product.category.toLowerCase().includes(q);
        const matchesLoc = item.locality.name.toLowerCase().includes(q);

        if (!matchesName && !matchesBrand && !matchesStore && !matchesCat && !matchesLoc) {
          return false;
        }
      }

      return true;
    });
  }, [allListings, selectedLocalityId, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => allListings.reduce<Record<string, number>>((counts, listing) => {
    counts[listing.product.category] = (counts[listing.product.category] || 0) + 1;
    return counts;
  }, {}), [allListings]);

  // Cart operations
  const handleAddToCart = (listing: EnrichedListing) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.listingId === listing.id);
      if (existing) {
        return prev.map((i) =>
          i.listingId === listing.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random()}`,
        listingId: listing.id,
        productId: listing.product.id,
        storeId: listing.store.id,
        productName: listing.product.name,
        brand: listing.product.brand,
        packSize: listing.product.packSize,
        storeName: listing.store.name,
        localityName: listing.locality.name,
        priceSnapshotMinor: listing.offerPriceMinor || listing.listedPriceMinor,
        listedPriceMinor: listing.listedPriceMinor,
        quantity: 1,
        addedAt: new Date().toISOString(),
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-surface-border shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('shopper')}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-ink tracking-tight flex items-center gap-1.5 leading-none">
                LookMyDeals
                <span className="text-[10px] font-bold bg-primary-light text-primary px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-widest">
                  Kochi
                </span>
              </h1>
              <p className="text-[11px] text-ink-muted leading-tight mt-0.5 hidden sm:block">
                In-Store Supermarket Price Comparison
              </p>
            </div>
          </div>

          {/* Right Header Controls: Locality, Mode Toggle & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Locality Selector */}
            {viewMode === 'shopper' && (
              <div className="hidden sm:block">
                <LocalitySelector
                  selectedLocalityId={selectedLocalityId}
                  onSelectLocality={setSelectedLocalityId}
                  localities={catalog.localities}
                />
              </div>
            )}

            {/* Request an Offer Button */}
            {viewMode === 'shopper' && (
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="touch-target px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-primary" />
                <span className="hidden md:inline">Request Offer</span>
              </button>
            )}

            {/* Reminder Cart Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="touch-target relative px-3 py-1.5 text-xs font-bold text-ink bg-white border border-surface-border hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-2xs transition-colors"
              aria-label={`View Reminder Cart with ${totalCartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 text-primary-strong" />
              <span className="hidden sm:inline">Shopping List</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.2 bg-primary text-white text-[11px] font-extrabold rounded-full">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Mode Switcher: Shopper Discovery vs Retailer Dashboard */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'shopper' ? 'retailer' : 'shopper')}
              className={`touch-target px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === 'retailer'
                  ? 'bg-ink text-white'
                  : 'bg-primary/10 text-primary-strong hover:bg-primary/20 border border-primary/20'
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>{viewMode === 'shopper' ? 'Retailer Portal' : 'Shopper View'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Locality bar */}
        {viewMode === 'shopper' && (
          <div className="sm:hidden px-4 py-2 bg-slate-50 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-ink-muted">Locality:</span>
            <LocalitySelector
              selectedLocalityId={selectedLocalityId}
              onSelectLocality={setSelectedLocalityId}
              localities={catalog.localities}
            />
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1660px] px-4 py-6 flex-1">
        {viewMode === 'retailer' ? (
          /* Retailer Dashboard Page */
          <RetailerDashboard
            listings={allListings}
            stores={catalog.stores}
            categories={catalog.categories}
            onBrochureItemsPublished={handleBrochureItemsPublished}
          />
        ) : (
          /* Shopper Discovery Page */
          <div className="space-y-6">
            {/* Hero & Search Banner */}
            <div className="bg-gradient-to-r from-teal-900 via-primary-dark to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-sm text-teal-200 border border-white/20 mb-3 uppercase tracking-wider">
                  Kochi Offline Shopping Discovery
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
                  Find the Best In-Store Deals Across Supermarkets in Kochi
                </h2>
                <p className="text-sm text-teal-100 mb-6">
                  Compare listed store prices at LuLu, Bismi, Reliance, and local hypermarkets before you travel. Build your offline trip list.
                </p>

                {/* Instant Search Bar */}
                <div className="relative flex items-center">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    aria-label="Search local products and stores"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sunflower oil, basmati rice, washing machine, tea..."
                    className="w-full pl-11 pr-10 py-3 bg-white text-ink text-sm rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1 text-slate-400 hover:text-ink"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Shopper Mode Tabs: Local Verified Deals vs External SERP Search */}
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShopperTab('local')}
                  className={`touch-target px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                    shopperTab === 'local'
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-slate-100'
                  }`}
                >
                  <StoreIcon className="w-4 h-4" />
                  <span>Kochi Local Store Deals ({filteredListings.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShopperTab('external')}
                  className={`touch-target px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                    shopperTab === 'external'
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-slate-100'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>External Online Search</span>
                </button>
              </div>

              {shopperTab === 'local' && (
                <span className="text-xs text-ink-muted hidden sm:inline">
                  Showing deals for:{' '}
                  <strong className="text-ink">
                    {catalog.localities.find((l) => l.id === selectedLocalityId)?.name}
                  </strong>
                </span>
              )}
            </div>

            {shopperTab === 'external' ? (
              /* External Search Results Tab (FR-601) */
              <ExternalResults currentQuery={searchQuery} />
            ) : (
              /* Local Kochi Deals Tab */
              <div className="space-y-4">
                {/* Category Chips */}
                <CategoryChips
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  categories={catalog.categories}
                  categoryCounts={categoryCounts}
                />

                {catalogError && (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {catalogError}
                  </div>
                )}

                {/* Deal Cards Grid */}
                {filteredListings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {filteredListings.map((listing) => (
                      <DealCard
                        key={listing.id}
                        listing={listing}
                        onAddToCart={handleAddToCart}
                        onClaimOffer={setClaimingListing}
                        isInCart={cartItems.some((i) => i.listingId === listing.id)}
                      />
                    ))}
                  </div>
                ) : (
                  /* Empty State (FR-202) */
                  <div className="bg-white rounded-2xl p-10 text-center border border-surface-border">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-ink mb-1">
                      No matching local deals found
                    </h3>
                    <p className="text-xs text-ink-muted mb-4 max-w-sm mx-auto">
                      We couldn't find in-store offers matching "{searchQuery}" in{' '}
                      {catalog.localities.find((l) => l.id === selectedLocalityId)?.name || 'your area'}.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setSelectedLocalityId('all');
                        }}
                        className="touch-target px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-ink rounded-lg transition-colors"
                      >
                        Reset All Filters
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRequestModalOpen(true)}
                        className="touch-target px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-strong rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Request an Offer from Retailers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShopperTab('external')}
                        className="touch-target px-4 py-2 text-xs font-semibold border border-surface-border bg-white hover:bg-slate-50 text-ink rounded-lg transition-colors"
                      >
                        Search External Results
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="bg-white border-t border-surface-border py-8 text-xs text-ink-muted">
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold text-ink text-sm">LookMyDeals</p>
              <p className="text-[11px] text-ink-muted">
                Hyper-local offline shopping discovery in Kochi, Kerala.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Kakkanad (682030)
              </span>
              <span>• Edappally (682024)</span>
              <span>• MG Road (682016)</span>
              <span>• Vyttila (682019)</span>
              <span>• Aluva (682101)</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            <strong>Honest Disclosure</strong>: LookMyDeals is an offline discovery and trip-planning utility. All sample data and analytics metrics are demonstrative. In-store prices and stock availability are subject to physical verification upon visit.
          </div>
        </div>
      </footer>

      {/* Reminder Cart Drawer */}
      <ReminderCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Claim Deal Modal */}
      <ClaimModal
        listing={claimingListing}
        onClose={() => setClaimingListing(null)}
      />

      {/* Request an Offer Modal */}
      <RequestOfferModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        defaultLocalityId={selectedLocalityId}
        localities={catalog.localities}
        categories={catalog.categories}
      />
    </div>
  );
}
