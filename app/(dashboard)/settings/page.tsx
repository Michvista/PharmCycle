"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import AppIcon from "@/components/ui/AppIcon";
import { pharmacyApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function SettingsPage() {
  const { refreshMe } = useAuth();
  const [pharmacyName, setPharmacyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [toggles, setToggles] = useState({
    expiry: true,
    transfers: true,
    lowStock: true,
    aiDigest: false,
    network: true,
  });
  const TOGGLE_STORAGE_KEY = "PharmaCycle.AI_notification_toggles";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(TOGGLE_STORAGE_KEY);
      if (saved) {
        try {
          setToggles(JSON.parse(saved));
        } catch {
          // ignore invalid saved state
        }
      }
    }

    pharmacyApi
      .getProfile()
      .then((res) => {
        setPharmacyName(res.pharmacy.name);
        setAddress(res.pharmacy.address || "");
        setCity(res.pharmacy.city);
        setState(res.pharmacy.state);
        setName(res.user.name);
        setEmail(res.user.email);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOGGLE_STORAGE_KEY, JSON.stringify(toggles));
    }
  }, [toggles]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await pharmacyApi.updateProfile({
        pharmacyName,
        address,
        city,
        state,
        name,
        email,
      });
      await refreshMe();
      setMessage("Profile saved successfully");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar
        title="Settings"
        subtitle="Manage your pharmacy profile, notifications, and preferences."
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {message && (
            <p
              className={`text-sm px-4 py-3 rounded-xl ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {message}
            </p>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Pharmacy Profile
            </h3>
            <div className="space-y-4">
              {[
                {
                  label: "Pharmacy Name",
                  value: pharmacyName,
                  set: setPharmacyName,
                },
                { label: "Address", value: address, set: setAddress },
                { label: "City", value: city, set: setCity },
                { label: "State", value: state, set: setState },
                { label: "Contact Name", value: name, set: setName },
                {
                  label: "Contact Email",
                  value: email,
                  set: setEmail,
                  type: "email",
                },
              ].map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-4">
                  <label className="text-sm text-gray-700">{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 w-56 text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Notifications{" "}
              <span className="text-xs text-gray-400 font-normal">
                (local preferences)
              </span>
            </h3>
            <div className="space-y-4">
              {Object.entries({
                expiry: "Expiry alerts",
                transfers: "Transfer request notifications",
                lowStock: "Low stock warnings",
                aiDigest: "AI insight digests",
                network: "Network updates",
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setToggles((p) => ({
                        ...p,
                        [key]: !p[key as keyof typeof p],
                      }))
                    }
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${toggles[key as keyof typeof toggles] ? "bg-green-600" : "bg-gray-200"}`}>
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${toggles[key as keyof typeof toggles] ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50">
            <AppIcon name="check" size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </main>
    </>
  );
}
