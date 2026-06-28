"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppIcon, { LogoIcon } from "@/components/ui/AppIcon";
import BrandWordmark from "@/components/ui/BrandWordmark";
import { authApi, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [role, setRole] = useState<"pharmacy" | "consumer">("pharmacy");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ message: string; resetUrl: string; resetToken: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res =
        role === "pharmacy"
          ? await authApi.forgotPasswordPharmacy(email)
          : await authApi.forgotPasswordConsumer(email);
      setResult(res);
      router.push(res.resetUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_36%),linear-gradient(180deg,#f7fbf8_0%,#eef7f1_100%)] text-gray-900 flex">
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
          <p className="text-sm uppercase tracking-[0.3em] text-green-200/80 mb-4">Account recovery</p>
          <h1 className="text-4xl font-bold leading-tight mb-5">
            Reset access without losing the flow.
          </h1>
          <p className="text-green-100/85 leading-relaxed">
            Create a secure reset link for your demo account, then set a new password on the next screen.
          </p>
        </div>
        <p className="relative z-10 text-sm text-green-100/70">
          Use the same email you used to register.
        </p>
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
                <h2 className="text-2xl font-bold">Forgot your password?</h2>
                <p className="text-sm text-gray-500">We&apos;ll create a reset link for your account.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setRole("pharmacy")}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${role === "pharmacy" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                Pharmacy
              </button>
              <button
                type="button"
                onClick={() => setRole("consumer")}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${role === "consumer" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                General User
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {result && (
              <div className="mb-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                <p className="font-semibold">{result.message}</p>
                <p className="mt-1">Demo reset link generated. Redirecting you now.</p>
                <p className="mt-2 text-xs font-mono break-all text-green-700">{result.resetToken}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={role === "pharmacy" ? "greenlifepharmacy@demo.com" : "chidinma@demo.com"}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-60">
                {loading ? "Generating reset link..." : "Create Reset Link"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/login" className="text-green-700 font-semibold hover:text-green-800">
                Back to sign in
              </Link>
              <span className="text-gray-400">Demo-only flow</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
