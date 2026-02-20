"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DATA, CHANNELS, CHANNEL_KEYS, STAGES, type Channel } from "@/lib/data";
import { fmt } from "@/lib/utils";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";
import { usePeriod } from "@/lib/period-context";
import { analyzeFunnel, analyzeVelocity } from "@/lib/funnel-analysis";
import { ENRICHED_DATA } from "@/lib/mock-enriched-data";
import { PageGuide } from "@/components/shared/page-guide";
import { SoWhatPanel } from "@/components/cards/so-what-panel";
import { ActionCard } from "@/components/cards/action-card";
import { PAGE_GUIDES } from "@/lib/guide-content";
import { interpretPipeline } from "@/lib/interpretation-engine";
import { stagger, fadeUp } from "@/lib/motion";

function buildStageChannelData() {
  return STAGES.map((stage) => {
    const stageAccounts = DATA.filter((d) => d.stage === stage.key);
    const channelTouches: Record<string, number> = {};
    let total = 0;

    CHANNEL_KEYS.forEach((ch) => {
      const count = stageAccounts.reduce(
        (s, d) => s + d.touches.filter((t) => t.channel === ch).length,
        0
      );
      channelTouches[ch] = count;
      total += count;
    });

    const row: Record<string, string | number> = { name: stage.name };
    CHANNEL_KEYS.forEach((ch) => {
      row[ch] = total > 0 ? (channelTouches[ch] / total) * 100 : 0;
      row[`${ch}_raw`] = channelTouches[ch];
    });
    row.total = total;
    return row;
  });
}

function buildRegionData() {
  const regions = ["NA", "EMEA", "APAC"];
  return regions.map((region) => {
    const regionAccounts = DATA.filter((d) => d.region === region);
    const pipeline = regionAccounts.reduce((s, d) => s + d.deal, 0);
    const wonRevenue = regionAccounts
      .filter((d) => d.stage === "closed_won")
      .reduce((s, d) => s + d.deal, 0);

    const channelTouches: Record<string, number> = {};
    let total = 0;
    CHANNEL_KEYS.forEach((ch) => {
      const count = regionAccounts.reduce(
        (s, d) => s + d.touches.filter((t) => t.channel === ch).length,
        0
      );
      channelTouches[ch] = count;
      total += count;
    });

    const row: Record<string, string | number> = { name: region };
    CHANNEL_KEYS.forEach((ch) => {
      row[ch] = total > 0 ? (channelTouches[ch] / total) * 100 : 0;
    });
    row.pipeline = pipeline;
    row.wonRevenue = wonRevenue;
    return row;
  });
}

function buildIndustryData() {
  const industries: Record<
    string,
    { opps: number; pipeline: number }
  > = {};
  DATA.forEach((d) => {
    if (!industries[d.industry]) {
      industries[d.industry] = { opps: 0, pipeline: 0 };
    }
    industries[d.industry].opps += 1;
    industries[d.industry].pipeline += d.deal;
  });

  return Object.entries(industries)
    .map(([industry, data]) => ({
      industry,
      ...data,
    }))
    .sort((a, b) => b.pipeline - a.pipeline);
}

