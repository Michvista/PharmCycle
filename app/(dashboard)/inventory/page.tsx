"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import AppIcon from "@/components/ui/AppIcon";
import { useToast } from "@/contexts/ToastContext";
import { dashboardApi, inventoryApi, type InventoryItem } from "@/lib/api";
import { formatDate, formatNaira, inventoryStatusToBadge } from "@/lib/format";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({ total: 0, lowStock: 0, nearExpiry: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicineName: "", category: "analgesic", dosageForm: "Tablet", strength: "500mg",
    quantity: "", costPrice: "", sellingPrice: "", batchNumber: "", expiryDate: "",
  });
  const { success: toastSuccess, error: toastError } = useToast();

  const statusApiMap: Record<string, string> = {
    "in-stock": "HEALTHY", "low-stock": "LOW_STOCK", "near-expiry": "NEAR_EXPIRY", "out-of-stock": "OUT_OF_STOCK",
  };

  function load() {
    setLoading(true);
    const apiStatus = statusFilter ? statusApiMap[statusFilter] || statusFilter.toUpperCase() : undefined;
    Promise.all([
      inventoryApi.list({ search: search || undefined, status: apiStatus, page, limit: 10 }),
      dashboardApi.inventoryStatus(),
    ])
      .then(([listRes, statusRes]) => {
        setItems(listRes.items);
        setTotal(listRes.total);
        const breakdown = Object.fromEntries(statusRes.breakdown.map((b) => [b.status, b.count]));
        setStats({
          total: statusRes.total,
          lowStock: breakdown.LOW_STOCK || 0,
          nearExpiry: breakdown.NEAR_EXPIRY || 0,
          expired: breakdown.EXPIRED || 0,
        });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryApi.create({
        medicineName: form.medicineName,
        category: form.category,
        dosageForm: form.dosageForm,
        strength: form.strength,
        quantity: Number(form.quantity),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate,
      });
      setShowAdd(false);
      setForm({ medicineName: "", category: "analgesic", dosageForm: "Tablet", strength: "500mg", quantity: "", costPrice: "", sellingPrice: "", batchNumber: "", expiryDate: "" });
      toastSuccess("Medicine added to inventory");
      load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Inventory" subtitle="Manage your medicine stock and track inventory in real-time.">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer">
          + Add Medicine
        </button>
      </TopBar>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard icon={<AppIcon name="package" size={20} className="text-white" />} iconBg="bg-green-500" title="Total Items" value={stats.total.toLocaleString()} />
          <StatCard icon={<AppIcon name="warning" size={20} className="text-white" />} iconBg="bg-orange-500" title="Low Stock Items" value={String(stats.lowStock)} />
          <StatCard icon={<AppIcon name="clock" size={20} className="text-white" />} iconBg="bg-red-500" title="Near Expiry Items" value={String(stats.nearExpiry)} />
          <StatCard icon={<AppIcon name="calendar" size={20} className="text-white" />} iconBg="bg-blue-500" title="Expired Items" value={String(stats.expired)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <AppIcon name="search" size={16} className="text-gray-400 shrink-0" />
                <input type="text" placeholder="Search in inventory..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
                  className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full" />
              </div>
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white cursor-pointer">
              <option value="">All Statuses</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="near-expiry">Near Expiry</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            <button onClick={() => { setPage(1); load(); }}
              className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm cursor-pointer">Search</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Medicine</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">NAFDAC Reg. No.</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Expiry</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">No inventory items found</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{item.medicine.name} {item.medicine.strength}</div>
                        <div className="text-xs text-gray-400">{item.medicine.dosageForm}</div>
                      </td>
                      <td className="px-6 py-4"><Badge variant={item.medicine.category as "analgesic"}>{item.medicine.category}</Badge></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.batchNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatNaira(item.sellingPrice)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.expiryDate)}</td>
                      <td className="px-6 py-4"><Badge variant={inventoryStatusToBadge(item.status)}>{item.status.replace("_", " ")}</Badge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100">
            <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(total / 10))} totalItems={total} itemsPerPage={10} onPageChange={setPage} />
          </div>
        </div>
      </main>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Add Medicine</h3>
            <input required placeholder="Medicine name" value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Strength (500mg)" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
              <input required placeholder="Dosage form" value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input required placeholder="NAFDAC Reg. No. (e.g. A4-1234)" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input required type="number" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
              <input required type="number" placeholder="Cost ₦" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
              <input required type="number" placeholder="Sell ₦" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <input required type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border rounded-lg text-sm cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm cursor-pointer disabled:opacity-50">{saving ? "Adding..." : "Add"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
