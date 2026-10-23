export type VerificationStatus = 'demo' | 'pending_review' | 'verified' | 'rejected' | 'expired';

export type SourceType = 'demo' | 'retailer' | 'external_serp' | 'brochure';

export type Category = string;

export interface Locality {
  id: string;
  name: string;
  pinCode: string;
  landmark?: string;
}

export interface Store {
  id: string;
  name: string;
  localityId: string;
  address: string;
  phone?: string;
  verificationStatus: VerificationStatus;
  categories?: Category[];
  rating?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  packSize: string; // e.g. "1 kg", "5 kg", "1 L", "500 g"
  unit: string;     // e.g. "kg", "L", "g", "unit"
  image?: string;
}

export interface StoreListing {
  id: string;
  storeId: string;
  productId: string;
  productSnapshot?: Product;
  listedPriceMinor: number; // in paise (e.g., 22000 = ₹220)
  offerPriceMinor?: number; // in paise (e.g., 18500 = ₹185)
  currency: string;         // 'INR'
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
  validFrom?: string;
  validUntil?: string;
  priceCheckedAt: string;
}

export interface EnrichedListing extends StoreListing {
  product: Product;
  store: Store;
  locality: Locality;
  discountPercent: number;
  savingsMinor: number;
}

export interface CartItem {
  id: string; // unique item id in cart
  listingId: string;
  productId: string;
  storeId: string;
  productName: string;
  brand: string;
  packSize: string;
  storeName: string;
  localityName: string;
  priceSnapshotMinor: number;
  listedPriceMinor: number;
  quantity: number;
  addedAt: string;
}

export interface OfferClaim {
  id: string;
  listingId: string;
  productName: string;
  storeName: string;
  localityName: string;
  claimCode: string;
  discountMinor: number;
  finalPriceMinor: number;
  claimedAt: string;
  expiresAt: string;
  maskedPhone?: string;
  status: 'demo' | 'redeemed' | 'expired';
}

export interface OfferRequest {
  id: string;
  itemName: string;
  brand?: string;
  category: string;
  locality: string;
  pinCode: string;
  targetPriceMinor?: number;
  contactMasked?: string;
  createdAt: string;
  status: 'open' | 'responded' | 'closed';
}

export interface BrochureProductCandidate {
  id: string;
  productName: string;
  brand: string | null;
  packSize: string | null;
  unit: string | null;
  regularPrice: number | null; // in Rupees
  offerPrice: number | null;   // in Rupees
  validFrom: string | null;
  validUntil: string | null;
  pageNumber: number | null;
  confidence: number | null;
  notes: string[];
  category: Category | null;
  status: 'draft' | 'approved' | 'rejected';
}

export interface ExternalProduct {
  title: string;
  price: string;
  merchant: string;
  link: string | null;
  thumbnail: string | null;
}
