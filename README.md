# LookMyDeals — Local In-Store Shopping Discovery & Deals | Kochi, Kerala

**LookMyDeals** is a hyper-local offline shopping discovery, weekly circular viewer, and SKU-level price comparison platform designed for Kochi, Kerala. It bridges physical supermarket promotions with smart consumers planning their offline grocery and home shopping trips.

---

## 📌 Project Overview

### The Problem It Solves
In urban and semi-urban markets across India, over **85% of grocery, FMCG, and home retail transactions take place offline** in physical supermarkets and department stores. Retailers spend substantial budgets printing physical circulars, promotional newspapers, and flyers to advertise weekly deals. 

However, shoppers have no digital way to search and compare in-store product prices across neighborhood stores before stepping out:
- **Quick-commerce apps** force high delivery markups and lack physical in-store catalog visibility.
- **Dining and cashback apps** focus on bill discounts or food vouchers rather than item-level supermarket savings.
- **Retailers face high friction**: Multi-aisle supermarkets cannot afford tedious manual data entry or complex POS integrations to digitize weekly offers.

### What LookMyDeals Does
LookMyDeals solves this gap by turning offline print circulars into an interactive, digital shopping companion:
1. **Interactive Weekly Flyers**: Shoppers can browse official weekly circulars (from supermarkets like LuLu Hypermarket and Smart Bazaar) with clickable visual product hotspots and crop previews.
2. **SKU-Level Price Comparison**: Shoppers can search specific products (e.g., *Fortune Sunflower Oil 5L*, *Aachi Sambar Powder 100g*) and compare verified in-store prices across neighborhood stores.
3. **Offline Trip Planner (Reminder Cart)**: Shoppers assemble a shopping list with price snapshots and estimated savings before visiting the store.
4. **Deal Claims & Brochure Coupons**: Shoppers claim store-issued promotional discount codes to redeem at store checkout.
5. **Customer Offer Requests**: Shoppers can request discounts or check availability for unlisted items; local retailers can review requests and directly respond via WhatsApp or SMS.
6. **Zero-Friction AI Digitization**: Retailers upload standard flyer images or PDFs; AI vision extracts products, prices, and crop coordinates in seconds for merchant review and publishing.

---

## 💡 The Core Idea & Innovations

- **AI-Powered Flyer Ingestion (OpenAI Vision)**: Eliminates manual data entry. Retailers simply drag and drop print brochures. The platform extracts product names, categories, brands, pack sizes, regular prices, and offer prices while calculating exact bounding boxes for product images.
- **Human-in-the-Loop Quality Control**: Extracted listings remain in a "Needs Review" state until the store manager validates, edits, and explicitly publishes them, preventing hallucinations or pricing errors.
- **Granular Pack-Size Matching**: Strictly differentiates pack sizes (e.g., 1L vs 5L cooking oil; 500g vs 5kg rice) to prevent misleading price comparisons.
- **Offline Shopping Trip Planner**: A resilient client-side cart that operates completely offline, tracks total estimated savings, and provides transparent shopping lists.
- **Direct Merchant-Customer Communication**: Facilitates 1-on-1 customer request resolution using direct WhatsApp and SMS integration protocols.

---

## 🛠️ Technology Stack & Tools

### Frontend
- **React 18**: Component-driven user interface with hooks and modular state management.
- **TypeScript**: Static typing across all components, API interfaces, and data models.
- **Vite**: Modern front-end build tool and lightning-fast development server.
- **Tailwind CSS**: Utility-first styling framework implementing a clean, responsive, and mobile-first design system.
- **Lucide React**: Clean, accessible, and consistent SVG icon library.
- **PDF.js (`pdfjs-dist`)**: Client-side parsing and rendering of multi-page PDF store flyers.

### Backend & API
- **Node.js**: Asynchronous event-driven JavaScript runtime environment.
- **Express**: Lightweight web framework handling REST endpoints, session cookies, and proxy routes.
- **TSX**: High-performance TypeScript execution engine for Node.js.
- **Zod**: Declarative, runtime schema validation for API payloads, AI extraction outputs, and storage integrity.
- **Multer**: Streaming multipart form-data parser with file size enforcement and memory buffering.

### Database & Persistence
- **MySQL**: Relational database managing stores, products, listings, brochures, extracted candidate items, coupon codes, and customer requests.
- **mysql2/promise**: High-performance MySQL client with connection pooling and async/await support.
- **SQL Migration Runner**: Versioned schema migrations (`backend/sql/`) ensuring reproducible database state.
- **Browser LocalStorage**: Versioned client-side storage (`lmd.cart.v1`) for the Reminder Cart with auto-recovery from corrupted states.

