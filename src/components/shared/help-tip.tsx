"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTipProps {
  text: string;
}

export function HelpTip({ text }: HelpTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help inline ml-1" />
      </TooltipTrigger>
      <TooltipContent className="text-xs text-muted-foreground leading-relaxed max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// Centralized help content
export const HELP_TEXT = {
  first_touch:
    "Gives 100% credit to the channel that first made this prospect aware of Redwood. Use this to understand where your pipeline originates.",
  last_touch:
    "Gives 100% credit to the final interaction before the deal progressed. Use this to understand what's converting prospects.",
  linear:
    "Splits credit equally across every touchpoint in the journey. Use this for a balanced view of all channel contributions.",
  time_decay:
    "Gives more credit to recent touchpoints. A webinar last month matters more than a LinkedIn click 9 months ago. Use this to see what's accelerating deals right now.",
  position_based:
    "Gives 40% credit to the first touch, 40% to the last touch, and spreads 20% across the middle. Balances awareness and conversion.",
  pipeline_influenced:
    "Total deal value of all opportunities where this touchpoint appeared anywhere in the journey.",
  influence_score:
    "Combines pipeline value with breadth — a touchpoint that appears across many deals scores higher than one in a single large deal.",
  lift_ratio:
    "How much more likely a touchpoint is to appear in won deals vs lost. A lift of 2.0x means it appears twice as often in wins.",
  velocity_impact:
    "How many days faster (or slower) deals progress when this touchpoint is present. Positive = deals move faster.",
  cost_per_pipeline:
    "How much you spend to generate $1 of attributed pipeline. Lower is better. Requires channel budgets to be entered.",
} as const;
