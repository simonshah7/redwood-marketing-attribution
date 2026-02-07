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
  accentColor: string;
}

export function KpiCard({ title, value, delta, trend, accentColor }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden transition-transform hover:scale-[1.02]">
      <div
        className="absolute left-0 right-0 top-0 h-[3px]"
        style={{ backgroundColor: accentColor }}
      />
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <Badge
          variant="secondary"
          className={cn(
            "mt-2 gap-1 text-[11px] font-medium",
            trend === "positive" && "bg-emerald-500/10 text-emerald-400",
            trend === "negative" && "bg-red-500/10 text-red-400",
            trend === "neutral" && "bg-amber-500/10 text-amber-400"
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
