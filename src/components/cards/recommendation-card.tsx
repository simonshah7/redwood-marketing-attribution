"use client";

import { Card, CardContent } from "@/components/ui/card";

type Severity = "danger" | "warning" | "info" | "success";

export interface Recommendation {
  severity: Severity;
  title: string;
  what: string;
  why: string;
  doThis: string;
  who: string;
  measure: string;
}

const severityStyles: Record<Severity, { border: string; bg: string; title: string }> = {
  danger: {
    border: "border-l-destructive",
    bg: "bg-destructive/5",
    title: "text-destructive",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    title: "text-amber-400",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
    title: "text-blue-400",
  },
  success: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    title: "text-emerald-400",
  },
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const styles = severityStyles[rec.severity];

  return (
    <Card className={`border-l-4 ${styles.border} ${styles.bg}`}>
      <CardContent className="p-4 space-y-3">
        <p className={`text-sm font-semibold ${styles.title}`}>{rec.title}</p>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              What
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              {rec.what}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Why
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              {rec.why}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Do This
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              {rec.doThis}
            </p>
          </div>

          <div className="flex gap-6">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Who
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">{rec.who}</p>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Measure
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {rec.measure}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
