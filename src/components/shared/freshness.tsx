"use client";

import { cn } from "@/lib/utils";

// The date of the current data snapshot
export const DATA_SNAPSHOT_DATE = "2026-01-31";

function getDaysSince(dateStr: string): number {
  const snapshot = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - snapshot.getTime()) / 86400000);
}

interface FreshnessIndicatorProps {
  className?: string;
}

export function FreshnessIndicator({ className }: FreshnessIndicatorProps) {
  const days = getDaysSince(DATA_SNAPSHOT_DATE);
  const date = new Date(DATA_SNAPSHOT_DATE).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let dotColor: string;
  let label: string;
  let pulse = false;

  if (days <= 1) {
    dotColor = "bg-emerald-500";
    label = `Data as of: ${date}`;
  } else if (days <= 14) {
    dotColor = "bg-amber-500";
    label = `Data as of: ${date} (${days} days ago)`;
  } else if (days <= 30) {
    dotColor = "bg-red-500";
    label = `Data as of: ${date} — stale`;
  } else {
    dotColor = "bg-red-500";
    pulse = true;
    label = `Data is ${days} days old — contact Marketing Ops`;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              dotColor
            )}
          />
        )}
        <span
          className={cn("relative inline-flex h-2 w-2 rounded-full", dotColor)}
        />
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
