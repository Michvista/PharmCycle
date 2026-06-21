"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import AppIcon from "@/components/ui/AppIcon";
import { alertsApi, type Alert } from "@/lib/api";
import { alertTypeToCategory, alertTypeToIcon, timeAgo } from "@/lib/format";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    alertsApi.list()
      .then((res) => setAlerts(res.alerts))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await alertsApi.markRead(id);
    load();
  }

  const unread = alerts.filter((a) => !a.read).length;
  const urgent = alerts.filter((a) => !a.read && ["NEAR_EXPIRY", "TRANSFER_REQUEST", "EXPIRED"].includes(a.type)).length;

  return (
    <>
      <TopBar title="Alerts" subtitle="Stay on top of inventory risks, transfers, and network updates." alertCount={unread} />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<AppIcon name="alerts" size={20} className="text-white" />} iconBg="bg-red-500" title="Unread Alerts" value={String(unread)} />
          <StatCard icon={<AppIcon name="warning" size={20} className="text-white" />} iconBg="bg-orange-500" title="Urgent" value={String(urgent)} />
          <StatCard icon={<AppIcon name="expiry" size={20} className="text-white" />} iconBg="bg-purple-500" title="Total Alerts" value={String(alerts.length)} />
          <StatCard icon={<AppIcon name="transfer" size={20} className="text-white" />} iconBg="bg-blue-500" title="Transfer Alerts"
            value={String(alerts.filter((a) => a.type === "TRANSFER_REQUEST").length)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {loading ? (
            <p className="p-8 text-center text-sm text-gray-500">Loading...</p>
          ) : alerts.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">No alerts</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} onClick={() => !alert.read && markRead(alert.id)}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!alert.read ? "bg-red-50" : "bg-gray-50"}`}>
                  <AppIcon name={alertTypeToIcon(alert.type)} size={20} className={!alert.read ? "text-red-500" : "text-gray-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{alert.message}</p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{alertTypeToCategory(alert.type)}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(alert.createdAt)}</span>
                {!alert.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
