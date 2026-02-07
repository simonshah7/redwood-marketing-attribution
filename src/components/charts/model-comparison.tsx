"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DATA,
  CHANNELS,
  CHANNEL_KEYS,
  type Channel,
} from "@/lib/data";
import {
  firstTouchAttribution,
  lastTouchAttribution,
  multiTouchAttribution,
} from "@/lib/attribution";
import { fmt } from "@/lib/utils";

function buildModelData() {
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);
  const mt = multiTouchAttribution(DATA);

  const models = [
    { name: "First Touch", data: ft },
    { name: "Last Touch", data: lt },
    { name: "Multi-Touch", data: mt },
  ];

  return models.map((model) => {
    const total = CHANNEL_KEYS.reduce(
      (s, ch) => s + model.data[ch].pipeline,
      0
    );
    const row: Record<string, string | number> = { name: model.name };
    CHANNEL_KEYS.forEach((ch) => {
      row[ch] = total > 0 ? (model.data[ch].pipeline / total) * 100 : 0;
      row[`${ch}_raw`] = model.data[ch].pipeline;
    });
    return row;
  });
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  payload: Record<string, string | number>;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p) => {
        const ch = p.dataKey as Channel;
        const info = CHANNELS[ch];
        if (!info) return null;
        const raw = p.payload[`${ch}_raw`] as number;
        return (
          <div key={ch} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-muted-foreground">{info.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {fmt(raw)} ({p.value.toFixed(1)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ModelComparison() {
  const data = buildModelData();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
          Attribution Model Comparison
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pipeline % split by channel across three attribution models
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{
                fill: "hsl(var(--chart-axis))",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--chart-cursor))" }}
            />
            {CHANNEL_KEYS.map((ch) => (
              <Bar
                key={ch}
                dataKey={ch}
                stackId="a"
                fill={CHANNELS[ch].color}
                radius={0}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {CHANNEL_KEYS.map((ch) => (
            <div key={ch} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: CHANNELS[ch].color }}
              />
              <span className="text-xs text-muted-foreground">
                {CHANNELS[ch].name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
