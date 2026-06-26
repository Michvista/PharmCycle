# 🌍 PharmaCycle.AI — Nigerian Pharmaceutical Redistribution Platform

PharmaCycle.AI is a peer-to-peer (P2P) pharmaceutical exchange platform designed to reduce medicine waste, optimize pharmacy inventory management, and solve product scarcity across Nigerian healthcare facilities.

By facilitating the secure exchange and redistribution of near-expiry inventory, PharmaCycle.AI saves lives and reduces losses for local community pharmacies.

---

## ✨ Key Features

1. **📷 Google Lens-style Camera Scanner & OCR**:
   - Photograph medicine packaging directly inside the app to auto-fill details (Medicine Name, Strength, Form, Category, etc.).
   - Dual-engine parsing: Utilizes **Google Gemini AI** for advanced semantic recognition with a local **Tesseract.js** client-side fallback if network or API limits are reached.
   - **Max 5 MB file guards** prevent memory overflow on uploads.

2. **🔍 Native QR & Barcode Reader**:
   - Switch the camera viewfinder to **QR & Barcode** scan mode.
   - Leverages browser-native hardware-accelerated **BarcodeDetector API** to detect standard linear barcodes and QR codes in real-time.
   - Audio success feedback (synthesized Web Audio beep) and auto-lookup of existing batch/NAFDAC numbers in inventory.

3. **🇳🇬 NAFDAC Regulatory Compliance**:
   - Uses regional **NAFDAC Reg. No.** nomenclature instead of generic batch numbers, tailoring the validation flow to Nigerian pharmaceutical standards.

4. **💡 AI Insights & Expiry Risk Forecasting**:
   - Real-time charts showing Near-Expiry, Low-Stock, and Out-of-Stock inventory status.
   - Automated AI insights indicating demand spikes (e.g. malaria season fluctuations, dry season shifts) with color-coded positive (Green) and negative (Red) demand forecasts.

5. **💼 Demo Experience Panel**:
   - Clickable credentials block at the login screen for prefilled testing accounts representing both Pharmacies and General Consumers.

6. **📱 Adaptive Mobile Off-Canvas Sidebar**:
   - Fully responsive interface transitioning from a sleek left-aligned sidebar on desktop to a backdrop-blurred hamburger drawer layout on smaller devices.

---

## 🛠 Tech Stack

### Frontend (Next.js Application)

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS v4 (with PostCSS compilation)
- **OCR**: Tesseract.js & Google Gemini API integrations
- **Scanning**: Browser-native `getUserMedia` + `BarcodeDetector` APIs
- **Contexts & Hooks**: Custom React Contexts for Toast & Auth states

### Backend (Node.js REST Server)

- **Runtime**: Node.js & Express
- **Database**: PostgreSQL (hosted on Neon Serverless)
- **ORM**: Prisma Client v5 (with fail-soft re-connection, connection pooling, and 503 error handling middleware)
- **Storage**: Cloudinary & Multer for image hosting
- **API Routing**: JWT Authenticated endpoints for Transfers, Listings, Auth, and Analytics

---

## 🚀 Setup & Execution

### Prerequisites

- Node.js (v18+)
- PostgreSQL instance (or Neon connection URL)

### 1. Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd pharmaexchange-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file containing:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@host/neondb?sslmode=require"
   JWT_SECRET="your-jwt-signing-secret"
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   GEMINI_API_KEY="your-google-gemini-key"
   GROQ_API_KEY="your-groq-api-key"
   ```
4. Run migrations and seed data:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Start backend:
   ```bash
   npm run dev
   ```

### 2. Frontend Configuration

1. Return to the root folder:
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Next.js client development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Safe Pushes

All API credentials, private keys, database connection strings, and backend secrets are strictly encapsulated in `.env` / `.env.local` files, which are ignored by Git. No sensitive configurations are present in source files, making this repository safe to push to public platforms like GitHub.
