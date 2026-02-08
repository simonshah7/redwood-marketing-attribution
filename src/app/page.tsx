"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/cards/kpi-card";
import { InsightCard } from "@/components/cards/insight-card";
import { ModelComparison } from "@/components/charts/model-comparison";
import { PipelineFunnel } from "@/components/charts/pipeline-funnel";
import { MonthlyTimeline } from "@/components/charts/monthly-timeline";
import { ModelSwitcher } from "@/components/controls/model-switcher";
import { BudgetModal, BudgetTrigger, loadBudgets, type ChannelBudgets } from "@/components/controls/budget-modal";
import { DATA, CHANNEL_KEYS, CHANNELS } from "@/lib/data";
import {
  type AttributionModel,
  runAttribution,
  firstTouchAttribution,
  lastTouchAttribution,
} from "@/lib/attribution";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { exportViewAsPdf } from "@/lib/export-pdf";

function computeKpis() {
  const totalPipeline = DATA.reduce((s, d) => s + d.deal, 0);
  const wonDeals = DATA.filter((d) => d.stage === "closed_won");
  const closedWon = wonDeals.reduce((s, d) => s + d.deal, 0);
  const winRate = wonDeals.length / DATA.length;
  const opps = DATA.length;
  const avgTouches =
    DATA.reduce((s, d) => s + d.touches.length, 0) / DATA.length;

  return { totalPipeline, closedWon, winRate, opps, avgTouches };
}

