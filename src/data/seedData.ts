import { Locality, Store, Product, StoreListing, EnrichedListing, Category } from '../types';
import { calculateDiscount } from '../lib/format';

export const LOCALITIES: Locality[] = [
  { id: 'all', name: 'All Kochi', pinCode: '682000', landmark: 'Greater Kochi Metropolitan Area' },
  { id: 'kakkanad', name: 'Kakkanad', pinCode: '682030', landmark: 'Infopark & Seaport-Airport Rd' },
  { id: 'edappally', name: 'Edappally', pinCode: '682024', landmark: 'Toll Junction & LuLu Circle' },
  { id: 'mg_road', name: 'MG Road', pinCode: '682016', landmark: 'Ernakulam South & Shenoys' },
  { id: 'vyttila', name: 'Vyttila', pinCode: '682019', landmark: 'Mobility Hub & NH 66 Bypass' },
  { id: 'aluva', name: 'Aluva', pinCode: '682101', landmark: 'Metro Terminal & Bank Junction' },
];

export const CATEGORIES: Category[] = [
  'Groceries & Staples',
  'Fresh Fruits & Veggies',
  'Personal Care',
  'Home & Cleaning',
  'Electronics & Appliances',
];

export const STORES: Store[] = [
  {
    id: 'store_lulu_edappally',
    name: 'LuLu Hypermarket',
    localityId: 'edappally',
    address: 'LuLu International Shopping Mall, Edappally, Kochi - 682024',
    phone: '0484 2727777',
    verificationStatus: 'verified',
    categories: ['Groceries & Staples', 'Fresh Fruits & Veggies', 'Personal Care', 'Home & Cleaning', 'Electronics & Appliances'],
    rating: 4.8,
  },
  {
    id: 'store_reliance_kakkanad',
    name: 'Reliance Smart Bazaar',
    localityId: 'kakkanad',
    address: 'Near Kakkanad Civil Station, Seaport-Airport Rd, Kochi - 682030',
    phone: '0484 2421111',
    verificationStatus: 'verified',
    categories: ['Groceries & Staples', 'Fresh Fruits & Veggies', 'Personal Care', 'Home & Cleaning'],
    rating: 4.5,
  },
  {
    id: 'store_bismi_vyttila',
    name: 'Bismi Hypermarket',
    localityId: 'vyttila',
    address: 'Vyttila Hub Exit, NH Bypass, Kochi - 682019',
    phone: '0484 4040404',
    verificationStatus: 'verified',
    categories: ['Groceries & Staples', 'Personal Care', 'Home & Cleaning', 'Electronics & Appliances'],
    rating: 4.6,
  },
  {
    id: 'store_supplyco_mgroad',
    name: 'Supplyco Peoples Bazaar',
    localityId: 'mg_road',
    address: 'Near Shenoys Junction, MG Road, Ernakulam - 682016',
    phone: '0484 2380000',
    verificationStatus: 'verified',
    categories: ['Groceries & Staples', 'Personal Care'],
    rating: 4.3,
  },
  {
    id: 'store_nandilath_edappally',
    name: 'Nandilath G-Mart',
    localityId: 'edappally',
    address: 'Edappally Toll, Palarivattom Bypass, Kochi - 682024',
    phone: '0484 2341234',
    verificationStatus: 'verified',
    categories: ['Electronics & Appliances'],
    rating: 4.7,
  },
  {
    id: 'store_pittappillil_kakkanad',
    name: 'Pittappillil Agencies',
    localityId: 'kakkanad',
    address: 'Thrikkakara Temple Rd, Kakkanad, Kochi - 682030',
    phone: '0484 2577788',
    verificationStatus: 'verified',
    categories: ['Electronics & Appliances'],
    rating: 4.6,
  },
  {
    id: 'store_more_vyttila',
    name: 'More Supermarket',
    localityId: 'vyttila',
    address: 'Subhash Chandra Bose Rd, Vyttila, Kochi - 682019',
    phone: '0484 2809000',
    verificationStatus: 'demo',
    categories: ['Groceries & Staples', 'Fresh Fruits & Veggies', 'Personal Care'],
    rating: 4.2,
  },
  {
    id: 'store_dailyfresh_aluva',
    name: 'Daily Fresh Mart',
    localityId: 'aluva',
    address: 'Railway Station Rd, Aluva, Kochi - 682101',
    phone: '0484 2623344',
    verificationStatus: 'demo',
    categories: ['Groceries & Staples', 'Fresh Fruits & Veggies'],
    rating: 4.4,
  },
];

