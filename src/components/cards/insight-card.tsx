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

const SEVERITY_CONFIG: Record<
  Severity,
  { icon: React.ReactNode; bg: string; text: string; iconColor: string; border: string }
> = {
  danger: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: "bg-destructive/5 dark:bg-destructive/10",
    text: "text-destructive",
    iconColor: "text-destructive",
    border: "border-l-destructive/50",
  },
  warning: {
    icon: <AlertCircle className="h-4 w-4" />,
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-l-amber-500/50",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    bg: "bg-primary/5 dark:bg-primary/10",
    text: "text-primary",
    iconColor: "text-primary",
    border: "border-l-primary/50",
  },
};

export function InsightCard({
  severity,
  title,
  description,
}: InsightCardProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <Card className={cn("border-0 border-l-[3px]", config.bg, config.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 shrink-0", config.iconColor)}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", config.text)}>
              {title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
