"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
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
import { calculateContentImpact } from "@/lib/explorer-analysis";
import type { UnifiedTouchpoint, EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

const ASSET_TYPE_COLORS: Record<string, string> = {
  whitepaper: "hsl(200, 65%, 50%)",
  datasheet: "hsl(168, 55%, 45%)",
  case_study: "hsl(38, 55%, 55%)",
  guide: "hsl(280, 45%, 55%)",
  roi_calculator: "hsl(140, 45%, 48%)",
  infographic: "hsl(340, 50%, 55%)",
  video: "hsl(220, 50%, 58%)",
  webinar_recording: "hsl(45, 60%, 50%)",
  unknown: "hsl(220, 10%, 50%)",
};

interface Props {
  touchpoints: UnifiedTouchpoint[];
  accounts: EnrichedAccount[];
}

export function ContentImpactPanel({ touchpoints, accounts }: Props) {
  const data = useMemo(
    () => calculateContentImpact(touchpoints, accounts),
    [touchpoints, accounts],
  );

  const topAsset = data[0];

  const bubbleData = data.map((d) => ({
    x: d.unique_opps,
    y: d.pipeline_influenced,
    z: d.influence_score,
    name: d.content_asset,
    type: d.asset_type,
    fill: ASSET_TYPE_COLORS[d.asset_type] || ASSET_TYPE_COLORS.unknown,
  }));

  // Group by asset type for legend
  const typeGroups = new Map<string, number>();
  data.forEach((d) => {
    typeGroups.set(d.asset_type, (typeGroups.get(d.asset_type) || 0) + 1);
  });

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {topAsset && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              Top performing content asset is{" "}
              <span className="font-semibold">
                &ldquo;{topAsset.content_asset}&rdquo;
              </span>{" "}
              ({topAsset.asset_type}) — influencing{" "}
              <span className="font-semibold">{fmt(topAsset.pipeline_influenced)}</span>{" "}
              in pipeline across {topAsset.unique_opps} opportunities.
              {topAsset.appears_in_won_pct > 0 &&
                ` Appears in ${pct(topAsset.appears_in_won_pct)} of won deals.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bubble Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Content Impact: Opps vs Pipeline (Bubble = Influence Score)
            <HelpTip text={HELP_TEXT.explorer_content_impact} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-3">
            {Array.from(typeGroups.entries()).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      ASSET_TYPE_COLORS[type] || ASSET_TYPE_COLORS.unknown,
                  }}
                />
                <span className="text-muted-foreground">
                  {type} ({count})
                </span>
              </div>
            ))}
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Unique Opps"
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "Unique Opportunities",
                    position: "bottom",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Pipeline"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => fmt(v)}
                  label={{
                    value: "Pipeline Influenced",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="z"
                  range={[50, 400]}
                  name="Influence"
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-card p-2 text-xs shadow-md">
                        <p className="font-semibold">{d.name}</p>
                        <p className="text-muted-foreground">
                          Type: {d.type}
                        </p>
                        <p>Opps: {d.x}</p>
                        <p>Pipeline: {fmt(d.y)}</p>
                      </div>
                    );
                  }}
                />
                <Scatter data={bubbleData}>
                  {bubbleData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Content Asset Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Interactions</TableHead>
                  <TableHead className="text-right">Unique Opps</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Won %</TableHead>
                  <TableHead className="text-right">Lost %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.content_asset}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.content_asset}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{
                          borderColor:
                            ASSET_TYPE_COLORS[d.asset_type] ||
                            ASSET_TYPE_COLORS.unknown,
                        }}
                      >
                        {d.asset_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.interaction_count}
                    </TableCell>
                    <TableCell className="text-right">{d.unique_opps}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_influenced)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(d.revenue_influenced)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {pct(d.appears_in_won_pct)}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      {pct(d.appears_in_lost_pct)}
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
