"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, getStoredAuth, setStoredAuth } from "@/lib/api";

type PharmacyAuth = {
  accountType: "pharmacy";
  token: string;
  user: { id: string; name: string; email: string; role: string };
  pharmacy: { id: string; name: string; city: string; state: string; address?: string; verified?: boolean };
};

type ConsumerAuth = {
  accountType: "consumer";
  token: string;
  consumer: { id: string; name: string; email: string; city?: string; state?: string };
};

type AuthState = PharmacyAuth | ConsumerAuth | null;

interface AuthContextValue {
  auth: AuthState;
  loading: boolean;
  loginPharmacy: (email: string, password: string) => Promise<void>;
  registerPharmacy: (data: {
    pharmacyName: string;
    address?: string;
    city: string;
    state: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  loginConsumer: (email: string, password: string) => Promise<void>;
  registerConsumer: (data: { name: string; email: string; password: string; city?: string; state?: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored?.accountType === "pharmacy" && stored.user && stored.pharmacy) {
      setAuth({ accountType: "pharmacy", token: stored.token, user: stored.user, pharmacy: stored.pharmacy });
    } else if (stored?.accountType === "consumer" && stored.consumer) {
      setAuth({ accountType: "consumer", token: stored.token, consumer: stored.consumer });
    }
    setLoading(false);
  }, []);

  const loginPharmacy = useCallback(async (email: string, password: string) => {
    const res = await authApi.loginPharmacy(email, password);
    const data: PharmacyAuth = {
      accountType: "pharmacy",
      token: res.token,
      user: res.user,
      pharmacy: res.pharmacy,
    };
    setStoredAuth({ ...data });
    setAuth(data);
    router.push("/dashboard");
  }, [router]);

  const registerPharmacy = useCallback(async (data: Parameters<AuthContextValue["registerPharmacy"]>[0]) => {
    const res = await authApi.registerPharmacy(data);
    const authData: PharmacyAuth = {
      accountType: "pharmacy",
      token: res.token,
      user: res.user,
      pharmacy: res.pharmacy,
    };
    setStoredAuth({ ...authData });
    setAuth(authData);
    router.push("/dashboard");
  }, [router]);

  const loginConsumer = useCallback(async (email: string, password: string) => {
    const res = await authApi.loginConsumer(email, password);
    const data: ConsumerAuth = {
      accountType: "consumer",
      token: res.token,
      consumer: res.consumer,
    };
    setStoredAuth({ ...data });
    setAuth(data);
    router.push("/search");
  }, [router]);

  const registerConsumer = useCallback(async (data: Parameters<AuthContextValue["registerConsumer"]>[0]) => {
    const res = await authApi.registerConsumer(data);
    const authData: ConsumerAuth = {
      accountType: "consumer",
      token: res.token,
      consumer: res.consumer,
    };
    setStoredAuth({ ...authData });
    setAuth(authData);
    router.push("/search");
  }, [router]);

  const logout = useCallback(() => {
    setStoredAuth(null);
    setAuth(null);
    router.push("/login");
  }, [router]);

  const refreshMe = useCallback(async () => {
    if (!auth || auth.accountType !== "pharmacy") return;
    try {
      const res = await authApi.me();
      const updated: PharmacyAuth = {
        accountType: "pharmacy",
        token: auth.token,
        user: res.user,
        pharmacy: res.pharmacy,
      };
      setStoredAuth({ ...updated });
      setAuth(updated);
    } catch {
      // token expired
    }
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, loading, loginPharmacy, registerPharmacy, loginConsumer, registerConsumer, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
