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
  Legend,
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
import { calculatePaidMediaROI } from "@/lib/explorer-analysis";
import type { UnifiedTouchpoint, EnrichedAccount } from "@/lib/enriched-data";
import { fmt } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  touchpoints: UnifiedTouchpoint[];
  accounts: EnrichedAccount[];
}

export function PaidMediaROIPanel({ touchpoints, accounts }: Props) {
  const data = useMemo(
    () => calculatePaidMediaROI(touchpoints, accounts),
    [touchpoints, accounts],
  );

  const totalSpend = data.reduce((s, d) => s + d.total_spend, 0);
  const totalPipeline = data.reduce((s, d) => s + d.pipeline_influenced, 0);
  const overallROAS = totalSpend > 0 ? totalPipeline / totalSpend : 0;

  const chartData = data.map((d) => ({
    name:
      d.ad_account_name.length > 25
        ? d.ad_account_name.slice(0, 22) + "..."
        : d.ad_account_name,
    spend: d.total_spend,
    pipeline: d.pipeline_influenced,
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            Total paid media spend is{" "}
            <span className="font-semibold">{fmt(totalSpend)}</span> generating{" "}
            <span className="font-semibold">{fmt(totalPipeline)}</span> in
            pipeline — an overall ROAS of{" "}
            <span className="font-semibold">{overallROAS.toFixed(1)}x</span>.
          </p>
        </CardContent>
      </Card>

      {/* Grouped Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Spend vs Pipeline by Ad Account
            <HelpTip text={HELP_TEXT.explorer_paid_media} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 140, right: 40, top: 5, bottom: 5 }}
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
                  width={130}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                        <p className="font-semibold">{d.name}</p>
                        <p>Spend: {fmt(d.spend)}</p>
                        <p>Pipeline: {fmt(d.pipeline)}</p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="spend" fill="hsl(350, 55%, 50%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pipeline" fill="hsl(168, 55%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Ad Account Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Account</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Opps</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Cost/Opp</TableHead>
                  <TableHead className="text-right">Cost per Pipeline $</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.ad_account_id}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.ad_account_name}
                    </TableCell>
                    <TableCell className="text-right">{fmt(d.total_spend)}</TableCell>
                    <TableCell className="text-right">{d.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{d.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{d.unique_opps}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_influenced)}
                    </TableCell>
                    <TableCell className="text-right">{fmt(d.revenue_generated)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {d.roas.toFixed(1)}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{fmt(d.cost_per_opp)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      ${d.cost_per_pipeline_dollar.toFixed(2)}
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
