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
import { calculateMarketingXDRCombos } from "@/lib/explorer-analysis";
import type { MarketingXDRCombo } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb, ArrowRight, Plus } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

const MARKETING_COLOR = "hsl(200, 65%, 50%)";
const XDR_COLOR = "hsl(350, 55%, 50%)";

export function MarketingXDRPanel({ accounts }: Props) {
  const data = useMemo(
    () => calculateMarketingXDRCombos(accounts),
    [accounts],
  );

  const best = data[0];

  const barData = data.slice(0, 10).map((d) => ({
    name:
      d.combo_label.length > 40
        ? d.combo_label.slice(0, 37) + "..."
        : d.combo_label,
    pipeline: d.pipeline_value,
    convProb: Math.round(d.conversion_probability * 100),
    count: d.occurrence_count,
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {best && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              The highest-converting combo is{" "}
              <span className="font-semibold">{best.combo_label}</span> with a{" "}
              <span className="font-semibold">
                {pct(best.conversion_probability)}
              </span>{" "}
              conversion probability across {best.occurrence_count} deals worth{" "}
              <span className="font-semibold">{fmt(best.pipeline_value)}</span>{" "}
              in pipeline.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top 5 Combo Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Top Marketing + xDR Combos</h3>
        {data.slice(0, 5).map((combo, i) => (
          <Card key={combo.combo_label}>
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
                    {combo.occurrence_count} deals · {fmt(combo.pipeline_value)}{" "}
                    pipeline
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={combo.conversion_probability > 0.5 ? "default" : "outline"}
                    className={
                      combo.conversion_probability > 0.5
                        ? "bg-green-600 text-[10px]"
                        : "text-[10px]"
                    }
                  >
                    {pct(combo.conversion_probability)} conv
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ~{Math.round(combo.avg_days_to_convert)}d
                  </span>
                </div>
              </div>

              {/* Combo flow visualization */}
              <div className="flex flex-wrap items-center gap-1">
                {combo.marketing_steps.map((step, j) => (
                  <div key={`m-${j}`} className="flex items-center gap-1">
                    {j > 0 && <Plus className="h-3 w-3 text-muted-foreground" />}
                    <div
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: MARKETING_COLOR }}
                    >
                      {step}
                    </div>
                  </div>
                ))}
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                {combo.xdr_steps.map((step, j) => (
                  <div key={`x-${j}`} className="flex items-center gap-1">
                    {j > 0 && <Plus className="h-3 w-3 text-muted-foreground" />}
                    <div
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: XDR_COLOR }}
                    >
                      {step}
                    </div>
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
            Combo Comparison: Pipeline & Conversion
            <HelpTip text={HELP_TEXT.explorer_xdr_combos} />
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
                        <p>Conversion: {d.convProb}%</p>
                        <p>Deals: {d.count}</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="pipeline"
                  name="Pipeline"
                  fill={MARKETING_COLOR}
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
            Combo Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Combo</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Won</TableHead>
                  <TableHead className="text-right">Conv Probability</TableHead>
                  <TableHead className="text-right">Avg Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.combo_label}>
                    <TableCell className="max-w-[300px] text-xs font-medium">
                      {d.combo_label}
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
                    <TableCell className="text-right">
                      <Badge
                        variant={d.conversion_probability > 0.5 ? "default" : "outline"}
                        className={
                          d.conversion_probability > 0.5
                            ? "bg-green-600 text-[10px]"
                            : "text-[10px]"
                        }
                      >
                        {pct(d.conversion_probability)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(d.avg_days_to_convert)}d
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