export default function PipelinePage() {
  const { periodLabel } = usePeriod();
  const stageData = buildStageChannelData();
  const regionData = buildRegionData();
  const industryData = buildIndustryData();
  const funnel = useMemo(() => analyzeFunnel(DATA), []);
  const velocity = useMemo(() => analyzeVelocity(ENRICHED_DATA), []);

  const interpretation = useMemo(
    () =>
      interpretPipeline({
        stageMetrics: funnel.stageMetrics,
        velocityByStage: velocity,
        overallConversionRate: funnel.overallConversionRate,
        topDropoffStage: funnel.topDropoffStage,
        bottleneckStage: funnel.bottleneckStage,
        avgTouchesWon: funnel.avgTouchesWon,
        avgTouchesLost: funnel.avgTouchesLost,
      }),
    [funnel, velocity]
  );

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
          Pipeline Influence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Channel influence across pipeline stages, regions, and industries &middot; {periodLabel}
        </p>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/pipeline"]} />
      </motion.div>

      {/* Stage Influence */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Channel Mix by Pipeline Stage
              <HelpTip text={HELP_TEXT.stage_channel_mix} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              How channel influence shifts across deal stages (% of touches)
            </p>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label="Stacked horizontal bar chart showing channel touch mix percentage by pipeline stage">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stageData}
                layout="vertical"
                barCategoryGap="18%"
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fill: "hsl(var(--chart-axis))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                        <p className="mb-1 text-xs font-semibold text-foreground">
                          {label}
                        </p>
                        {payload.map((p: any) => {
                          const ch = p.dataKey as Channel;
                          const info = CHANNELS[ch];
                          if (!info) return null;
                          return (
                            <div
                              key={ch}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: info.color }}
                              />
                              <span className="text-muted-foreground">
                                {info.name}:
                              </span>
                              <span className="font-mono font-medium text-foreground">
                                {p.value.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "hsl(var(--chart-cursor))" }}
                />
                {CHANNEL_KEYS.map((ch) => (
                  <Bar
                    key={ch}
                    dataKey={ch}
                    stackId="a"
                    fill={CHANNELS[ch].color}
                    radius={0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {CHANNEL_KEYS.map((ch) => (
                <div key={ch} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: CHANNELS[ch].color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {CHANNELS[ch].name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stage-to-Stage Conversion Rates */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Stage-to-Stage Conversion
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Conversion rates between adjacent pipeline stages &middot; Overall: {(funnel.overallConversionRate * 100).toFixed(1)}% disco→close
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {funnel.stageMetrics.filter(s => s.stage !== 'closed_won' && s.stage !== 'closed_lost').map((stage, i, arr) => (
                <div key={stage.stage} className="flex items-center gap-2 shrink-0">
                  <div className="rounded-lg border border-border p-3 text-center min-w-[100px]">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{stage.stageName}</p>
                    <p className="text-lg font-bold tabular-nums">{stage.accountCount}</p>
                    <p className="text-[10px] text-muted-foreground">{fmt(stage.pipeline)}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex flex-col items-center">
                      <span className={`text-xs font-bold tabular-nums ${stage.conversionToNext >= 0.7 ? 'text-emerald-500' : stage.conversionToNext >= 0.4 ? 'text-amber-500' : 'text-red-500'}`}>
                        {stage.conversionToNext >= 0.7 ? '✓ ' : stage.conversionToNext < 0.4 ? '⚠ ' : ''}{(stage.conversionToNext * 100).toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-[9px] text-muted-foreground">
                        {(stage.dropoffRate * 100).toFixed(0)}% drop
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center min-w-[120px]">
                <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">Closed Won</p>
                <p className="text-lg font-bold tabular-nums text-emerald-400">
                  {funnel.stageMetrics.find(s => s.stage === 'closed_won')?.accountCount || 0}
                </p>
              </div>
            </div>

            {/* Insight */}
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs">
                <span className="font-medium text-amber-400">Bottleneck: </span>
                <span className="text-muted-foreground">
                  Highest drop-off at <span className="font-medium text-foreground">{funnel.topDropoffStage.replace(/_/g, ' ')}</span>.
                  Won deals average {funnel.avgTouchesWon.toFixed(1)} touches vs {funnel.avgTouchesLost.toFixed(1)} for lost.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversion interpretation */}
      <motion.div variants={fadeUp}>
        <SoWhatPanel interpretations={interpretation.conversionSoWhats} />
      </motion.div>

      {/* Velocity by Stage */}
      {velocity.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                Stage Velocity (Avg Days)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Average time spent at each stage, segmented by deal outcome
              </p>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Stage</th>
                    <th className="pb-3 pr-4 text-right">Won (days)</th>
                    <th className="pb-3 pr-4 text-right">Lost (days)</th>
                    <th className="pb-3 pr-4 text-right">Open (days)</th>
                    <th className="pb-3 text-right">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {velocity.filter(v => v.stage !== 'closed_won' && v.stage !== 'closed_lost').map(v => (
                    <tr key={v.stage} className="border-b border-border/50 transition-colors hover:bg-accent/50">
                      <td className="py-3 pr-4 font-medium text-foreground">{v.stageName}</td>
                      <td className="py-3 pr-4 text-right font-mono text-emerald-400">{v.wonAvgDays > 0 ? `${v.wonAvgDays.toFixed(0)}d` : '—'}</td>
                      <td className="py-3 pr-4 text-right font-mono text-red-400">{v.lostAvgDays > 0 ? `${v.lostAvgDays.toFixed(0)}d` : '—'}</td>
                      <td className="py-3 pr-4 text-right font-mono text-muted-foreground">{v.openAvgDays > 0 ? `${v.openAvgDays.toFixed(0)}d` : '—'}</td>
                      <td className="py-3 text-right font-mono text-foreground">{v.allAvgDays > 0 ? `${v.allAvgDays.toFixed(0)}d` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Velocity interpretation */}
      <motion.div variants={fadeUp}>
        <SoWhatPanel interpretations={interpretation.velocitySoWhats} />
      </motion.div>

      {/* Region Breakdown */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Pipeline by Region
              <HelpTip text={HELP_TEXT.pipeline_by_region} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Regional pipeline distribution and channel mix
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {regionData.map((region) => (
                <div key={region.name as string}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {region.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Pipeline:{" "}
                        <span className="font-mono font-medium text-foreground">
                          {fmt(region.pipeline as number)}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Won:{" "}
                        <span className="font-mono font-medium text-emerald-400">
                          {fmt(region.wonRevenue as number)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex h-6 w-full overflow-hidden rounded-md">
                    {CHANNEL_KEYS.map((ch) => {
                      const val = region[ch] as number;
                      if (val <= 0) return null;
                      return (
                        <div
                          key={ch}
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${val}%`,
                            backgroundColor: CHANNELS[ch].color,
                          }}
                          title={`${CHANNELS[ch].name}: ${val.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {CHANNEL_KEYS.map((ch) => (
                <div key={ch} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: CHANNELS[ch].color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {CHANNELS[ch].name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Industry Breakdown Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Industry Breakdown
              <HelpTip text={HELP_TEXT.industry_breakdown} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pipeline distribution across target industries
            </p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4">Industry</th>
                  <th className="pb-3 pr-4 text-right">Opportunities</th>
                  <th className="pb-3 text-right">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {industryData.map((row) => (
                  <tr
                    key={row.industry}
                    className="border-b border-border/50 transition-colors hover:bg-accent/50"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {row.industry}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-muted-foreground">
                      {row.opps}
                    </td>
                    <td className="py-3 text-right font-mono text-foreground">
                      {fmt(row.pipeline)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Cards */}
      {interpretation.actions.length > 0 && (
        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
          {interpretation.actions.map((a) => (
            <ActionCard key={a.title} {...a} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
