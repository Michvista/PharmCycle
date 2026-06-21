interface BadgeProps {
  variant: "pending" | "in-transit" | "completed" | "cancelled" | "new" | "near-expiry" | "in-stock" | "low-stock" | "out-of-stock" | "excess-stock" | "analgesic" | "antibiotic" | "antihistamine" | "supplement" | "high" | "medium" | "low";
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  "pending": "bg-orange-50 text-orange-600 border-orange-100",
  "in-transit": "bg-blue-50 text-blue-600 border-blue-100",
  "completed": "bg-green-50 text-green-600 border-green-100",
  "cancelled": "bg-red-50 text-red-600 border-red-100",
  "new": "bg-green-50 text-green-600 border-green-100",
  "near-expiry": "bg-red-50 text-red-600 border-red-100",
  "in-stock": "bg-green-50 text-green-600 border-green-100",
  "low-stock": "bg-orange-50 text-orange-600 border-orange-100",
  "out-of-stock": "bg-red-50 text-red-600 border-red-100",
  "excess-stock": "bg-blue-50 text-blue-600 border-blue-100",
  "analgesic": "bg-blue-50 text-blue-600 border-blue-100",
  "antibiotic": "bg-purple-50 text-purple-600 border-purple-100",
  "antihistamine": "bg-orange-50 text-orange-600 border-orange-100",
  "supplement": "bg-green-50 text-green-600 border-green-100",
  "high": "bg-red-50 text-red-600 border-red-100",
  "medium": "bg-orange-50 text-orange-600 border-orange-100",
  "low": "bg-green-50 text-green-600 border-green-100",
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
      {children}
    </span>
  );
}
