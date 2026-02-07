"use client";

import { motion } from "framer-motion";
import { KpiCard } from "@/components/cards/kpi-card";
import { InsightCard } from "@/components/cards/insight-card";
import { ModelComparison } from "@/components/charts/model-comparison";
import { PipelineFunnel } from "@/components/charts/pipeline-funnel";
import { MonthlyTimeline } from "@/components/charts/monthly-timeline";
import { DATA, CHANNEL_KEYS } from "@/lib/data";
import {
  firstTouchAttribution,
  lastTouchAttribution,
} from "@/lib/attribution";
import { fmt, pct } from "@/lib/utils";

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

  // Event touch analysis
  const wonDeals = DATA.filter((d) => d.stage === "closed_won");
  const lostDeals = DATA.filter((d) => d.stage === "closed_lost");
  const wonEventAvg =
    wonDeals.length > 0
      ? wonDeals.reduce(
          (s, d) => s + d.touches.filter((t) => t.channel === "events").length,
          0
        ) / wonDeals.length
      : 0;
  const lostEventAvg =
    lostDeals.length > 0
      ? lostDeals.reduce(
          (s, d) => s + d.touches.filter((t) => t.channel === "events").length,
          0
        ) / lostDeals.length
      : 0;
  const eventGapPct =
    wonEventAvg > 0
      ? (((wonEventAvg - lostEventAvg) / wonEventAvg) * 100).toFixed(0)
      : "0";

  // Email FT vs LT
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

export default function OverviewPage() {
  const kpis = computeKpis();
  const insights = computeInsights();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Attribution Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          RunMyJobs pipeline attribution across all channels · Feb 2024 – Jan
          2025
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          title="Total Pipeline"
          value={fmt(kpis.totalPipeline)}
          delta="↓ 8.3% vs prior"
          trend="negative"
          accentColor="#3B82F6"
        />
        <KpiCard
          title="Closed Won"
          value={fmt(kpis.closedWon)}
          delta="↓ 12.1% vs prior"
          trend="negative"
          accentColor="#10B981"
        />
        <KpiCard
          title="Win Rate"
          value={pct(kpis.winRate)}
          delta="↓ 3.2pp vs prior"
          trend="negative"
          accentColor="#8B5CF6"
        />
        <KpiCard
          title="Opportunities"
          value={String(kpis.opps)}
          delta="Flat vs prior"
          trend="neutral"
          accentColor="#F59E0B"
        />
        <KpiCard
          title="Avg Touches"
          value={kpis.avgTouches.toFixed(1)}
          delta="+1.4 vs prior"
          trend="positive"
          accentColor="#06B6D4"
        />
      </div>

      {/* Model Comparison + Pipeline Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModelComparison />
        <PipelineFunnel />
      </div>

      {/* Attribution Alerts */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Attribution Alerts</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InsightCard
            severity="danger"
            title="LinkedIn drives awareness but not conversion"
            description={`LinkedIn is ${pct(insights.linkedinFtPct)} of first-touch but only ${pct(insights.linkedinLtPct)} of last-touch — a ${pct(insights.linkedinGap)} awareness-to-conversion gap worth ${fmt(insights.linkedinGap * DATA.reduce((s, d) => s + d.deal, 0))} in pipeline.`}
          />
          <InsightCard
            severity="warning"
            title="Form submissions dominate last touch"
            description={`Web forms are ${pct(insights.formLtPct)} of last-touch vs ${pct(insights.formFtPct)} of first-touch. Website converts demand generated elsewhere — forms are converters, not generators.`}
          />
          <InsightCard
            severity="danger"
            title={`Closed-Lost deals had ${insights.eventGapPct}% fewer event touches`}
            description={`Won deals averaged ${insights.wonEventAvg.toFixed(1)} event touches vs ${insights.lostEventAvg.toFixed(1)} for lost. Event engagement is the strongest predictor of winning.`}
          />
          <InsightCard
            severity="info"
            title="Email nurtures undervalued"
            description={`Email is ${pct(insights.emailFtPct)} of first-touch and ${pct(insights.emailLtPct)} of last-touch. Multi-touch reveals far more email influence — Marketo is the hidden workhorse of the funnel.`}
          />
        </div>
      </div>

      {/* Monthly Touch Volume */}
      <MonthlyTimeline />
    </motion.div>
  );
}
