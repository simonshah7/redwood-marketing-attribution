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
import { calculateCreativePerformance } from "@/lib/explorer-analysis";
import type { CreativePerformance } from "@/lib/explorer-analysis";
import type { UnifiedTouchpoint, EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

const TYPE_COLORS: Record<CreativePerformance["creative_type"], string> = {
  paid_social: "hsl(200, 65%, 50%)",
  organic_social: "hsl(195, 55%, 45%)",
  digital_creative: "hsl(280, 45%, 55%)",
};

interface Props {
  touchpoints: UnifiedTouchpoint[];
  accounts: EnrichedAccount[];
}

export function CreativePerformancePanel({ touchpoints, accounts }: Props) {
  const data = useMemo(
    () => calculateCreativePerformance(touchpoints, accounts),
    [touchpoints, accounts],
  );

  const top = data[0];

  const barData = data.slice(0, 12).map((d) => ({
    name:
      d.creative_name.length > 35
        ? d.creative_name.slice(0, 32) + "..."
        : d.creative_name,
    pipeline: d.pipeline_influenced,
    type: d.creative_type,
    opps: d.unique_opps,
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {top && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              Top creative variant is{" "}
              <span className="font-semibold">
                &ldquo;{top.creative_name}&rdquo;
              </span>{" "}
              ({top.creative_type}) — influencing{" "}
              <span className="font-semibold">{fmt(top.pipeline_influenced)}</span>{" "}
              in pipeline across {top.unique_opps} opportunities with{" "}
              {pct(top.meeting_conversion_rate)} meeting conversion.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Creative Variants by Pipeline Influenced
            <HelpTip text={HELP_TEXT.explorer_creative} />
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
                        <p>Type: {d.type}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.type]} />
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
            Creative Performance Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creative Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Unique Opps</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Meeting Conv Rate</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Cost/Meeting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.creative_name}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.creative_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{ borderColor: TYPE_COLORS[d.creative_type] }}
                      >
                        {d.creative_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{d.impression_count}</TableCell>
                    <TableCell className="text-right">{d.click_count}</TableCell>
                    <TableCell className="text-right">{d.unique_opps}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_influenced)}
                    </TableCell>
                    <TableCell className="text-right">{pct(d.meeting_conversion_rate)}</TableCell>
                    <TableCell className="text-right">{fmt(d.total_spend)}</TableCell>
                    <TableCell className="text-right">{fmt(d.cost_per_meeting)}</TableCell>
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
