"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import Badge from "@/components/ui/Badge";
import AppIcon from "@/components/ui/AppIcon";
import { useToast } from "@/contexts/ToastContext";
import { inventoryApi, transfersApi, type InventoryItem, type TransferListing } from "@/lib/api";
import { formatNaira } from "@/lib/format";

export default function TransfersPage() {
  const [listings, setListings] = useState<TransferListing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [showOffer, setShowOffer] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [offerForm, setOfferForm] = useState({ inventoryItemId: "", quantity: "", discountPercent: "10" });
  const { success: toastSuccess, error: toastError } = useToast();

  function load() {
    setLoading(true);
    transfersApi.available({ search: search || undefined })
      .then((res) => setListings(res.listings))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRequest(listingId: string, maxQty: number) {
    const qty = prompt(`How many units? (max ${maxQty})`, String(Math.min(maxQty, 10)));
    if (!qty) return;
    setRequesting(listingId);
    try {
      await transfersApi.request(listingId, Number(qty));
      toastSuccess("Transfer request sent!");
      load();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRequesting(null);
    }
  }

  async function openOfferModal() {
    const res = await inventoryApi.list({ limit: 50 });
    setInventory(res.items.filter((i) => i.quantity > 0));
    setShowOffer(true);
  }

  async function handleOffer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await transfersApi.createListing(offerForm.inventoryItemId, Number(offerForm.quantity), Number(offerForm.discountPercent));
      setShowOffer(false);
      toastSuccess("Medicine listed for transfer!");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create listing");
    }
  }

  return (
    <>
      <TopBar title="Transfers" subtitle="Find, request and manage medicine transfers between pharmacies." />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <AppIcon name="search" size={20} className="text-green-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Find Medicines</h3>
            <p className="text-xs text-gray-500 mb-4">Search available transfer listings from partner pharmacies.</p>
            <button onClick={load} className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-semibold cursor-pointer">Refresh Listings →</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <AppIcon name="send" size={20} className="text-blue-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Request Transfer</h3>
            <p className="text-xs text-gray-500 mb-4">Click &quot;Request&quot; on any listing below.</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <AppIcon name="price" size={20} className="text-purple-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Offer Medicines</h3>
            <p className="text-xs text-gray-500 mb-4">List your excess or near-expiry stock.</p>
            <button onClick={openOfferModal} className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold cursor-pointer">Offer Now →</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex-1 min-w-[160px]">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                <AppIcon name="search" size={14} className="text-gray-400" />
                <input type="text" placeholder="Search medicine name..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="bg-transparent border-none outline-none text-xs w-full" />
              </div>
            </div>
            <button onClick={load} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs cursor-pointer">Search</button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading...</p>
          ) : listings.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No listings available</p>
          ) : (
            <div className="space-y-3">
              {listings.map((med) => (
                <div key={med.listingId} className="flex flex-wrap items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-sm font-semibold text-gray-900">{med.medicineName} {med.strength}</h4>
                    <p className="text-xs text-gray-400">{med.dosageForm} · {med.fromPharmacy.name}, {med.fromPharmacy.city}</p>
                  </div>
                  <div className="text-sm text-gray-600">{med.quantity} units</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatNaira(med.discountedPrice)}
                    <span className="text-red-500 text-xs ml-1">-{med.discountPercent}%</span>
                  </div>
                  <Badge variant="excess-stock">Available</Badge>
                  <button
                    onClick={() => handleRequest(med.listingId, med.quantity)}
                    disabled={requesting === med.listingId}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {requesting === med.listingId ? "Sending..." : "Request Transfer"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showOffer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleOffer} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-bold">List Medicine for Transfer</h3>
            <select required value={offerForm.inventoryItemId} onChange={(e) => setOfferForm({ ...offerForm, inventoryItemId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Select inventory item</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>{i.medicine.name} — {i.quantity} units</option>
              ))}
            </select>
            <input required type="number" placeholder="Quantity to list" value={offerForm.quantity}
              onChange={(e) => setOfferForm({ ...offerForm, quantity: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="number" placeholder="Discount %" value={offerForm.discountPercent}
              onChange={(e) => setOfferForm({ ...offerForm, discountPercent: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowOffer(false)} className="flex-1 py-2 border rounded-lg text-sm cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm cursor-pointer">List</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
