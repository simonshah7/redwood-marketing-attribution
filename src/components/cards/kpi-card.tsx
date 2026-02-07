"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  delta: string;
  trend: "positive" | "negative" | "neutral";
}

export function KpiCard({ title, value, delta, trend }: KpiCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/20">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <Badge
          variant="secondary"
          className={cn(
            "mt-2 gap-1 text-[11px] font-medium",
            trend === "positive" && "bg-primary/10 text-primary",
            trend === "negative" &&
              "bg-destructive/10 text-destructive",
            trend === "neutral" && "text-muted-foreground"
          )}
        >
          {trend === "positive" && <TrendingUp className="h-3 w-3" />}
          {trend === "negative" && <TrendingDown className="h-3 w-3" />}
          {trend === "neutral" && <Minus className="h-3 w-3" />}
          {delta}
        </Badge>
      </CardContent>
    </Card>
  );
}
