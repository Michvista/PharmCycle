/**
 * Integration test for all PharmaExchange API endpoints.
 * Run: node scripts/test-api.js
 * Requires: backend .env saved, DB migrated + seeded, server running OR auto-starts checks against BASE_URL
 */
require('dotenv').config();

const BASE = process.env.TEST_API_URL || `http://localhost:${process.env.PORT || 5000}`;
const DEMO_EMAIL = 'greenlifepharmacy@demo.com';
const DEMO_PASSWORD = 'password123';

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, { token, body, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (expectStatus && res.status !== expectStatus) {
    throw new Error(`${method} ${path} → ${res.status} (expected ${expectStatus}): ${typeof data === 'object' ? data?.error || JSON.stringify(data).slice(0, 120) : data}`);
  }
  if (!expectStatus && res.status >= 400) {
    throw new Error(`${method} ${path} → ${res.status}: ${typeof data === 'object' ? data?.error || JSON.stringify(data).slice(0, 120) : data}`);
  }
  return { status: res.status, data };
}

async function main() {
  console.log('\nPharmaExchange API Integration Test');
  console.log('Target:', BASE);
  console.log('─'.repeat(50));

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL not loaded. Save pharmaexchange-backend/.env and try again.\n');
    process.exit(1);
  }

  let token;
  let listingId;
  let inventoryItemId;
  let alertId;

  try {
    const health = await req('GET', '/health');
    pass('GET /health', health.data?.status);
  } catch (e) {
    fail('GET /health', e.message);
    console.error('\n❌ Backend not reachable. Run: cd pharmaexchange-backend && npm run dev\n');
    process.exit(1);
  }

  try {
    const login = await req('POST', '/auth/login', {
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    token = login.data.token;
    pass('POST /auth/login', login.data.pharmacy?.name);
  } catch (e) {
    fail('POST /auth/login', e.message);
    console.error('\n❌ Login failed. Run: npm run seed (after prisma migrate)\n');
    process.exit(1);
  }

  const authed = [
    ['GET /auth/me', () => req('GET', '/auth/me', { token })],
    ['GET /dashboard/summary', () => req('GET', '/dashboard/summary', { token })],
    ['GET /dashboard/inventory-status', () => req('GET', '/dashboard/inventory-status', { token })],
    ['GET /inventory', () => req('GET', '/inventory?limit=5', { token })],
    ['GET /transfers/available', () => req('GET', '/transfers/available', { token })],
    ['GET /transfer-requests', () => req('GET', '/transfer-requests?direction=incoming', { token })],
    ['GET /transfer-requests/summary', () => req('GET', '/transfer-requests/summary', { token })],
    ['GET /alerts', () => req('GET', '/alerts', { token })],
    ['GET /insights', () => req('GET', '/insights', { token })],
    ['GET /analytics/summary', () => req('GET', '/analytics/summary', { token })],
    ['GET /pharmacy/profile', () => req('GET', '/pharmacy/profile', { token })],
    ['GET /pharmacies', () => req('GET', '/pharmacies', { token })],
    ['GET /medicines', () => req('GET', '/medicines', { token })],
  ];

  for (const [name, fn] of authed) {
    try {
      const res = await fn();
      pass(name, res.data?.total !== undefined ? `${res.data.total} items` : 'ok');
      if (name === 'GET /inventory' && res.data?.items?.[0]) {
        inventoryItemId = res.data.items[0].id;
      }
      if (name === 'GET /alerts' && res.data?.alerts?.[0]) {
        alertId = res.data.alerts[0].id;
      }
      if (name === 'GET /transfers/available' && res.data?.listings?.[0]) {
        listingId = res.data.listings[0].listingId;
      }
    } catch (e) {
      fail(name, e.message);
    }
  }

  // Public consumer search
  try {
    const search = await req('GET', '/consumer/search?medicine=paracetamol');
    pass('GET /consumer/search', `${search.data.count} results`);
  } catch (e) {
    fail('GET /consumer/search', e.message);
  }

  // Batch lookup (may 404 if no batch — that's ok)
  try {
    const inv = await req('GET', '/inventory?limit=1', { token });
    const batch = inv.data?.items?.[0]?.batchNumber;
    if (batch) {
      await req('GET', `/inventory/lookup?batch=${encodeURIComponent(batch)}`, { token });
      pass('GET /inventory/lookup', `batch ${batch}`);
    } else {
      pass('GET /inventory/lookup', 'skipped (no inventory)');
    }
  } catch (e) {
    fail('GET /inventory/lookup', e.message);
  }

  // AI generate (optional — needs GROQ_API_KEY)
  if (process.env.GROQ_API_KEY) {
    try {
      await req('POST', '/insights/generate', {
        token,
        body: { type: 'EXPIRY_RISK' },
        expectStatus: 201,
      });
      pass('POST /insights/generate', 'EXPIRY_RISK');
    } catch (e) {
      fail('POST /insights/generate', e.message);
    }
  } else {
    pass('POST /insights/generate', 'skipped (no GROQ_API_KEY)');
  }

  // Mark alert read
  if (alertId) {
    try {
      await req('PATCH', `/alerts/${alertId}/read`, { token });
      pass('PATCH /alerts/:id/read', alertId.slice(0, 8));
    } catch (e) {
      fail('PATCH /alerts/:id/read', e.message);
    }
  }

  // Profile patch (non-destructive)
  try {
    await req('PATCH', '/pharmacy/profile', {
      token,
      body: { name: 'GreenLife Admin' },
    });
    pass('PATCH /pharmacy/profile', 'ok');
  } catch (e) {
    fail('PATCH /pharmacy/profile', e.message);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log('─'.repeat(50));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
