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
  ReferenceLine,
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
import { calculateWinLossSignals } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { pct } from "@/lib/utils";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  accounts: EnrichedAccount[];
}

export function WinLossPanel({ accounts }: Props) {
  const allSignals = useMemo(() => calculateWinLossSignals(accounts), [accounts]);

  // Only show significant signals
  const significant = allSignals.filter((s) => s.statistical_significance);
  const winSignals = significant
    .filter((s) => s.lift_ratio > 1.5)
    .slice(0, 10);
  const lossSignals = significant
    .filter((s) => s.lift_ratio < 0.7)
    .sort((a, b) => a.lift_ratio - b.lift_ratio)
    .slice(0, 10);

  // Diverging bar chart data
  const divergingData = [
    ...winSignals.slice(0, 5).map((s) => ({
      name: s.touchpoint_descriptor.replace(/^(Campaign|Event|Content|Page|Sequence|Channel|Activity): /, ""),
      lift: parseFloat(s.lift_ratio.toFixed(1)),
      type: s.touchpoint_type,
      isWin: true,
    })),
    ...lossSignals.slice(0, 5).map((s) => ({
      name: s.touchpoint_descriptor.replace(/^(Campaign|Event|Content|Page|Sequence|Channel|Activity): /, ""),
      lift: parseFloat(s.lift_ratio.toFixed(1)),
      type: s.touchpoint_type,
      isWin: false,
    })),
  ].sort((a, b) => b.lift - a.lift);

  const topWinSignal = winSignals[0];

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {topWinSignal && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              Deals with{" "}
              <span className="font-semibold">
                {topWinSignal.touchpoint_descriptor}
              </span>{" "}
              are{" "}
              <span className="font-semibold">
                {topWinSignal.lift_ratio.toFixed(1)}x
              </span>{" "}
              more likely to close.{" "}
              {topWinSignal.won_deals_with} deals were won with this touchpoint
              vs {topWinSignal.lost_deals_with} lost.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Win/Loss Signal Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-600">
              <TrendingUp className="h-4 w-4" />
              Top Win Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {winSignals.slice(0, 5).map((s, i) => (
              <div
                key={s.touchpoint_descriptor}
                className="flex items-center justify-between rounded-md bg-green-500/5 px-3 py-2"
              >
                <span className="text-xs">
                  {i + 1}. {s.touchpoint_descriptor}
                </span>
                <Badge className="bg-green-600 text-[10px]">
                  {s.lift_ratio.toFixed(1)}x lift
                </Badge>
              </div>
            ))}
            {winSignals.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Not enough data to determine win signals.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-red-500">
              <TrendingDown className="h-4 w-4" />
              Top Loss Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lossSignals.slice(0, 5).map((s, i) => (
              <div
                key={s.touchpoint_descriptor}
                className="flex items-center justify-between rounded-md bg-red-500/5 px-3 py-2"
              >
                <span className="text-xs">
                  {i + 1}. {s.touchpoint_descriptor}
                </span>
                <Badge variant="destructive" className="text-[10px]">
                  {s.lift_ratio.toFixed(1)}x lift
                </Badge>
              </div>
            ))}
            {lossSignals.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Not enough data to determine loss signals.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diverging Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Win/Loss Lift Ratio (1.0x = neutral)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={divergingData}
                layout="vertical"
                margin={{ left: 180, right: 40, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, "auto"]} />
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
                        <p>Lift: {d.lift}x</p>
                        <p>Type: {d.type}</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="lift" radius={[0, 4, 4, 0]}>
                  {divergingData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.lift > 1.5
                          ? "hsl(142, 50%, 45%)"
                          : entry.lift < 0.7
                            ? "hsl(0, 60%, 50%)"
                            : "hsl(220, 10%, 55%)"
                      }
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
            All Significant Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Touchpoint</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Won %</TableHead>
                  <TableHead className="text-right">Lost %</TableHead>
                  <TableHead className="text-right">Lift</TableHead>
                  <TableHead className="text-right">Significant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {significant.slice(0, 20).map((s) => (
                  <TableRow key={s.touchpoint_descriptor}>
                    <TableCell className="max-w-[250px] truncate text-xs">
                      {s.touchpoint_descriptor}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {s.touchpoint_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {pct(s.won_pct)}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      {pct(s.lost_pct)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {s.lift_ratio.toFixed(1)}x
                    </TableCell>
                    <TableCell className="text-right">
                      {s.statistical_significance ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
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
