"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import AppIcon from "@/components/ui/AppIcon";
import { analyticsApi, dashboardApi, inventoryApi } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";

export default function ReportsPage() {
  const [stats, setStats] = useState({ total: 0, nearExpiry: 0, completed: 0, partners: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.summary(), analyticsApi.summary()])
      .then(([sum, analytics]) => {
        setStats({
          total: sum.totalInventoryItems,
          nearExpiry: sum.nearExpiryItems,
          completed: analytics.completedTransfers,
          partners: sum.partnerPharmacies,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function exportInventory() {
    const res = await inventoryApi.list({ limit: 500 });
    const rows = [
      ["Medicine", "Category", "Batch", "Quantity", "Price", "Expiry", "Status"],
      ...res.items.map((i) => [
        `${i.medicine.name} ${i.medicine.strength}`,
        i.medicine.category,
        i.batchNumber,
        i.quantity,
        i.sellingPrice,
        formatDate(i.expiryDate),
        i.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <TopBar title="Reports" subtitle="Export and review inventory and transfer reports.">
        <button onClick={exportInventory}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold cursor-pointer">
          <AppIcon name="download" size={16} />
          Export Inventory CSV
        </button>
      </TopBar>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<AppIcon name="package" size={20} className="text-white" />} iconBg="bg-green-500" title="Total Inventory" value={stats.total.toLocaleString()} />
              <StatCard icon={<AppIcon name="warning" size={20} className="text-white" />} iconBg="bg-orange-500" title="Near Expiry" value={String(stats.nearExpiry)} />
              <StatCard icon={<AppIcon name="transfers" size={20} className="text-white" />} iconBg="bg-blue-500" title="Completed Transfers" value={String(stats.completed)} />
              <StatCard icon={<AppIcon name="users" size={20} className="text-white" />} iconBg="bg-purple-500" title="Partner Pharmacies" value={String(stats.partners)} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Available Reports</h3>
              <p className="text-sm text-gray-500 mb-4">Download inventory data as CSV for external analysis.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Inventory Report</p>
                    <p className="text-xs text-gray-400">All medicines, batches, quantities, prices</p>
                  </div>
                  <button onClick={exportInventory} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold cursor-pointer">
                    Download
                  </button>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between opacity-60">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Transfer Report</p>
                    <p className="text-xs text-gray-400">View on Transfer Requests page</p>
                  </div>
                  <span className="text-xs text-gray-400">In-app</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
