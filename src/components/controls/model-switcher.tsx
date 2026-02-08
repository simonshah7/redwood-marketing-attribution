"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HelpTip } from "@/components/shared/help-tip";
import {
  ATTRIBUTION_MODELS,
  type AttributionModel,
} from "@/lib/attribution";

interface ModelSwitcherProps {
  value: AttributionModel;
  onChange: (model: AttributionModel) => void;
}

export function ModelSwitcher({ value, onChange }: ModelSwitcherProps) {
  const current = ATTRIBUTION_MODELS.find((m) => m.id === value);

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => onChange(v as AttributionModel)}>
        <SelectTrigger className="h-8 w-[220px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ATTRIBUTION_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id} className="text-xs">
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current && (
        <HelpTip text={current.description} />
      )}
    </div>
  );
}
