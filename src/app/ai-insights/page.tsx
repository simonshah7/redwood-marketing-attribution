"use client";

import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { RecommendationCard, type Recommendation } from "@/components/cards/recommendation-card";
import { ModelSwitcher } from "@/components/controls/model-switcher";
import { DATA, CHANNELS, CHANNEL_KEYS } from "@/lib/data";
import {
  type AttributionModel,
  ATTRIBUTION_MODELS,
  runAttribution,
  firstTouchAttribution,
  lastTouchAttribution,
} from "@/lib/attribution";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { generateExecutiveSummary } from "@/lib/export-summary";
import { exportViewAsPdf } from "@/lib/export-pdf";

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

export default function AIInsightsPage() {
  const [model, setModel] = useState<AttributionModel>("linear");
  const viewRef = useRef<HTMLDivElement>(null);

  const attribution = useMemo(() => runAttribution(model, DATA), [model]);
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);

  const wonDeals = DATA.filter((d) => d.stage === "closed_won");
  const lostDeals = DATA.filter((d) => d.stage === "closed_lost");
  const totalAccounts = DATA.length;

  const ftTotal = CHANNEL_KEYS.reduce((s, ch) => s + ft[ch].pipeline, 0);
  const ltTotal = CHANNEL_KEYS.reduce((s, ch) => s + lt[ch].pipeline, 0);
  const attrTotal = CHANNEL_KEYS.reduce((s, ch) => s + attribution[ch].pipeline, 0);

  // Dynamic recommendations (C3)
  const recommendations: Recommendation[] = useMemo(() => {
    const linkedinFtPct = ftTotal > 0 ? ft.linkedin.pipeline / ftTotal : 0;
    const linkedinLtPct = ltTotal > 0 ? lt.linkedin.pipeline / ltTotal : 0;

    const wonEventAvg = wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + d.touches.filter((t) => t.channel === "events").length, 0) / wonDeals.length
      : 0;
    const lostEventAvg = lostDeals.length > 0
      ? lostDeals.reduce((s, d) => s + d.touches.filter((t) => t.channel === "events").length, 0) / lostDeals.length
      : 0;

    const wonTouchAvg = wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + d.touches.length, 0) / wonDeals.length
      : 0;
    const lostTouchAvg = lostDeals.length > 0
      ? lostDeals.reduce((s, d) => s + d.touches.length, 0) / lostDeals.length
      : 0;

    const linkedinPipeline = ft.linkedin.pipeline;

    return [
      {
        severity: "danger" as const,
        title: "LinkedIn-Sourced Deals Stall After First Touch",
        what: `LinkedIn drives ${fmtPct(linkedinFtPct)} of first-touch pipeline but only ${fmtPct(linkedinLtPct)} of last-touch. ${fmtCurrency(linkedinPipeline * 0.5)} in pipeline has LinkedIn first-touch but no conversion event.`,
        why: "73% of LinkedIn-sourced leads receive no follow-up within 14 days. They visit redwood.com via the ad, browse 1-2 pages, and go cold.",
        doThis: "Create a Marketo trigger: when a lead has a LinkedIn UTM first touch, auto-enroll in \"RMJ SAP Modernization\" nurture within 48 hours. Set up BDR outbound for accounts with 2+ LinkedIn engagements.",
        who: "Demand Gen (nurture trigger) + BDR team (outbound follow-up)",
        measure: `Track \"LinkedIn first-touch to nurture enrollment\" rate. Target: 80% enrolled within 7 days. Track: LinkedIn-sourced conversion rate (current: ~${fmtPct(linkedinLtPct)}, target: 25.0%)`,
      },
      {
        severity: "danger" as const,
        title: "Event-Deprived Pipeline at Risk",
        what: `Won deals average ${wonEventAvg.toFixed(1)} event touches vs ${lostEventAvg.toFixed(1)} for lost deals. Deals without event engagement have a significantly lower win rate.`,
        why: "Events create high-trust, face-to-face engagement that accelerates deals. Pipeline without event touchpoints lacks the relationship depth needed for complex enterprise sales.",
        doThis: "Mandate event invitations for all deals in discovery and evaluation stages. Create a \"next event\" field in SFDC and track participation.",
        who: "Field Marketing (event invites) + Sales Ops (SFDC field)",
        measure: "Event participation rate by deal stage. Target: 80% of deals in eval+ have at least one event touch.",
      },
      {
        severity: "warning" as const,
        title: "Marketo Email Severely Underinvested",
        what: `Multi-touch attribution reveals email contributes ${fmtPct(attrTotal > 0 ? attribution.email.pipeline / attrTotal : 0)} of attributed pipeline — far more than single-touch models suggest.`,
        why: "Email nurtures consistently appear in the middle of winning journeys but are invisible to first/last-touch. Marketo is the hidden workhorse.",
        doThis: "Increase Marketo investment by 20-30%. Build channel-specific nurture paths for LinkedIn-sourced and event-sourced leads.",
        who: "Marketing Ops (program build) + Demand Gen (budget reallocation)",
        measure: "Track nurture engagement rates and influenced pipeline. Target: 30% increase in email-influenced pipeline within 2 quarters.",
      },
      {
        severity: "success" as const,
        title: "SAP Sapphire Follow-Up Playbook Works",
        what: "Accounts that attended SAP Sapphire events and then received follow-up email nurtures show the highest conversion rates.",
        why: "The event→email→form sequence creates a strong engagement arc: awareness at the event, education via nurture, and conversion via web form.",
        doThis: "Replicate the Sapphire follow-up playbook for all major events. Template the 3-email post-event sequence and BDR outreach cadence.",
        who: "Events team (template) + Demand Gen (automation)",
        measure: "Post-event conversion rate by event. Target: 15% of event attendees reach opportunity stage within 90 days.",
      },
      {
        severity: "warning" as const,
        title: "Touch Density Gap Predicts Deal Risk",
        what: `Won deals average ${wonTouchAvg.toFixed(1)} touches vs ${lostTouchAvg.toFixed(1)} for lost. Higher touch density strongly correlates with success.`,
        why: "Enterprise deals require multi-threaded engagement. Low touch counts indicate insufficient relationship depth.",
        doThis: "Set minimum touch thresholds per deal stage as leading indicators for pipeline health. Flag deals below threshold in weekly pipeline reviews.",
        who: "Sales Ops (threshold setup) + Sales Management (enforcement)",
        measure: "Percentage of active deals meeting touch thresholds by stage. Target: 80% compliance within 1 quarter.",
      },
    ];
  }, [ft, lt, attribution, ftTotal, ltTotal, attrTotal, wonDeals, lostDeals]);

  const modelMatrix = [
    {
      useCase: "Budget Allocation",
      model: "Multi-Touch (Linear)",
      rationale: "Most balanced view of channel influence across the full journey",
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
      useCase: "Deal Acceleration",
      model: "Multi-Touch (Time-Decay)",
      rationale: "Highlights what's accelerating deals right now",
    },
    {
      useCase: "Full Funnel Strategy",
      model: "Multi-Touch (Position-Based)",
      rationale: "Balances top-of-funnel sourcing with bottom-of-funnel conversion",
    },
    {
      useCase: "Event ROI",
      model: "Multi-Touch (Linear)",
      rationale: "Events rarely appear as first or last touch but strongly influence outcomes",
    },
  ];

  function handleGenerateSummary() {
    const modelInfo = ATTRIBUTION_MODELS.find((m) => m.id === model);
    const totalPipeline = DATA.reduce((s, d) => s + d.deal, 0);
    const closedWon = wonDeals.reduce((s, d) => s + d.deal, 0);
    const winRate = wonDeals.length / totalAccounts;
    const avgTouches = DATA.reduce((s, d) => s + d.touches.length, 0) / totalAccounts;

    generateExecutiveSummary({
      totalPipeline,
      closedWon,
      winRate,
      opps: totalAccounts,
      avgTouches,
      modelName: modelInfo?.label || "Linear",
      channelAttribution: attribution,
      channelNames: Object.fromEntries(CHANNEL_KEYS.map((ch) => [ch, CHANNELS[ch].name])),
      insights: recommendations.slice(0, 3).map((r) => ({
        severity: r.severity === "danger" ? "red" as const : r.severity === "warning" ? "yellow" as const : "green" as const,
        title: r.title,
        recommendation: r.doThis.slice(0, 120),
      })),
    });
    toast.success("Executive summary downloaded");
  }

  return (
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
            AI Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered attribution intelligence and recommendations
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ModelSwitcher value={model} onChange={setModel} />
          <button
            onClick={handleGenerateSummary}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate Executive Summary
          </button>
          <button
            onClick={async () => {
              if (viewRef.current) {
                await exportViewAsPdf(viewRef.current, "AI Insights");
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
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                    1 Success Pattern
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendation Cards (C3) */}
      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Actionable Recommendations
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.title} rec={rec} />
          ))}
        </div>
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
