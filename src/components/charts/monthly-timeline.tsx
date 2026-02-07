"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DATA,
  CHANNELS,
  CHANNEL_KEYS,
  MONTH_LABELS,
  MONTH_KEYS,
  type Channel,
} from "@/lib/data";

function buildMonthlyData() {
  const monthly: Record<string, Record<Channel, number>> = {};
  MONTH_KEYS.forEach((mk) => {
    monthly[mk] = { linkedin: 0, email: 0, form: 0, events: 0 };
  });

  DATA.forEach((acc) => {
    acc.touches.forEach((t) => {
      const mk = t.date.slice(0, 7); // "2024-02"
      if (monthly[mk]) {
        monthly[mk][t.channel] += 1;
      }
    });
  });

  return MONTH_KEYS.map((mk, idx) => ({
    name: MONTH_LABELS[idx],
    ...monthly[mk],
  }));
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
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
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-foreground">
        {label} &middot; {total} touches
      </p>
      {payload.map((p) => {
        const ch = p.dataKey as Channel;
        const info = CHANNELS[ch];
        if (!info) return null;
        return (
          <div key={ch} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-muted-foreground">{info.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {p.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MonthlyTimeline() {
  const data = buildMonthlyData();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Monthly Touch Volume
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Marketing touches by channel over 12 months
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap="15%">
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(222, 14%, 14%)" }}
            />
            {CHANNEL_KEYS.map((ch) => (
              <Bar
                key={ch}
                dataKey={ch}
                stackId="a"
                fill={CHANNELS[ch].color}
                radius={ch === "events" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
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
