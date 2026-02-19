"use client";

import type { TrendPoint } from "@/lib/mock-multi-period";

interface TrendSparklineProps {
  data: TrendPoint[];
  height?: number;
  width?: number;
  color?: string;
  showLabels?: boolean;
  format?: "currency" | "pct" | "number";
}

function formatValue(
  value: number,
  format: "currency" | "pct" | "number"
): string {
  if (format === "currency") {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
  if (format === "pct") return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

export function TrendSparkline({
  data,
  height = 32,
  width = 80,
  color = "hsl(var(--primary))",
  showLabels = false,
  format = "number",
}: TrendSparklineProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 2;
  const w = width;
  const h = height;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Trend direction
  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  const trending = lastVal > prevVal ? "up" : lastVal < prevVal ? "down" : "flat";

  return (
    <div className="inline-flex items-center gap-1.5">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="shrink-0"
      >
        {/* Area fill */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`}
          fill={color}
          opacity={0.1}
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2}
          fill={color}
        />
      </svg>
      {showLabels && (
        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
          {formatValue(lastVal, format)}
        </span>
      )}
    </div>
  );
}
