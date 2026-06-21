"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AppIcon, { LogoIcon, type AppIconName } from "@/components/ui/AppIcon";
import { useAuth } from "@/contexts/AuthContext";
import { alertsApi, transferRequestsApi } from "@/lib/api";
import { initials } from "@/lib/format";

const navItems: {
  label: string;
  href: string;
  icon: AppIconName;
  pharmacyOnly?: boolean;
  badgeKey?: "alerts" | "requests";
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Inventory", href: "/inventory", icon: "inventory", pharmacyOnly: true },
  { label: "AI Insights", href: "/ai-insights", icon: "insights", pharmacyOnly: true },
  { label: "Transfers", href: "/transfers", icon: "transfers" },
  { label: "Transfer Requests", href: "/transfer-requests", icon: "requests", badgeKey: "requests" },
  { label: "Alerts", href: "/alerts", icon: "alerts", badgeKey: "alerts" },
  { label: "Scan Medicines", href: "/scan", icon: "scan", pharmacyOnly: true },
  { label: "Analysis", href: "/analysis", icon: "analysis", pharmacyOnly: true },
  { label: "Reports", href: "/reports", icon: "reports", pharmacyOnly: true },
  { label: "Settings", href: "/settings", icon: "settings" },
  { label: "Help & Support", href: "/help", icon: "help" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { auth, logout } = useAuth();
  const [badges, setBadges] = useState({ alerts: 0, requests: 0 });

  useEffect(() => {
    if (!auth || auth.accountType !== "pharmacy") return;
    Promise.all([
      alertsApi.list(false).catch(() => ({ alerts: [] })),
      transferRequestsApi.summary().catch(() => ({ incomingPending: 0 })),
    ]).then(([alertsRes, summaryRes]) => {
      setBadges({
        alerts: alertsRes.alerts.filter((a) => !a.read).length,
        requests: summaryRes.incomingPending || 0,
      });
    });
  }, [auth, pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const pharmacy = auth?.accountType === "pharmacy" ? auth.pharmacy : null;
  const user = auth?.accountType === "pharmacy" ? auth.user : null;

  const sidebarContent = (
    <aside className="w-[240px] h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shrink-0 text-white">
            <LogoIcon size={20} />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-[15px] leading-tight">PharmCycle</div>
            <div className="text-[11px] text-gray-400 leading-tight">Share. Save. Save Lives.</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
          aria-label="Close menu"
        >
          <AppIcon name="cancel" size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative
                ${isActive ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-green-600 rounded-r-full" />}
              <AppIcon name={item.icon} size={18} className={isActive ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"} />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${item.icon === "alerts" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {pharmacy ? initials(pharmacy.name) : "PC"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
              {pharmacy?.name || "Pharmacy"}
              <AppIcon name="verified" size={14} className="text-green-600 shrink-0" />
            </div>
            <div className="text-[11px] text-gray-400">{user?.role || "Pharmacist"}</div>
          </div>
          <button onClick={logout} title="Sign out" className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <AppIcon name="cancel" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:flex w-[240px] min-h-screen shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer panel */}
          <div className="relative flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
