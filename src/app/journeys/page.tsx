"use client";

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
  // Top 10 accounts by deal size
  const top10 = [...ENRICHED_DATA]
    .sort((a, b) => b.deal_amount - a.deal_amount)
    .slice(0, 10);

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
          Visualize the complete marketing journey for key accounts. Each marker
          represents a marketing touchpoint, colored by enriched channel. BDR touches
          use distinct icons.
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
    </motion.div>
  );
}
