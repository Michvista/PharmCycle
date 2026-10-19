interface DonutChartProps {
  segments: { color: string; value: number; label: string }[];
  total: number;
  centerLabel?: string;
  size?: number;
}

export default function DonutChart({ segments, total, centerLabel }: DonutChartProps) {
  // Lightweight, dependency-free summary that preserves layout without SVG charts
  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
        {centerLabel && <div className="text-xs text-gray-500">{centerLabel}</div>}
      </div>
      <div className="space-y-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span className="truncate">{s.label}</span>
            <span className="ml-2 font-semibold text-gray-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
