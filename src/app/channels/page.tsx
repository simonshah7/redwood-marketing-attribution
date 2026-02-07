"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DATA,
  CHANNELS,
  CHANNEL_KEYS,
  CAMPAIGNS,
  MONTH_KEYS,
  MONTH_LABELS,
  type Channel,
} from "@/lib/data";

function buildChannelData() {
  return CHANNEL_KEYS.map((ch) => {
    // Total touches for this channel
    const allTouches = DATA.flatMap((d) =>
      d.touches.filter((t) => t.channel === ch)
    );
    const totalTouches = allTouches.length;

    // Monthly sparkline data
    const monthlyTouches = MONTH_KEYS.map((mk) => {
      return allTouches.filter((t) => t.date.startsWith(mk)).length;
    });
    const maxMonthly = Math.max(...monthlyTouches, 1);

    // Campaign breakdown
    const campaignCounts: Record<string, number> = {};
    allTouches.forEach((t) => {
      campaignCounts[t.campaign] = (campaignCounts[t.campaign] || 0) + 1;
    });
    const topCampaigns = Object.entries(campaignCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const maxCampaignCount = topCampaigns.length > 0 ? topCampaigns[0][1] : 1;

    return {
      key: ch,
      name: CHANNELS[ch].name,
      color: CHANNELS[ch].color,
      totalTouches,
      monthlyTouches,
      maxMonthly,
      topCampaigns,
      maxCampaignCount,
    };
  });
}

export default function ChannelsPage() {
  const channelData = buildChannelData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Channel Performance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deep dive into individual channel metrics and campaign performance
        </p>
      </div>

      {/* 2x2 Channel Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {channelData.map((ch) => (
          <Card key={ch.key} className="relative overflow-hidden">
            <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ backgroundColor: ch.color }}
            />
            <CardContent className="p-5">
              {/* Channel header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: ch.color }}
                  />
                  <h3 className="text-base font-semibold text-foreground">
                    {ch.name}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {ch.totalTouches} touches
                </Badge>
              </div>

              {/* Monthly Sparkline */}
              <div className="mt-4">
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Monthly Volume
                </p>
                <div className="flex items-end gap-1" style={{ height: 40 }}>
                  {ch.monthlyTouches.map((count, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max((count / ch.maxMonthly) * 100, 4)}%`,
                        backgroundColor: ch.color,
                        opacity: 0.7 + (count / ch.maxMonthly) * 0.3,
                      }}
                      title={`${MONTH_LABELS[idx]}: ${count}`}
                    />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
                  <span>{MONTH_LABELS[0]}</span>
                  <span>{MONTH_LABELS[MONTH_LABELS.length - 1]}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Top Campaigns */}
              <div>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Top Campaigns
                </p>
                <div className="space-y-2">
                  {ch.topCampaigns.map(([campaign, count]) => (
                    <div key={campaign}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="max-w-[80%] truncate text-foreground">
                          {campaign}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {count}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(count / ch.maxCampaignCount) * 100}%`,
                            backgroundColor: ch.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