function computeInsights() {
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);

  const ftTotal = CHANNEL_KEYS.reduce((s, ch) => s + ft[ch].pipeline, 0);
  const ltTotal = CHANNEL_KEYS.reduce((s, ch) => s + lt[ch].pipeline, 0);

  const linkedinFtPct = ftTotal > 0 ? ft.linkedin.pipeline / ftTotal : 0;
  const linkedinLtPct = ltTotal > 0 ? lt.linkedin.pipeline / ltTotal : 0;
  const linkedinGap = linkedinFtPct - linkedinLtPct;

  const formFtPct = ftTotal > 0 ? ft.form.pipeline / ftTotal : 0;
  const formLtPct = ltTotal > 0 ? lt.form.pipeline / ltTotal : 0;

  const wonDeals = DATA.filter((d) => d.stage === "closed_won");
  const lostDeals = DATA.filter((d) => d.stage === "closed_lost");
  const wonEventAvg =
    wonDeals.length > 0
      ? wonDeals.reduce(
          (s, d) =>
            s + d.touches.filter((t) => t.channel === "events").length,
          0
        ) / wonDeals.length
      : 0;
  const lostEventAvg =
    lostDeals.length > 0
      ? lostDeals.reduce(
          (s, d) =>
            s + d.touches.filter((t) => t.channel === "events").length,
          0
        ) / lostDeals.length
      : 0;
  const eventGapPct =
    wonEventAvg > 0
      ? (((wonEventAvg - lostEventAvg) / wonEventAvg) * 100).toFixed(0)
      : "0";

  const emailFtPct = ftTotal > 0 ? ft.email.pipeline / ftTotal : 0;
  const emailLtPct = ltTotal > 0 ? lt.email.pipeline / ltTotal : 0;

  return {
    linkedinFtPct,
    linkedinLtPct,
    linkedinGap,
    formFtPct,
    formLtPct,
    wonEventAvg,
    lostEventAvg,
    eventGapPct,
    emailFtPct,
    emailLtPct,
  };
}

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function OverviewPage() {
  const kpis = computeKpis();
  const insights = computeInsights();
  const [model, setModel] = useState<AttributionModel>("linear");
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgets, setBudgets] = useState<ChannelBudgets | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  // Compute attribution using selected model
  const attribution = useMemo(() => runAttribution(model, DATA), [model]);

  // Cost-per-pipeline mapping
  const budgetMapping: Record<string, keyof ChannelBudgets> = {
    linkedin: "linkedin_ads",
    email: "marketo_email",
    events: "events_webinars",
    form: "web_content",
  };

  // Load budgets on mount
  useEffect(() => {
    const saved = loadBudgets();
    if (saved) setBudgets(saved);
  }, []);

  return (
    <>
      <motion.div
        ref={viewRef}
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Page header */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Attribution Overview
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              RunMyJobs pipeline attribution across all channels &middot; Feb 2024
              - Jan 2025
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ModelSwitcher value={model} onChange={setModel} />
            <BudgetTrigger onClick={() => setBudgetOpen(true)} hasBudgets={budgets !== null} />
            <button
              onClick={async () => {
                if (viewRef.current) {
                  await exportViewAsPdf(viewRef.current, "Overview");
                  toast.success("PDF exported");
                }
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </motion.div>

        {/* KPI Row */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        >
          <motion.div variants={fadeUp}>
            <KpiCard
              title="Total Pipeline"
              value={fmtCurrency(kpis.totalPipeline)}
              delta="8.3% vs prior"
              trend="negative"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <KpiCard
              title="Closed Won"
              value={fmtCurrency(kpis.closedWon)}
              delta="12.1% vs prior"
              trend="negative"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <KpiCard
              title="Win Rate"
              value={fmtPct(kpis.winRate)}
              delta="3.2pp vs prior"
              trend="negative"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <KpiCard
              title="Opportunities"
              value={String(kpis.opps)}
              delta="Flat vs prior"
              trend="neutral"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <KpiCard
              title="Avg Touches"
              value={kpis.avgTouches.toFixed(1)}
              delta="+1.4 vs prior"
              trend="positive"
            />
          </motion.div>
        </motion.div>

        {/* Cost-per-pipeline KPIs (if budgets set) */}
        {budgets && (
          <motion.div
            variants={stagger}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {CHANNEL_KEYS.map((ch) => {
              const budgetKey = budgetMapping[ch];
              const spend = budgetKey ? budgets[budgetKey] : 0;
              const pipeline = attribution[ch].pipeline;
              const costPer = pipeline > 0 ? spend / pipeline : 0;
              const roi = spend > 0 ? pipeline / spend : 0;
              return (
                <motion.div key={ch} variants={fadeUp}>
                  <KpiCard
                    title={`${CHANNELS[ch].shortName} Cost/$1 Pipeline`}
                    value={costPer > 0 ? `$${costPer.toFixed(2)}` : "—"}
                    delta={roi > 0 ? `${roi.toFixed(1)}x ROI` : "No spend"}
                    trend={roi > 5 ? "positive" : roi > 0 ? "neutral" : "neutral"}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Model Comparison + Pipeline Funnel */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp}>
            <ModelComparison />
          </motion.div>
          <motion.div variants={fadeUp}>
            <PipelineFunnel />
          </motion.div>
        </motion.div>

        {/* Attribution Alerts */}
        <motion.div variants={fadeUp}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Attribution Alerts
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InsightCard
              severity="danger"
              title="LinkedIn drives awareness but not conversion"
              description={`LinkedIn is ${fmtPct(insights.linkedinFtPct)} of first-touch but only ${fmtPct(insights.linkedinLtPct)} of last-touch — a ${fmtPct(insights.linkedinGap)} awareness-to-conversion gap worth ${fmtCurrency(insights.linkedinGap * DATA.reduce((s, d) => s + d.deal, 0))} in pipeline.`}
            />
            <InsightCard
              severity="warning"
              title="Form submissions dominate last touch"
              description={`Web forms are ${fmtPct(insights.formLtPct)} of last-touch vs ${fmtPct(insights.formFtPct)} of first-touch. Website converts demand generated elsewhere — forms are converters, not generators.`}
            />
            <InsightCard
              severity="danger"
              title={`Closed-Lost deals had ${insights.eventGapPct}% fewer event touches`}
              description={`Won deals averaged ${insights.wonEventAvg.toFixed(1)} event touches vs ${insights.lostEventAvg.toFixed(1)} for lost. Event engagement is the strongest predictor of winning.`}
            />
            <InsightCard
              severity="info"
              title="Email nurtures undervalued"
              description={`Email is ${fmtPct(insights.emailFtPct)} of first-touch and ${fmtPct(insights.emailLtPct)} of last-touch. Multi-touch reveals far more email influence — Marketo is the hidden workhorse of the funnel.`}
            />
          </div>
        </motion.div>

        {/* Monthly Touch Volume */}
        <motion.div variants={fadeUp}>
          <MonthlyTimeline />
        </motion.div>
      </motion.div>

      <BudgetModal
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        onSave={(b) => setBudgets(b)}
      />
    </>
  );
}
