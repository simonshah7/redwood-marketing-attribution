"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  CheckCircle2,
  Target,
  TrendingUp,
  ArrowRight,
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
import { analyzeCrossSell, type CrossSellSummary } from "@/lib/cross-sell-analysis";
import { fmtCurrency } from "@/lib/format";
import { PageGuide } from "@/components/shared/page-guide";
import { PAGE_GUIDES } from "@/lib/guide-content";

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

function ReadinessBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor:
              score >= 60
                ? "hsl(160, 60%, 45%)"
                : score >= 35
                ? "hsl(40, 80%, 55%)"
                : "hsl(220, 50%, 55%)",
          }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums">{score}%</span>
    </div>
  );
}

function CrossSellFlowDiagram({ summary }: { summary: CrossSellSummary }) {
  const pattern = summary.patterns[0];
  if (!pattern) return null;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Primary product */}
      <div className="flex items-center gap-4">
        <div className="rounded-lg border-2 border-primary bg-primary/5 px-6 py-3 text-center">
          <p className="text-sm font-bold text-primary">RunMyJobs</p>
          <p className="text-[10px] text-muted-foreground">
            {summary.productBreakdown[0]?.totalAccounts || 0} accounts
          </p>
        </div>
      </div>

      {/* Flow indicators */}
      <div className="flex flex-col items-center gap-1">
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">
            {pattern.crossSellConversionRate}% cross-sell rate
          </span>
        </div>
        <div className="h-8 w-px bg-border" />
      </div>

      {/* Triggers */}
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {pattern.commonTriggers.map((trigger, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">
            {trigger}
          </Badge>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="h-8 w-px bg-border" />
        <ArrowRight className="h-4 w-4 text-primary rotate-90" />
      </div>

      {/* Cross-sell product */}
      <div className="rounded-lg border-2 border-emerald-500 bg-emerald-500/5 px-6 py-3 text-center">
        <p className="text-sm font-bold text-emerald-600">Finance Automation</p>
        <p className="text-[10px] text-muted-foreground">
          {summary.productBreakdown[1]?.totalAccounts || 0} opportunities
        </p>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-md mt-2">
        {pattern.description}
      </p>
    </div>
  );
}

export default function CrossSellPage() {
  const summary = useMemo(() => analyzeCrossSell(ENRICHED_DATA), []);

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
          Multi-Product & Cross-Sell Attribution
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-sell pattern detection between RunMyJobs and Finance Automation.
          Identify which content sequences and engagement patterns predict
          cross-sell success.
        </p>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/cross-sell"]} />
      </motion.div>

      {/* KPI Row */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cross-Sell Opps</p>
                <p className="text-2xl font-bold tabular-nums">
                  {summary.totalCrossSellOpportunities}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cross-Sell Pipeline</p>
                <p className="text-2xl font-bold tabular-nums">
                  {fmtCurrency(summary.totalCrossSellPipeline)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Readiness</p>
                <p className="text-2xl font-bold tabular-nums">
                  {summary.avgReadinessScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <CheckCircle2 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Cross-Sells</p>
                <p className="text-2xl font-bold tabular-nums">
                  {summary.opportunities.filter((o) => o.crossSellStage).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cross-Sell Flow Diagram */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cross-Sell Pattern: RunMyJobs → Finance Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrossSellFlowDiagram summary={summary} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Product Breakdown */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Line Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {summary.productBreakdown.map((pb) => (
                <div
                  key={pb.product}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="text-sm font-semibold">{pb.product}</p>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        Total Accounts
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {pb.totalAccounts}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        Cross-Sell
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {pb.crossSellAccounts}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        Cross-Sell Rate
                      </p>
                      <p className="text-lg font-bold tabular-nums text-primary">
                        {pb.crossSellRate}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Opportunity Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cross-Sell Opportunities — Ranked by Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Current Product</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead className="text-right">Current Deal</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Cross-Sell Status</TableHead>
                  <TableHead className="w-64">Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.opportunities.map((opp) => (
                  <TableRow key={opp.account_id}>
                    <TableCell className="font-medium">
                      {opp.account_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {opp.currentProduct}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {opp.currentStage.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtCurrency(opp.currentDealAmount)}
                    </TableCell>
                    <TableCell>
                      <ReadinessBar score={opp.readinessScore} />
                    </TableCell>
                    <TableCell>
                      {opp.crossSellStage ? (
                        <div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-emerald-500/10 text-emerald-600"
                          >
                            Active: {opp.crossSellStage.replace(/_/g, " ")}
                          </Badge>
                          {opp.crossSellDealAmount && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {fmtCurrency(opp.crossSellDealAmount)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not started
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {opp.recommendation}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Indicators */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cross-Sell Readiness Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.opportunities[0]?.indicatorsPresent
                .concat(summary.opportunities[0]?.indicatorsMissing || [])
                .slice(0, 7)
                .map((indicator, i) => {
                  const isPresent =
                    summary.opportunities[0]?.indicatorsPresent.includes(
                      indicator
                    );
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-lg border p-3 ${
                        isPresent
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      {isPresent ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                      )}
                      <span className="text-xs">{indicator}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
