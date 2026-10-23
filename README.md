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
grep -rE "sk-|OPENAI_API_KEY|SERPAPI" dist/
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
| **Local Discovery (FR-101..103)** | **Live (In-Memory & Seed)** | Instant sub-50ms filtering by Kochi PIN code and category. |
| **Pack-Size Correctness** | **Live** | 1L and 5L oils / 1kg and 5kg rice are strictly separated. |
| **Reminder Cart (FR-301/302)** | **Live (`localStorage`)** | Versioned key `lmd.cart.v1` with Zod schema parsing & error recovery. |
| **Claim In-Store Deal (FR-401)** | **Live Demo Flow** | Generates CSPRNG voucher codes; honest copy (no simulated WhatsApp). |
| **Request an Offer (FR-402)** | **Live (`localStorage`)** | Shoppers can submit demand requests; viewable in Retailer Portal. |
| **AI Brochure Upload & Review (FR-502/503)** | **Live (Interactive)** | Drag-and-drop PDF/JPG/PNG flyer upload with editable review table. Approved deals immediately enter the shopper feed. |
| **External Web Search (FR-601)** | **Live / Fallback** | Segregated comparative tab. Calls SerpApi if configured; otherwise provides fallback results with mandatory disclaimers. |
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