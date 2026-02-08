"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterPill {
  key: string;
  label: string;
  value: string;
}

interface FilterPillsProps {
  pills: FilterPill[];
  onDismiss: (key: string) => void;
  onClearAll: () => void;
}

export function FilterPills({ pills, onDismiss, onClearAll }: FilterPillsProps) {
  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => (
        <Badge
          key={pill.key}
          variant="secondary"
          className="gap-1 pl-2.5 pr-1.5 py-1 text-xs"
        >
          {pill.value}
          <button
            onClick={() => onDismiss(pill.key)}
            className="ml-0.5 rounded-sm hover:bg-accent p-0.5"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {pill.label} filter</span>
          </button>
        </Badge>
      ))}
      {pills.length >= 2 && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
