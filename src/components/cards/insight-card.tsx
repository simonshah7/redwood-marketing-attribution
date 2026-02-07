"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

type Severity = "danger" | "warning" | "info";

interface InsightCardProps {
  severity: Severity;
  title: string;
  description: string;
}

const SEVERITY_CONFIG: Record<Severity, { color: string; border: string; icon: React.ReactNode }> = {
  danger: {
    color: "text-red-400",
    border: "border-l-red-500",
    icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
  },
  warning: {
    color: "text-amber-400",
    border: "border-l-amber-500",
    icon: <AlertCircle className="h-4 w-4 text-amber-400" />,
  },
  info: {
    color: "text-blue-400",
    border: "border-l-blue-500",
    icon: <Info className="h-4 w-4 text-blue-400" />,
  },
};

export function InsightCard({ severity, title, description }: InsightCardProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <Card className={cn("border-l-[3px]", config.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{config.icon}</div>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", config.color)}>{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
