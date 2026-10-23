# LookMyDeals — Local In-Store Shopping Discovery & Deals | Kochi, Kerala

LookMyDeals is a hyper-local offline shopping discovery and price comparison platform tailored for Kochi, Kerala. It bridges physical supermarket promotions (brochures/flyers) with smart shoppers planning their weekly offline shopping trips.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js `v20.x` or later (tested on Node v24.x)
- npm `v10.x` or later

### 2. Setup
```bash
# Clone the repository
git clone <repo-url>
cd LookMyDeals

# Install dependencies
npm install

# Copy environment variables (optional for live AI/SERP integrations)
cp .env.example .env
```

Optional server integrations can be configured in `.env`:
- `SERPAPI_KEY` enables external shopping search.
- `OPENAI_API_KEY` enables brochure image extraction; PDF page rendering is not implemented yet.
- `OPENAI_MODEL` optionally selects the OpenAI model (defaults to `gpt-4o`).

### MySQL Database (XAMPP)

Start the MySQL module in the XAMPP Control Panel and make sure the `lookmydeals` database exists. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in the root `.env` file. The local XAMPP defaults are already listed in `.env.example`.

The schema is managed by the SQL migrations in `backend/sql/`. Apply migrations and seed the demo catalog with:

```bash
npm run db:migrate
npm run db:seed
```

The backend checks its MySQL connection on startup and reports the connection at `GET /api/health`.

The shopper catalog, retailer-approved brochure listings, and offer requests are loaded from and saved to MySQL. The reminder cart and demo deal claims remain browser-local.

### Retailer Demo Login

Open `http://localhost:5173/retailer` and sign in with username `lulu`. Set `DEMO_LULU_PASSWORD` in your local, untracked `.env` file. The demo session is held in backend memory, expires after 8 hours, and is disabled when `NODE_ENV=production`. The dashboard API scopes listings, brochure metrics, and publishing to LuLu Hypermarket in Edappally. Customer requests are filtered by the store's service area because shopper requests are not assigned to a specific retailer.

### 3. Run Locally

#### Run Frontend Dev Server (Vite)
```bash
npm run dev
# App will run at http://localhost:5173
```

#### Run Server Proxy (Express)
```bash
npm run server
# Server will run on http://localhost:3001
```

#### Run Both Concurrently
```bash
npm run dev:all
```

---

## 🧪 Testing & Verification

Run automated test suites covering price formatting, cart persistence, corrupted data recovery, and pack-size correctness:

```bash
npm run test
```

### Run Production Build Verification
```bash
npm run build
npm run preview
```

### Security Secret Audit (lmd-security)
Ensure no secrets were leaked into the frontend bundle:
```bash
grep -rE "sk-|OPENAI_API_KEY|SERPAPI" frontend/dist/
# Output must be completely empty
```

---

## 📍 Covered Localities (Kochi, Kerala)
- **Kakkanad** (PIN: 682030) — Infopark & Seaport-Airport Road
- **Edappally** (PIN: 682024) — LuLu International Mall & Toll Junction
- **MG Road** (PIN: 682016) — Ernakulam South & Shenoys Junction
- **Vyttila** (PIN: 682019) — Mobility Hub & NH 66 Bypass
- **Aluva** (PIN: 682101) — Metro Terminal & Market Road

---

## 📦 Feature Status (Live vs. Demo / Simulated)

| Feature | Implementation Status | Implementation Notes |
| :--- | :--- | :--- |
| **Local Discovery (FR-101..103)** | **Live (MySQL demo catalog)** | Loads stores, products, categories, localities, and listings through the backend API. Prices are demonstrative. |
| **Pack-Size Correctness** | **Live** | 1L and 5L oils / 1kg and 5kg rice are strictly separated. |
| **Reminder Cart (FR-301/302)** | **Live (`localStorage`)** | Versioned key `lmd.cart.v1` with Zod schema parsing & error recovery. |
| **Claim In-Store Deal (FR-401)** | **Live Demo Flow** | Generates CSPRNG voucher codes; honest copy (no simulated WhatsApp). |
| **Request an Offer (FR-402)** | **Live (MySQL)** | Shoppers can submit requests; requests are viewable in Retailer Portal. |
| **AI Brochure Upload & Review (FR-502/503)** | **Partial / optional** | JPEG/PNG extraction requires `OPENAI_API_KEY`; PDF page rendering is not implemented. Candidates need retailer review, category assignment, and explicit approval. |
| **External Web Search (FR-601)** | **Optional** | Calls SerpApi when `SERPAPI_KEY` is configured; otherwise shows a configuration message without inventing web listings. |
| **Server-Side Proxy (Milestone 4)** | **Live (Express)** | Magic-byte checks, CORS, rate limits, and secret isolation. |

---

## 🔒 Security & Privacy Commitments
- **Zero Client Secrets**: All AI (`OPENAI_API_KEY`) and SERP keys are kept strictly on the Node server.
- **DPDP Act Compliance**: Shopper mobile numbers are masked (`98•••••345`) and never logged in plain text or URLs.
- **Prompt Injection Defense**: Brochure text is treated as untrusted data; candidate models are validated against strict Zod schemas.
- **Human-in-the-Loop**: No flyer extraction can appear in the public deal feed until a merchant explicitly approves it.

---

## 📚 Documentation
Detailed specifications and implementation blueprints are located in [LookMyDeals_Project_Docs/](file:///d:/LookMyDeals/LookMyDeals_Project_Docs/README.md):
- [PRD.md](file:///d:/LookMyDeals/LookMyDeals_Project_Docs/PRD.md)
- [IMPLEMENTATION_PLAN.md](file:///d:/LookMyDeals/LookMyDeals_Project_Docs/IMPLEMENTATION_PLAN.md)
- [ARCHITECTURE.md](file:///d:/LookMyDeals/LookMyDeals_Project_Docs/ARCHITECTURE.md)
- [SECURITY.md](file:///d:/LookMyDeals/LookMyDeals_Project_Docs/SECURITY.md)
