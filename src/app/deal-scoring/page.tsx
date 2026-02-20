"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
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
import { ENRICHED_DATA } from "@/lib/mock-enriched-data";
import { scoreAllOpenDeals, backtestDealScoring, type DealScore } from "@/lib/deal-scoring";
import { fmtCurrency } from "@/lib/format";
import { PageGuide } from "@/components/shared/page-guide";
import { SoWhatPanel } from "@/components/cards/so-what-panel";
import { ActionCard } from "@/components/cards/action-card";
import { PAGE_GUIDES } from "@/lib/guide-content";
import { interpretDealScoring } from "@/lib/interpretation-engine";

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

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : score >= 40
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-red-500/15 text-red-600 dark:text-red-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${color}`}
    >
      {score}%
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving")
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === "declining")
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function ScoreBar({
  components,
}: {
  components: DealScore["score_components"];
}) {
  return (
    <div className="flex gap-0.5">
      {components.map((c) => (
        <div
          key={c.factor}
          className="group relative h-6 rounded-sm"
          style={{
            width: `${c.weight * 100}%`,
            backgroundColor:
              c.score >= 70
                ? "hsl(160, 60%, 45%)"
                : c.score >= 40
                ? "hsl(40, 80%, 55%)"
                : "hsl(0, 65%, 55%)",
            opacity: 0.3 + (c.score / 100) * 0.7,
          }}
          title={`${c.factor}: ${c.score}/100 — ${c.detail}`}
        />
      ))}
    </div>
  );
}

export default function DealScoringPage() {
  const scores = useMemo(() => scoreAllOpenDeals(ENRICHED_DATA), []);
  const backtest = useMemo(() => backtestDealScoring(ENRICHED_DATA), []);

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, d) => s + d.probability, 0) / scores.length)
      : 0;
  const highScoreCount = scores.filter((s) => s.probability >= 70).length;
  const atRiskCount = scores.filter((s) => s.probability < 40).length;
  const totalWeightedPipeline = scores.reduce(
    (s, d) => s + d.deal_amount * (d.probability / 100),
    0
  );

  const interpretation = useMemo(
    () =>
      interpretDealScoring({
        scores,
        backtest,
        avgScore,
        atRiskCount,
        totalWeightedPipeline,
      }),
    [scores, backtest, avgScore, atRiskCount, totalWeightedPipeline]
  );

  // Score distribution
  const distribution = [
    { label: "0-20%", count: scores.filter((s) => s.probability < 20).length, color: "bg-red-500" },
    { label: "20-40%", count: scores.filter((s) => s.probability >= 20 && s.probability < 40).length, color: "bg-orange-500" },
    { label: "40-60%", count: scores.filter((s) => s.probability >= 40 && s.probability < 60).length, color: "bg-amber-500" },
    { label: "60-80%", count: scores.filter((s) => s.probability >= 60 && s.probability < 80).length, color: "bg-emerald-400" },
    { label: "80-100%", count: scores.filter((s) => s.probability >= 80).length, color: "bg-emerald-600" },
  ];
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

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
          Predictive Deal Scoring
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every open deal scored by probability of closing based on touchpoint
          pattern analysis against won and lost deals.
        </p>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/deal-scoring"]} />
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Deal Score</p>
                <p className="text-2xl font-bold tabular-nums">{avgScore}%</p>
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
                <p className="text-xs text-muted-foreground">High Probability (70%+)</p>
                <p className="text-2xl font-bold tabular-nums">{highScoreCount}</p>
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
                <p className="text-xs text-muted-foreground">At Risk (&lt;40%)</p>
                <p className="text-2xl font-bold tabular-nums">{atRiskCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weighted Pipeline</p>
                <p className="text-2xl font-bold tabular-nums">
                  {fmtCurrency(totalWeightedPipeline)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI interpretation */}
      <motion.div variants={fadeUp}>
        <SoWhatPanel interpretations={interpretation.kpiSoWhats} />
      </motion.div>

      {/* Score Distribution */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32">
              {distribution.map((bucket) => (
                <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {bucket.count}
                  </span>
                  <div
                    className={`w-full rounded-t-sm ${bucket.color} transition-all`}
                    style={{
                      height: `${(bucket.count / maxCount) * 100}%`,
                      minHeight: bucket.count > 0 ? "8px" : "2px",
                      opacity: bucket.count > 0 ? 1 : 0.2,
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Accuracy (Backtest) */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Accuracy (Backtest on Closed Deals)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">AUC Score</p>
                <p className="text-2xl font-bold tabular-nums">{backtest.auc.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {backtest.auc >= 0.7 ? 'Good discriminative power' : 'Moderate discriminative power'}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Score Separation</p>
                <p className="text-2xl font-bold tabular-nums">{backtest.scoreSeparation.toFixed(0)}pts</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Won avg: {backtest.avgScoreWon.toFixed(0)}% vs Lost avg: {backtest.avgScoreLost.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Precision</p>
                <p className="text-2xl font-bold tabular-nums">{(backtest.precision * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Of predicted wins, how many actually won</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Recall</p>
                <p className="text-2xl font-bold tabular-nums">{(backtest.recall * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Of actual wins, how many were predicted</p>
              </div>
            </div>

            {/* Threshold Analysis */}
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Threshold Analysis</p>
              <div className="flex items-end gap-1 h-24">
                {backtest.thresholdAnalysis.map(t => (
                  <div key={t.threshold} className="flex flex-1 flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-t-sm bg-primary/60 transition-all"
                      style={{ height: `${t.f1 * 100}%`, minHeight: 2 }}
                      title={`F1: ${(t.f1 * 100).toFixed(0)}% | Precision: ${(t.precision * 100).toFixed(0)}% | Recall: ${(t.recall * 100).toFixed(0)}%`}
                    />
                    <span className="text-[9px] text-muted-foreground">{t.threshold}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Score threshold vs F1 score — higher bars = better balance of precision and recall</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Backtest interpretation */}
      <motion.div variants={fadeUp}>
        <SoWhatPanel interpretations={interpretation.backtestSoWhats} />
      </motion.div>

      {/* Deal Score Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Open Deals — Scored by Close Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Deal Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Score Breakdown</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Top Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((deal) => (
                  <TableRow key={deal.opportunity_id}>
                    <TableCell className="font-medium">
                      {deal.account_name}
                      <span className="ml-1.5 text-[10px] text-muted-foreground">
                        {deal.product_line}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtCurrency(deal.deal_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {deal.stage.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={deal.probability} />
                    </TableCell>
                    <TableCell className="w-48">
                      <ScoreBar components={deal.score_components} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          deal.confidence === "high"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : deal.confidence === "medium"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {deal.confidence}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendIcon trend={deal.trend} />
                        <span className="text-xs text-muted-foreground">
                          {deal.trend}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-40">
                      {deal.risk_factors.length > 0 ? (
                        <span
                          className={`text-xs ${
                            deal.risk_factors[0].severity === "high"
                              ? "text-red-500"
                              : deal.risk_factors[0].severity === "medium"
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {deal.risk_factors[0].label}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-500">No risks</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Cards */}
      {interpretation.actions.length > 0 && (
        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
          {interpretation.actions.map((a) => (
            <ActionCard key={a.title} {...a} />
          ))}
        </motion.div>
      )}

      {/* Score Component Legend */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scoring Methodology</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scores[0]?.score_components.map((comp) => (
                <div
                  key={comp.factor}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {Math.round(comp.weight * 100)}%
                  </div>
                  <div>
                    <p className="text-sm font-medium">{comp.factor}</p>
                    <p className="text-xs text-muted-foreground">{comp.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
