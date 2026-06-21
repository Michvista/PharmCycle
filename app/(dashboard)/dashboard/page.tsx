"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import DonutChart from "@/components/ui/DonutChart";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  alertsApi,
  dashboardApi,
  insightsApi,
  transfersApi,
  type AIInsight,
  type Alert,
  type TransferListing,
} from "@/lib/api";
import { alertTypeToIcon, formatNaira, STATUS_COLORS, STATUS_LABELS } from "@/lib/format";

export default function DashboardPage() {
  const { auth } = useAuth();
  const pharmacy = auth?.accountType === "pharmacy" ? auth.pharmacy : null;

  const [summary, setSummary] = useState({ totalInventoryItems: 0, nearExpiryItems: 0, activeTransfers: 0, partnerPharmacies: 0 });
  const [inventorySegments, setInventorySegments] = useState<{ color: string; value: number; label: string }[]>([]);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [listings, setListings] = useState<TransferListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.inventoryStatus(),
      insightsApi.list().catch(() => ({ insights: [] })),
      alertsApi.list().catch(() => ({ alerts: [] })),
      transfersApi.available().catch(() => ({ listings: [] })),
    ])
      .then(([sum, invStatus, ins, al, tr]) => {
        setSummary(sum);
        setInventoryTotal(invStatus.total);
        setInventorySegments(
          invStatus.breakdown
            .filter((b) => ["HEALTHY", "LOW_STOCK", "NEAR_EXPIRY", "OUT_OF_STOCK"].includes(b.status))
            .map((b) => ({
              color: STATUS_COLORS[b.status] || "#d1d5db",
              value: b.count,
              label: STATUS_LABELS[b.status] || b.status,
            }))
        );
        setInsights(ins.insights);
        setAlerts(al.alerts.slice(0, 4));
        setListings(tr.listings.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRequest(listingId: string, quantity: number) {
    setRequesting(listingId);
    try {
      await transfersApi.request(listingId, quantity);
      toastSuccess("Transfer request sent!");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRequesting(null);
    }
  }

  const insightConfig: Record<string, { icon: AppIconName; iconClass: string; color: string; link: string }> = {
    EXPIRY_RISK: { icon: "warning", iconClass: "text-red-500", color: "bg-red-50 border-red-100", link: "View Items →" },
    DEMAND_FORECAST: { icon: "trending", iconClass: "text-blue-500", color: "bg-blue-50 border-blue-100", link: "See prediction →" },
    RESTOCK_SUGGESTION: { icon: "package", iconClass: "text-green-500", color: "bg-green-50 border-green-100", link: "List now →" },
  };

  const unreadAlerts = alerts.filter((a) => !a.read).length;

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Loading..." />
        <main className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={`Welcome back, ${pharmacy?.name || "Pharmacy"}`}
        alertCount={unreadAlerts}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <p className="text-sm text-gray-500 mb-5">Here&apos;s what&apos;s happening with your inventory today.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard icon={<AppIcon name="package" size={20} className="text-white" />} iconBg="bg-green-500"
            title="Total Inventory Items" value={summary.totalInventoryItems.toLocaleString()} trend="View all" trendColor="text-green-600" />
          <StatCard icon={<AppIcon name="warning" size={20} className="text-white" />} iconBg="bg-orange-500"
            title="Near Expiry Items" value={String(summary.nearExpiryItems)} trend="View all" trendColor="text-orange-500" />
          <StatCard icon={<AppIcon name="transfers" size={20} className="text-white" />} iconBg="bg-blue-500"
            title="Active Transfers" value={String(summary.activeTransfers)} trend="View all" trendColor="text-blue-500" />
          <StatCard icon={<AppIcon name="users" size={20} className="text-white" />} iconBg="bg-purple-500"
            title="Partner Pharmacies" value={String(summary.partnerPharmacies)} subtitle="Across Nigeria" trendColor="text-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Inventory Status Overview</h3>
                <div className="flex items-center gap-6">
                  <DonutChart segments={inventorySegments} total={inventoryTotal} centerLabel="Total Items" size={150} />
                  <div className="space-y-2.5">
                    {inventorySegments.map((seg) => (
                      <div key={seg.label} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                        <span className="text-xs text-gray-600">{seg.label}</span>
                        <span className="text-xs font-semibold text-gray-900 ml-auto">
                          {seg.value} ({inventoryTotal > 0 ? ((seg.value / inventoryTotal) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/analysis" className="text-sm text-green-600 font-medium mt-4 inline-flex items-center gap-1 hover:text-green-700">
                  View full report →
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <AppIcon name="sparkles" size={18} className="text-purple-500" />
                    AI Insights
                  </h3>
                </div>
                <div className="space-y-3">
                  {insights.length === 0 ? (
                    <p className="text-sm text-gray-500">No insights yet. <Link href="/ai-insights" className="text-green-600">Generate insights</Link></p>
                  ) : (
                    insights.map((insight) => {
                      const cfg = insightConfig[insight.type] || insightConfig.EXPIRY_RISK;
                      const text = (insight.payload as { summary?: string }).summary || "AI insight available";
                      return (
                        <div key={insight.id} className={`p-3 rounded-xl border ${cfg.color}`}>
                          <div className="flex gap-2.5">
                            <AppIcon name={cfg.icon} size={18} className={`shrink-0 mt-0.5 ${cfg.iconClass}`} />
                            <div>
                              <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                              <Link href="/ai-insights" className="text-xs text-green-600 font-semibold mt-1 inline-block">{cfg.link}</Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Available Medicines for Transfer</h3>
                <Link href="/transfers" className="text-sm text-green-600 font-medium">View all →</Link>
              </div>
              {listings.length === 0 ? (
                <p className="text-sm text-gray-500">No transfer listings available right now.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {listings.map((med) => (
                    <div key={med.listingId} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
                        <AppIcon name="pill" size={20} className="text-blue-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{med.medicineName} {med.strength}</h4>
                      <p className="text-xs text-gray-400 mb-3">{med.dosageForm}</p>
                      <div className="space-y-1 text-xs text-gray-500 mb-3">
                        <div className="flex justify-between"><span>Quantity</span><span className="font-medium text-gray-700">{med.quantity} units</span></div>
                        <div className="flex justify-between"><span>Price</span><span className="font-medium text-gray-700">{formatNaira(med.discountedPrice)} <span className="text-red-500">-{med.discountPercent}%</span></span></div>
                        <div className="flex justify-between"><span>From</span><span className="font-medium text-gray-700">{med.fromPharmacy.name}</span></div>
                      </div>
                      <button
                        onClick={() => handleRequest(med.listingId, Math.min(med.quantity, 10))}
                        disabled={requesting === med.listingId}
                        className="w-full py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <AppIcon name="transfers" size={14} />
                        {requesting === med.listingId ? "Sending..." : "Request Transfer"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Alerts</h3>
                <Link href="/alerts" className="text-sm text-green-600 font-medium hover:text-green-700">View all</Link>
              </div>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-sm text-gray-500">No alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <AppIcon name={alertTypeToIcon(alert.type)} size={18} className="shrink-0 text-orange-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{alert.message}</p>
                      </div>
                      {!alert.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Scan Medicine", icon: "camera" as AppIconName, href: "/scan" },
                  { label: "List for Transfer", icon: "clipboard" as AppIconName, href: "/transfers" },
                  { label: "Search Medicines", icon: "search" as AppIconName, href: "/transfers" },
                  { label: "New Transfer Request", icon: "send" as AppIconName, href: "/transfer-requests" },
                ].map((action) => (
                  <Link key={action.label} href={action.href}
                    className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all text-sm font-medium text-gray-700">
                    <AppIcon name={action.icon} size={16} className="text-green-600 shrink-0" />
                    <span className="text-xs text-left">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
