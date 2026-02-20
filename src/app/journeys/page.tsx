"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnrichedChannelLegend } from "@/components/shared/enriched-channel-legend";
import { InsightCard } from "@/components/cards/insight-card";
import { ENRICHED_DATA } from "@/lib/mock-enriched-data";
import { ENRICHED_CHANNELS, type EnrichedChannel } from "@/lib/enriched-data";
import { fmt } from "@/lib/utils";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";
import { usePeriod } from "@/lib/period-context";

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

function getStageName(stage: string) {
  const names: Record<string, string> = {
    disco_set: "Discos Set",
    disco_completed: "Discos Completed",
    solution_accepted: "Solution Accepted",
    eval_planning: "Evaluation Planning",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };
  return names[stage] || stage;
}

function getStageColor(stage: string) {
  const colors: Record<string, string> = {
    disco_set: "bg-blue-500/20 text-blue-400",
    disco_completed: "bg-cyan-500/20 text-cyan-400",
    solution_accepted: "bg-violet-500/20 text-violet-400",
    eval_planning: "bg-amber-500/20 text-amber-400",
    negotiation: "bg-orange-500/20 text-orange-400",
    closed_won: "bg-emerald-500/20 text-emerald-400",
    closed_lost: "bg-red-500/20 text-red-400",
  };
  return colors[stage] || "bg-secondary text-muted-foreground";
}

function isBDRChannel(channel: string) {
  return channel === 'bdr_call' || channel === 'bdr_email' || channel === 'bdr_linkedin';
}

// Timeline date range
const DATE_MIN = new Date("2025-02-01").getTime();
const DATE_MAX = new Date("2026-01-31").getTime();
const DATE_RANGE = DATE_MAX - DATE_MIN;

const TIMELINE_LABELS = [
  "Feb '25",
  "Apr '25",
  "Jun '25",
  "Aug '25",
  "Oct '25",
  "Dec '25",
  "Jan '26",
];

