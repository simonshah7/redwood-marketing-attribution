"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES } from "@/lib/data";

interface AccountFilterProps {
  onFilterChange: (filters: AccountFilters) => void;
  showRegionFilter?: boolean;
  showIndustryFilter?: boolean;
  regions?: string[];
  industries?: string[];
  className?: string;
}

export interface AccountFilters {
  search: string;
  stages: string[];
  regions: string[];
  industries: string[];
}

export function AccountFilter({
  onFilterChange,
  showRegionFilter = false,
  showIndustryFilter = false,
  regions = [],
  industries = [],
  className,
}: AccountFilterProps) {
  const [search, setSearch] = useState("");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  const emitChange = useCallback(
    (updates: Partial<{ search: string; stages: string[]; regions: string[]; industries: string[] }>) => {
      onFilterChange({
        search: updates.search ?? search,
        stages: updates.stages ?? selectedStages,
        regions: updates.regions ?? selectedRegions,
        industries: updates.industries ?? selectedIndustries,
      });
    },
    [search, selectedStages, selectedRegions, selectedIndustries, onFilterChange]
  );

  const toggleStage = (stage: string) => {
    const next = selectedStages.includes(stage)
      ? selectedStages.filter(s => s !== stage)
      : [...selectedStages, stage];
    setSelectedStages(next);
    emitChange({ stages: next });
  };

  const toggleRegion = (region: string) => {
    const next = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    setSelectedRegions(next);
    emitChange({ regions: next });
  };

  const clearAll = () => {
    setSearch("");
    setSelectedStages([]);
    setSelectedRegions([]);
    setSelectedIndustries([]);
    onFilterChange({ search: "", stages: [], regions: [], industries: [] });
  };

  const hasFilters = search || selectedStages.length > 0 || selectedRegions.length > 0 || selectedIndustries.length > 0;

  // Pipeline stages to show as filter pills (exclude closed states for cleaner UI)
  const filterableStages = STAGES.filter(s => s.key !== 'closed_won' && s.key !== 'closed_lost');

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            emitChange({ search: e.target.value });
          }}
          className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {search && (
          <button
            onClick={() => { setSearch(""); emitChange({ search: "" }); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mr-1">
          Stage
        </span>
        {filterableStages.map(stage => (
          <button
            key={stage.key}
            onClick={() => toggleStage(stage.key)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors border",
              selectedStages.includes(stage.key)
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {stage.name}
          </button>
        ))}
        <button
          key="won"
          onClick={() => toggleStage("closed_won")}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors border",
            selectedStages.includes("closed_won")
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          Won
        </button>
        <button
          key="lost"
          onClick={() => toggleStage("closed_lost")}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors border",
            selectedStages.includes("closed_lost")
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          Lost
        </button>

        {/* Region pills (optional) */}
        {showRegionFilter && regions.length > 0 && (
          <>
            <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mr-1">
              Region
            </span>
            {regions.map(region => (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors border",
                  selectedRegions.includes(region)
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {region}
              </button>
            ))}
          </>
        )}

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

// Utility: apply filters to any account-like array
export function applyAccountFilters<T extends { name?: string; account_name?: string; stage?: string; region?: string; industry?: string }>(
  items: T[],
  filters: AccountFilters,
): T[] {
  return items.filter(item => {
    const name = (item.name || item.account_name || "").toLowerCase();
    if (filters.search && !name.includes(filters.search.toLowerCase())) return false;
    if (filters.stages.length > 0 && item.stage && !filters.stages.includes(item.stage)) return false;
    if (filters.regions.length > 0 && item.region && !filters.regions.includes(item.region)) return false;
    if (filters.industries.length > 0 && item.industry && !filters.industries.includes(item.industry)) return false;
    return true;
  });
}
