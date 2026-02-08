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
import {
  calculatePreMeetingInfluence,
  type PreMeetingTouchpoint,
} from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

export function PreMeetingPanel({ accounts }: Props) {
  const data = useMemo(
    () => calculatePreMeetingInfluence(accounts),
    [accounts],
  );

  const top3 = data.slice(0, 3);
  const top3Pipeline = top3.reduce((s, d) => s + d.pipeline_influenced, 0);

  const chartData = data.slice(0, 15).map((d) => ({
    name:
      d.touchpoint_descriptor.length > 30
        ? d.touchpoint_descriptor.slice(0, 28) + "…"
        : d.touchpoint_descriptor,
    score: d.frequency * d.pipeline_influenced,
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
            Top pre-meeting touchpoints are{" "}
            <span className="font-semibold">
              {top3.map((d) => d.touchpoint_descriptor).join(", ")}
            </span>{" "}
            — influencing deals worth{" "}
            <span className="font-semibold">{fmt(top3Pipeline)}</span> in the 14
            days before a meeting was booked.
          </p>
        </CardContent>
      </Card>

      {/* Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Pre-Meeting Touchpoints by Frequency × Pipeline
            <HelpTip text={HELP_TEXT.explorer_pre_meeting} />
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
                        <p>Pipeline: {fmt(d.pipeline)}</p>
                        <p>Conv Rate: {pct(d.convRate)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
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
            Pre-Meeting Touchpoint Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Touchpoint</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Frequency</TableHead>
                  <TableHead className="text-right">Unique Opps</TableHead>
                  <TableHead className="text-right">Pipeline Influenced</TableHead>
                  <TableHead className="text-right">Conv Rate</TableHead>
                  <TableHead className="text-right">Avg Days Before</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 15).map((d) => (
                  <TableRow key={d.touchpoint_descriptor}>
                    <TableCell className="font-mono text-xs">
                      {d.touchpoint_descriptor}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {d.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{d.frequency}</TableCell>
                    <TableCell className="text-right">{d.unique_opps}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_influenced)}
                    </TableCell>
                    <TableCell className="text-right">
                      {pct(d.conversion_rate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.avg_days_before_meeting.toFixed(1)}d
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
