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
import { calculateDealVelocityPaths } from "@/lib/explorer-analysis";
import type { DealVelocityComparison } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb, ArrowRight } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

const STEP_COLORS: Record<string, string> = {
  "LinkedIn Ad": "hsl(200, 65%, 50%)",
  "Organic Social": "hsl(195, 55%, 45%)",
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

const FAST_COLOR = "hsl(168, 55%, 45%)";
const SLOW_COLOR = "hsl(350, 55%, 50%)";

export function DealVelocityPanel({ accounts }: Props) {
  const data: DealVelocityComparison = useMemo(
    () => calculateDealVelocityPaths(accounts),
    [accounts],
  );

  const topDiff = data.differentiating_touchpoints[0];

  const barData = data.differentiating_touchpoints.slice(0, 10).map((d) => ({
    name: d.touchpoint,
    fast: Math.round(d.fast_pct * 100),
    slow: Math.round(d.slow_pct * 100),
  }));

  function renderSequenceCards(
    paths: DealVelocityComparison["fast_deals"],
    label: string,
  ) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{label}</h3>
        {paths.slice(0, 5).map((seq, i) => (
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
                <span className="text-xs text-muted-foreground">
                  ~{Math.round(seq.avg_days_to_close)}d ·{" "}
                  {seq.avg_touchpoints.toFixed(1)} touches
                </span>
              </div>
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            The median deal velocity is{" "}
            <span className="font-semibold">
              {Math.round(data.median_days)} days
            </span>
            .
            {topDiff && (
              <>
                {" "}The biggest differentiator is{" "}
                <span className="font-semibold">{topDiff.touchpoint}</span>,
                present in{" "}
                <span className="font-semibold">{pct(topDiff.fast_pct)}</span>{" "}
                of fast deals vs{" "}
                <span className="font-semibold">{pct(topDiff.slow_pct)}</span>{" "}
                of slow deals ({topDiff.lift.toFixed(1)}x lift).
              </>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Grouped Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Touchpoint Prevalence: Fast vs Slow Deals
            <HelpTip text={HELP_TEXT.explorer_velocity} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 120, right: 40, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  unit="%"
                />
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
                        <p>Fast deals: {d.fast}%</p>
                        <p>Slow deals: {d.slow}%</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="fast" name="Fast Deals" fill={FAST_COLOR} radius={[0, 4, 4, 0]} />
                <Bar dataKey="slow" name="Slow Deals" fill={SLOW_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Fast Deal Patterns */}
      {renderSequenceCards(data.fast_deals, "Fast Deal Patterns")}

      {/* Slow Deal Patterns */}
      {renderSequenceCards(data.slow_deals, "Slow Deal Patterns")}

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Differentiating Touchpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Touchpoint</TableHead>
                  <TableHead className="text-right">Fast Deal %</TableHead>
                  <TableHead className="text-right">Slow Deal %</TableHead>
                  <TableHead className="text-right">Lift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.differentiating_touchpoints.map((d) => (
                  <TableRow key={d.touchpoint}>
                    <TableCell className="text-xs font-medium">
                      {d.touchpoint}
                    </TableCell>
                    <TableCell className="text-right">{pct(d.fast_pct)}</TableCell>
                    <TableCell className="text-right">{pct(d.slow_pct)}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={d.lift > 1.2 ? "default" : d.lift < 0.8 ? "destructive" : "outline"}
                        className="text-[10px]"
                      >
                        {d.lift.toFixed(2)}x
                      </Badge>
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
