import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  EnrichedListing,
  CartItem,
  Category,
  Locality,
  Store,
} from './types';
import { loadCartFromStorage, saveCartToStorage, CLAIMS_STORAGE_KEY } from './lib/cartStorage';
import { readApiJson } from './lib/api';
import { DealCard } from './components/DealCard';
import { ClaimModal } from './components/ClaimModal';
import { MyClaimsModal } from './components/MyClaimsModal';
import { ReminderCartDrawer } from './components/ReminderCartDrawer';
import { RequestOfferModal } from './components/RequestOfferModal';
import {
  LookMyDealsLogo,
  LuluLogo,
  NestoLogo,
  MyGLogo,
  SmartBazaarLogo,
  KalyanLogo,
  SafariLogo,
  CarrefourLogo,
  OxygenLogo,
} from './components/BrandLogos';
import {
  CategoryIconGroceries,
  CategoryIconFruits,
  CategoryIconHomeware,
  CategoryIconElectronics,
  CategoryIconBeverages,
  CategoryIconPantry,
  CategoryIconMeat,
  CategoryIconPersonalCare,
  CategoryIconDairy,
  CategoryIconBakery,
  CategoryIconFrozenFood,
} from './components/CategoryIcons';
import { PopularSupermarketsMap } from './components/PopularSupermarketsMap';
import {
  Search,
  User,
  Lock,
  Menu,
  MapPin,
  ChevronDown,
  Send,
  Zap,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  X,
  Ticket,
  ShoppingBag,
  PlusCircle,
} from 'lucide-react';

const PublicBrochure = lazy(() => import('./pages/PublicBrochure').then((module) => ({ default: module.PublicBrochure })));
const RetailerPortal = lazy(() => import('./pages/RetailerPortal').then((module) => ({ default: module.RetailerPortal })));

