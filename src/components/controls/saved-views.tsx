"use client";

import { useState, useEffect } from "react";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ExplorerFilters } from "@/components/explorer/filter-bar";

export interface FilterPreset {
  id: string;
  name: string;
  filters: ExplorerFilters;
  builtIn?: boolean;
  created_at: string;
}

const STORAGE_KEY = "redwood-attribution-presets";

const BUILT_IN_PRESETS: FilterPreset[] = [
  {
    id: "built-in-rmj-ent-new",
    name: "RMJ Enterprise New Logo",
    builtIn: true,
    created_at: "2025-01-01",
    filters: {
      dealType: "New Logo",
      segment: "Enterprise",
      productLine: "RunMyJobs",
      dateStart: "2025-02-01",
      dateEnd: "2026-01-31",
      stages: [],
    },
  },
  {
    id: "built-in-all-rmj",
    name: "All RunMyJobs Pipeline",
    builtIn: true,
    created_at: "2025-01-01",
    filters: {
      dealType: "All",
      segment: "All",
      productLine: "RunMyJobs",
      dateStart: "2025-02-01",
      dateEnd: "2026-01-31",
      stages: [],
    },
  },
];

function loadPresets(): FilterPreset[] {
  if (typeof window === "undefined") return BUILT_IN_PRESETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const custom: FilterPreset[] = raw ? JSON.parse(raw) : [];
    return [...BUILT_IN_PRESETS, ...custom];
  } catch {
    return BUILT_IN_PRESETS;
  }
}

function saveCustomPresets(presets: FilterPreset[]) {
  const custom = presets.filter((p) => !p.builtIn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

interface SavedViewsProps {
  currentFilters: ExplorerFilters;
  onApply: (filters: ExplorerFilters) => void;
}

export function SavedViews({ currentFilters, onApply }: SavedViewsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>(BUILT_IN_PRESETS);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  function handleSave() {
    if (!newName.trim()) return;
    const custom = presets.filter((p) => !p.builtIn);
    if (custom.length >= 10) return;

    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      filters: { ...currentFilters },
      created_at: new Date().toISOString(),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    saveCustomPresets(updated);
    setSaving(false);
    setNewName("");
  }

  function handleDelete(id: string) {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    saveCustomPresets(updated);
  }

  return (
    <div className="flex items-center gap-2">
      <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
      <Select
        value=""
        onValueChange={(v) => {
          if (v === "__save__") {
            setSaving(true);
            return;
          }
          const preset = presets.find((p) => p.id === v);
          if (preset) onApply(preset.filters);
        }}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <SelectValue placeholder="Saved Views" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <div key={p.id} className="flex items-center">
              <SelectItem value={p.id} className="flex-1 text-xs">
                {p.name}
              </SelectItem>
              {!p.builtIn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="mr-2 p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <SelectItem value="__save__" className="text-xs text-primary">
            <div className="flex items-center gap-1">
              <Plus className="h-3 w-3" /> Save Current View
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {saving && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="View name..."
            className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="h-8 rounded-md bg-primary px-2 text-xs text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
          <button
            onClick={() => { setSaving(false); setNewName(""); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
