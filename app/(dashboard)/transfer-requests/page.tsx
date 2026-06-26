"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import DonutChart from "@/components/ui/DonutChart";
import AppIcon from "@/components/ui/AppIcon";
import { useToast } from "@/contexts/ToastContext";
import { transferRequestsApi, type TransferRequest } from "@/lib/api";
import {
  formatDate,
  formatNaira,
  transferStatusLabel,
  transferStatusToBadge,
} from "@/lib/format";

export default function TransferRequestsPage() {
  const [direction, setDirection] = useState<"incoming" | "outgoing">(
    "incoming",
  );
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      transferRequestsApi.list(direction),
      transferRequestsApi.summary(),
    ])
      .then(([listRes, sumRes]) => {
        setRequests(listRes.requests);
        setSummary(sumRes);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [direction]);

  async function handleAction(
    id: string,
    action: "accept" | "reject" | "complete",
  ) {
    setActing(id);
    try {
      await transferRequestsApi.update(id, action);
      toastSuccess(
        `Request ${action === "accept" ? "accepted" : action === "reject" ? "rejected" : "completed"}`,
      );
      load();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  const segments = [
    { color: "#f97316", value: summary.pending, label: "Pending" },
    { color: "#3b82f6", value: summary.inTransit, label: "In Transit" },
    { color: "#22c55e", value: summary.completed, label: "Completed" },
    { color: "#ef4444", value: summary.cancelled, label: "Cancelled" },
  ];

  return (
    <>
      <TopBar
        title="Transfer Requests"
        subtitle="Manage incoming and outgoing medicine transfer requests."
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={
              <AppIcon name="chart" size={20} className="text-purple-600" />
            }
            iconBg="bg-purple-50"
            title="All Requests"
            value={String(summary.total)}
          />
          <StatCard
            icon={
              <AppIcon name="clock" size={20} className="text-orange-600" />
            }
            iconBg="bg-orange-50"
            title="Pending"
            value={String(summary.pending)}
          />
          <StatCard
            icon={<AppIcon name="truck" size={20} className="text-blue-600" />}
            iconBg="bg-blue-50"
            title="In Transit"
            value={String(summary.inTransit)}
          />
          <StatCard
            icon={<AppIcon name="check" size={20} className="text-green-600" />}
            iconBg="bg-green-50"
            title="Completed"
            value={String(summary.completed)}
          />
          <StatCard
            icon={<AppIcon name="cancel" size={20} className="text-red-600" />}
            iconBg="bg-red-50"
            title="Cancelled"
            value={String(summary.cancelled)}
          />
        </div>

        <div className="flex border-b border-gray-200">
          {(["incoming", "outgoing"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`px-4 py-2 text-sm font-medium cursor-pointer capitalize ${direction === d ? "border-b-2 border-green-600 text-green-700 font-semibold" : "text-gray-500"}`}>
              {d} Requests
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-5">
            {loading ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                Loading...
              </p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                No {direction} requests
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const med = req.listing?.inventoryItem?.medicine;
                  const partner =
                    direction === "incoming"
                      ? req.requestingPharmacy
                      : req.listing?.pharmacy;
                  return (
                    <div
                      key={req.id}
                      className="border border-gray-100 rounded-xl p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {med?.name || "Medicine"} {med?.strength}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {partner?.name} · {partner?.city}, {partner?.state}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {req.quantity} units · {formatDate(req.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Unit price:{" "}
                            <span className="font-semibold text-gray-900">
                              {formatNaira(
                                req.listing?.inventoryItem?.sellingPrice ?? 0,
                              )}
                            </span>
                            {req.listing?.discountPercent ? (
                              <span className="ml-2 text-xs text-red-500">
                                -{req.listing.discountPercent}%
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Total:{" "}
                            <span className="font-semibold text-gray-900">
                              {formatNaira(
                                (req.listing?.inventoryItem?.sellingPrice ??
                                  0) * req.quantity,
                              )}
                            </span>
                          </p>
                        </div>
                        <Badge variant={transferStatusToBadge(req.status)}>
                          {transferStatusLabel(req.status)}
                        </Badge>
                      </div>
                      {direction === "incoming" && req.status === "PENDING" && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAction(req.id, "accept")}
                            disabled={acting === req.id}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs cursor-pointer disabled:opacity-50">
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "reject")}
                            disabled={acting === req.id}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs cursor-pointer disabled:opacity-50">
                            Reject
                          </button>
                        </div>
                      )}
                      {direction === "incoming" &&
                        req.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleAction(req.id, "complete")}
                            disabled={acting === req.id}
                            className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs cursor-pointer disabled:opacity-50">
                            Mark Complete
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Request Summary
            </h3>
            <DonutChart
              segments={segments}
              total={summary.total || 1}
              centerLabel="Total"
              size={130}
            />
            <div className="space-y-2 mt-4">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-gray-600">{s.label}</span>
                  <span className="ml-auto font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
