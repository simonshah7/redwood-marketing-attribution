"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateFirstTouchOrigins } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { ENRICHED_CHANNELS } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

export function FirstTouchPanel({ accounts }: Props) {
  const data = useMemo(
    () => calculateFirstTouchOrigins(accounts),
    [accounts],
  );

  const topOrigin = data[0];

  // Treemap-style bar chart data (top 10)
  const barData = data.slice(0, 10).map((d) => ({
    name: d.specific_detail.length > 35
      ? d.specific_detail.slice(0, 32) + "..."
      : d.specific_detail,
    pipeline: d.pipeline_generated,
    channel: d.channel,
    opps: d.opp_count,
  }));

  // Channel donut
  const channelMap = new Map<string, number>();
  data.forEach((d) => {
    channelMap.set(d.channel, (channelMap.get(d.channel) || 0) + d.opp_count);
  });
  const donutData = Array.from(channelMap.entries()).map(([channel, count]) => ({
    name: ENRICHED_CHANNELS[channel as keyof typeof ENRICHED_CHANNELS]?.shortName || channel,
    value: count,
    fill: ENRICHED_CHANNELS[channel as keyof typeof ENRICHED_CHANNELS]?.color || "hsl(220, 10%, 50%)",
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {topOrigin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              The top door-opener is{" "}
              <span className="font-semibold">
                {topOrigin.specific_detail}
              </span>{" "}
              ({topOrigin.channel}) — generating{" "}
              <span className="font-semibold">{fmt(topOrigin.pipeline_generated)}</span>{" "}
              in pipeline across {topOrigin.opp_count} opportunities with{" "}
              {pct(topOrigin.conversion_rate)} conversion rate.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar Chart (Treemap-style) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              First Touchpoints by Pipeline Generated
              <HelpTip text={HELP_TEXT.explorer_first_touch} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ left: 160, right: 40, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => fmt(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={150}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                          <p className="font-semibold">{d.name}</p>
                          <p>Pipeline: {fmt(d.pipeline)}</p>
                          <p>Opps: {d.opps}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          ENRICHED_CHANNELS[
                            entry.channel as keyof typeof ENRICHED_CHANNELS
                          ]?.color || "hsl(200, 65%, 50%)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              First Touch by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                          <p className="font-semibold">{d.name}</p>
                          <p>{d.value} opps</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: d.fill }}
                  />
                  <span className="text-muted-foreground">
                    {d.name}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            First Touch Origins Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Touch</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Opps</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Days to Pipeline</TableHead>
                  <TableHead className="text-right">Conv Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.first_touchpoint}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.specific_detail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {d.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.touchpoint_type}
                    </TableCell>
                    <TableCell className="text-right">{d.opp_count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_generated)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(d.revenue_generated)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(d.avg_time_to_pipeline)}d
                    </TableCell>
                    <TableCell className="text-right">
                      {pct(d.conversion_rate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
