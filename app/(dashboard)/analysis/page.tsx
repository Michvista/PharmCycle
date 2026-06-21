"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import DonutChart from "@/components/ui/DonutChart";
import AppIcon from "@/components/ui/AppIcon";
import { analyticsApi } from "@/lib/api";
import { CATEGORY_COLORS } from "@/lib/format";

export default function AnalysisPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof analyticsApi.summary>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.summary()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const categorySegments = (data?.categoryBreakdown || []).map((c, i) => ({
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    value: c.count,
    label: c.label,
  }));

  const total = data?.totalItems || 0;
  const transferSummary = data?.transferSummary;

  return (
    <>
      <TopBar title="Analysis" subtitle="Deep-dive into inventory trends, category performance, and demand patterns." />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading analytics...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<AppIcon name="chart" size={20} className="text-white" />} iconBg="bg-green-500"
                title="Inventory Turnover" value={`${data?.inventoryTurnover || 0}x`} subtitle="Last 90 days" />
              <StatCard icon={<AppIcon name="transfers" size={20} className="text-white" />} iconBg="bg-blue-500"
                title="Completed Transfers" value={String(data?.completedTransfers || 0)} />
              <StatCard icon={<AppIcon name="warning" size={20} className="text-white" />} iconBg="bg-purple-500"
                title="At-Risk Units" value={String(data?.atRiskUnits || 0)} subtitle="Near expiry / expired" />
              <StatCard icon={<AppIcon name="users" size={20} className="text-white" />} iconBg="bg-orange-500"
                title="Partner Pharmacies" value={String(data?.partnerPharmacies || 0)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Inventory by Category</h3>
                {categorySegments.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <DonutChart segments={categorySegments} total={total} centerLabel="Total Items" size={150} />
                    <div className="space-y-2.5 flex-1">
                      {categorySegments.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                          <span className="text-xs text-gray-600 capitalize">{seg.label}</span>
                          <span className="text-xs font-semibold text-gray-900 ml-auto">{seg.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No category data yet</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Transfer Pipeline</h3>
                <div className="space-y-4">
                  {[
                    { label: "Pending", value: transferSummary?.pending || 0, color: "bg-orange-500" },
                    { label: "In Transit", value: transferSummary?.accepted || 0, color: "bg-blue-500" },
                    { label: "Completed", value: transferSummary?.completed || 0, color: "bg-green-500" },
                    { label: "Rejected", value: transferSummary?.rejected || 0, color: "bg-red-500" },
                  ].map((bar) => {
                    const max = Math.max(transferSummary?.pending || 0, transferSummary?.accepted || 0, transferSummary?.completed || 0, transferSummary?.rejected || 0, 1);
                    return (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{bar.label}</span>
                          <span className="font-semibold">{bar.value}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${(bar.value / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
