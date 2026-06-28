"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import AppIcon from "@/components/ui/AppIcon";
import { useToast } from "@/contexts/ToastContext";
import { dashboardApi, insightsApi, type AIInsight } from "@/lib/api";

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [nearExpiry, setNearExpiry] = useState(0);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { error: toastError, success: toastSuccess } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      insightsApi.list(),
      dashboardApi.summary(),
    ])
      .then(([ins, sum]) => {
        setInsights(ins.insights);
        setNearExpiry(sum.nearExpiryItems);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function generate(type: "EXPIRY_RISK" | "DEMAND_FORECAST" | "RESTOCK_SUGGESTION") {
    setGenerating(type);
    try {
      await insightsApi.generate(type);
      toastSuccess("Insight generated successfully");
      load();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Generation failed — check GROQ_API_KEY");
    } finally {
      setGenerating(null);
    }
  }

  const expiryInsight = insights.find((i) => i.type === "EXPIRY_RISK");
  const demandInsight = insights.find((i) => i.type === "DEMAND_FORECAST");
  const restockInsight = insights.find((i) => i.type === "RESTOCK_SUGGESTION");

  const riskItems = (expiryInsight?.payload as { riskItems?: { medicine?: string; riskLevel?: string; reason?: string; suggestedAction?: string }[] })?.riskItems || [];
  const forecasts = (demandInsight?.payload as { forecasts?: { medicineName?: string; predictedChangePercent?: number; direction?: string; reason?: string }[] })?.forecasts || [];
  const recommendations = (restockInsight?.payload as { recommendations?: { medicineName?: string; recommendedReorderQty?: number; urgency?: string; reason?: string }[] })?.recommendations || [];

  return (
    <>
      <TopBar title="AI Insights" subtitle="Smart insights to help you reduce waste, optimize inventory and improve availability." />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<AppIcon name="lightbulb" size={20} className="text-white" />} iconBg="bg-purple-500" title="Insights Generated" value={String(insights.length)} />
          <StatCard icon={<AppIcon name="warning" size={20} className="text-white" />} iconBg="bg-orange-500" title="At Risk of Expiry" value={`${nearExpiry} Items`} />
          <StatCard icon={<AppIcon name="trending" size={20} className="text-white" />} iconBg="bg-blue-500" title="Demand Forecasts" value={String(forecasts.length)} />
          <StatCard icon={<AppIcon name="package" size={20} className="text-white" />} iconBg="bg-green-500" title="Restock Suggestions" value={String(recommendations.length)} />
        </div>

        <div className="flex flex-wrap gap-3">
          {([
            ["EXPIRY_RISK", "Generate Expiry Risk"],
            ["DEMAND_FORECAST", "Generate Drug Forecast"],
            ["RESTOCK_SUGGESTION", "Generate Restock Plan"],
          ] as const).map(([type, label]) => (
            <button key={type} onClick={() => generate(type)} disabled={generating === type}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50">
              {generating === type ? "Generating..." : label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading insights...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Expiry Risk</h3>
              {(expiryInsight?.payload as { summary?: string })?.summary && (
                <p className="text-sm text-gray-600 mb-4">{(expiryInsight?.payload as { summary?: string }).summary}</p>
              )}
              {riskItems.length === 0 ? (
                <p className="text-sm text-gray-500">No expiry risk data — click Generate above.</p>
              ) : (
                <div className="space-y-3">
                  {riskItems.map((item, i) => (
                    <div key={i} className="p-3 border border-gray-100 rounded-xl">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-gray-900">{item.medicine || "Medicine"}</p>
                        <Badge variant={(item.riskLevel as "high") || "medium"}>{item.riskLevel}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                      <p className="text-xs text-green-600 mt-1">{item.suggestedAction}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Demand Forecast</h3>
              {forecasts.length === 0 ? (
                <p className="text-sm text-gray-500">No drug forecast data yet.</p>
              ) : (
                <div className="space-y-3">
                  {forecasts.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                      <AppIcon name={f.direction === "decrease" ? "lowStock" : "trending"} size={18} className={f.direction === "decrease" ? "text-red-500" : "text-green-600"} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{f.medicineName}</p>
                        <p className="text-xs text-gray-400">{f.reason}</p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${
                        (f.predictedChangePercent ?? 0) < 0
                          ? "text-red-500"
                          : (f.predictedChangePercent ?? 0) > 0
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}>
                        {(f.predictedChangePercent ?? 0) > 0 ? "+" : ""}{f.predictedChangePercent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Restock Recommendations</h3>
              {recommendations.length === 0 ? (
                <p className="text-sm text-gray-500">No restock suggestions yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.map((r, i) => (
                    <div key={i} className="p-3 border border-gray-100 rounded-xl">
                      <div className="flex justify-between">
                        <p className="text-sm font-semibold text-gray-900">{r.medicineName}</p>
                        <Badge variant={(r.urgency as "high") || "medium"}>{r.urgency}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Reorder: {r.recommendedReorderQty} units</p>
                      <p className="text-xs text-gray-400">{r.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
