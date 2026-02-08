"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateConversionEffort, type ConversionEffort } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { fmt } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

const CHANNEL_COLORS: Record<string, string> = {
  "Web Visit": "hsl(200, 65%, 50%)",
  "Email Nurture": "hsl(168, 55%, 45%)",
  "LinkedIn Ad": "hsl(220, 50%, 58%)",
  "Paid Search": "hsl(38, 55%, 55%)",
  Event: "hsl(280, 45%, 55%)",
  "Direct Mail": "hsl(340, 50%, 55%)",
  Webinar: "hsl(140, 45%, 48%)",
};

function channelColor(ch: string) {
  return CHANNEL_COLORS[ch] || "hsl(220, 10%, 50%)";
}

export function ConversionEffortPanel({ accounts }: Props) {
  const data = useMemo(() => calculateConversionEffort(accounts), [accounts]);

  const overall = data.find((d) => d.dimension_type === "overall");

  const barData = data
    .filter((d) => d.dimension_type === "overall" || d.dimension_type === "region")
    .map((d) => ({
      name: d.dimension_label,
      avg_touches: Number(d.avg_touches_to_convert.toFixed(1)),
    }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {overall && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              On average, it takes{" "}
              <span className="font-semibold">
                {overall.avg_touches_to_convert.toFixed(1)} touches
              </span>{" "}
              to convert an account (median {overall.median_touches}) across{" "}
              <span className="font-semibold">{overall.opp_count}</span>{" "}
              converted opportunities with{" "}
              <span className="font-semibold">{fmt(overall.avg_pipeline)}</span>{" "}
              average pipeline.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Avg Touches to Convert by Region
            <HelpTip text={HELP_TEXT.explorer_conversion_effort} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                        <p className="font-semibold">{d.name}</p>
                        <p>Avg Touches: {d.avg_touches}</p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avg_touches" name="Avg Touches" fill="hsl(200, 65%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Conversion Effort Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimension</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Avg Touches</TableHead>
                  <TableHead className="text-right">Median Touches</TableHead>
                  <TableHead className="text-right">Opp Count</TableHead>
                  <TableHead className="text-right">Avg Pipeline</TableHead>
                  <TableHead>Top Channels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={`${d.dimension_type}-${d.dimension_label}`}>
                    <TableCell className="text-xs font-medium">{d.dimension_label}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{d.dimension_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{d.avg_touches_to_convert.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{d.median_touches}</TableCell>
                    <TableCell className="text-right">{d.opp_count}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(d.avg_pipeline)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {d.touch_type_breakdown.slice(0, 3).map((ch) => (
                          <Badge
                            key={ch.channel}
                            variant="secondary"
                            className="text-[10px] whitespace-nowrap"
                            style={{ borderColor: channelColor(ch.channel) }}
                          >
                            {ch.channel}: {ch.avg_count.toFixed(1)}
                          </Badge>
                        ))}
                      </div>
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
