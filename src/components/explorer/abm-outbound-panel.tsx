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
import { calculateABMToOutbound } from "@/lib/explorer-analysis";
import type { ABMToOutbound } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

export function ABMOutboundPanel({ accounts }: Props) {
  const data = useMemo(
    () => calculateABMToOutbound(accounts),
    [accounts],
  );

  const top = data[0] as ABMToOutbound | undefined;

  const barData = data.slice(0, 10).map((d) => ({
    name:
      d.abm_touchpoint.length > 35
        ? d.abm_touchpoint.slice(0, 32) + "..."
        : d.abm_touchpoint,
    pipeline: d.pipeline_generated,
    successRate: Math.round(d.outbound_success_rate * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {top && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              The ABM touchpoint most likely to precede a successful outbound
              meeting is{" "}
              <span className="font-semibold">
                &ldquo;{top.abm_touchpoint}&rdquo;
              </span>{" "}
              ({top.channel}) with{" "}
              <span className="font-semibold">{pct(top.outbound_success_rate)}</span>{" "}
              outbound success rate and{" "}
              <span className="font-semibold">{fmt(top.pipeline_generated)}</span>{" "}
              in pipeline generated.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            ABM Touchpoints by Pipeline Generated
            <HelpTip text={HELP_TEXT.explorer_abm_outbound} />
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
                        <p>Success Rate: {d.successRate}%</p>
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
            ABM-to-Outbound Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ABM Touchpoint</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Followed by Outbound</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Avg Days to Outbound</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.abm_touchpoint}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.abm_touchpoint}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {d.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.followed_by_outbound}
                    </TableCell>
                    <TableCell className="text-right">
                      {pct(d.outbound_success_rate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_generated)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(d.avg_days_to_outbound)}d
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
