"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChannelLegend } from "@/components/shared/channel-legend";
import { InsightCard } from "@/components/cards/insight-card";
import { DATA, CHANNELS, type Channel } from "@/lib/data";
import { fmt } from "@/lib/utils";

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

// Timeline date range
const DATE_MIN = new Date("2024-02-01").getTime();
const DATE_MAX = new Date("2025-01-31").getTime();
const DATE_RANGE = DATE_MAX - DATE_MIN;

const TIMELINE_LABELS = [
  "Feb '24",
  "Apr '24",
  "Jun '24",
  "Aug '24",
  "Oct '24",
  "Dec '24",
  "Jan '25",
];

export default function JourneysPage() {
  // Top 10 accounts by deal size
  const top10 = [...DATA]
    .sort((a, b) => b.deal - a.deal)
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
          Visualize the complete marketing journey for key accounts. Each dot
          represents a marketing touchpoint, colored by channel.
        </p>
      </motion.div>

      {/* Channel Legend */}
      <motion.div variants={fadeUp}>
        <ChannelLegend />
      </motion.div>

      {/* Journey Timeline */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Top 10 Accounts by Deal Size
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Marketing touchpoint timeline from Feb 2024 to Jan 2025
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
                  key={acc.name}
                  className="flex items-center rounded-md py-2 transition-colors hover:bg-accent/30"
                >
                  {/* Account info */}
                  <div className="w-40 shrink-0 pr-3">
                    <p className="truncate text-sm font-medium text-foreground">
                      {acc.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {fmt(acc.deal)}
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
                    {acc.touches.map((touch, idx) => {
                      const touchDate = new Date(touch.date).getTime();
                      const pctPos = Math.min(
                        Math.max(
                          ((touchDate - DATE_MIN) / DATE_RANGE) * 100,
                          0
                        ),
                        100
                      );
                      return (
                        <UITooltip key={idx}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-card cursor-pointer transition-transform hover:scale-150"
                              style={{
                                left: `${pctPos}%`,
                                backgroundColor:
                                  CHANNELS[touch.channel].color,
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs"
                          >
                            <p className="text-xs font-semibold">
                              {touch.date}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {CHANNELS[touch.channel].name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {touch.campaign}
                            </p>
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
