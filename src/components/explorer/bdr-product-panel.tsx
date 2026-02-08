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
import { calculateBDRByProduct } from "@/lib/explorer-analysis";
import type { BDRByProduct } from "@/lib/explorer-analysis";
import type { UnifiedTouchpoint, EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  touchpoints: UnifiedTouchpoint[];
  accounts: EnrichedAccount[];
}

export function BDRProductPanel({ touchpoints, accounts }: Props) {
  const data = useMemo(
    () => calculateBDRByProduct(touchpoints, accounts),
    [touchpoints, accounts],
  );

  const best = data[0];

  const barData = data.slice(0, 10).map((d) => ({
    name:
      d.sequence_name.length > 30
        ? d.sequence_name.slice(0, 27) + "..."
        : d.sequence_name,
    pipeline: d.pipeline_generated,
    replyRate: Math.round(d.reply_rate * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {best && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              Top BDR sequence{" "}
              <span className="font-semibold">
                &ldquo;{best.sequence_name}&rdquo;
              </span>{" "}
              ({best.product_line}) generates{" "}
              <span className="font-semibold">{fmt(best.pipeline_generated)}</span>{" "}
              pipeline with a{" "}
              <span className="font-semibold">{pct(best.reply_rate)}</span> reply
              rate.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Sequence Pipeline by Product
            <HelpTip text={HELP_TEXT.explorer_bdr_product} />
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
            BDR Sequence Detail by Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence Name</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Enrolled</TableHead>
                  <TableHead className="text-right">Replied</TableHead>
                  <TableHead className="text-right">Meetings</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Reply Rate</TableHead>
                  <TableHead className="text-right">Meeting Rate</TableHead>
                  <TableHead className="text-right">Avg Steps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={`${d.sequence_name}-${d.product_line}`}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.sequence_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {d.product_line}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{d.enrolled}</TableCell>
                    <TableCell className="text-right">{d.replied}</TableCell>
                    <TableCell className="text-right">{d.meetings_booked}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_generated)}
                    </TableCell>
                    <TableCell className="text-right">{pct(d.reply_rate)}</TableCell>
                    <TableCell className="text-right">{pct(d.meeting_rate)}</TableCell>
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