export default function App() {
  const pathname = window.location.pathname;
  if (pathname.replace(/\/$/, '') === '/retailer') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-600">Loading retailer sign in…</div>}>
        <RetailerPortal />
      </Suspense>
    );
  }
  const brochureMatch = pathname.match(/^\/brochure\/([^/]+)\/?$/);
  if (brochureMatch) {
    let storeId = brochureMatch[1];
    try {
      storeId = decodeURIComponent(storeId);
    } catch {
      /* Safe not-found */
    }
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-600">Loading store brochure…</div>}>
        <PublicBrochure storeId={storeId} />
      </Suspense>
    );
  }

  const [viewMode, setViewMode] = useState<'shopper' | 'retailer'>('shopper');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // Request form state in the section
  const [requestCategory, setRequestCategory] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Catalog state
  const [catalog, setCatalog] = useState<{
    listings: EnrichedListing[];
    stores: Store[];
    localities: Locality[];
    categories: Category[];
  }>({ listings: [], stores: [], localities: [], categories: [] });

  // Cart, Claims & Modals
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [claimingListing, setClaimingListing] = useState<EnrichedListing | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isClaimsModalOpen, setIsClaimsModalOpen] = useState(false);
  const [claimsCount, setClaimsCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const updateClaimsCount = () => {
    try {
      const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setClaimsCount(parsed.length);
          return;
        }
      }
      setClaimsCount(0);
    } catch {
      setClaimsCount(0);
    }
  };

  useEffect(() => {
    updateClaimsCount();
  }, []);

  const totalCartCount = useMemo(() => cartItems.reduce((acc, i) => acc + i.quantity, 0), [cartItems]);

  // Load catalog
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch('/api/catalog');
        const data = await readApiJson(res);
        if (res.ok && data) {
          setCatalog(data);
        }
      } catch (e) {
        console.error('Catalog load error', e);
      }
    }
    fetchCatalog();
  }, []);

  // Save cart
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  const handleAddToCart = (listing: EnrichedListing) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.listingId === listing.id);
      if (existing) {
        return prev.map((i) =>
          i.listingId === listing.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
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
        },
      ];
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

  const handleClaimSuccess = (claim: { id: string; listingId: string }) => {
    void fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: claim.id, listingId: claim.listingId }),
    }).catch(() => undefined);
    updateClaimsCount();
  };

  const handleInlineRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDetails.trim()) return;
    setRequestSubmitted(true);
    setTimeout(() => {
      setRequestDetails('');
      setRequestPhone('');
      setRequestCategory('');
      setRequestSubmitted(false);
    }, 4000);
  };

  // Filtered deals
  const filteredListings = useMemo(() => {
    return catalog.listings.filter((item) => {
      if (selectedLocation !== 'All Locations' && item.locality.name !== selectedLocation) {
        return false;
      }
      if (selectedCategory && item.product.category !== selectedCategory) {
        return false;
      }
      if (selectedStore && !item.store.name.toLowerCase().includes(selectedStore.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.product.name.toLowerCase().includes(q);
        const matchesBrand = item.product.brand.toLowerCase().includes(q);
        const matchesStore = item.store.name.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesStore) return false;
      }
      return true;
    });
  }, [catalog.listings, selectedLocation, selectedCategory, selectedStore, searchQuery]);

  // Brand stores row data
  const brandStores = [
    { id: 'lulu', name: 'Lulu', logo: <LuluLogo /> },
    { id: 'nesto', name: 'Nesto', logo: <NestoLogo /> },
    { id: 'myg', name: 'MyG', logo: <MyGLogo /> },
    { id: 'smart_bazaar', name: 'Smart Bazaar', logo: <SmartBazaarLogo /> },
    { id: 'kalyan', name: 'Kalyan', logo: <KalyanLogo /> },
    { id: 'safari', name: 'Safari', logo: <SafariLogo /> },
    { id: 'carrefour', name: 'Carrefour', logo: <CarrefourLogo /> },
    { id: 'oxygen', name: 'Oxygen', logo: <OxygenLogo /> },
  ];

  // Category cards data matching exact counts and icons from reference screenshot
  const categoriesList = [
    { id: 'groceries', name: 'Groceries', count: '15+ Deals', icon: <CategoryIconGroceries /> },
    { id: 'fruits', name: 'Fruits & Vegetables', count: '14+ Deals', icon: <CategoryIconFruits /> },
    { id: 'homeware', name: 'Homeware', count: '9+ Deals', icon: <CategoryIconHomeware /> },
    { id: 'electronics', name: 'Electronics', count: '8+ Deals', icon: <CategoryIconElectronics /> },
    { id: 'beverages', name: 'Beverages', count: '5+ Deals', icon: <CategoryIconBeverages /> },
    { id: 'pantry', name: 'Pantry', count: '5+ Deals', icon: <CategoryIconPantry /> },
    { id: 'meat', name: 'Meat & Seafood', count: '4+ Deals', icon: <CategoryIconMeat /> },
    { id: 'personal_care', name: 'Personal Care', count: '4+ Deals', icon: <CategoryIconPersonalCare /> },
    { id: 'dairy', name: 'Dairy', count: '4+ Deals', icon: <CategoryIconDairy /> },
    { id: 'bakery', name: 'Bakery', count: '2+ Deals', icon: <CategoryIconBakery /> },
    { id: 'frozen', name: 'Frozen Food', count: '2+ Deals', icon: <CategoryIconFrozenFood /> },
  ];

  return (
    <div className="min-h-screen bg-[#FBFDFE] text-[#0F172A] flex flex-col font-sans antialiased">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          {/* Brand Logo & Desktop Search Bar */}
          <div className="flex items-center">
            <div
              onClick={() => { setViewMode('shopper'); setSelectedCategory(null); setSelectedStore(null); }}
              className="shrink-0 flex items-center cursor-pointer"
            >
              <LookMyDealsLogo />
            </div>

            {/* Search Input in Navbar (Tablet & Desktop) */}
            <div className="hidden md:flex items-center relative w-[200px] lg:w-[270px] xl:w-[320px] ml-3 lg:ml-5">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, deals..."
                className="w-full bg-[#F8FAFC] border-[1.5px] border-[#E2E8F0] rounded-[20px] text-[#0F172A] text-[13px] lg:text-[14px] font-medium pl-9 pr-4 py-1.5 lg:py-2 focus:bg-white focus:border-[#FBBB12] focus:ring-4 focus:ring-[#FBBB12]/20 transition-all outline-none placeholder:text-[#94A3B8] placeholder:font-medium"
              />
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode('shopper');
                setSelectedCategory(null);
                setSelectedStore(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-black font-semibold text-[14px] xl:text-[15px] px-2.5 py-1.5 whitespace-nowrap hover:text-teal-700 transition-colors cursor-pointer"
            >
              Discover
            </button>
            <a
              href="#categories"
              onClick={() => {
                if (viewMode !== 'shopper') setViewMode('shopper');
              }}
              className="text-black font-semibold text-[14px] xl:text-[15px] px-2.5 py-1.5 whitespace-nowrap hover:text-teal-700 transition-colors inline-block"
            >
              Categories
            </a>
            <button
              type="button"
              onClick={() => setIsClaimsModalOpen(true)}
              className="text-black font-semibold text-[14px] xl:text-[15px] px-2.5 py-1.5 whitespace-nowrap flex items-center gap-1.5 hover:text-teal-700 transition-colors cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Claim Deals</span>
              {claimsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {claimsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="text-black font-semibold text-[14px] xl:text-[15px] px-2.5 py-1.5 whitespace-nowrap flex items-center gap-1.5 hover:text-teal-700 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Reminder Cart</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.2 bg-teal-700 text-white text-[10px] font-bold rounded-full">
                  {totalCartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="text-black font-semibold text-[14px] xl:text-[15px] px-2.5 py-1.5 whitespace-nowrap flex items-center gap-1.5 hover:text-teal-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Request an Offer</span>
            </button>
          </nav>

          {/* Right Action Buttons & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              style={{
                background: '#fbbb12',
                border: '1px solid #d89e05',
                color: '#000',
              }}
              className="h-[34px] sm:h-[40px] px-2.5 sm:px-4 rounded-[6px] sm:rounded-[8px] font-bold text-[12px] sm:text-[14px] inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap hover:brightness-95 transition-all cursor-pointer shadow-none"
            >
              <Lock className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'shopper' ? 'retailer' : 'shopper')}
              style={{
                background: 'linear-gradient(90deg, #006767, #004d4d)',
                color: '#fff',
              }}
              className="h-[34px] sm:h-[40px] px-2.5 sm:px-4 rounded-[6px] sm:rounded-[8px] font-bold text-[12px] sm:text-[14px] inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap hover:opacity-95 transition-all cursor-pointer shadow-none"
            >
              <User className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{viewMode === 'shopper' ? 'Provider Sign In' : 'Shopper View'}</span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-3.5 space-y-3 shadow-lg">
            {/* Mobile Search Input */}
            <div className="relative w-full md:hidden">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, deals..."
                className="w-full bg-[#F8FAFC] border-[1.5px] border-[#E2E8F0] rounded-[20px] text-[#0F172A] text-[13px] font-medium pl-9 pr-4 py-2 focus:bg-white focus:border-[#FBBB12] focus:ring-4 focus:ring-[#FBBB12]/20 transition-all outline-none placeholder:text-[#94A3B8]"
              />
            </div>

            {/* Mobile Nav Links */}
            <div className="flex flex-col space-y-1 font-semibold text-slate-800 text-[14px]">
              <button
                type="button"
                onClick={() => {
                  setViewMode('shopper');
                  setSelectedCategory(null);
                  setSelectedStore(null);
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors"
              >
                Discover
              </button>
              <a
                href="#categories"
                onClick={() => {
                  if (viewMode !== 'shopper') setViewMode('shopper');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors"
              >
                Categories
              </a>
              <button
                type="button"
                onClick={() => {
                  setIsClaimsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Claim Deals / My Claims</span>
                </span>
                {claimsCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded-full">
                    {claimsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Reminder Cart</span>
                </span>
                {totalCartCount > 0 && (
                  <span className="px-2 py-0.5 bg-teal-700 text-white text-[11px] font-bold rounded-full">
                    {totalCartCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRequestModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors text-left"
              >
                <PlusCircle className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Request an Offer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('retailer');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-700 transition-colors"
              >
                Become a Shop With Us (Retailer)
              </button>
            </div>
          </div>
        )}
      </header>

      {/* RETAILER VIEW MODE (if switched) */}
      {viewMode === 'retailer' ? (
        <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Provider & Retailer Portal</h2>
            <button
              type="button"
              onClick={() => setViewMode('shopper')}
              className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 cursor-pointer"
            >
              ← Back to Customer Home
            </button>
          </div>
          <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Retailer Portal…</div>}>
            <RetailerPortal />
          </Suspense>
        </main>
      ) : (
        /* 2. SHOPPER HOMEPAGE (EXACT SCREENSHOT LAYOUT) */
        <main className="flex-1 w-full flex flex-col">
          {/* HERO BANNER */}
          <section
            className="relative overflow-hidden py-14 sm:py-20 px-4 text-white text-center bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/home2.jpeg')`,
              backgroundColor: '#EA580C',
            }}
          >
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />

            <div className="relative max-w-4xl mx-auto z-10">
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase mb-3 drop-shadow-sm">
                FIND THE BEST <span className="text-[#CEFF1A]">DEALS</span> IN YOUR CITY!
              </h1>
              <p className="text-sm sm:text-base text-amber-50 font-medium max-w-2xl mx-auto mb-8 drop-shadow-xs">
                We connect you to the best supermarket deals in your area, first time and every time.
              </p>

              {/* Unified Hero Search Box */}
              <div className="bg-white rounded-2xl sm:rounded-full p-2 sm:p-1.5 shadow-2xl max-w-3xl mx-auto flex flex-col sm:flex-row items-center border border-white/40 gap-2 sm:gap-0">
                {/* Search Input */}
                <div className="flex items-center gap-2 flex-1 px-3 sm:px-4 py-1.5 sm:py-2 w-full">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search offers, products or supermarket"
                    className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Vertical Divider (Desktop) */}
                <div className="hidden sm:block w-px h-8 bg-slate-200" />

                {/* Horizontal Divider (Mobile) */}
                <div className="sm:hidden w-full h-px bg-slate-100" />

                {/* Location Selector Dropdown */}
                <div className="flex items-center justify-between sm:justify-start gap-2 px-3 sm:px-4 py-1 sm:py-2 w-full sm:w-auto shrink-0 relative">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none pr-4 appearance-none"
                    >
                      <option value="All Locations">All Locations</option>
                      <option value="Kochi">Kochi (682024)</option>
                      <option value="Kakkanad">Kakkanad (682030)</option>
                      <option value="Edappally">Edappally (682024)</option>
                      <option value="MG Road">MG Road (682016)</option>
                      <option value="Vyttila">Vyttila (682019)</option>
                      <option value="Aluva">Aluva (682101)</option>
                      <option value="Thrissur">Thrissur</option>
                      <option value="Ras Al-Khaimah">Ras Al-Khaimah</option>
                    </select>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('deals-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-7 py-2.5 sm:py-3 bg-[#007A78] hover:bg-[#006664] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl sm:rounded-full shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>SEARCH</span>
                </button>
              </div>
            </div>
          </section>

          {/* 3. SECTION: SHOP BY SUPERMARKET */}
          <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="mb-6">
              <span className="text-[11px] font-extrabold text-[#009688] tracking-widest uppercase block mb-1">
                FIND YOUR FAVORITE STORE
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#003B46] tracking-tight uppercase">
                SHOP BY SUPERMARKET
              </h2>
            </div>

            {/* Circular Brand Logos Row */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 sm:gap-6">
              {brandStores.map((store) => {
                const isSelected = selectedStore === store.name;
                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStore(isSelected ? null : store.name)}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-2 flex items-center justify-center p-2.5 transition-all shadow-xs ${
                        isSelected
                          ? 'border-[#007A78] shadow-md scale-105 ring-4 ring-[#007A78]/10'
                          : 'border-slate-200/90 group-hover:border-[#007A78]/60 group-hover:shadow-sm'
                      }`}
                    >
                      {store.logo}
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-800 text-center group-hover:text-[#007A78] transition-colors truncate max-w-[80px]">
                      {store.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. SECTION: EXPLORE OFFERS BY CATEGORY */}
          <section id="categories" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="mb-6">
              <span className="text-[11px] font-bold text-[#0D9488] tracking-widest uppercase block mb-1">
                BROWSE BY TYPE
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#004D40] tracking-tight uppercase">
                EXPLORE OFFERS BY CATEGORY
              </h2>
            </div>

            {/* Category Cards Grid (11 items) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                    className={`bg-white rounded-xl p-4 sm:p-5 border transition-all flex flex-col items-center text-center cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-[#007A78] shadow-md ring-2 ring-[#007A78]/20 bg-teal-50/20 scale-[1.02]'
                        : 'border-slate-200/80 hover:border-teal-400 hover:shadow-sm hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-center h-14 w-14">
                      {cat.icon}
                    </div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug mb-1">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] sm:text-xs font-medium text-teal-600">
                      {cat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ACTIVE LIVE DEALS (Filtered when user selects category or supermarket) */}
          <section id="deals-section" className="py-8 max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {selectedStore ? `${selectedStore} In-Store Deals` : selectedCategory ? `${selectedCategory} Deals` : 'Featured In-Store Deals'}
                  <span className="ml-2 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {filteredListings.length} Deals
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Compare prices across LuLu, Bismi, Reliance Smart & local stores in Kochi.
                </p>
              </div>

              {(selectedCategory || selectedStore || searchQuery) && (
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(null); setSelectedStore(null); setSearchQuery(''); }}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>

            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredListings.slice(0, 8).map((listing) => (
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
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                No active deals match the selected filters. Try choosing another category or clearing filters.
              </div>
            )}
          </section>

          {/* 5. SECTION: TOP RATED SUPERMARKETS & INTERACTIVE MAP */}
          <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <PopularSupermarketsMap />
          </section>

          {/* 6. SECTION: REQUEST AN OFFER */}
          <section className="py-12 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Description Column */}
                <div className="lg:col-span-6 space-y-4">
                  <span className="text-[11px] font-extrabold text-[#009688] tracking-widest uppercase block">
                    CAN'T FIND A DEAL?
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#003B46] tracking-tight uppercase leading-tight">
                    REQUEST AN OFFER
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Looking for a specific laptop, TV, AC, or mobile deal that isn't listed? Tell us what you're looking for, and we'll instantly notify all local stores and providers to publish a custom discount for you!
                  </p>

                  <div className="flex items-center gap-3 p-3 bg-teal-50/70 rounded-xl border border-teal-100/80">
                    <div className="w-10 h-10 rounded-full bg-[#007A78] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Zap className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        Instant Store Alerts
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                        Providers get notified on their dashboard instantly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Form Card Column */}
                <div className="lg:col-span-6">
                  <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                    {requestSubmitted ? (
                      <div className="text-center py-8 space-y-2">
                        <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-900">Request Dispatched!</h3>
                        <p className="text-xs text-slate-600">
                          Local supermarkets in Kochi have been notified to list offers for your requested product.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleInlineRequestSubmit} className="space-y-4">
                        {/* Choose Category */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Choose Category
                          </label>
                          <div className="relative">
                            <select
                              value={requestCategory}
                              onChange={(e) => setRequestCategory(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                            >
                              <option value="">-- Select a category --</option>
                              {categoriesList.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Product Details
                          </label>
                          <input
                            type="text"
                            required
                            value={requestDetails}
                            onChange={(e) => setRequestDetails(e.target.value)}
                            placeholder="What product are you looking for? (e.g. Dell XPS 15)"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={requestPhone}
                            onChange={(e) => setRequestPhone(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          className="w-full py-3 bg-[#007A78] hover:bg-[#006664] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit Request</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. FOOTER */}
          <footer className="bg-white border-t border-slate-200 pt-12 pb-6 text-xs text-slate-600 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                {/* Col 1: Brand & Details */}
                <div className="space-y-3">
                  <LookMyDealsLogo />
                  <p className="text-xs text-slate-500 leading-relaxed pr-4">
                    Know the real price before you walk in. Find the best TV, Laptop, AC & Mobile deals at Croma, Lulu, myG & Oxygen stores near you.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-slate-500">
                    <a href="#web" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-teal-700 transition-colors">
                      <Globe className="w-4 h-4" />
                    </a>
                    <a href="mailto:care@lookmydeals.com" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-teal-700 transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                    <a href="tel:+914842727777" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-teal-700 transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Col 2: Quick Links */}
                <div>
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs mb-3">
                    QUICK LINKS
                  </h4>
                  <ul className="space-y-2 text-xs">
                    <li><a href="#home" className="hover:text-teal-700 transition-colors">Home</a></li>
                    <li><a href="#about" className="hover:text-teal-700 transition-colors">About Us</a></li>
                    <li><a href="#categories" className="hover:text-teal-700 transition-colors">Categories</a></li>
                    <li><a href="#nearby" className="hover:text-teal-700 transition-colors">Nearby Stores</a></li>
                  </ul>
                </div>

                {/* Col 3: Support */}
                <div>
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs mb-3">
                    SUPPORT
                  </h4>
                  <ul className="space-y-2 text-xs">
                    <li><a href="#help" className="hover:text-teal-700 transition-colors">Help Center</a></li>
                    <li><a href="#faq" className="hover:text-teal-700 transition-colors">FAQ</a></li>
                    <li><a href="#contact" className="hover:text-teal-700 transition-colors">Contact Us</a></li>
                    <li><a href="#privacy" className="hover:text-teal-700 transition-colors">Privacy Policy</a></li>
                  </ul>
                </div>

                {/* Col 4: Empty space / Brand mission */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs mb-3">
                    OFFLINE SHOPPING UTILITY
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Designed for shoppers across Kochi, Kerala. Compare prices, save to reminder cart, and walk in with verified promotional codes.
                  </p>
                </div>
              </div>

              {/* Bottom Copyright Bar */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <p>© 2026 LOOK MY DEALS — All Rights Reserved</p>
              </div>
            </div>
          </footer>
        </main>
      )}

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
        onClaimSuccess={handleClaimSuccess}
      />

      {/* My Claims List Modal */}
      <MyClaimsModal
        isOpen={isClaimsModalOpen}
        onClose={() => {
          setIsClaimsModalOpen(false);
          updateClaimsCount();
        }}
        onExploreDeals={() => {
          const el = document.getElementById('deals-section') || document.getElementById('categories');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Request an Offer Modal */}
      <RequestOfferModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        localities={catalog.localities}
        categories={catalog.categories}
      />
    </div>
  );
}
