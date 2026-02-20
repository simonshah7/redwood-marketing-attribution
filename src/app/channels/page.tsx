"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  DATA,
  CHANNELS,
  CHANNEL_KEYS,
  MONTH_KEYS,
  MONTH_LABELS,
  type Channel,
} from "@/lib/data";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";
import { usePeriod } from "@/lib/period-context";
import { PageGuide } from "@/components/shared/page-guide";
import { SoWhatPanel } from "@/components/cards/so-what-panel";
import { PAGE_GUIDES } from "@/lib/guide-content";
import { useMemo } from "react";
import { stagger, fadeUp } from "@/lib/motion";

function getChannelStats(ch: Channel) {
  const allTouches = DATA.flatMap((d) =>
    d.touches.filter((t) => t.channel === ch)
  );
  const totalTouches = allTouches.length;

  // Monthly sparkline data
  const monthly = MONTH_KEYS.map((mk, idx) => ({
    name: MONTH_LABELS[idx],
    count: allTouches.filter((t) => t.date.startsWith(mk)).length,
  }));

  // Top campaigns
  const campaignCounts: Record<string, number> = {};
  allTouches.forEach((t) => {
    campaignCounts[t.campaign] = (campaignCounts[t.campaign] || 0) + 1;
  });
  const topCampaigns = Object.entries(campaignCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxCampaignCount =
    topCampaigns.length > 0 ? topCampaigns[0][1] : 1;

  return { totalTouches, monthly, topCampaigns, maxCampaignCount };
}

export default function ChannelsPage() {
  const { periodLabel } = usePeriod();

  // Compute channel-level SoWhats
  const channelSoWhats = useMemo(() => {
    const stats = CHANNEL_KEYS.map(ch => {
      const touches = DATA.flatMap(d => d.touches.filter(t => t.channel === ch)).length;
      return { ch, touches };
    }).sort((a, b) => b.touches - a.touches);
    const top = stats[0];
    const bottom = stats[stats.length - 1];
    return [
      `${CHANNELS[top.ch].name} has the most activity with ${top.touches} touches, while ${CHANNELS[bottom.ch].name} trails with ${bottom.touches}. Touch volume alone doesn't predict conversion — compare with win rates on the Overview page.`,
    ];
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
          Channel Performance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deep dive into individual channel metrics and campaign performance &middot; {periodLabel}
        </p>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/channels"]} />
      </motion.div>

      {/* Channel Cards 2x2 */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {CHANNEL_KEYS.map((ch) => {
          const stats = getChannelStats(ch);
          return (
            <motion.div key={ch} variants={fadeUp}>
              <Card className="overflow-hidden">
                <div
                  className="h-1"
                  style={{ backgroundColor: CHANNELS[ch].color }}
                />
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHANNELS[ch].color }}
                      />
                      <h3 className="text-base font-semibold text-foreground">
                        {CHANNELS[ch].name}
                        <HelpTip text={HELP_TEXT.channel_card} />
                      </h3>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {stats.totalTouches} touches
                    </Badge>
                  </div>

                  {/* Monthly Sparkline */}
                  <div className="mt-4">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Monthly volume
                      <HelpTip text={HELP_TEXT.channel_sparkline} />
                    </p>
                    <ResponsiveContainer width="100%" height={60}>
                      <BarChart data={stats.monthly} barCategoryGap="15%">
                        <XAxis dataKey="name" hide />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.[0]) return null;
                            return (
                              <div className="rounded-lg border border-border bg-popover px-2 py-1 shadow-lg">
                                <p className="text-[11px] text-foreground">
                                  {label}: {payload[0].value} touches
                                </p>
                              </div>
                            );
                          }}
                          cursor={{ fill: "hsl(var(--chart-cursor))" }}
                        />
                        <Bar
                          dataKey="count"
                          fill={CHANNELS[ch].color}
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <Separator className="my-4" />

                  {/* Top Campaigns */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Top Campaigns
                      <HelpTip text={HELP_TEXT.top_campaigns} />
                    </p>
                    <div className="space-y-2.5">
                      {stats.topCampaigns.map(([campaign, count]) => (
                        <div key={campaign}>
                          <div className="mb-1 flex items-center justify-between">
                            <p className="truncate text-xs text-foreground pr-2">
                              {campaign}
                            </p>
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">
                              {count}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(count / stats.maxCampaignCount) * 100}%`,
                                backgroundColor: CHANNELS[ch].color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
      {/* Channel interpretation */}
      <motion.div variants={fadeUp}>
        <SoWhatPanel interpretations={channelSoWhats} />
      </motion.div>
    </motion.div>
  );
}
