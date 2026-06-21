"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!auth || auth.accountType !== "pharmacy")) {
      router.replace("/login");
    }
  }, [auth, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!auth || auth.accountType !== "pharmacy") return null;

  return <>{children}</>;
}
