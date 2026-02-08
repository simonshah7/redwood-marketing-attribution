"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "redwood-attribution-budgets";

export interface ChannelBudgets {
  linkedin_ads: number;
  marketo_email: number;
  events_webinars: number;
  web_content: number;
  bdr_team: number;
}

const DEFAULT_BUDGETS: ChannelBudgets = {
  linkedin_ads: 0,
  marketo_email: 0,
  events_webinars: 0,
  web_content: 0,
  bdr_team: 0,
};

const BUDGET_LABELS: Record<keyof ChannelBudgets, string> = {
  linkedin_ads: "LinkedIn Ads — Quarterly Spend",
  marketo_email: "Marketo Email — Quarterly Spend",
  events_webinars: "Events & Webinars — Quarterly Spend",
  web_content: "Web / Content — Quarterly Spend",
  bdr_team: "BDR Team — Quarterly Spend",
};

export function loadBudgets(): ChannelBudgets | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const total = Object.values(parsed).reduce((s: number, v) => s + (v as number), 0);
    return total > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveBudgets(budgets: ChannelBudgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (budgets: ChannelBudgets) => void;
}

export function BudgetModal({ open, onClose, onSave }: BudgetModalProps) {
  const [values, setValues] = useState<ChannelBudgets>(DEFAULT_BUDGETS);

  useEffect(() => {
    const saved = loadBudgets();
    if (saved) setValues(saved);
  }, []);

  if (!open) return null;

  function handleSave() {
    saveBudgets(values);
    onSave(values);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-[440px] max-w-[95vw]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4" />
            Edit Channel Budgets
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Enter quarterly spend per channel to unlock cost-per-pipeline metrics.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(BUDGET_LABELS) as (keyof ChannelBudgets)[]).map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                {BUDGET_LABELS[key]}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={values[key] || ""}
                  onChange={(e) =>
                    setValues({ ...values, [key]: Number(e.target.value) || 0 })
                  }
                  className="h-9 w-full rounded-md border border-border bg-background pl-6 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="h-8 rounded-md px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save Budgets
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface BudgetTriggerProps {
  onClick: () => void;
  hasBudgets: boolean;
}

export function BudgetTrigger({ onClick, hasBudgets }: BudgetTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <Pencil className="h-3.5 w-3.5" />
      {hasBudgets ? (
        <Badge variant="secondary" className="text-[10px]">
          Budgets: Q4 2024
        </Badge>
      ) : (
        <span>Add budgets</span>
      )}
    </button>
  );
}
