"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelLegend } from "@/components/shared/channel-legend";
import {
  DATA,
  CHANNELS,
  CHANNEL_KEYS,
  STAGES,
  type Channel,
} from "@/lib/data";
import { fmt } from "@/lib/utils";

function buildStageData() {
  return STAGES.map((stage) => {
    const stageAccounts = DATA.filter((d) => d.stage === stage.key);
    const channelMix: Record<string, number> = {};
    CHANNEL_KEYS.forEach((ch) => {
      channelMix[ch] = 0;
    });
    stageAccounts.forEach((acc) => {
      acc.touches.forEach((t) => {
        channelMix[t.channel] += 1;
      });
    });
    const total = Object.values(channelMix).reduce((s, v) => s + v, 0);
    const row: Record<string, string | number> = {
      name: stage.name,
      total,
    };
    CHANNEL_KEYS.forEach((ch) => {
      row[ch] = total > 0 ? (channelMix[ch] / total) * 100 : 0;
      row[`${ch}_count`] = channelMix[ch];
    });
    return row;
  });
}

function buildRegionData() {
  const regions = ["NA", "EMEA", "APAC"];
  return regions.map((region) => {
    const regionAccounts = DATA.filter((d) => d.region === region);
    const pipeline = regionAccounts.reduce((s, d) => s + d.deal, 0);
    const wonDeals = regionAccounts.filter((d) => d.stage === "closed_won");
    const won = wonDeals.reduce((s, d) => s + d.deal, 0);

    const channelMix: Record<string, number> = {};
    CHANNEL_KEYS.forEach((ch) => {
      channelMix[ch] = 0;
    });
    regionAccounts.forEach((acc) => {
      acc.touches.forEach((t) => {
        channelMix[t.channel] += 1;
      });
    });
    const total = Object.values(channelMix).reduce((s, v) => s + v, 0);
    const channelPcts: Record<string, number> = {};
    CHANNEL_KEYS.forEach((ch) => {
      channelPcts[ch] = total > 0 ? (channelMix[ch] / total) * 100 : 0;
    });

    return { region, pipeline, won, opps: regionAccounts.length, channelPcts };
  });
}

function buildIndustryData() {
  const industries: Record<
    string,
    { count: number; pipeline: number }
  > = {};
  DATA.forEach((d) => {
    if (!industries[d.industry]) {
      industries[d.industry] = { count: 0, pipeline: 0 };
    }
    industries[d.industry].count += 1;
    industries[d.industry].pipeline += d.deal;
  });
  return Object.entries(industries)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.pipeline - a.pipeline);
}

interface StageTooltipPayload {
  dataKey: string;
  value: number;
  payload: Record<string, string | number>;
}

function StageTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: StageTooltipPayload[];
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
        const count = p.payload[`${ch}_count`] as number;
        return (
          <div key={ch} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-muted-foreground">{info.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {count} ({p.value.toFixed(1)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PipelinePage() {
  const stageData = buildStageData();
  const regionData = buildRegionData();
  const industryData = buildIndustryData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Pipeline Influence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Channel influence across pipeline stages and segments
        </p>
      </div>

      {/* Stacked bars by stage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Channel Mix by Pipeline Stage
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Percentage of touches by channel at each deal stage
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={stageData}
              layout="vertical"
              barCategoryGap="15%"
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: "hsl(220, 15%, 90%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<StageTooltip />}
                cursor={{ fill: "hsl(222, 14%, 14%)" }}
              />
              {CHANNEL_KEYS.map((ch) => (
                <Bar
                  key={ch}
                  dataKey={ch}
                  stackId="a"
                  fill={CHANNELS[ch].color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3">
            <ChannelLegend />
          </div>
        </CardContent>
      </Card>

      {/* Pipeline by Region */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Pipeline by Region</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {regionData.map((r) => (
            <Card key={r.region}>
              <CardContent className="p-5">
                <h3 className="text-lg font-bold text-foreground">
                  {r.region}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Pipeline</span>
                    <span className="font-mono font-medium text-foreground">
                      {fmt(r.pipeline)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closed Won</span>
                    <span className="font-mono font-medium text-emerald-400">
                      {fmt(r.won)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opportunities</span>
                    <span className="font-mono font-medium text-foreground">
                      {r.opps}
                    </span>
                  </div>
                </div>

                {/* Channel mix bar */}
                <div className="mt-4">
                  <p className="mb-1 text-[10px] text-muted-foreground">
                    Channel Mix
                  </p>
                  <div className="flex h-3 w-full overflow-hidden rounded-full">
                    {CHANNEL_KEYS.map((ch) => (
                      <div
                        key={ch}
                        style={{
                          width: `${r.channelPcts[ch]}%`,
                          backgroundColor: CHANNELS[ch].color,
                        }}
                        title={`${CHANNELS[ch].name}: ${r.channelPcts[ch].toFixed(1)}%`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Industry Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Industry Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Industry</th>
                <th className="pb-2 pr-4 text-right">Opportunities</th>
                <th className="pb-2 text-right">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {industryData.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-border/50 transition-colors hover:bg-secondary/50"
                >
                  <td className="py-2.5 pr-4 font-medium text-foreground">
                    {row.name}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs text-foreground">
                    {row.count}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-foreground">
                    {fmt(row.pipeline)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
