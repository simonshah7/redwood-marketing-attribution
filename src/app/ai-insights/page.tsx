"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { DATA, CHANNELS, CHANNEL_KEYS } from "@/lib/data";
import {
  firstTouchAttribution,
  lastTouchAttribution,
  multiTouchAttribution,
} from "@/lib/attribution";
import { fmt, pct } from "@/lib/utils";

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

type InsightSeverity = "danger" | "warning" | "info" | "success";

interface Insight {
  title: string;
  severity: InsightSeverity;
  description: string;
  recommendation: string;
}

const severityStyles: Record<
  InsightSeverity,
  { bg: string; border: string; title: string; rec: string }
> = {
  danger: {
    bg: "bg-destructive/5",
    border: "border-l-destructive",
    title: "text-destructive",
    rec: "text-amber-400",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-l-amber-500",
    title: "text-amber-400",
    rec: "text-amber-400",
  },
  info: {
    bg: "bg-blue-500/5",
    border: "border-l-blue-500",
    title: "text-blue-400",
    rec: "text-blue-400",
  },
  success: {
    bg: "bg-emerald-500/5",
    border: "border-l-emerald-500",
    title: "text-emerald-400",
    rec: "text-emerald-400",
  },
};

export default function AIInsightsPage() {
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);
  const mt = multiTouchAttribution(DATA);

  const wonDeals = DATA.filter((d) => d.stage === "closed_won");
  const lostDeals = DATA.filter((d) => d.stage === "closed_lost");
  const totalAccounts = DATA.length;

  const ftTotal = CHANNEL_KEYS.reduce((s, ch) => s + ft[ch].pipeline, 0);
  const ltTotal = CHANNEL_KEYS.reduce((s, ch) => s + lt[ch].pipeline, 0);

  const leftInsights: Insight[] = [
    {
      title: "LinkedIn Drop-Off",
      severity: "danger",
      description: `LinkedIn drives ${pct(ftTotal > 0 ? ft.linkedin.pipeline / ftTotal : 0)} of first-touch pipeline but only ${pct(ltTotal > 0 ? lt.linkedin.pipeline / ltTotal : 0)} of last-touch. This ${pct(ftTotal > 0 ? (ft.linkedin.pipeline / ftTotal) - (lt.linkedin.pipeline / ltTotal) : 0)} drop indicates prospects sourced via LinkedIn are not being nurtured through to conversion.`,
      recommendation:
        "Build LinkedIn-specific nurture sequences in Marketo to bridge the awareness-to-conversion gap.",
    },
    {
      title: "Event-Deprived Pipeline",
      severity: "danger",
      description: `Lost deals averaged ${(lostDeals.reduce((s, d) => s + d.touches.filter((t) => t.channel === "events").length, 0) / Math.max(lostDeals.length, 1)).toFixed(1)} event touches vs ${(wonDeals.reduce((s, d) => s + d.touches.filter((t) => t.channel === "events").length, 0) / Math.max(wonDeals.length, 1)).toFixed(1)} for won deals. Deals without event engagement have a significantly lower win rate.`,
      recommendation:
        "Mandate event invitations for all deals in discovery and evaluation stages.",
    },
    {
      title: "Marketo Underinvestment",
      severity: "warning",
      description:
        "Multi-touch attribution reveals email contributes far more pipeline influence than single-touch models suggest. Marketo is the hidden workhorse but receives disproportionately low budget allocation.",
      recommendation:
        "Increase Marketo investment by 20-30% and build channel-specific nurture paths.",
    },
  ];

  const rightInsights: Insight[] = [
    {
      title: "SAP Sapphire Winning Sequence",
      severity: "success",
      description:
        "Accounts that attended SAP Sapphire events and then received follow-up email nurtures show the highest conversion rates. This event→email→form sequence is the strongest predictor of winning.",
      recommendation:
        "Replicate the Sapphire follow-up playbook for all major events.",
    },
    {
      title: "Model Disagreement",
      severity: "warning",
      description:
        "First-touch and last-touch models disagree significantly on LinkedIn and Form attribution. This 40%+ variance indicates your marketing funnel has distinct awareness and conversion phases.",
      recommendation:
        "Use multi-touch as the primary planning model; reference FT/LT for channel-specific optimization.",
    },
    {
      title: "Touch Density Correlation",
      severity: "info",
      description: `Won deals average ${(wonDeals.reduce((s, d) => s + d.touches.length, 0) / Math.max(wonDeals.length, 1)).toFixed(1)} touches vs ${(lostDeals.reduce((s, d) => s + d.touches.length, 0) / Math.max(lostDeals.length, 1)).toFixed(1)} for lost deals. Higher touch density correlates strongly with deal success across all channels.`,
      recommendation:
        "Set minimum touch thresholds per deal stage as leading indicators for pipeline health.",
    },
    {
      title: "Form Quality Signal",
      severity: "info",
      description:
        "Form submissions dominate last-touch attribution (~50%), but most forms are downstream of other channel activity. Forms are conversion mechanisms, not demand generators.",
      recommendation:
        "Attribute form success upstream — credit the channels that drove form visitors, not just the form itself.",
    },
  ];

  const modelMatrix = [
    {
      useCase: "Budget Allocation",
      model: "Multi-Touch",
      rationale:
        "Most balanced view of channel influence across the full journey",
    },
    {
      useCase: "Awareness Campaigns",
      model: "First Touch",
      rationale: "Identifies which channels generate initial pipeline entry",
    },
    {
      useCase: "Conversion Optimization",
      model: "Last Touch",
      rationale: "Shows which channels close deals and drive final action",
    },
    {
      useCase: "Pipeline Forecasting",
      model: "Multi-Touch + Touch Density",
      rationale:
        "Combines attribution with engagement depth for predictive accuracy",
    },
    {
      useCase: "Event ROI",
      model: "Multi-Touch",
      rationale:
        "Events rarely appear as first or last touch but strongly influence outcomes",
    },
    {
      useCase: "Content Strategy",
      model: "First Touch",
      rationale:
        "Reveals which content themes and formats generate initial awareness",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          AI Insights
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered attribution intelligence and recommendations
        </p>
      </motion.div>

      {/* Hero Banner */}
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  AI-Powered Attribution Intelligence
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analysis of {totalAccounts} accounts, {wonDeals.length} won
                  deals, and{" "}
                  {DATA.reduce((s, d) => s + d.touches.length, 0)}{" "}
                  marketing touchpoints across 4 channels over 12 months.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                    2 Critical Findings
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                    2 Warnings
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
                    2 Insights
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                    1 Success Pattern
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2-Column Insight Grid */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Left Column */}
        <motion.div variants={fadeUp} className="space-y-4">
          {leftInsights.map((insight) => {
            const styles = severityStyles[insight.severity];
            return (
              <Card
                key={insight.title}
                className={`border-l-4 ${styles.border} ${styles.bg}`}
              >
                <CardContent className="p-4">
                  <p className={`text-sm font-semibold ${styles.title}`}>
                    {insight.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {insight.description}
                  </p>
                  <p className={`mt-3 text-xs font-medium ${styles.rec}`}>
                    Recommendation: {insight.recommendation}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Right Column */}
        <motion.div variants={fadeUp} className="space-y-4">
          {rightInsights.map((insight) => {
            const styles = severityStyles[insight.severity];
            return (
              <Card
                key={insight.title}
                className={`border-l-4 ${styles.border} ${styles.bg}`}
              >
                <CardContent className="p-4">
                  <p className={`text-sm font-semibold ${styles.title}`}>
                    {insight.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {insight.description}
                  </p>
                  <p className={`mt-3 text-xs font-medium ${styles.rec}`}>
                    Recommendation: {insight.recommendation}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Model Recommendation Matrix */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Model Recommendation Matrix
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Which attribution model to use for each business decision
            </p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4">Use Case</th>
                  <th className="pb-3 pr-4">Recommended Model</th>
                  <th className="pb-3">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {modelMatrix.map((row) => (
                  <tr
                    key={row.useCase}
                    className="border-b border-border/50 transition-colors hover:bg-accent/50"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {row.useCase}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className="text-xs">
                        {row.model}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {row.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
