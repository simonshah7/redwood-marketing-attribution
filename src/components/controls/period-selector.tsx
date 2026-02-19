"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeriod, PERIODS, getPeriodMeta } from "@/lib/period-context";
import type { ReportingPeriod } from "@/lib/period-context";

export function PeriodSelector() {
  const { period, setPeriod } = usePeriod();

  return (
    <div className="flex items-center gap-2">
      <Calendar className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
      <Select value={period} onValueChange={(v) => setPeriod(v as ReportingPeriod)}>
        <SelectTrigger className="h-8 w-[120px] border-border text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {getPeriodMeta(p).label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
