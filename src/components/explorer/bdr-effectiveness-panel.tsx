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
import { Progress } from "@/components/ui/progress";
import { calculateBDREffectiveness } from "@/lib/explorer-analysis";
import type { UnifiedTouchpoint, EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  touchpoints: UnifiedTouchpoint[];
  accounts: EnrichedAccount[];
}

export function BDREffectivenessPanel({ touchpoints, accounts }: Props) {
  const data = useMemo(
    () => calculateBDREffectiveness(touchpoints, accounts),
    [touchpoints, accounts],
  );

  const best = data[0];
  const worst = data.length > 1 ? data[data.length - 1] : null;

  const barData = data.map((d) => ({
    name:
      d.sequence_name.length > 30
        ? d.sequence_name.slice(0, 27) + "..."
        : d.sequence_name,
    pipeline: d.pipeline_generated,
    replyRate: Math.round(d.reply_rate * 100),
    meetingRate: Math.round(d.meeting_rate * 100),
    convRate: Math.round(d.opp_conversion_rate * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {best && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              Best sequence{" "}
              <span className="font-semibold">
                &ldquo;{best.sequence_name}&rdquo;
              </span>{" "}
              generates <span className="font-semibold">{fmt(best.pipeline_generated)}</span>{" "}
              at {pct(best.opp_conversion_rate)} conversion rate.
              {worst &&
                ` Worst sequence "${worst.sequence_name}" has enrolled ${worst.total_prospects_enrolled} prospects with ${fmt(worst.pipeline_generated)} pipeline.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Best vs Worst Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.slice(0, 3).map((d, i) => (
          <Card
            key={d.sequence_name}
            className={i === 0 ? "border-green-500/20" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {i === 0 && <TrendingUp className="h-4 w-4 text-green-600" />}
                <CardTitle className="text-xs font-semibold">
                  #{i + 1} {d.sequence_name}
                  <HelpTip text={HELP_TEXT.explorer_bdr} />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Pipeline</span>
                <span className="text-lg font-bold">{fmt(d.pipeline_generated)}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Reply Rate</span>
                    <span>{pct(d.reply_rate)}</span>
                  </div>
                  <Progress value={d.reply_rate * 100} className="h-1.5" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Meeting Rate</span>
                    <span>{pct(d.meeting_rate)}</span>
                  </div>
                  <Progress value={d.meeting_rate * 100} className="h-1.5" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Opp Conv Rate</span>
                    <span>{pct(d.opp_conversion_rate)}</span>
                  </div>
                  <Progress value={d.opp_conversion_rate * 100} className="h-1.5" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Best step: #{d.best_performing_step.step_number}</span>
                <Badge variant="outline" className="text-[10px]">
                  {d.best_performing_step.step_type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom sequences warning */}
      {data.length > 3 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.slice(-3).reverse().map((d, i) => (
            <Card key={d.sequence_name} className="border-red-500/10">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {i === 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                  <CardTitle className="text-xs font-semibold text-muted-foreground">
                    Bottom #{i + 1}: {d.sequence_name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Pipeline</span>
                  <span className="text-lg font-bold text-muted-foreground">
                    {fmt(d.pipeline_generated)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {d.total_prospects_enrolled} enrolled · {pct(d.reply_rate)}{" "}
                  reply · {pct(d.opp_conversion_rate)} conv
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Sequence Pipeline Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 180, right: 40, top: 5, bottom: 5 }}
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
                  width={170}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                        <p className="font-semibold">{d.name}</p>
                        <p>Pipeline: {fmt(d.pipeline)}</p>
                        <p>Reply Rate: {d.replyRate}%</p>
                        <p>Conv Rate: {d.convRate}%</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pipeline" fill="hsl(200, 65%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Sequence Performance Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence</TableHead>
                  <TableHead className="text-right">Enrolled</TableHead>
                  <TableHead className="text-right">Replied</TableHead>
                  <TableHead className="text-right">Meetings</TableHead>
                  <TableHead className="text-right">Converted</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Reply Rate</TableHead>
                  <TableHead className="text-right">Conv Rate</TableHead>
                  <TableHead className="text-right">Avg Steps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.sequence_name}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.sequence_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.total_prospects_enrolled}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.prospects_replied}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.prospects_meeting_booked}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.prospects_converted_to_opp}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_generated)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(d.revenue_generated)}
                    </TableCell>
                    <TableCell className="text-right">
                      {pct(d.reply_rate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {pct(d.opp_conversion_rate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.avg_steps_to_reply.toFixed(1)}
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
