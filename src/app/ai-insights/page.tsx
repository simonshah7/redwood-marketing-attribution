"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DATA, CHANNELS, CHANNEL_KEYS } from "@/lib/data";
import {
  firstTouchAttribution,
  lastTouchAttribution,
  multiTouchAttribution,
} from "@/lib/attribution";
import { fmt, pct } from "@/lib/utils";

type InsightSeverity = "danger" | "warning" | "success" | "info";

interface InsightItem {
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendation: string;
}

function buildInsights(): InsightItem[] {
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);
  const mt = multiTouchAttribution(DATA);

  const ftTotal = CHANNEL_KEYS.reduce((s, ch) => s + ft[ch].pipeline, 0);
  const ltTotal = CHANNEL_KEYS.reduce((s, ch) => s + lt[ch].pipeline, 0);

  const linkedinFtPct = ftTotal > 0 ? ft.linkedin.pipeline / ftTotal : 0;
  const linkedinLtPct = ltTotal > 0 ? lt.linkedin.pipeline / ltTotal : 0;

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

  const wonTouchAvg =
    wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + d.touches.length, 0) / wonDeals.length
      : 0;
  const lostTouchAvg =
    lostDeals.length > 0
      ? lostDeals.reduce((s, d) => s + d.touches.length, 0) / lostDeals.length
      : 0;

  const emailFtPct = ftTotal > 0 ? ft.email.pipeline / ftTotal : 0;
  const emailMtPct =
    CHANNEL_KEYS.reduce((s, ch) => s + mt[ch].pipeline, 0) > 0
      ? mt.email.pipeline /
        CHANNEL_KEYS.reduce((s, ch) => s + mt[ch].pipeline, 0)
      : 0;

  const formLtPct = ltTotal > 0 ? lt.form.pipeline / ltTotal : 0;
  const formFtPct = ftTotal > 0 ? ft.form.pipeline / ftTotal : 0;

  return [
    {
      severity: "danger",
      title: "LinkedIn Drop-Off: Awareness Without Conversion",
      description: `LinkedIn represents ${pct(linkedinFtPct)} of first-touch attribution but drops to ${pct(linkedinLtPct)} at last-touch. This ${pct(linkedinFtPct - linkedinLtPct)} gap means LinkedIn generates awareness but fails to convert.`,
      recommendation:
        "Add retargeting sequences and mid-funnel content to LinkedIn campaigns to maintain engagement through the buyer journey.",
    },
    {
      severity: "danger",
      title: "Event-Deprived Pipeline at Risk",
      description: `Won deals average ${wonEventAvg.toFixed(1)} event touches vs ${lostEventAvg.toFixed(1)} for lost deals. Deals without event engagement are significantly more likely to close lost.`,
      recommendation:
        "Prioritize event invitations for deals in early pipeline stages. Consider virtual events for accounts that cannot attend in person.",
    },
    {
      severity: "warning",
      title: "Marketo Email Underinvestment",
      description: `Email is only ${pct(emailFtPct)} of first-touch but multi-touch reveals ${pct(emailMtPct)} true influence. Email nurture is the hidden workhorse but may be under-resourced.`,
      recommendation:
        "Increase email nurture investment and create more segmented sequences. Email is driving more value than single-touch models reveal.",
    },
    {
      severity: "success",
      title: "SAP Sapphire: The Winning Sequence",
      description:
        "Accounts that attended SAP Sapphire events and followed up with email nurture show the highest conversion rates. This LinkedIn → Event → Email → Form pattern is the golden path.",
      recommendation:
        "Replicate the SAP Sapphire playbook for other events. Pre-event LinkedIn campaigns + post-event nurture is the winning formula.",
    },
    {
      severity: "warning",
      title: "Model Disagreement Signals Opportunity",
      description:
        "Channels where first-touch and last-touch disagree most represent the biggest optimization opportunities. The gap between models reveals where the funnel has blind spots.",
      recommendation:
        "Use multi-touch as the primary model for budget allocation. First/last-touch should inform channel-specific strategy, not overall investment.",
    },
    {
      severity: "info",
      title: "Touch Density Predicts Outcomes",
      description: `Won deals average ${wonTouchAvg.toFixed(1)} touches vs ${lostTouchAvg.toFixed(1)} for lost. Higher touch density — especially with channel diversity — correlates with winning.`,
      recommendation:
        "Set minimum touch thresholds before advancing deals. Accounts with fewer than 5 touches should receive additional nurture.",
    },
    {
      severity: "info",
      title: "Form Submission Quality Signal",
      description: `Web forms represent ${pct(formLtPct)} of last-touch but only ${pct(formFtPct)} of first-touch. Forms are strong conversion signals — accounts submitting forms have been nurtured elsewhere first.`,
      recommendation:
        "Don't optimize forms for top-of-funnel. Instead, ensure upstream channels drive form-ready prospects to your website.",
    },
  ];
}

