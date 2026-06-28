"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import AppIcon from "@/components/ui/AppIcon";
import { alertsApi, transferRequestsApi, type Alert, type TransferRequest } from "@/lib/api";
import { alertTypeToCategory, alertTypeToIcon, timeAgo } from "@/lib/format";

type PriorityCard = {
  title: string;
  note: string;
  tag: string;
  tone: "amber" | "green" | "blue";
};

function toneClass(tone: PriorityCard["tone"]) {
  if (tone === "amber") return "bg-amber-400/20 text-amber-200";
  if (tone === "green") return "bg-emerald-400/20 text-emerald-200";
  return "bg-sky-400/20 text-sky-200";
}

function groupIncomingRequests(requests: TransferRequest[]) {
  const groups = new Map<
    string,
    {
      title: string;
      dose: string;
      count: number;
      quantity: number;
      pharmacies: string[];
      status: string;
    }
  >();

  for (const request of requests) {
    const medicine = request.listing?.inventoryItem?.medicine;
    const key = medicine
      ? `${medicine.name}::${medicine.strength}::${medicine.dosageForm}`
      : request.id;
    const pharmacyName = request.requestingPharmacy?.name || request.listing?.pharmacy?.name || "Unknown pharmacy";
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      existing.quantity += request.quantity;
      existing.pharmacies.push(pharmacyName);
      existing.status = request.status;
    } else {
      groups.set(key, {
        title: medicine ? medicine.name : "Medicine request",
        dose: medicine ? `${medicine.strength} • ${medicine.dosageForm}` : "",
        count: 1,
        quantity: request.quantity,
        pharmacies: [pharmacyName],
        status: request.status,
      });
    }
  }

  return Array.from(groups.values());
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([
      alertsApi.list(),
      transferRequestsApi.list("incoming", "PENDING"),
    ])
      .then(([alertsRes, requestsRes]) => {
        setAlerts(alertsRes.alerts);
        setIncomingRequests(requestsRes.requests);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await alertsApi.markRead(id);
    load();
  }

  const unread = alerts.filter((a) => !a.read).length;
  const urgentAlerts = alerts.filter((a) => !a.read && ["NEAR_EXPIRY", "TRANSFER_REQUEST", "OUT_OF_STOCK"].includes(a.type));
  const groupedRequests = useMemo(() => groupIncomingRequests(incomingRequests), [incomingRequests]);
  const priorityCards: PriorityCard[] = useMemo(() => {
    const requestCards = groupedRequests.slice(0, 3).map<PriorityCard>((group) => ({
      title: `${group.title}${group.dose ? ` ${group.dose}` : ""}`,
      note:
        group.count === 1
          ? `${group.pharmacies[0]} needs ${group.quantity} units`
          : `${group.count} pharmacies nearby need this`,
      tag:
        group.count === 1
          ? "Review"
          : group.status === "ACCEPTED"
          ? "Matched"
          : "Review",
      tone: (
        group.count === 1
          ? "amber"
          : group.count > 1
          ? "green"
          : "amber"
      ) as PriorityCard["tone"],
    }));

    const alertCards = urgentAlerts.slice(0, Math.max(0, 3 - requestCards.length)).map<PriorityCard>((alert) => ({
      title: alert.message.replace(/^.*?:\s*/, ""),
      note: alert.message,
      tag: alertTypeToCategory(alert.type),
      tone: (alert.type === "OUT_OF_STOCK" ? "blue" : "amber") as PriorityCard["tone"],
    }));

    return [...requestCards, ...alertCards].slice(0, 3);
  }, [groupedRequests, urgentAlerts]);

  return (
    <>
      <TopBar
        title="Alerts"
        subtitle="Expiry alerts, transfer demand, and nearby pharmacy requests in one place."
        alertCount={unread}
      />
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.08),_transparent_25%),linear-gradient(180deg,#f7fbf8_0%,#eef6f0_100%)] p-4 space-y-6 md:p-6">
        <section className="rounded-[34px] bg-[#0d4f3c] px-6 py-6 text-white shadow-[0_30px_90px_rgba(13,79,60,0.22)] md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-green-200">
                <AppIcon name="alerts" size={14} />
                Expiry alert
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-[Syne,sans-serif] text-3xl font-extrabold leading-tight md:text-5xl">
                    {Math.max(priorityCards.length, 1)} items need attention
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                    This board highlights which medicines are moving, which pharmacies are asking for stock, and which items are getting close to expiry.
                  </p>
                </div>
                <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-green-100">
                  Priority view
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.24em] text-green-200/80">Unread</div>
                <div className="mt-2 text-3xl font-black">{unread}</div>
                <div className="mt-2 text-xs text-white/60">Alerts awaiting review</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.24em] text-green-200/80">Requests</div>
                <div className="mt-2 text-3xl font-black">{incomingRequests.length}</div>
                <div className="mt-2 text-xs text-white/60">Pharmacies asking for stock</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<AppIcon name="alerts" size={20} className="text-white" />}
            iconBg="bg-red-500"
            title="Unread Alerts"
            value={String(unread)}
          />
          <StatCard
            icon={<AppIcon name="transfer" size={20} className="text-white" />}
            iconBg="bg-blue-500"
            title="Incoming Requests"
            value={String(incomingRequests.length)}
          />
          <StatCard
            icon={<AppIcon name="warning" size={20} className="text-white" />}
            iconBg="bg-orange-500"
            title="Urgent Alerts"
            value={String(urgentAlerts.length)}
          />
          <StatCard
            icon={<AppIcon name="checkmark" size={20} className="text-white" />}
            iconBg="bg-green-500"
            title="Grouped Medicines"
            value={String(groupedRequests.length)}
          />
        </div>

        <section className="rounded-[32px] border border-white/60 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-950">Who needs what</h2>
              <p className="text-sm text-gray-500">Grouped from incoming transfer requests so the demand signal is easier to scan.</p>
            </div>
            <div className="hidden rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 md:block">
              Live demand board
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">Loading...</p>
          ) : priorityCards.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No pending alerts right now.</p>
          ) : (
            <div className="space-y-3">
              {priorityCards.map((card) => (
                <div
                  key={`${card.title}-${card.note}`}
                  className="flex flex-col gap-4 rounded-[24px] border border-[#dbe9df] bg-[#2f6b56] px-5 py-5 text-white md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold md:text-lg">{card.title}</div>
                    <div className="mt-1 text-sm text-white/70">{card.note}</div>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-4 py-1.5 text-sm font-bold ${toneClass(card.tone)}`}>
                    {card.tag}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-white/60 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-950">Alert feed</h2>
              <p className="text-sm text-gray-500">Click unread items once you have reviewed them.</p>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">Loading...</p>
          ) : alerts.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => !alert.read && markRead(alert.id)}
                  className={`flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition-all hover:-translate-y-[1px] hover:shadow-md ${
                    alert.read ? "border-gray-100 bg-white" : "border-green-100 bg-green-50/70"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      !alert.read ? "bg-white text-green-600" : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    <AppIcon
                      name={alertTypeToIcon(alert.type)}
                      size={20}
                      className={!alert.read ? "text-green-600" : "text-gray-400"}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-950">{alert.message}</p>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        {alertTypeToCategory(alert.type)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{timeAgo(alert.createdAt)}</p>
                  </div>
                  {!alert.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
