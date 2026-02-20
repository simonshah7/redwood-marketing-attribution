"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
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
import { ENRICHED_DATA } from "@/lib/mock-enriched-data";
import { scoreAllOpenDeals } from "@/lib/deal-scoring";
import {
  generateForecast,
  modelForecastScenarios,
  type RevenueForecast,
  type ForecastDeal,
} from "@/lib/revenue-forecast";
import { fmtCurrency } from "@/lib/format";
import { PageGuide } from "@/components/shared/page-guide";
import { PAGE_GUIDES } from "@/lib/guide-content";
import { stagger, fadeUp } from "@/lib/motion";

function CategoryBadge({
  category,
}: {
  category: ForecastDeal["forecast_category"];
}) {
  const config = {
    commit: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    best_case: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    pipeline: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    at_risk: "bg-red-500/15 text-red-600 dark:text-red-400",
  };
  return (
    <Badge variant="secondary" className={`text-[10px] ${config[category]}`}>
      {category.replace(/_/g, " ")}
    </Badge>
  );
}

function ForecastBar({
  marketing,
  stage,
  max,
}: {
  marketing: number;
  stage: number;
  max: number;
}) {
  const scale = max > 0 ? 100 / max : 0;
  return (
    <div className="flex flex-col gap-1 w-40">
      <div className="flex items-center gap-1">
        <div className="h-2.5 flex-1 rounded-full bg-muted">
          <div
            className="h-2.5 rounded-full bg-primary"
            style={{ width: `${marketing * scale}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2.5 flex-1 rounded-full bg-muted">
          <div
            className="h-2.5 rounded-full bg-muted-foreground/40"
            style={{ width: `${stage * scale}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ projection }: { projection: RevenueForecast["weeklyProjection"] }) {
  if (projection.length === 0) return null;
  const maxVal = Math.max(
    ...projection.map((w) => Math.max(w.cumulative_marketing, w.cumulative_stage))
  );
  const height = 160;

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {projection.map((week) => {
        const marketingH = maxVal > 0 ? (week.cumulative_marketing / maxVal) * height : 0;
        const stageH = maxVal > 0 ? (week.cumulative_stage / maxVal) * height : 0;
        return (
          <div key={week.weekLabel} className="flex flex-1 flex-col items-center gap-0.5">
            <div className="flex items-end gap-px w-full" style={{ height }}>
              <div
                className="flex-1 rounded-t-sm bg-primary/60"
                style={{ height: marketingH }}
                title={`Marketing: ${fmtCurrency(week.cumulative_marketing)}`}
              />
              <div
                className="flex-1 rounded-t-sm bg-muted-foreground/30"
                style={{ height: stageH }}
                title={`Stage: ${fmtCurrency(week.cumulative_stage)}`}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{week.weekLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function RevenueForecastPage() {
  const dealScores = useMemo(() => scoreAllOpenDeals(ENRICHED_DATA), []);
  const forecast = useMemo(
    () => generateForecast(ENRICHED_DATA, dealScores),
    [dealScores]
  );
  const scenarios = useMemo(() => modelForecastScenarios(forecast), [forecast]);

  const totalPipeline = forecast.deals.reduce((s, d) => s + d.deal_amount, 0);
  const maxBucketPipeline = Math.max(
    ...forecast.marketingBuckets.map((b) => b.weightedPipeline),
    ...forecast.stageBuckets.map((b) => b.weightedPipeline),
    1
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Revenue Forecast — {forecast.quarterLabel}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marketing-informed forecast based on deal scores and touchpoint
          patterns vs traditional stage-based forecast.
        </p>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/revenue-forecast"]} />
      </motion.div>

      {/* KPI Row */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Marketing Forecast
                </p>
                <p className="text-2xl font-bold tabular-nums text-primary">
                  {fmtCurrency(forecast.marketingForecastTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High Confidence</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600">
                  {fmtCurrency(forecast.marketingHighConfidence)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold tabular-nums text-red-500">
                  {fmtCurrency(forecast.marketingAtRisk)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Stage-Based Forecast
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {fmtCurrency(forecast.stageForecastTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Forecast Comparison Buckets */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Forecast Comparison: Marketing-Informed vs Stage-Based
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {forecast.marketingBuckets.map((bucket, i) => (
                <div key={bucket.label} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">{bucket.label}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    {bucket.dealCount} deal{bucket.dealCount !== 1 ? "s" : ""} |{" "}
                    {fmtCurrency(bucket.pipeline)} pipeline
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-primary font-medium">
                        Marketing
                      </span>
                      <span className="text-sm font-mono font-bold text-primary">
                        {fmtCurrency(bucket.weightedPipeline)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{
                          width: `${
                            (bucket.weightedPipeline / maxBucketPipeline) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Stage-Based
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {fmtCurrency(forecast.stageBuckets[i].weightedPipeline)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-muted-foreground/40"
                        style={{
                          width: `${
                            (forecast.stageBuckets[i].weightedPipeline /
                              maxBucketPipeline) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                Marketing-informed (deal score weighted)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" />
                Stage-based (traditional probability)
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Projection */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Weekly Cumulative Projection — {forecast.quarterLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart projection={forecast.weeklyProjection} />
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
                Marketing-informed
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" />
                Stage-based
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scenario Modeling */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scenario Modeling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {scenarios.map(scenario => (
                <div key={scenario.label} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{scenario.label}</p>
                    <span className={`text-xs font-mono font-bold ${
                      scenario.deltaFromBase >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {scenario.deltaFromBase >= 0 ? '+' : ''}{fmtCurrency(scenario.deltaFromBase)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">{scenario.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Adjusted forecast</span>
                    <span className="text-lg font-bold font-mono">{fmtCurrency(scenario.adjustedTotal)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${scenario.deltaFromBase >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.max(5, (scenario.adjustedTotal / (forecast.marketingForecastTotal * 1.5)) * 100))}%` }}
                    />
                  </div>
                  {scenario.adjustedDeals.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {scenario.adjustedDeals.slice(0, 3).map((d, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground">
                          {d.account_name}: {d.originalCategory} → {d.newCategory} ({d.impact >= 0 ? '+' : ''}{fmtCurrency(d.impact)})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Deal-Level Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal-Level Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Deal Amount</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Deal Score</TableHead>
                  <TableHead className="text-right">Marketing Weighted</TableHead>
                  <TableHead className="text-right">Stage Weighted</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecast.deals.map((deal) => (
                  <TableRow key={deal.account_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{deal.account_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {deal.product_line}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtCurrency(deal.deal_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {deal.stage.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm ${
                          deal.deal_score >= 70
                            ? "text-emerald-600"
                            : deal.deal_score >= 40
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {deal.deal_score}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary">
                      {fmtCurrency(deal.marketing_weighted_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {fmtCurrency(deal.stage_weighted_amount)}
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={deal.forecast_category} />
                      {deal.risk_reason && (
                        <p className="text-[9px] text-red-400 mt-0.5">
                          {deal.risk_reason}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
