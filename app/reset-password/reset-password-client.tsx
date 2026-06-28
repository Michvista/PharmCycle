"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppIcon, { LogoIcon } from "@/components/ui/AppIcon";
import BrandWordmark from "@/components/ui/BrandWordmark";
import { authApi, ApiError } from "@/lib/api";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") === "consumer" ? "consumer" : "pharmacy") as "pharmacy" | "consumer";
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleLabel = useMemo(() => (role === "pharmacy" ? "Pharmacy account" : "General user account"), [role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token. Start from the forgot password page.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fn = role === "pharmacy" ? authApi.resetPasswordPharmacy : authApi.resetPasswordConsumer;
      const res = await fn(token, password);
      setSuccess(res.message);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_32%),linear-gradient(180deg,#f7fbf8_0%,#eef7f1_100%)] text-gray-900 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d4f3c] text-white p-12 flex-col justify-between">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-white/6" />
        <div className="absolute -bottom-32 -left-16 w-[420px] h-[420px] rounded-full bg-emerald-400/10" />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="opacity-[0.08] scale-[5.5] rotate-[-15deg] text-white">
            <LogoIcon size={60} />
          </div>
        </div>
        <div className="relative z-10">
          <BrandWordmark tone="light" showTagline />
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-sm uppercase tracking-[0.3em] text-green-200/80 mb-4">Set a new password</p>
          <h1 className="text-4xl font-bold leading-tight mb-5">
            Secure recovery for your {role === "pharmacy" ? "pharmacy" : "consumer"} login.
          </h1>
          <p className="text-green-100/85 leading-relaxed">
            Your reset link is active for a short time. Choose a fresh password and keep moving.
          </p>
        </div>
        <p className="relative z-10 text-sm text-green-100/70">{roleLabel}</p>
      </div>

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
              <LogoIcon size={20} />
            </div>
            <BrandWordmark />
          </div>

          <div className="bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_24px_80px_rgba(15,23,42,0.12)] rounded-[28px] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center">
                <AppIcon name="lock" size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Reset your password</h2>
                <p className="text-sm text-gray-500">{roleLabel}</p>
              </div>
            </div>

            {error && (
              <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="mb-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                {success}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reset token</label>
                <input
                  type="text"
                  value={token}
                  readOnly
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-mono text-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-60">
                {loading ? "Updating password..." : "Update Password"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-green-700 font-semibold hover:text-green-800">
                Get a new link
              </Link>
              <Link href="/login" className="text-gray-500 hover:text-gray-700">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