export default function JourneysPage() {
  const { periodLabel } = usePeriod();

  // Top 10 accounts by deal size
  const top10 = [...ENRICHED_DATA]
    .sort((a, b) => b.deal_amount - a.deal_amount)
    .slice(0, 10);

  // Compute channel transitions from journey data
  const channelTransitions = useMemo(() => {
    const transitions = new Map<string, number>();
    const channelTotals = new Map<string, number>();

    for (const acc of ENRICHED_DATA) {
      const touches = acc.touchpoints;
      for (let i = 0; i < touches.length; i++) {
        const from = touches[i].channel;
        channelTotals.set(from, (channelTotals.get(from) || 0) + 1);
        if (i < touches.length - 1) {
          const to = touches[i + 1].channel;
          const key = `${from}→${to}`;
          transitions.set(key, (transitions.get(key) || 0) + 1);
        }
      }
    }

    // Get top 12 transitions by count
    const sorted = [...transitions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

    return sorted.map(([key, count]) => {
      const [from, to] = key.split('→');
      return {
        from,
        to,
        count,
        pct: Math.round((count / maxCount) * 100),
      };
    });
  }, []);

  // Compute golden path from won deals
  const goldenPath = useMemo(() => {
    const wonDeals = ENRICHED_DATA.filter(a => a.stage === 'closed_won');

    // Count channel at each position (normalized 0-4: first, early, mid, late, last)
    const positionChannels: Record<string, Record<string, number>> = {};
    const positions = ['First Touch', 'Early Funnel', 'Mid Funnel', 'Late Funnel', 'Last Touch'];

    for (const deal of wonDeals) {
      const n = deal.touchpoints.length;
      if (n === 0) continue;

      deal.touchpoints.forEach((tp, i) => {
        let posIdx: number;
        if (i === 0) posIdx = 0;
        else if (i === n - 1) posIdx = 4;
        else {
          const frac = i / (n - 1);
          posIdx = frac < 0.33 ? 1 : frac < 0.66 ? 2 : 3;
        }
        const pos = positions[posIdx];
        if (!positionChannels[pos]) positionChannels[pos] = {};
        positionChannels[pos][tp.channel] = (positionChannels[pos][tp.channel] || 0) + 1;
      });
    }

    return positions.map(pos => {
      const channels = positionChannels[pos] || {};
      const sorted = Object.entries(channels).sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      const total = sorted.reduce((s, [, c]) => s + c, 0);
      return {
        position: pos,
        topChannel: top ? top[0] : 'unknown',
        topChannelPct: top && total > 0 ? Math.round((top[1] / total) * 100) : 0,
        total,
      };
    });
  }, []);

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
          Account Journeys
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete marketing journey for key accounts &middot; {periodLabel}
        </p>
      </motion.div>

      {/* Enriched Channel Legend */}
      <motion.div variants={fadeUp}>
        <EnrichedChannelLegend />
      </motion.div>

      {/* Journey Timeline */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Top 10 Accounts by Deal Size
              <HelpTip text={HELP_TEXT.journey_timeline} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Marketing touchpoint timeline from Feb 2025 to Jan 2026 — hover for detail
            </p>
          </CardHeader>
          <CardContent>
            {/* Timeline header */}
            <div className="mb-4 flex items-center">
              <div className="w-40 shrink-0" />
              <div className="relative flex-1">
                <div className="flex justify-between">
                  {TIMELINE_LABELS.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] text-muted-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Account rows */}
            <div className="space-y-3">
              {top10.map((acc) => (
                <div
                  key={acc.account_name}
                  className="flex items-center rounded-md py-2 transition-colors hover:bg-accent/30"
                >
                  {/* Account info */}
                  <div className="w-40 shrink-0 pr-3">
                    <p className="truncate text-sm font-medium text-foreground">
                      {acc.account_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {fmt(acc.deal_amount)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${getStageColor(acc.stage)}`}
                      >
                        {getStageName(acc.stage)}
                      </Badge>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative flex-1 h-8">
                    {/* Track line */}
                    <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-border" />

                    {/* Touchpoint dots */}
                    {acc.touchpoints.map((touch, idx) => {
                      const touchDate = new Date(touch.date).getTime();
                      const pctPos = Math.min(
                        Math.max(
                          ((touchDate - DATE_MIN) / DATE_RANGE) * 100,
                          0
                        ),
                        100
                      );
                      const channelColor =
                        ENRICHED_CHANNELS[touch.channel as EnrichedChannel]?.color || "hsl(220, 10%, 50%)";
                      const isBDR = isBDRChannel(touch.channel);

                      return (
                        <UITooltip key={idx}>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-150 ${
                                isBDR
                                  ? "flex h-4 w-4 items-center justify-center rounded-sm border border-card"
                                  : "h-3 w-3 rounded-full border-2 border-card"
                              }`}
                              style={{
                                left: `${pctPos}%`,
                                backgroundColor: channelColor,
                              }}
                            >
                              {touch.channel === 'bdr_call' && (
                                <Phone className="h-2.5 w-2.5 text-white" />
                              )}
                              {touch.channel === 'bdr_email' && (
                                <Mail className="h-2.5 w-2.5 text-white" />
                              )}
                              {touch.channel === 'bdr_linkedin' && (
                                <MessageSquare className="h-2.5 w-2.5 text-white" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs"
                          >
                            <p className="text-xs font-semibold">
                              {touch.date}
                            </p>
                            <p className="text-xs font-medium" style={{ color: channelColor }}>
                              {ENRICHED_CHANNELS[touch.channel as EnrichedChannel]?.name || touch.channel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {touch.interaction_detail}
                            </p>
                            {/* Enhanced tooltip: page URL, content asset, email, ad creative */}
                            {touch.page_url && (
                              <p className="text-[10px] text-muted-foreground">
                                Page: {touch.page_url}
                              </p>
                            )}
                            {touch.content_asset && (
                              <p className="text-[10px] text-muted-foreground">
                                Content: {touch.content_asset}
                              </p>
                            )}
                            {touch.email_name && (
                              <p className="text-[10px] text-muted-foreground">
                                Email: {touch.email_name}
                              </p>
                            )}
                            {touch.ad_creative && (
                              <p className="text-[10px] text-muted-foreground">
                                Ad: {touch.ad_creative}
                              </p>
                            )}
                            {touch.event_name && (
                              <p className="text-[10px] text-muted-foreground">
                                Event: {touch.event_name}
                              </p>
                            )}
                            {touch.bdr_sequence && (
                              <p className="text-[10px] text-muted-foreground">
                                Sequence: {touch.bdr_sequence}
                                {touch.bdr_outcome && ` (${touch.bdr_outcome})`}
                              </p>
                            )}
                          </TooltipContent>
                        </UITooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Journey Pattern Insights */}
      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Journey Patterns
          <HelpTip text={HELP_TEXT.journey_patterns} />
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InsightCard
            severity="info"
            title="Winning Pattern: LinkedIn → Event → Email → Form"
            description="Won deals typically start with LinkedIn awareness, engage through events, get nurtured by email, then convert via web forms. This 4-stage journey has the highest win rate."
          />
          <InsightCard
            severity="danger"
            title="Losing Pattern: LinkedIn → Gap → Form"
            description="Lost deals often skip mid-funnel engagement entirely. They go from LinkedIn awareness straight to forms without event or email nurture — resulting in premature conversion attempts."
          />
          <InsightCard
            severity="warning"
            title="Stalled Pattern: Heavy Email, No Events"
            description="Deals stuck in early pipeline stages show heavy email engagement but zero event touches. Consider using events as an accelerator for stalled opportunities."
          />
        </div>
      </motion.div>

      {/* Channel Transition Flow */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Channel Transition Flow
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Most common channel-to-channel transitions across all journeys
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {channelTransitions.map(({ from, to, count, pct }) => {
                const fromInfo = ENRICHED_CHANNELS[from as EnrichedChannel];
                const toInfo = ENRICHED_CHANNELS[to as EnrichedChannel];
                if (!fromInfo || !toInfo) return null;
                return (
                  <div key={`${from}→${to}`} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-36 shrink-0 justify-end">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: fromInfo.color }} />
                      <span className="text-xs text-muted-foreground truncate">{fromInfo.name}</span>
                    </div>
                    <div className="text-muted-foreground/40 text-xs">&rarr;</div>
                    <div className="flex items-center gap-1.5 w-36 shrink-0">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: toInfo.color }} />
                      <span className="text-xs text-muted-foreground truncate">{toInfo.name}</span>
                    </div>
                    <div className="flex-1 h-5 rounded-full bg-muted relative">
                      <div
                        className="h-5 rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 5)}%`,
                          background: `linear-gradient(90deg, ${fromInfo.color}80, ${toInfo.color}80)`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Golden Path */}
      <motion.div variants={fadeUp}>
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
              Golden Path &mdash; Won Deal Journey Pattern
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Most common channel at each journey stage for closed-won deals
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {goldenPath.map((step, i) => {
                const chInfo = ENRICHED_CHANNELS[step.topChannel as EnrichedChannel];
                return (
                  <div key={step.position} className="flex items-center gap-2">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center min-w-[120px]">
                      <p className="text-[10px] font-medium text-emerald-400/70 uppercase tracking-wide">{step.position}</p>
                      <div className="mt-1 flex items-center justify-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chInfo?.color || '#666' }} />
                        <span className="text-xs font-medium text-foreground">{chInfo?.name || step.topChannel}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{step.topChannelPct}% of won deals</p>
                    </div>
                    {i < goldenPath.length - 1 && (
                      <span className="text-emerald-500/50 text-lg">&rarr;</span>
                    )}
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
