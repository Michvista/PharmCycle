// ... existing top of lib/api.ts remains unchanged above this insertion

export const pharmaciesApi = {
  list: (params?: { city?: string; state?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set("city", params.city);
    if (params?.state) q.set("state", params.state);
    if (params?.search) q.set("search", params.search);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<{
      pharmacies: { id: string; name: string; city: string; state: string; address?: string }[];
      total: number;
      page: number;
      limit: number;
    }>(`/pharmacies${qs ? `?${qs}` : ""}`);
  },
  nearby: (lat: number, lng: number, radiusKm = 25) =>
    request<{ pharmacies: { id: string; name: string; city: string; state: string; distanceKm?: number | null }[] }>(
      `/pharmacies/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`,
    ),
};

// ... rest of lib/api.ts continues unchanged below this insertion
