# PharmaExchange Backend

AI-powered Pharmaceutical Resource Exchange and Drug Safety Platform — backend API.

## Stack
Node.js, Express, PostgreSQL, Prisma ORM, JWT auth, Cloudinary (images), Resend (email), Groq (LLM insights).

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_*, RESEND_API_KEY, GROQ_API_KEY
npx prisma generate
npx prisma migrate dev --name init
npm run seed            # loads realistic demo data (Nigerian pharmacies, medicines, sales history)
npm run dev              # starts server on PORT from .env (default 5000)
```

Check it's alive: `GET http://localhost:5000/health`

## Demo login credentials (after seeding)

**Pharmacy accounts** (password for all: `password123`):
- greenlifepharmacy@demo.com
- lifecarepharmacy@demo.com
- medpluspharmacy@demo.com
- healthpluspharmacy@demo.com
- citycarepharmacy@demo.com
- goodhealthpharmacy@demo.com
- trustpharmacy@demo.com
- wellcarepharmacy@demo.com

**Consumer accounts** (password: `password123`):
- chidinma@demo.com
- tunde@demo.com

## Route map

| Method | Route | Auth |
|---|---|---|
| POST | /auth/register | none |
| POST | /auth/login | none |
| GET | /dashboard/summary | pharmacy |
| GET | /dashboard/inventory-status | pharmacy |
| GET | /inventory | pharmacy |
| POST | /inventory | pharmacy |
| PATCH | /inventory/:id | pharmacy |
| DELETE | /inventory/:id | pharmacy |
| POST | /inventory/:id/image | pharmacy |
| GET | /transfers/available | pharmacy |
| POST | /transfers | pharmacy |
| POST | /transfers/:id/request | pharmacy |
| GET | /transfer-requests?direction=incoming\|outgoing | pharmacy |
| PATCH | /transfer-requests/:id | pharmacy |
| GET | /insights | pharmacy |
| POST | /insights/generate | pharmacy |
| GET | /alerts | pharmacy |
| PATCH | /alerts/:id/read | pharmacy |
| GET | /pharmacies | optional |
| GET | /pharmacies/nearby?lat=&lng=&radiusKm= | optional |
| POST | /medicines/:id/image | pharmacy |
| POST | /consumer/auth/register | none |
| POST | /consumer/auth/login | none |
| GET | /consumer/search?medicine=&city=&state=&lat=&lng= | none |
| GET | /consumer/medicines/:id/availability?lat=&lng= | none |

All pharmacy-auth routes expect `Authorization: Bearer <token>` from `/auth/login`.

## Notes / known limitations (intentional, for hackathon scope)
- No KYC/verification flow for pharmacies — auto-verified on register.
- No payment processing — "purchase/transfer" is a status change, no real money moves.
- Geolocation uses Haversine distance in JS, not PostGIS — fine at this data scale.
- LLM insights use Groq (free tier, OpenAI-compatible) — swap provider in `src/lib/llm.js` only.
- `src/jobs/expiryCheck.job.js` runs once on server boot (so demo data looks "alive" immediately) and then daily at 1am via cron.
