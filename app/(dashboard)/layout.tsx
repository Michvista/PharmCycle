"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";
import AppIcon from "@/components/ui/AppIcon";
import { LogoIcon } from "@/components/ui/AppIcon";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top nav bar */}
          <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 sticky top-0 z-40">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
              aria-label="Open menu"
            >
              {/* Hamburger icon — three lines */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white">
                <LogoIcon size={16} />
              </div>
              <span className="font-bold text-gray-900 text-sm">PharmCycle</span>
            </div>
            {/* Spacer to keep logo centered */}
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
