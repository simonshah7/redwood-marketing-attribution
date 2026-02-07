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
  { icon: React.ReactNode; bg: string; text: string; iconColor: string }
> = {
  danger: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: "bg-destructive/5 dark:bg-destructive/10",
    text: "text-destructive",
    iconColor: "text-destructive",
  },
  warning: {
    icon: <AlertCircle className="h-4 w-4" />,
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    bg: "bg-primary/5 dark:bg-primary/10",
    text: "text-primary",
    iconColor: "text-primary",
  },
};

export function InsightCard({
  severity,
  title,
  description,
}: InsightCardProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <Card className={cn("border-0", config.bg)}>
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
