"use client";

import Link from "next/link";
import AppIcon from "@/components/ui/AppIcon";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/format";

interface TopBarProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  alertCount?: number;
}

export default function TopBar({ title, subtitle, children, alertCount }: TopBarProps) {
  const { auth } = useAuth();
  const pharmacy = auth?.accountType === "pharmacy" ? auth.pharmacy : null;

  return (
    <header className="h-16 bg-white border-b border-gray-200 hidden lg:flex items-center justify-between px-6 shrink-0">
      <div className="min-w-0 flex-1 mr-4">
        <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
        <p className="text-sm text-gray-500 -mt-0.5 truncate">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {children}

        <Link href="/alerts" className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <AppIcon name="alerts" size={20} className="text-gray-500" />
          {(alertCount ?? 0) > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {pharmacy ? initials(pharmacy.name) : "PC"}
          </div>
          <div className="hidden xl:block">
            <div className="text-sm font-medium text-gray-900 leading-tight">{pharmacy?.name || "Pharmacy"}</div>
            <div className="text-[11px] text-gray-400">{pharmacy ? `${pharmacy.city}, ${pharmacy.state}` : ""}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
