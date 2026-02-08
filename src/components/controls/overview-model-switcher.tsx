"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";
import { type AttributionModel } from "@/lib/attribution";

interface OverviewModelSwitcherProps {
  value: AttributionModel;
  onChange: (model: AttributionModel) => void;
}

type TopLevel = "first_touch" | "last_touch" | "multi_touch";

const MULTI_TOUCH_MODELS: { id: AttributionModel; label: string; helpKey: keyof typeof HELP_TEXT }[] = [
  { id: "linear", label: "Linear", helpKey: "linear" },
  { id: "time_decay", label: "Time Decay", helpKey: "time_decay" },
  { id: "position_based", label: "Position Based", helpKey: "position_based" },
];

function getTopLevel(model: AttributionModel): TopLevel {
  if (model === "first_touch") return "first_touch";
  if (model === "last_touch") return "last_touch";
  return "multi_touch";
}

export function OverviewModelSwitcher({ value, onChange }: OverviewModelSwitcherProps) {
  const topLevel = getTopLevel(value);
  const [multiModel, setMultiModel] = useState<AttributionModel>(
    topLevel === "multi_touch" ? value : "linear"
  );

  function handleTopLevelChange(v: string) {
    if (v === "first_touch") {
      onChange("first_touch");
    } else if (v === "last_touch") {
      onChange("last_touch");
    } else {
      onChange(multiModel);
    }
  }

  function handleMultiModelChange(v: string) {
    const model = v as AttributionModel;
    setMultiModel(model);
    onChange(model);
  }

  const topLevelHelp = topLevel === "first_touch"
    ? HELP_TEXT.first_touch
    : topLevel === "last_touch"
    ? HELP_TEXT.last_touch
    : HELP_TEXT[multiModel as keyof typeof HELP_TEXT] || HELP_TEXT.linear;

  return (
    <div className="flex items-center gap-2">
      <Select value={topLevel} onValueChange={handleTopLevelChange}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="first_touch" className="text-xs">
            First Touch
          </SelectItem>
          <SelectItem value="last_touch" className="text-xs">
            Last Touch
          </SelectItem>
          <SelectItem value="multi_touch" className="text-xs">
            Multi-Touch
          </SelectItem>
        </SelectContent>
      </Select>

      {topLevel === "multi_touch" && (
        <Select value={multiModel} onValueChange={handleMultiModelChange}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MULTI_TOUCH_MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <HelpTip text={topLevelHelp} />
    </div>
  );
}
