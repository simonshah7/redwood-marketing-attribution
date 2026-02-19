"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { optimizeSpend, type OptimizationResult } from "@/lib/spend-optimizer";
import { TOTAL_QUARTERLY_BUDGET } from "@/lib/mock-channel-spend";
import { fmtCurrency } from "@/lib/format";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

function AllocationBar({
  current,
  recommended,
  max,
}: {
  current: number;
  recommended: number;
  max: number;
}) {
  const scale = max > 0 ? 100 / max : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] w-16 text-muted-foreground">Current</span>
        <div className="h-3 flex-1 rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-muted-foreground/40"
            style={{ width: `${current * scale}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] w-16 text-primary font-medium">Optimized</span>
        <div className="h-3 flex-1 rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-primary"
            style={{ width: `${recommended * scale}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function WaterfallBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.abs(value) / max : 0;
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="h-5 flex-1 rounded-sm bg-muted relative overflow-hidden">
        <div
          className={`absolute top-0 h-5 rounded-sm ${
            isPositive ? "bg-emerald-500" : "bg-red-500"
          }`}
          style={{
            width: `${pct * 100}%`,
            left: isPositive ? "50%" : undefined,
            right: !isPositive ? "50%" : undefined,
          }}
        />
        <div className="absolute top-0 left-1/2 h-5 w-px bg-border" />
      </div>
    </div>
  );
}

export default function SpendOptimizerPage() {
  const [budget, setBudget] = useState(TOTAL_QUARTERLY_BUDGET);
  const result = useMemo(() => optimizeSpend(budget), [budget]);

  const maxBudget = Math.max(
    ...result.allocations.map((a) =>
      Math.max(a.currentBudget, a.recommendedBudget)
    )
  );
  const maxDelta = Math.max(
    1,
    ...result.allocations.map((a) => Math.abs(a.pipelineDelta))
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">
          Marketing Spend Optimizer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Optimal budget allocation based on marginal ROI analysis across
          channels. Equalize marginal returns to maximize pipeline.
        </p>
      </motion.div>

      {/* Budget Input + KPIs */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">
              Quarterly Budget
            </p>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                value={budget}
                onChange={(e) =>
                  setBudget(
                    Math.max(50000, Math.min(1000000, Number(e.target.value)))
                  )
                }
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-lg font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                step={10000}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Current Pipeline</p>
            <p className="text-2xl font-bold tabular-nums">
              {fmtCurrency(result.currentTotalPipeline)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Projected Pipeline</p>
            <p className="text-2xl font-bold tabular-nums text-primary">
              {fmtCurrency(result.projectedTotalPipeline)}
            </p>
          </CardContent>
        </Card>
        <Card
          className={`${
            result.pipelineDelta >= 0
              ? "border-emerald-500/30"
              : "border-red-500/30"
          }`}
        >
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">
              Projected Pipeline Impact
            </p>
            <div className="flex items-center gap-2">
              <p
                className={`text-2xl font-bold tabular-nums ${
                  result.pipelineDelta >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {result.pipelineDelta >= 0 ? "+" : ""}
                {fmtCurrency(result.pipelineDelta)}
              </p>
              <Badge
                variant="secondary"
                className={`text-[10px] ${
                  result.pipelineDelta >= 0
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-red-500/10 text-red-600"
                }`}
              >
                {result.pipelineDeltaPct >= 0 ? "+" : ""}
                {result.pipelineDeltaPct.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Allocation Comparison */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Current vs Recommended Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.allocations.map((alloc) => (
                <div key={alloc.channel} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{alloc.channelName}</span>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="text-muted-foreground">
                        {fmtCurrency(alloc.currentBudget)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-primary">
                        {fmtCurrency(alloc.recommendedBudget)}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 ${
                          alloc.change > 0
                            ? "text-emerald-600"
                            : alloc.change < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {alloc.change > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : alloc.change < 0 ? (
                          <ArrowDownRight className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {alloc.change > 0 ? "+" : ""}
                        {fmtCurrency(alloc.change)}
                      </span>
                    </div>
                  </div>
                  <AllocationBar
                    current={alloc.currentBudget}
                    recommended={alloc.recommendedBudget}
                    max={maxBudget}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Channel Detail Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel Economics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Current Spend</TableHead>
                  <TableHead className="text-right">Recommended</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Current ROI</TableHead>
                  <TableHead className="text-right">Projected ROI</TableHead>
                  <TableHead>Pipeline Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.allocations.map((alloc) => (
                  <TableRow key={alloc.channel}>
                    <TableCell className="font-medium">
                      {alloc.channelName}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtCurrency(alloc.currentBudget)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary">
                      {fmtCurrency(alloc.recommendedBudget)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm ${
                          alloc.change > 0
                            ? "text-emerald-600"
                            : alloc.change < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {alloc.changePct > 0 ? "+" : ""}
                        {alloc.changePct.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {alloc.currentROI.toFixed(1)}x
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary">
                      {alloc.projectedROI.toFixed(1)}x
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WaterfallBar
                          value={alloc.pipelineDelta}
                          max={maxDelta}
                        />
                        <span
                          className={`text-xs font-mono ${
                            alloc.pipelineDelta >= 0
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {alloc.pipelineDelta >= 0 ? "+" : ""}
                          {fmtCurrency(alloc.pipelineDelta)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Methodology */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">
              <strong>Methodology:</strong> Budget optimization uses marginal ROI
              equalization. Each channel follows a diminishing returns curve
              (pipeline = coefficient × √spend). The algorithm redistributes
              budget so that the last dollar spent on each channel generates equal
              marginal pipeline, subject to minimum and maximum constraints per
              channel. This approach maximizes total pipeline for any given budget.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
