"use client";

import TopBar from "@/components/layout/TopBar";
import { useEffect, useState } from "react";
import { pharmaciesApi } from "@/lib/api";

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pharmaciesApi
      .list({ limit: 50 })
      .then((res) => setPharmacies(res.pharmacies || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar title="Partner Pharmacies" subtitle="Verified pharmacy partners" />
      <main className="p-6">
        <div className="bg-white rounded-xl border p-5">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : pharmacies.length === 0 ? (
            <p className="text-sm text-gray-500">No partner pharmacies found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pharmacies.map((p) => (
                <div key={p.id} className="border rounded-xl p-4 bg-gray-50">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.city}, {p.state}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