### AI & External Integrations
- **OpenAI Vision API (`gpt-4o`)**: Vision intelligence utilizing structured JSON Schema constraints to parse printed promotional circulars and identify merchandise bounding boxes.
- **SerpApi (Google Shopping API)**: Optional external fallback search providing broader web market price comparisons when local store deals are unavailable.
- **WhatsApp & SMS Web Intents**: Native URI schemes (`https://wa.me/` and `sms:`) enabling store managers to contact shoppers with validated 10-digit phone numbers without third-party messaging costs.

### Testing & Code Quality
- **Vitest**: Fast, Vite-native testing framework for unit and integration suites.
- **React Testing Library**: Component testing ensuring accessible and resilient user interactions.

---

## 📍 Covered Localities (Kochi, Kerala)

The catalog is geographically scoped to Kochi's major retail hubs:
- **Edappally** (PIN: 682024) — LuLu International Shopping Mall & Toll Junction
- **Kakkanad** (PIN: 682030) — Infopark & Seaport-Airport Road
- **MG Road** (PIN: 682016) — Ernakulam South & Shenoys Junction
- **Vyttila** (PIN: 682019) — Mobility Hub & NH 66 Bypass
- **Aluva** (PIN: 682101) — Metro Terminal & Market Road

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** `v20.x` or later (tested on Node v24.x)
- **npm** `v10.x` or later
- **MySQL Server** (e.g., via XAMPP, Docker, or native service)

### 2. Installation & Setup
```bash
# Clone the repository
git clone <repo-url>
cd LookMyDeals

# Install project dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### 3. Environment Configuration (`.env`)
Configure your database and optional API keys in the root `.env` file:
```env
# Database Configuration (XAMPP defaults)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=lookmydeals
DB_USER=root
DB_PASSWORD=

# Optional AI & External Search Integrations
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
SERPAPI_KEY=your_serpapi_key_here

# Retailer Demo Password
DEMO_LULU_PASSWORD=lulu@123
```

### 4. Database Initialization
Ensure your MySQL server is running and the database specified in `DB_NAME` exists. Then run:
```bash
# Run schema migrations
npm run db:migrate

# Seed baseline Kochi stores, categories, and sample products
npm run db:seed
```

### 5. Running the Application
You can run both frontend and backend concurrently or independently:

```bash
# Run both frontend and backend concurrently
npm run dev:all

# Or run separately:
# Frontend (http://localhost:5173)
npm run dev

# Backend API (http://localhost:3001)
npm run server
```

---

## 🔑 Demo Access & Portals

- **Shopper Web Experience**: `http://localhost:5173/`
  - Search deals, browse categories, switch Kochi localities, view LuLu and Smart Bazaar weekly flyers, and build an offline shopping cart.
- **Public Store Circulars**: `http://localhost:5173/brochure/store_lulu_edappally`
  - View published weekly circulars, interactive visual flyers, and extracted deal crops.
- **Retailer Management Dashboard**: `http://localhost:5173/retailer`
  - **Username**: `lulu`
  - **Password**: `lulu@123` (or the value set in `DEMO_LULU_PASSWORD`)
  - Features: Upload new flyers, review and publish extracted deals, allot brochure and product coupon codes, and reply to customer enquiries via WhatsApp or SMS.

---

## 🧪 Testing & Verification

Automated test suites verify price calculations, currency formatting, cart persistence, and corruption recovery:

```bash
# Run unit test suite
npm run test

# Run full TypeScript check and production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🔒 Security & Data Integrity Principles

- **Zero Client Secrets**: Sensitive keys (`OPENAI_API_KEY`, `SERPAPI_KEY`) reside strictly on the server and are never exposed to browser bundles.
- **DPDP Act Compliance**: Customer contact numbers are validated, formatted, and strictly masked in public feeds (`98•••••345`) to protect shopper privacy.
- **Strict Input Validation**: All upload inputs, candidate extractions, and queries pass through schema validation using Zod.
- **Prompt Injection Defense**: Text extracted from raw flyers is treated as untrusted data and strictly parsed through constrained JSON schemas before display.
- **Human-in-the-Loop**: No AI-extracted promotion enters the public catalog until verified and approved by the store retailer.
