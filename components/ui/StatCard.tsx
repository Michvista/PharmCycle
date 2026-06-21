interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendColor?: string;
  sparklineColor?: string;
}

export default function StatCard({ icon, iconBg, title, value, subtitle, trend, trendColor = "text-green-600" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 hover:shadow-md transition-shadow duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && <p className={`text-xs font-medium mt-1 ${trendColor}`}>{trend}</p>}
      </div>
      {/* Mini sparkline */}
      <svg width="48" height="24" viewBox="0 0 48 24" className="shrink-0 mt-2">
        <polyline
          fill="none"
          stroke={trendColor === "text-red-500" ? "#ef4444" : "#22c55e"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="2,18 8,14 16,16 24,8 32,12 40,6 46,10"
        />
      </svg>
    </div>
  );
}
