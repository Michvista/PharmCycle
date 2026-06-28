const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("PharmaCycle.AI_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("PharmaCycle.AI_token", token);
  else localStorage.removeItem("PharmaCycle.AI_token");
}

export function getStoredAuth() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("PharmaCycle.AI_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      token: string;
      user?: { id: string; name: string; email: string; role: string };
      pharmacy?: { id: string; name: string; city: string; state: string };
      consumer?: {
        id: string;
        name: string;
        email: string;
        city?: string;
        state?: string;
      };
      accountType: "pharmacy" | "consumer";
    };
  } catch {
    return null;
  }
}

export function setStoredAuth(data: ReturnType<typeof getStoredAuth>) {
  if (typeof window === "undefined") return;
  if (data) {
    localStorage.setItem("PharmaCycle.AI_auth", JSON.stringify(data));
    setToken(data.token);
  } else {
    localStorage.removeItem("PharmaCycle.AI_auth");
    setToken(null);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.error || res.statusText || "Request failed",
      res.status,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  loginPharmacy: (email: string, password: string) =>
    request<{
      token: string;
      user: { id: string; name: string; email: string; role: string };
      pharmacy: { id: string; name: string; city: string; state: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  registerPharmacy: (data: {
    pharmacyName: string;
    address?: string;
    city: string;
    state: string;
    name: string;
    email: string;
    password: string;
  }) =>
    request<{
      token: string;
      user: { id: string; name: string; email: string; role: string };
      pharmacy: { id: string; name: string; city: string; state: string };
    }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  forgotPasswordPharmacy: (email: string) =>
    request<{ message: string; resetToken: string; resetUrl: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPasswordPharmacy: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  loginConsumer: (email: string, password: string) =>
    request<{
      token: string;
      consumer: {
        id: string;
        name: string;
        email: string;
        city?: string;
        state?: string;
      };
    }>("/consumer/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  registerConsumer: (data: {
    name: string;
    email: string;
    password: string;
    city?: string;
    state?: string;
  }) =>
    request<{
      token: string;
      consumer: {
        id: string;
        name: string;
        email: string;
        city?: string;
        state?: string;
      };
    }>("/consumer/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  forgotPasswordConsumer: (email: string) =>
    request<{ message: string; resetToken: string; resetUrl: string }>("/consumer/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPasswordConsumer: (token: string, password: string) =>
    request<{ message: string }>("/consumer/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  me: () =>
    request<{
      user: { id: string; name: string; email: string; role: string };
      pharmacy: {
        id: string;
        name: string;
        city: string;
        state: string;
        address?: string;
        verified: boolean;
      };
    }>("/auth/me"),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: () =>
    request<{
      totalInventoryItems: number;
      nearExpiryItems: number;
      activeTransfers: number;
      partnerPharmacies: number;
    }>("/dashboard/summary"),
  inventoryStatus: () =>
    request<{
      total: number;
      breakdown: { status: string; count: number; percentage: number }[];
    }>("/dashboard/inventory-status"),
};

// ── Inventory ─────────────────────────────────────────────────────────────────

export type InventoryItem = {
  id: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  batchNumber: string;
  expiryDate: string;
  status: string;
  imageUrl?: string | null;
  medicine: {
    id: string;
    name: string;
    category: string;
    dosageForm: string;
    strength: string;
  };
};

export const inventoryApi = {
  list: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<{
      items: InventoryItem[];
      total: number;
      page: number;
      limit: number;
    }>(`/inventory${qs ? `?${qs}` : ""}`);
  },
  create: (data: Record<string, unknown>) =>
    request<InventoryItem>("/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    request<InventoryItem>(`/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/inventory/${id}`, { method: "DELETE" }),
  lookup: (batch: string) =>
    request<InventoryItem>(
      `/inventory/lookup?batch=${encodeURIComponent(batch)}`,
    ),
  ocrLabel: (image: string, mimeType?: string) =>
    request<{ source: string; extracted: Record<string, string> }>(
      "/inventory/ocr-label",
      {
        method: "POST",
        body: JSON.stringify({ image, mimeType }),
      },
    ),
};

// ── Transfers ─────────────────────────────────────────────────────────────────

export type TransferListing = {
  listingId: string;
  medicineName: string;
  dosageForm: string;
  strength: string;
  imageUrl?: string | null;
  quantity: number;
  originalPrice: number;
  discountPercent: number;
  discountedPrice: number;
  fromPharmacy: { id: string; name: string; city: string; state: string };
};

export const transfersApi = {
  available: (params?: { city?: string; state?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set("city", params.city);
    if (params?.state) q.set("state", params.state);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return request<{ listings: TransferListing[] }>(
      `/transfers/available${qs ? `?${qs}` : ""}`,
    );
  },
  createListing: (
    inventoryItemId: string,
    quantity: number,
    discountPercent?: number,
  ) =>
    request("/transfers", {
      method: "POST",
      body: JSON.stringify({ inventoryItemId, quantity, discountPercent }),
    }),
  request: (listingId: string, quantity: number) =>
    request(`/transfers/${listingId}/request`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }),
};

// ── Transfer Requests ─────────────────────────────────────────────────────────

export type TransferRequest = {
  id: string;
  quantity: number;
  status: string;
  createdAt: string;
  listing?: {
    pharmacy?: { id: string; name: string; city: string; state: string };
    inventoryItem?: {
      medicine: { name: string; dosageForm: string; strength: string };
      sellingPrice: number;
      costPrice: number;
    };
    discountPercent?: number;
  };
  requestingPharmacy?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
};

export const transferRequestsApi = {
  list: (direction: "incoming" | "outgoing" = "incoming", status?: string) => {
    const q = new URLSearchParams({ direction });
    if (status) q.set("status", status);
    return request<{ requests: TransferRequest[]; direction: string }>(
      `/transfer-requests?${q}`,
    );
  },
  summary: () =>
    request<{
      incomingPending: number;
      outgoingTotal: number;
      pending: number;
      inTransit: number;
      completed: number;
      cancelled: number;
      total: number;
    }>("/transfer-requests/summary"),
  update: (id: string, action: "accept" | "reject" | "complete") =>
    request(`/transfer-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),
};

// ── Alerts ────────────────────────────────────────────────────────────────────

export type Alert = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export const alertsApi = {
  list: (read?: boolean) => {
    const q = read !== undefined ? `?read=${read}` : "";
    return request<{ alerts: Alert[] }>(`/alerts${q}`);
  },
  markRead: (id: string) =>
    request<Alert>(`/alerts/${id}/read`, { method: "PATCH" }),
};

// ── Insights ──────────────────────────────────────────────────────────────────

export type AIInsight = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  generatedAt: string;
};

export const insightsApi = {
  list: () => request<{ insights: AIInsight[] }>("/insights"),
  generate: (type: "EXPIRY_RISK" | "DEMAND_FORECAST" | "RESTOCK_SUGGESTION") =>
    request<AIInsight>("/insights/generate", {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const analyticsApi = {
  summary: () =>
    request<{
      inventoryTurnover: number;
      completedTransfers: number;
      partnerPharmacies: number;
      atRiskUnits: number;
      transferSummary: {
        pending: number;
        accepted: number;
        completed: number;
        rejected: number;
      };
      categoryBreakdown: { label: string; count: number }[];
      totalItems: number;
    }>("/analytics/summary"),
};

// ── Pharmacy Profile ──────────────────────────────────────────────────────────

export const pharmacyApi = {
  getProfile: () =>
    request<{
      pharmacy: {
        id: string;
        name: string;
        address: string;
        city: string;
        state: string;
        verified: boolean;
      };
      user: { id: string; name: string; email: string; role: string };
    }>("/pharmacy/profile"),
  updateProfile: (data: Record<string, unknown>) =>
    request("/pharmacy/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ── Consumer Search ───────────────────────────────────────────────────────────

export const consumerApi = {
  search: (medicine: string, city?: string, state?: string) => {
    const q = new URLSearchParams({ medicine });
    if (city) q.set("city", city);
    if (state) q.set("state", state);
    return request<{
      results: {
        inventoryItemId: string;
        medicineName: string;
        dosageForm: string;
        strength: string;
        price: number;
        quantityAvailable: number;
        pharmacy: {
          id: string;
          name: string;
          address: string;
          city: string;
          state: string;
        };
        distanceKm: number | null;
      }[];
      count: number;
    }>(`/consumer/search?${q}`);
  },
};
