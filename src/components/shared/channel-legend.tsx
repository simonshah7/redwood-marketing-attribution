"use client";

import { CHANNELS, CHANNEL_KEYS } from "@/lib/data";

export function ChannelLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {CHANNEL_KEYS.map((ch) => (
        <div key={ch} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: CHANNELS[ch].color }}
          />
          <span className="text-xs text-muted-foreground">
            {CHANNELS[ch].name}
          </span>
        </div>
      ))}
    </div>
  );
}
