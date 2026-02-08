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
import { calculateFirstTouchByProduct } from "@/lib/explorer-analysis";
import type { FirstTouchByProduct } from "@/lib/explorer-analysis";
import type { EnrichedAccount } from "@/lib/enriched-data";
import { fmt, pct } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";

interface Props {
  accounts: EnrichedAccount[];
}

export function FirstTouchProductPanel({ accounts }: Props) {
  const data = useMemo(
    () => calculateFirstTouchByProduct(accounts),
    [accounts],
  );

  const top = data[0];

  const barData = data.slice(0, 12).map((d) => ({
    name:
      d.first_touchpoint.length > 35
        ? d.first_touchpoint.slice(0, 32) + "..."
        : d.first_touchpoint,
    frequency: d.frequency,
    product: d.product_line,
  }));

  return (
    <div className="space-y-6">
      {/* Insight Card */}
      {top && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              The most common first touchpoint is{" "}
              <span className="font-semibold">{top.first_touchpoint}</span>{" "}
              ({top.channel}, {top.product_line}) — appearing in{" "}
              <span className="font-semibold">{top.frequency}</span>{" "}
              journeys with {fmt(top.pipeline_generated)} pipeline and{" "}
              {pct(top.conversion_rate)} conversion rate.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Top First Touchpoints by Frequency
            <HelpTip text={HELP_TEXT.explorer_first_touch_product} />
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
                <XAxis type="number" tick={{ fontSize: 11 }} />
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
                        <p>Frequency: {d.frequency}</p>
                        <p>Product: {d.product}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="frequency" fill="hsl(200, 65%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            First Touch by Product Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Touchpoint</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Frequency</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Conv Rate</TableHead>
                  <TableHead>Product Line</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d, i) => (
                  <TableRow key={`${d.first_touchpoint}-${d.product_line}-${i}`}>
                    <TableCell className="max-w-[200px] truncate text-xs font-medium">
                      {d.first_touchpoint}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {d.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{d.frequency}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(d.pipeline_generated)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(d.revenue_generated)}
                    </TableCell>
                    <TableCell className="text-right">
                      {pct(d.conversion_rate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {d.product_line}
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
