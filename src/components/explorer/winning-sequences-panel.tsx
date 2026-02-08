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
import { findWinningSequences } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb, ArrowRight } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

const STEP_COLORS: Record<string, string> = {
  "LinkedIn Ad": "hsl(200, 65%, 50%)",
  "Email Nurture": "hsl(220, 50%, 58%)",
  Newsletter: "hsl(230, 45%, 62%)",
  "Web Visit": "hsl(280, 45%, 55%)",
  "Form Fill": "hsl(168, 55%, 45%)",
  Event: "hsl(38, 55%, 55%)",
  Webinar: "hsl(45, 60%, 50%)",
  "BDR Email": "hsl(340, 50%, 55%)",
  "BDR Call": "hsl(350, 55%, 50%)",
  "BDR LinkedIn": "hsl(0, 50%, 55%)",
  "Content DL": "hsl(140, 45%, 48%)",
};

export function WinningSequencesPanel({ accounts }: Props) {
  const data = useMemo(() => findWinningSequences(accounts), [accounts]);

  const topSeq = data[0];

  // Average journey for comparison
  const allDurations = accounts
    .filter((a) => a.touchpoints.length >= 2)
    .map((a) => {
      const first = new Date(a.touchpoints[0].date).getTime();
      const last = new Date(a.touchpoints[a.touchpoints.length - 1].date).getTime();
      return (last - first) / 86400000;
    });
  const avgDuration =
    allDurations.length > 0
      ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
      : 0;

  const barData = data.slice(0, 10).map((d) => ({
    name:
      d.pattern_label.length > 40
        ? d.pattern_label.slice(0, 37) + "..."
        : d.pattern_label,
    pipeline: d.pipeline_value,
    winRate: Math.round(d.win_rate * 100),
    count: d.occurrence_count,
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {topSeq && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              The most effective sequence is{" "}
              <span className="font-semibold">
                {topSeq.pattern_label}
              </span>{" "}
              with a{" "}
              <span className="font-semibold">{pct(topSeq.win_rate)}</span>{" "}
              close rate across {topSeq.occurrence_count} deals worth{" "}
              <span className="font-semibold">{fmt(topSeq.pipeline_value)}</span>.
              {topSeq.avg_journey_duration_days < avgDuration &&
                ` Deals following this pattern close ${Math.round(avgDuration - topSeq.avg_journey_duration_days)} days faster than average.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top 5 Sequence Cards (flow visualization) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Top Winning Sequences</h3>
        {data.slice(0, 5).map((seq, i) => (
          <Card key={seq.pattern_label}>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={i === 0 ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    #{i + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {seq.occurrence_count} deals · {fmt(seq.pipeline_value)}{" "}
                    pipeline
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={seq.win_rate > 0.5 ? "default" : "outline"}
                    className={
                      seq.win_rate > 0.5
                        ? "bg-green-600 text-[10px]"
                        : "text-[10px]"
                    }
                  >
                    {pct(seq.win_rate)} win rate
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ~{Math.round(seq.avg_journey_duration_days)}d
                  </span>
                </div>
              </div>

              {/* Sequence flow visualization */}
              <div className="flex flex-wrap items-center gap-1">
                {seq.sequence_pattern.map((step, j) => (
                  <div key={j} className="flex items-center gap-1">
                    <div
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          STEP_COLORS[step] || "hsl(220, 10%, 50%)",
                      }}
                    >
                      {step}
                    </div>
                    {j < seq.sequence_pattern.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Sequence Comparison: Pipeline & Win Rate
            <HelpTip text={HELP_TEXT.explorer_sequences} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 200, right: 40, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  width={190}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                        <p className="font-semibold">{d.name}</p>
                        <p>Pipeline: {fmt(d.pipeline)}</p>
                        <p>Win Rate: {d.winRate}%</p>
                        <p>Deals: {d.count}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar
                  dataKey="pipeline"
                  name="pipeline"
                  fill="hsl(200, 65%, 50%)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Sequence Pattern Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence Pattern</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Won</TableHead>
                  <TableHead className="text-right">Lost</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                  <TableHead className="text-right">Avg Touches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.pattern_label}>
                    <TableCell className="max-w-[300px] text-xs font-medium">
                      {d.pattern_label}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.occurrence_count}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_value)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {d.won_count}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      {d.lost_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={d.win_rate > 0.5 ? "default" : "outline"}
                        className={
                          d.win_rate > 0.5
                            ? "bg-green-600 text-[10px]"
                            : "text-[10px]"
                        }
                      >
                        {pct(d.win_rate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(d.avg_journey_duration_days)}d
                    </TableCell>
                    <TableCell className="text-right">
                      {d.avg_touchpoints_total.toFixed(1)}
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
