"use client";

import { ENRICHED_CHANNELS, ENRICHED_CHANNEL_KEYS } from "@/lib/enriched-data";

export function EnrichedChannelLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {ENRICHED_CHANNEL_KEYS.map((ch) => (
        <div key={ch} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ENRICHED_CHANNELS[ch].color }}
          />
          {ENRICHED_CHANNELS[ch].shortName}
        </div>
      ))}
    </div>
  );
}
