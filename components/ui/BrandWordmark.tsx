"use client";

type BrandWordmarkProps = {
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  showTagline?: boolean;
  className?: string;
};

const sizeStyles = {
  sm: "text-[15px]",
  md: "text-xl",
  lg: "text-2xl md:text-3xl",
};

export default function BrandWordmark({
  size = "md",
  tone = "dark",
  showTagline = false,
  className = "",
}: BrandWordmarkProps) {
  const labelTone = tone === "light" ? "text-white" : "text-gray-900";
  const accentTone = tone === "light" ? "text-green-400" : "text-green-600";
  const taglineTone = tone === "light" ? "text-green-100/80" : "text-gray-400";

  return (
    <div className={className}>
      <div className={`font-bold leading-tight ${sizeStyles[size]} ${labelTone}`}>
        Pharma<span className={accentTone}>Cycle</span>.AI
      </div>
      {showTagline && (
        <div className={`text-[10px] leading-tight ${taglineTone}`}>
          Share. Save. Save Lives.
        </div>
      )}
    </div>
  );
}
