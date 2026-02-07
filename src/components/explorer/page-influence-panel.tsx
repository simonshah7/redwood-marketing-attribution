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
import { calculatePageInfluence } from "@/lib/explorer-analysis";
import type { UnifiedTouchpoint, EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

interface Props {
  touchpoints: UnifiedTouchpoint[];
  accounts: EnrichedAccount[];
}

export function PageInfluencePanel({ touchpoints, accounts }: Props) {
  const data = useMemo(
    () => calculatePageInfluence(touchpoints, accounts),
    [touchpoints, accounts],
  );

  const top3 = data.slice(0, 3);
  const top3Pipeline = top3.reduce((s, d) => s + d.pipeline_influenced, 0);

  const chartData = data.slice(0, 12).map((d) => ({
    name: d.page_url.replace(/^\//, "").replace(/\/$/, "") || "home",
    influence: Math.round(d.influence_score / 1000),
    pipeline: d.pipeline_influenced,
    convRate: d.conversion_rate,
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            Top 3 most influential pages are{" "}
            <span className="font-semibold">{top3.map((d) => d.page_url).join(", ")}</span>{" "}
            — collectively appearing in deals worth{" "}
            <span className="font-semibold">{fmt(top3Pipeline)}</span>.
          </p>
        </CardContent>
      </Card>

      {/* Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Pages Ranked by Influence Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 120, right: 60, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                        <p className="font-semibold">{d.name}</p>
                        <p>Influence: {d.influence}K</p>
                        <p>Pipeline: {fmt(d.pipeline)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="influence" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(200, 65%, ${50 - entry.convRate * 20}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Page Influence Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page URL</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Unique Opps</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Influence Score</TableHead>
                  <TableHead className="text-right">Avg Position</TableHead>
                  <TableHead className="text-right">Conv Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 15).map((d) => (
                  <TableRow key={d.page_url}>
                    <TableCell className="font-mono text-xs">
                      {d.page_url}
                    </TableCell>
                    <TableCell className="text-right">{d.visit_count}</TableCell>
                    <TableCell className="text-right">{d.unique_opps}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_influenced)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(d.revenue_influenced)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {fmt(d.influence_score)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.avg_position_in_journey < 0.33
                        ? "Early"
                        : d.avg_position_in_journey < 0.66
                          ? "Mid"
                          : "Late"}
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