export const PRODUCTS: Product[] = [
  // Groceries & Staples
  {
    id: 'prod_fortune_oil_1l',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    brand: 'Fortune',
    category: 'Groceries & Staples',
    packSize: '1 L',
    unit: 'L',
  },
  {
    id: 'prod_fortune_oil_5l',
    name: 'Fortune Sunlite Refined Sunflower Oil (Can)',
    brand: 'Fortune',
    category: 'Groceries & Staples',
    packSize: '5 L',
    unit: 'L',
  },
  {
    id: 'prod_india_gate_rice_5kg',
    name: 'India Gate Basmati Rice Feast Rozzana',
    brand: 'India Gate',
    category: 'Groceries & Staples',
    packSize: '5 kg',
    unit: 'kg',
  },
  {
    id: 'prod_nirapara_matta_5kg',
    name: 'Nirapara Vadi Matta Rice (Kerala Special)',
    brand: 'Nirapara',
    category: 'Groceries & Staples',
    packSize: '5 kg',
    unit: 'kg',
  },
  {
    id: 'prod_aashirvaad_atta_5kg',
    name: 'Aashirvaad Superior MP Sharbati Atta',
    brand: 'Aashirvaad',
    category: 'Groceries & Staples',
    packSize: '5 kg',
    unit: 'kg',
  },
  {
    id: 'prod_red_label_500g',
    name: 'Brooke Bond Red Label Strong Blend Tea',
    brand: 'Brooke Bond',
    category: 'Groceries & Staples',
    packSize: '500 g',
    unit: 'g',
  },
  {
    id: 'prod_klf_coconut_oil_1l',
    name: 'KLF Coconad 100% Pure Coconut Oil',
    brand: 'KLF',
    category: 'Groceries & Staples',
    packSize: '1 L',
    unit: 'L',
  },
  {
    id: 'prod_eastern_sambar_200g',
    name: 'Eastern Sambar Powder Premium Spices',
    brand: 'Eastern',
    category: 'Groceries & Staples',
    packSize: '200 g',
    unit: 'g',
  },

  // Fresh Fruits & Veggies
  {
    id: 'prod_onion_1kg',
    name: 'Nashik Premium Red Onion',
    brand: 'Farm Fresh',
    category: 'Fresh Fruits & Veggies',
    packSize: '1 kg',
    unit: 'kg',
  },
  {
    id: 'prod_tomato_1kg',
    name: 'Kerala Country Farm Tomatoes (Nadan)',
    brand: 'Farm Fresh',
    category: 'Fresh Fruits & Veggies',
    packSize: '1 kg',
    unit: 'kg',
  },
  {
    id: 'prod_banana_robusta_1kg',
    name: 'Robusta Green Sweet Bananas',
    brand: 'Farm Fresh',
    category: 'Fresh Fruits & Veggies',
    packSize: '1 kg',
    unit: 'kg',
  },
  {
    id: 'prod_apple_shimla_1kg',
    name: 'Shimla Royal Delicious Red Apples',
    brand: 'Fresh Orchard',
    category: 'Fresh Fruits & Veggies',
    packSize: '1 kg',
    unit: 'kg',
  },

  // Personal Care
  {
    id: 'prod_dettol_soap_3pack',
    name: 'Dettol Original Germ Protection Soap Bar (125g x 3)',
    brand: 'Dettol',
    category: 'Personal Care',
    packSize: '375 g',
    unit: 'g',
  },
  {
    id: 'prod_head_shoulders_650ml',
    name: 'Head & Shoulders Smooth & Silky Anti-Dandruff Shampoo',
    brand: 'Head & Shoulders',
    category: 'Personal Care',
    packSize: '650 ml',
    unit: 'ml',
  },
  {
    id: 'prod_colgate_toothpaste_500g',
    name: 'Colgate Strong Teeth Calcium Boost (Pack of 2 x 250g)',
    brand: 'Colgate',
    category: 'Personal Care',
    packSize: '500 g',
    unit: 'g',
  },

  // Home & Cleaning
  {
    id: 'prod_surf_excel_3kg',
    name: 'Surf Excel Easy Wash Detergent Powder',
    brand: 'Surf Excel',
    category: 'Home & Cleaning',
    packSize: '3 kg',
    unit: 'kg',
  },
  {
    id: 'prod_vim_gel_750ml',
    name: 'Vim Lemon Dishwash Liquid Gel Refill Pouch',
    brand: 'Vim',
    category: 'Home & Cleaning',
    packSize: '750 ml',
    unit: 'ml',
  },
  {
    id: 'prod_harpic_1l',
    name: 'Harpic Power Plus Disinfectant Toilet Cleaner',
    brand: 'Harpic',
    category: 'Home & Cleaning',
    packSize: '1 L',
    unit: 'L',
  },

  // Electronics & Appliances
  {
    id: 'prod_samsung_tv_55',
    name: 'Samsung 55" Crystal 4K UHD Smart LED TV (2024 Model)',
    brand: 'Samsung',
    category: 'Electronics & Appliances',
    packSize: '1 Unit',
    unit: 'unit',
  },
  {
    id: 'prod_lg_washing_machine_7kg',
    name: 'LG 7kg 5-Star Inverter Front Load Washing Machine with Steam',
    brand: 'LG',
    category: 'Electronics & Appliances',
    packSize: '1 Unit',
    unit: 'unit',
  },
  {
    id: 'prod_preethi_zodiac_750w',
    name: 'Preethi Zodiac MG 218 750W Mixer Grinder (5 Jars)',
    brand: 'Preethi',
    category: 'Electronics & Appliances',
    packSize: '1 Unit',
    unit: 'unit',
  },
  {
    id: 'prod_philips_airfryer',
    name: 'Philips Daily Collection 4.1L Digital Rapid Air Fryer',
    brand: 'Philips',
    category: 'Electronics & Appliances',
    packSize: '1 Unit',
    unit: 'unit',
  },
];

