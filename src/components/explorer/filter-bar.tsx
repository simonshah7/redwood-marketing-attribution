"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGES } from "@/lib/data";
import { Filter } from "lucide-react";

export interface ExplorerFilters {
  dealType: string;
  segment: string;
  productLine: string;
  dateStart: string;
  dateEnd: string;
  stages: string[];
}

export const DEFAULT_FILTERS: ExplorerFilters = {
  dealType: "New Logo",
  segment: "Enterprise",
  productLine: "RunMyJobs",
  dateStart: "2025-02-01",
  dateEnd: "2026-01-31",
  stages: [],
};

interface FilterBarProps {
  filters: ExplorerFilters;
  onChange: (filters: ExplorerFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const isRMJEntNewLogo =
    filters.dealType === "New Logo" &&
    filters.segment === "Enterprise" &&
    filters.productLine === "RunMyJobs";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        {/* Deal Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Deal Type
          </label>
          <Select
            value={filters.dealType}
            onValueChange={(v) => onChange({ ...filters, dealType: v })}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="New Logo">New Logo</SelectItem>
              <SelectItem value="Expansion">Expansion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Segment */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Segment
          </label>
          <Select
            value={filters.segment}
            onValueChange={(v) => onChange({ ...filters, segment: v })}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
              <SelectItem value="Mid-Market">Mid-Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Line */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Product Line
          </label>
          <Select
            value={filters.productLine}
            onValueChange={(v) => onChange({ ...filters, productLine: v })}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="RunMyJobs">RunMyJobs</SelectItem>
              <SelectItem value="Finance Automation">
                Finance Automation
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stage */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Stage
          </label>
          <Select
            value={filters.stages.length === 0 ? "All" : filters.stages[0]}
            onValueChange={(v) =>
              onChange({ ...filters, stages: v === "All" ? [] : [v] })
            }
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter badge */}
        {isRMJEntNewLogo && (
          <Badge
            variant="default"
            className="ml-auto h-6 text-[10px] font-semibold"
          >
            Filtered: RMJ Enterprise New Logo deals
          </Badge>
        )}
      </div>
    </div>
  );
}
