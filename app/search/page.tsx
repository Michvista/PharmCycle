"use client";

import { useState } from "react";
import Link from "next/link";
import AppIcon, { LogoIcon } from "@/components/ui/AppIcon";
import { consumerApi } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

export default function ConsumerSearchPage() {
  const { auth, logout } = useAuth();
  const [medicine, setMedicine] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof consumerApi.search>>["results"]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!medicine.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await consumerApi.search(medicine.trim(), city || undefined);
      setResults(res.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const consumer = auth?.accountType === "consumer" ? auth.consumer : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white">
            <LogoIcon size={18} />
          </div>
          <div>
            <div className="font-bold text-gray-900">PharmCycle</div>
            <div className="text-xs text-gray-400">Find medicines near you</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {consumer ? (
            <>
              <span className="text-sm text-gray-600">Hi, {consumer.name}</span>
              <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-green-600 font-semibold">Sign in</Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search for Medicines</h1>
        <p className="text-gray-500 mb-6">Find which pharmacies have your medicine in stock.</p>

        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <AppIcon name="search" size={18} className="text-gray-400" />
            <input required type="text" value={medicine} onChange={(e) => setMedicine(e.target.value)}
              placeholder="e.g. Paracetamol" className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (optional, e.g. Lagos)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-50">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {searched && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No results found. Try a different medicine name.</p>
            ) : (
              results.map((r) => (
                <div key={r.inventoryItemId} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{r.medicineName} {r.strength}</h3>
                      <p className="text-xs text-gray-400">{r.dosageForm}</p>
                      <p className="text-xs text-gray-500 mt-1">{r.pharmacy.name} · {r.pharmacy.city}, {r.pharmacy.state}</p>
                      <p className="text-xs text-gray-400">{r.pharmacy.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">{formatNaira(r.price)}</p>
                      <p className="text-xs text-gray-400">{r.quantityAvailable} available</p>
                      {r.distanceKm !== null && <p className="text-xs text-gray-400">{r.distanceKm} km away</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