export const INITIAL_LISTINGS: StoreListing[] = [
  // Fortune Sunflower Oil 1L
  {
    id: 'list_oil1l_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_fortune_oil_1l',
    listedPriceMinor: 15500, // ₹155
    offerPriceMinor: 13900,  // ₹139
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-20',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_oil1l_reliance',
    storeId: 'store_reliance_kakkanad',
    productId: 'prod_fortune_oil_1l',
    listedPriceMinor: 15500,
    offerPriceMinor: 14200,  // ₹142
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-18',
    validUntil: '2026-10-30',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_oil1l_bismi',
    storeId: 'store_bismi_vyttila',
    productId: 'prod_fortune_oil_1l',
    listedPriceMinor: 15500,
    offerPriceMinor: 13500,  // ₹135 (Best price)
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-21',
    validUntil: '2026-10-28',
    priceCheckedAt: '2026-10-23',
  },

  // Fortune Sunflower Oil 5L
  {
    id: 'list_oil5l_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_fortune_oil_5l',
    listedPriceMinor: 75000, // ₹750
    offerPriceMinor: 64900,  // ₹649
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-20',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_oil5l_bismi',
    storeId: 'store_bismi_vyttila',
    productId: 'prod_fortune_oil_5l',
    listedPriceMinor: 75000,
    offerPriceMinor: 62900,  // ₹629
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-21',
    validUntil: '2026-10-28',
    priceCheckedAt: '2026-10-23',
  },

  // India Gate Basmati Rice 5kg
  {
    id: 'list_basmati_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_india_gate_rice_5kg',
    listedPriceMinor: 49500, // ₹495
    offerPriceMinor: 39900,  // ₹399
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_basmati_reliance',
    storeId: 'store_reliance_kakkanad',
    productId: 'prod_india_gate_rice_5kg',
    listedPriceMinor: 49500,
    offerPriceMinor: 41500,  // ₹415
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-18',
    validUntil: '2026-10-30',
    priceCheckedAt: '2026-10-23',
  },

  // Nirapara Matta Rice 5kg
  {
    id: 'list_matta_supplyco',
    storeId: 'store_supplyco_mgroad',
    productId: 'prod_nirapara_matta_5kg',
    listedPriceMinor: 26000, // ₹260
    offerPriceMinor: 21500,  // ₹215 (Subsidy/Govt store)
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-01',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_matta_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_nirapara_matta_5kg',
    listedPriceMinor: 26000,
    offerPriceMinor: 22800,  // ₹228
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },

  // Brooke Bond Red Label Tea 500g
  {
    id: 'list_tea_bismi',
    storeId: 'store_bismi_vyttila',
    productId: 'prod_red_label_500g',
    listedPriceMinor: 27000, // ₹270
    offerPriceMinor: 21900,  // ₹219
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-20',
    validUntil: '2026-10-28',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_tea_reliance',
    storeId: 'store_reliance_kakkanad',
    productId: 'prod_red_label_500g',
    listedPriceMinor: 27000,
    offerPriceMinor: 22500,  // ₹225
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-18',
    validUntil: '2026-10-30',
    priceCheckedAt: '2026-10-23',
  },

  // KLF Pure Coconut Oil 1L
  {
    id: 'list_coconutoil_supplyco',
    storeId: 'store_supplyco_mgroad',
    productId: 'prod_klf_coconut_oil_1l',
    listedPriceMinor: 24000, // ₹240
    offerPriceMinor: 19500,  // ₹195
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-01',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_coconutoil_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_klf_coconut_oil_1l',
    listedPriceMinor: 24000,
    offerPriceMinor: 20500,  // ₹205
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },

  // Fresh Fruits & Veggies
  {
    id: 'list_onion_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_onion_1kg',
    listedPriceMinor: 4800,  // ₹48
    offerPriceMinor: 3800,   // ₹38
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-22',
    validUntil: '2026-10-26',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_onion_dailyfresh',
    storeId: 'store_dailyfresh_aluva',
    productId: 'prod_onion_1kg',
    listedPriceMinor: 4800,
    offerPriceMinor: 3500,   // ₹35
    currency: 'INR',
    sourceType: 'demo',
    verificationStatus: 'demo',
    validFrom: '2026-10-22',
    validUntil: '2026-10-26',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_tomato_reliance',
    storeId: 'store_reliance_kakkanad',
    productId: 'prod_tomato_1kg',
    listedPriceMinor: 4200,  // ₹42
    offerPriceMinor: 2900,   // ₹29
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-22',
    validUntil: '2026-10-26',
    priceCheckedAt: '2026-10-23',
  },

  // Personal Care
  {
    id: 'list_dettol_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_dettol_soap_3pack',
    listedPriceMinor: 16500, // ₹165
    offerPriceMinor: 13500,  // ₹135
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_head_shoulders_bismi',
    storeId: 'store_bismi_vyttila',
    productId: 'prod_head_shoulders_650ml',
    listedPriceMinor: 65000, // ₹650
    offerPriceMinor: 49900,  // ₹499
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-20',
    validUntil: '2026-10-28',
    priceCheckedAt: '2026-10-23',
  },

  // Home & Cleaning
  {
    id: 'list_surf_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_surf_excel_3kg',
    listedPriceMinor: 43500, // ₹435
    offerPriceMinor: 34900,  // ₹349
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_vim_reliance',
    storeId: 'store_reliance_kakkanad',
    productId: 'prod_vim_gel_750ml',
    listedPriceMinor: 15500, // ₹155
    offerPriceMinor: 12400,  // ₹124
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-18',
    validUntil: '2026-10-30',
    priceCheckedAt: '2026-10-23',
  },

  // Electronics & Appliances
  {
    id: 'list_tv_nandilath',
    storeId: 'store_nandilath_edappally',
    productId: 'prod_samsung_tv_55',
    listedPriceMinor: 5490000, // ₹54,900
    offerPriceMinor: 4199000,  // ₹41,990
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_tv_pittappillil',
    storeId: 'store_pittappillil_kakkanad',
    productId: 'prod_samsung_tv_55',
    listedPriceMinor: 5490000,
    offerPriceMinor: 4249000,  // ₹42,490
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_washing_machine_pittappillil',
    storeId: 'store_pittappillil_kakkanad',
    productId: 'prod_lg_washing_machine_7kg',
    listedPriceMinor: 3899000, // ₹38,990
    offerPriceMinor: 2999000,  // ₹29,990
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
  {
    id: 'list_airfryer_lulu',
    storeId: 'store_lulu_edappally',
    productId: 'prod_philips_airfryer',
    listedPriceMinor: 999500,  // ₹9,995
    offerPriceMinor: 679900,   // ₹6,799
    currency: 'INR',
    sourceType: 'retailer',
    verificationStatus: 'verified',
    validFrom: '2026-10-15',
    validUntil: '2026-10-31',
    priceCheckedAt: '2026-10-23',
  },
];

/**
 * Return all enriched listings combining product, store, locality, and calculated savings.
 * Automatically injects any approved brochure items from localStorage if available.
 */
export function getEnrichedListings(extraListings: StoreListing[] = []): EnrichedListing[] {
  const storeMap = new Map<string, Store>(STORES.map((s) => [s.id, s]));
  const productMap = new Map<string, Product>(PRODUCTS.map((p) => [p.id, p]));
  const localityMap = new Map<string, Locality>(LOCALITIES.map((l) => [l.id, l]));

  const allListings = [...INITIAL_LISTINGS, ...extraListings];
  const enriched: EnrichedListing[] = [];

  for (const listing of allListings) {
    const store = storeMap.get(listing.storeId);
    const product = productMap.get(listing.productId);
    if (!store || !product) continue;
    const locality = localityMap.get(store.localityId) || LOCALITIES[0];

    const discountPercent = calculateDiscount(listing.listedPriceMinor, listing.offerPriceMinor);
    const savingsMinor = listing.offerPriceMinor
      ? Math.max(0, listing.listedPriceMinor - listing.offerPriceMinor)
      : 0;

    enriched.push({
      ...listing,
      store,
      product,
      locality,
      discountPercent,
      savingsMinor,
    });
  }

  return enriched;
}
