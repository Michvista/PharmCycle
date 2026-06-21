interface DonutChartProps {
  segments: { color: string; value: number; label: string }[];
  total: number;
  centerLabel?: string;
  size?: number;
}

export default function DonutChart({ segments, total, centerLabel, size = 160 }: DonutChartProps) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let cumulativePercent = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const percent = seg.value / total;
          const dashLength = percent * circumference;
          const dashGap = circumference - dashLength;
          const rotation = cumulativePercent * 360 - 90;
          cumulativePercent += percent;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={`${dashLength} ${dashGap}`}
              transform={`rotate(${rotation} ${center} ${center})`}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</span>
          <span className="text-xs text-gray-500">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}
