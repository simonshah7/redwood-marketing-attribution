"use client";

import { motion } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DATA, CHANNELS, CHANNEL_KEYS, STAGES } from "@/lib/data";
import { firstTouchAttribution } from "@/lib/attribution";
import { fmt, pct } from "@/lib/utils";

function buildData() {
  const ft = firstTouchAttribution(DATA);
  const totalPipeline = CHANNEL_KEYS.reduce((s, ch) => s + ft[ch].pipeline, 0);

  const channelCards = CHANNEL_KEYS.map((ch) => ({
    key: ch,
    name: CHANNELS[ch].name,
    color: CHANNELS[ch].color,
    pipeline: ft[ch].pipeline,
    pipelineShare: totalPipeline > 0 ? ft[ch].pipeline / totalPipeline : 0,
    revenue: ft[ch].revenue,
    opps: ft[ch].opps,
  }));

  const barData = [...channelCards]
    .sort((a, b) => b.pipeline - a.pipeline)
    .map((c) => ({
      name: CHANNELS[c.key].shortName,
      pipeline: c.pipeline,
      color: c.color,
    }));

  const accountTable = DATA.map((acc) => {
    const ftChannel = acc.touches.length > 0 ? acc.touches[0].channel : null;
    const stageDef = STAGES.find((s) => s.key === acc.stage);
    return {
      name: acc.name,
      stage: stageDef?.name ?? acc.stage,
      stageColor: stageDef?.color ?? "#666",
      deal: acc.deal,
      ftChannelName: ftChannel ? CHANNELS[ftChannel].name : "N/A",
      ftChannelColor: ftChannel ? CHANNELS[ftChannel].color : "#666",
    };
  });

  return { channelCards, barData, accountTable };
}

interface BarTooltipPayload {
  value: number;
  payload: { name: string; pipeline: number; color: string };
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: BarTooltipPayload[];
}) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{d.name}</p>
      <p className="font-mono text-xs text-muted-foreground">{fmt(d.pipeline)}</p>
    </div>
  );
}

export default function FirstTouchPage() {
  const { channelCards, barData, accountTable } = buildData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          First-Touch Attribution
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          First-touch attribution gives 100% credit to the first marketing
          interaction in each account&apos;s journey. This model highlights which
          channels are most effective at generating initial awareness and
          creating new pipeline.
        </p>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channelCards.map((c) => (
          <Card key={c.key} className="relative overflow-hidden">
            <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ backgroundColor: c.color }}
            />
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <p className="text-sm font-medium text-foreground">{c.name}</p>
              </div>
              <p className="mt-3 font-mono text-xl font-bold text-foreground">
                {fmt(c.pipeline)}
              </p>
              <p className="text-xs text-muted-foreground">
                {pct(c.pipelineShare)} of pipeline
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Revenue:{" "}
                  <span className="font-mono font-medium text-emerald-400">
                    {fmt(c.revenue)}
                  </span>
                </span>
                <span>
                  Opps:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {c.opps}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Horizontal Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Channels Ranked by Pipeline (First Touch)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" barCategoryGap="25%">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: "hsl(220, 15%, 90%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<BarTooltip />}
                cursor={{ fill: "hsl(222, 14%, 14%)" }}
              />
              <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Account Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            All Accounts — First Touch Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Account</th>
                  <th className="pb-2 pr-4">Stage</th>
                  <th className="pb-2 pr-4 text-right">Deal</th>
                  <th className="pb-2">First Touch</th>
                </tr>
              </thead>
              <tbody>
                {accountTable.map((acc) => (
                  <tr
                    key={acc.name}
                    className="border-b border-border/50 transition-colors hover:bg-secondary/50"
                  >
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {acc.name}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant="secondary"
                        className="text-[11px]"
                        style={{
                          backgroundColor: `${acc.stageColor}20`,
                          color: acc.stageColor,
                        }}
                      >
                        {acc.stage}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-foreground">
                      {fmt(acc.deal)}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: acc.ftChannelColor }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {acc.ftChannelName}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
