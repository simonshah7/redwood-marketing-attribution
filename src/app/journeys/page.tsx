"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InsightCard } from "@/components/cards/insight-card";
import { ChannelLegend } from "@/components/shared/channel-legend";
import { DATA, CHANNELS, STAGES, MONTH_KEYS } from "@/lib/data";
import { fmt } from "@/lib/utils";

function buildJourneyData() {
  const top10 = [...DATA].sort((a, b) => b.deal - a.deal).slice(0, 10);

  const startDate = new Date("2024-02-01");
  const endDate = new Date("2025-01-31");
  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  return top10.map((acc) => {
    const stageDef = STAGES.find((s) => s.key === acc.stage);
    return {
      name: acc.name,
      deal: acc.deal,
      stage: stageDef?.name ?? acc.stage,
      stageColor: stageDef?.color ?? "#666",
      touches: acc.touches.map((t) => {
        const touchDate = new Date(t.date);
        const dayOffset =
          (touchDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const positionPct = Math.max(
          0,
          Math.min(100, (dayOffset / totalDays) * 100)
        );
        return {
          ...t,
          positionPct,
          color: CHANNELS[t.channel].color,
          channelName: CHANNELS[t.channel].name,
        };
      }),
    };
  });
}

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
  const journeyData = buildJourneyData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Journeys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize the complete marketing journey for key accounts
        </p>
      </div>

      {/* Channel Legend */}
      <ChannelLegend />

      {/* Journey Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Top 10 Accounts by Deal Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Timeline header */}
          <div className="mb-4 flex">
            <div className="w-36 shrink-0" />
            <div className="relative flex flex-1 justify-between text-[10px] text-muted-foreground">
              {TIMELINE_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          {/* Account rows */}
          <div className="space-y-3">
            {journeyData.map((acc) => (
              <div
                key={acc.name}
                className="flex items-center rounded-md py-2 transition-colors hover:bg-secondary/30"
              >
                {/* Account info */}
                <div className="w-36 shrink-0 pr-3">
                  <p className="truncate text-xs font-medium text-foreground">
                    {acc.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {fmt(acc.deal)}
                    </span>
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[9px]"
                      style={{
                        backgroundColor: `${acc.stageColor}20`,
                        color: acc.stageColor,
                      }}
                    >
                      {acc.stage}
                    </Badge>
                  </div>
                </div>

                {/* Timeline dots */}
                <div className="relative h-6 flex-1 rounded bg-secondary/30">
                  {acc.touches.map((t, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-background shadow-sm transition-transform hover:scale-150"
                          style={{
                            left: `${t.positionPct}%`,
                            backgroundColor: t.color,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <p className="font-semibold">{t.channelName}</p>
                        <p className="text-muted-foreground">{t.date}</p>
                        <p className="text-muted-foreground">{t.campaign}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pattern Insight Cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Journey Patterns</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InsightCard
            severity="info"
            title="Winning Pattern: LinkedIn → Event → Email → Form"
            description="Won deals typically start with LinkedIn awareness, attend an event mid-funnel, receive email nurture, and convert via a web form. This 4-stage journey is the most common path to Closed Won."
          />
          <InsightCard
            severity="danger"
            title="Losing Pattern: LinkedIn → Gap → Form"
            description="Lost deals show a pattern of initial LinkedIn engagement followed by a long gap with no touchpoints, then a direct form submission. The absence of mid-funnel nurture correlates with losing."
          />
          <InsightCard
            severity="warning"
            title="Stalled Pattern: Heavy Email, No Events"
            description="Deals stuck in early stages show heavy email engagement but zero event touches. Adding event invitations to stalled nurture sequences could accelerate pipeline velocity."
          />
        </div>
      </div>
    </motion.div>
  );
}