const SEVERITY_STYLES: Record<
  InsightSeverity,
  { border: string; badge: string; recColor: string }
> = {
  danger: {
    border: "border-l-red-500",
    badge: "bg-red-500/10 text-red-400",
    recColor: "text-amber-400",
  },
  warning: {
    border: "border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-400",
    recColor: "text-amber-400",
  },
  success: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-400",
    recColor: "text-emerald-400",
  },
  info: {
    border: "border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-400",
    recColor: "text-blue-400",
  },
};

const MODEL_MATRIX = [
  {
    useCase: "Budget Allocation",
    model: "Multi-Touch",
    rationale:
      "Distributes credit fairly across all channels for balanced investment decisions",
  },
  {
    useCase: "Demand Generation",
    model: "First-Touch",
    rationale:
      "Identifies which channels create initial awareness and generate new pipeline",
  },
  {
    useCase: "Conversion Optimization",
    model: "Last-Touch",
    rationale:
      "Shows which channels close deals and drive final conversion actions",
  },
  {
    useCase: "Content Strategy",
    model: "Multi-Touch",
    rationale:
      "Reveals mid-funnel content influence hidden by single-touch models",
  },
  {
    useCase: "Event ROI",
    model: "Multi-Touch",
    rationale:
      "Events are mid-funnel — single-touch models under-count their true impact",
  },
  {
    useCase: "SDR Prioritization",
    model: "First-Touch",
    rationale:
      "First engagement channel indicates intent strength for outbound prioritization",
  },
];

export default function AIInsightsPage() {
  const insights = buildInsights();
  const leftInsights = insights.filter(
    (_, i) => i === 0 || i === 1 || i === 2
  );
  const rightInsights = insights.filter((_, i) => i >= 3);

  const totalPipeline = DATA.reduce((s, d) => s + d.deal, 0);
  const totalAccounts = DATA.length;
  const totalTouches = DATA.reduce((s, d) => s + d.touches.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered attribution intelligence and recommendations
        </p>
      </div>

      {/* Hero Banner */}
      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <CardContent className="relative p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">
                AI-Powered Attribution Intelligence
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Analysis of {totalAccounts} accounts, {fmt(totalPipeline)} in
                pipeline, and {totalTouches} marketing touchpoints across 12
                months.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-xs">
                  {totalAccounts} Accounts Analyzed
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {totalTouches} Touchpoints Tracked
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  4 Channels Compared
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  3 Attribution Models
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-column Insight Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {leftInsights.map((insight, idx) => {
            const style = SEVERITY_STYLES[insight.severity];
            return (
              <Card
                key={idx}
                className={`border-l-[3px] ${style.border}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Badge className={`shrink-0 text-[10px] ${style.badge}`}>
                      {insight.severity.toUpperCase()}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {insight.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {insight.description}
                      </p>
                      <p
                        className={`mt-2 text-xs font-medium ${style.recColor}`}
                      >
                        Recommendation: {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="space-y-4">
          {rightInsights.map((insight, idx) => {
            const style = SEVERITY_STYLES[insight.severity];
            return (
              <Card
                key={idx}
                className={`border-l-[3px] ${style.border}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Badge className={`shrink-0 text-[10px] ${style.badge}`}>
                      {insight.severity.toUpperCase()}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {insight.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {insight.description}
                      </p>
                      <p
                        className={`mt-2 text-xs font-medium ${style.recColor}`}
                      >
                        Recommendation: {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Model Recommendation Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Model Recommendation Matrix
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            When to use each attribution model based on your business question
          </p>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Use Case</th>
                <th className="pb-2 pr-4">Recommended Model</th>
                <th className="pb-2">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_MATRIX.map((row) => (
                <tr
                  key={row.useCase}
                  className="border-b border-border/50 transition-colors hover:bg-secondary/50"
                >
                  <td className="py-2.5 pr-4 font-medium text-foreground">
                    {row.useCase}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge variant="secondary" className="text-xs">
                      {row.model}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {row.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
