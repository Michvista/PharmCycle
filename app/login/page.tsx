"use client";

import { useState } from "react";
import Link from "next/link";
import AppIcon, { LogoIcon } from "@/components/ui/AppIcon";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { loginPharmacy, loginConsumer } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"pharmacy" | "public">("pharmacy");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "pharmacy") await loginPharmacy(email, password);
      else await loginConsumer(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-120px] left-[-60px] w-[400px] h-[400px] rounded-full bg-white/5" />
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600">
              <LogoIcon size={22} />
            </div>
            <span className="text-white text-2xl font-bold">PharmCycle</span>
          </div>
          <p className="text-green-100 text-sm ml-[52px] -mt-1">Share. Save. Save Lives.</p>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            Reduce Waste.<br />Share Medicines.<br />Save Lives.
          </h1>
          <p className="text-green-100 text-lg leading-relaxed max-w-md">
            Join the network of pharmacies working together to ensure medicines reach those who need them before they expire.
          </p>
        </div>
        <p className="text-green-200 text-sm relative z-10">© 2026 PharmCycle. All rights reserved.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white">
              <LogoIcon size={18} />
            </div>
            <span className="text-gray-900 text-xl font-bold">PharmCycle</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button type="button" onClick={() => setRole("pharmacy")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${role === "pharmacy" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <AppIcon name="pharmacy" size={16} className="inline mr-1.5 -mt-0.5" />
              Pharmacy
            </button>
            <button type="button" onClick={() => setRole("public")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${role === "public" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <AppIcon name="user" size={16} className="inline mr-1.5 -mt-0.5" />
              General User
            </button>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder={role === "pharmacy" ? "greenlifepharmacy@demo.com" : "chidinma@demo.com"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="login-password" type={showPassword ? "text" : "password"} value={password} required
                  onChange={(e) => setPassword(e.target.value)} placeholder="password123"
                  className="w-full px-4 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-sm">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-green-600 hover:text-green-700 font-semibold">Create account</Link>
          </p>

          {/* Demo credentials panel */}
          <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <AppIcon name="help" size={12} className="text-gray-400" />
              Demo credentials &mdash; password for all accounts: <span className="font-bold text-gray-700 normal-case">password123</span>
            </p>
            {role === "pharmacy" ? (
              <div className="space-y-1">
                {[
                  "greenlifepharmacy@demo.com",
                  "lifecarepharmacy@demo.com",
                  "medpluspharmacy@demo.com",
                  "healthpluspharmacy@demo.com",
                  "citycarepharmacy@demo.com",
                  "goodhealthpharmacy@demo.com",
                  "trustpharmacy@demo.com",
                  "wellcarepharmacy@demo.com",
                ].map((email) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setEmail(email)}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-colors font-mono cursor-pointer"
                  >
                    {email}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {[
                  { email: "chidinma@demo.com", label: "Chidinma Okafor — Lagos" },
                  { email: "tunde@demo.com", label: "Tunde Bello — Ibadan" },
                ].map(({ email, label }) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setEmail(email)}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-colors cursor-pointer"
                  >
                    <span className="font-mono">{email}</span>
                    <span className="text-gray-400 ml-2">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
