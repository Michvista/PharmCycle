import type { AppIconName } from "@/components/ui/AppIcon";

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function inventoryStatusToBadge(
  status: string
): "in-stock" | "low-stock" | "near-expiry" | "out-of-stock" {
  const map: Record<string, "in-stock" | "low-stock" | "near-expiry" | "out-of-stock"> = {
    HEALTHY: "in-stock",
    LOW_STOCK: "low-stock",
    NEAR_EXPIRY: "near-expiry",
    OUT_OF_STOCK: "out-of-stock",
    EXPIRED: "out-of-stock",
  };
  return map[status] || "in-stock";
}

export function transferStatusToBadge(
  status: string
): "pending" | "in-transit" | "completed" | "cancelled" {
  const map: Record<string, "pending" | "in-transit" | "completed" | "cancelled"> = {
    PENDING: "pending",
    ACCEPTED: "in-transit",
    COMPLETED: "completed",
    REJECTED: "cancelled",
  };
  return map[status] || "pending";
}

export function transferStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "In Transit",
    COMPLETED: "Completed",
    REJECTED: "Cancelled",
  };
  return map[status] || status;
}

export function alertTypeToIcon(type: string): AppIconName {
  const map: Record<string, AppIconName> = {
    NEAR_EXPIRY: "expiry",
    LOW_STOCK: "lowStock",
    TRANSFER_REQUEST: "transfer",
    PRICE_DROP: "price",
    EXPIRED: "warning",
  };
  return map[type] || "alerts";
}

export function alertTypeToCategory(type: string): string {
  const map: Record<string, string> = {
    NEAR_EXPIRY: "Expiry",
    LOW_STOCK: "Stock",
    TRANSFER_REQUEST: "Transfers",
    PRICE_DROP: "Pricing",
    EXPIRED: "Expiry",
  };
  return map[type] || "General";
}

export const STATUS_COLORS: Record<string, string> = {
  HEALTHY: "#22c55e",
  LOW_STOCK: "#f97316",
  NEAR_EXPIRY: "#ef4444",
  OUT_OF_STOCK: "#d1d5db",
  EXPIRED: "#9ca3af",
};

export const STATUS_LABELS: Record<string, string> = {
  HEALTHY: "Healthy Stock",
  LOW_STOCK: "Low Stock",
  NEAR_EXPIRY: "Near Expiry",
  OUT_OF_STOCK: "Out of Stock",
  EXPIRED: "Expired",
};

export const CATEGORY_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#d1d5db", "#06b6d4", "#ec4899"];

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function parseLocation(location: string): { city: string; state: string } {
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 2) return { city: parts[0], state: parts[parts.length - 1] };
  return { city: parts[0] || "Lagos", state: "Lagos" };
}
