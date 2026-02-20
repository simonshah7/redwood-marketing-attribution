"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/cards/kpi-card";
import { InsightCard } from "@/components/cards/insight-card";
import { TrendSparkline } from "@/components/charts/trend-sparkline";
import { ModelSwitcher } from "@/components/controls/model-switcher";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";
import { CHANNELS, CHANNEL_KEYS, type Channel } from "@/lib/data";
import {
  type AttributionModel,
  ATTRIBUTION_MODELS,
} from "@/lib/attribution";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { usePeriod } from "@/lib/period-context";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  computeChannelAttributionTrends,
  computeModelDivergence,
  computeModelStability,
  generateTrendInsights,
  type ChannelAttributionTrend,
} from "@/lib/attribution-trends";
import { PageGuide } from "@/components/shared/page-guide";
import { PAGE_GUIDES } from "@/lib/guide-content";

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

function MomentumBadge({ momentum }: { momentum: 'rising' | 'stable' | 'declining' }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 text-[11px] font-medium",
        momentum === "rising" && "bg-primary/10 text-primary",
        momentum === "declining" && "bg-destructive/10 text-destructive",
        momentum === "stable" && "text-muted-foreground",
      )}
    >
      {momentum === "rising" && <TrendingUp className="h-3 w-3" />}
      {momentum === "declining" && <TrendingDown className="h-3 w-3" />}
      {momentum === "stable" && <Minus className="h-3 w-3" />}
      {momentum}
    </Badge>
  );
}

export default function AttributionTrendsPage() {
  const { period, periodLabel } = usePeriod();
  const [model, setModel] = useState<AttributionModel>("linear");

  const trends = useMemo(() => computeChannelAttributionTrends(model), [model]);
  const divergences = useMemo(() => computeModelDivergence(period), [period]);
  const stability = useMemo(() => computeModelStability(), []);
  const insights = useMemo(() => generateTrendInsights(model), [model]);

  // Summary KPIs
  const topRiser = [...trends].sort((a, b) => b.shareDeltaPp - a.shareDeltaPp)[0];
  const topDecliner = [...trends].sort((a, b) => a.shareDeltaPp - b.shareDeltaPp)[0];
  const maxDivergence = [...divergences].sort((a, b) => b.spreadPp - a.spreadPp)[0];
  const latestStability = stability[stability.length - 1];

  // Line chart data: attribution share over time
  const shareChartData = useMemo(() => {
    if (trends.length === 0) return [];
    const numPeriods = trends[0].share.length;
    return Array.from({ length: numPeriods }, (_, i) => {
      const row: Record<string, string | number> = {
        label: trends[0].share[i].label,
      };
      for (const t of trends) {
        row[t.channel] = t.share[i].value;
      }
      return row;
    });
  }, [trends]);

  // Pipeline bar chart data: attributed pipeline per channel, latest period
  const pipelineBarData = useMemo(() => {
    return trends.map(t => ({
      name: CHANNELS[t.channel].shortName,
      channel: t.channel,
      pipeline: t.pipeline[t.pipeline.length - 1]?.value ?? 0,
      delta: t.pipelineDeltaPct,
    }));
  }, [trends]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Attribution Trends
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How channel attribution shifts over time &middot; {ATTRIBUTION_MODELS.find(m => m.id === model)?.label ?? model} &middot; {periodLabel}
          </p>
        </div>
        <ModelSwitcher value={model} onChange={setModel} />
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/attribution-trends"]} />
      </motion.div>

      {/* Summary KPI row */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <KpiCard
            title="Top Gaining Channel"
            value={topRiser ? CHANNELS[topRiser.channel].shortName : "—"}
            delta={topRiser ? `+${topRiser.shareDeltaPp.toFixed(1)}pp MoM` : "—"}
            trend={topRiser && topRiser.shareDeltaPp > 0 ? "positive" : "neutral"}
            helpText={HELP_TEXT.attribution_trend_gainer}
            sparkline={topRiser ? <TrendSparkline data={topRiser.share} format="pct" /> : undefined}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard
            title="Top Declining Channel"
            value={topDecliner ? CHANNELS[topDecliner.channel].shortName : "—"}
            delta={topDecliner ? `${topDecliner.shareDeltaPp.toFixed(1)}pp MoM` : "—"}
            trend={topDecliner && topDecliner.shareDeltaPp < 0 ? "negative" : "neutral"}
            helpText={HELP_TEXT.attribution_trend_decliner}
            sparkline={topDecliner ? <TrendSparkline data={topDecliner.share} format="pct" /> : undefined}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard
            title="Max Model Divergence"
            value={maxDivergence ? `${maxDivergence.spreadPp.toFixed(1)}pp` : "—"}
            delta={maxDivergence ? CHANNELS[maxDivergence.channel].shortName : "—"}
            trend={maxDivergence && maxDivergence.spreadPp > 20 ? "negative" : "neutral"}
            helpText={HELP_TEXT.attribution_trend_divergence}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard
            title="Avg Model Spread"
            value={latestStability ? `${latestStability.avgSpread.toFixed(1)}pp` : "—"}
            delta={latestStability ? `Max ${latestStability.maxSpread.toFixed(1)}pp` : "—"}
            trend="neutral"
            helpText={HELP_TEXT.attribution_trend_stability}
          />
        </motion.div>
      </motion.div>

      {/* Attribution Share Over Time — Line Chart */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Attribution Share Over Time
              <HelpTip text={HELP_TEXT.attribution_trend_share_chart} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              % of attributed pipeline per channel across reporting periods
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={shareChartData}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--chart-axis))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--chart-axis))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                        <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
                        {payload.map((p: any) => {
                          const ch = p.dataKey as Channel;
                          const info = CHANNELS[ch];
                          if (!info) return null;
                          return (
                            <div key={ch} className="flex items-center gap-2 text-xs">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: info.color }}
                              />
                              <span className="text-muted-foreground">{info.shortName}:</span>
                              <span className="font-mono font-medium text-foreground">
                                {Number(p.value).toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ stroke: "hsl(var(--chart-cursor))", strokeWidth: 1 }}
                />
                {CHANNEL_KEYS.map(ch => (
                  <Line
                    key={ch}
                    type="monotone"
                    dataKey={ch}
                    stroke={CHANNELS[ch].color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHANNELS[ch].color }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {CHANNEL_KEYS.map(ch => (
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

      {/* Channel Momentum Cards + Pipeline Bar */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {/* Channel Momentum Cards */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                Channel Momentum
                <HelpTip text={HELP_TEXT.attribution_trend_momentum} />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Attribution share trend direction per channel
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {trends.map(t => {
                const currentShare = t.share[t.share.length - 1]?.value ?? 0;
                return (
                  <div
                    key={t.channel}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/50"
                  >
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: CHANNELS[t.channel].color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {CHANNELS[t.channel].name}
                        </span>
                        <MomentumBadge momentum={t.momentum} />
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{currentShare.toFixed(1)}% share</span>
                        <span className={cn(
                          "flex items-center gap-0.5 font-mono",
                          t.shareDeltaPp > 0 && "text-primary",
                          t.shareDeltaPp < 0 && "text-destructive",
                        )}>
                          {t.shareDeltaPp > 0 ? <ArrowUpRight className="h-3 w-3" /> : t.shareDeltaPp < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                          {t.shareDeltaPp > 0 ? "+" : ""}{t.shareDeltaPp.toFixed(1)}pp
                        </span>
                        <span className="font-mono">{fmtCurrency(t.pipeline[t.pipeline.length - 1]?.value ?? 0)}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <TrendSparkline data={t.share} format="pct" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Attributed Pipeline Bar Chart */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                Attributed Pipeline by Channel
                <HelpTip text={HELP_TEXT.attribution_trend_pipeline_bar} />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Current period attributed pipeline with MoM change
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pipelineBarData} barCategoryGap="20%">
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--chart-axis))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--chart-axis))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={(v: number) => {
                      if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                      if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                      return `$${v}`;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      const ch = d.channel as Channel;
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                          <p className="mb-1 text-xs font-semibold text-foreground">
                            {CHANNELS[ch].name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pipeline: <span className="font-mono font-medium text-foreground">{fmtCurrency(d.pipeline)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            MoM: <span className={cn(
                              "font-mono font-medium",
                              d.delta > 0 ? "text-primary" : d.delta < 0 ? "text-destructive" : "text-foreground",
                            )}>
                              {d.delta > 0 ? "+" : ""}{d.delta.toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      );
                    }}
                    cursor={{ fill: "hsl(var(--chart-cursor))" }}
                  />
                  <Bar dataKey="pipeline" radius={[4, 4, 0, 0]}>
                    {pipelineBarData.map((d, i) => (
                      <Cell key={i} fill={CHANNELS[d.channel as Channel].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Delta badges below chart */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                {pipelineBarData.map(d => (
                  <Badge
                    key={d.channel}
                    variant="secondary"
                    className={cn(
                      "text-[11px] font-medium",
                      d.delta > 0 && "bg-primary/10 text-primary",
                      d.delta < 0 && "bg-destructive/10 text-destructive",
                      d.delta === 0 && "text-muted-foreground",
                    )}
                  >
                    {d.name}: {d.delta > 0 ? "+" : ""}{d.delta.toFixed(1)}% MoM
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Period-over-Period Attribution Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Period-over-Period Attribution
              <HelpTip text={HELP_TEXT.attribution_trend_table} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Attributed pipeline and share per channel across all reporting periods
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Channel</th>
                    {trends[0]?.pipeline.map(p => (
                      <th key={p.period} className="pb-3 pr-4 text-right">{p.label}</th>
                    ))}
                    <th className="pb-3 pr-4 text-right">MoM &Delta;</th>
                    <th className="pb-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map(t => (
                    <tr
                      key={t.channel}
                      className="border-b border-border/50 transition-colors hover:bg-accent/50"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CHANNELS[t.channel].color }}
                          />
                          <span className="font-medium text-foreground">
                            {CHANNELS[t.channel].name}
                          </span>
                        </div>
                      </td>
                      {t.pipeline.map((p, i) => (
                        <td key={p.period} className="py-3 pr-4 text-right">
                          <span className="font-mono text-foreground">
                            {fmtCurrency(p.value)}
                          </span>
                          <br />
                          <span className="text-[11px] text-muted-foreground">
                            {t.share[i].value.toFixed(1)}%
                          </span>
                        </td>
                      ))}
                      <td className="py-3 pr-4 text-right">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[11px] font-medium",
                            t.pipelineDeltaPct > 0 && "bg-primary/10 text-primary",
                            t.pipelineDeltaPct < 0 && "bg-destructive/10 text-destructive",
                            t.pipelineDeltaPct === 0 && "text-muted-foreground",
                          )}
                        >
                          {t.pipelineDeltaPct > 0 ? "+" : ""}{t.pipelineDeltaPct.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <TrendSparkline data={t.pipeline} format="currency" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Divergence Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Model Divergence Analysis
              <HelpTip text={HELP_TEXT.attribution_trend_model_divergence} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              How much attribution models disagree on each channel&apos;s credit &middot; {periodLabel}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Channel</th>
                    <th className="pb-3 pr-4 text-right">Spread</th>
                    <th className="pb-3 pr-4 text-right">Highest Model</th>
                    <th className="pb-3 pr-4 text-right">Lowest Model</th>
                    <th className="pb-3 text-right">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {divergences.map(d => {
                    const modelLabels: Record<string, string> = {
                      first_touch: 'First Touch',
                      last_touch: 'Last Touch',
                      linear: 'Linear',
                      time_decay: 'Time-Decay',
                      position_based: 'Position-Based',
                    };
                    return (
                      <tr
                        key={d.channel}
                        className="border-b border-border/50 transition-colors hover:bg-accent/50"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: CHANNELS[d.channel].color }}
                            />
                            <span className="font-medium text-foreground">
                              {CHANNELS[d.channel].name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[11px] font-medium",
                              d.spreadPp > 20 && "bg-destructive/10 text-destructive",
                              d.spreadPp > 10 && d.spreadPp <= 20 && "bg-amber-500/10 text-amber-400",
                              d.spreadPp <= 10 && "text-muted-foreground",
                            )}
                          >
                            {d.spreadPp.toFixed(1)}pp
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right text-xs text-muted-foreground">
                          {modelLabels[d.highestModel]} ({d.highestSharePct.toFixed(1)}%)
                        </td>
                        <td className="py-3 pr-4 text-right text-xs text-muted-foreground">
                          {modelLabels[d.lowestModel]} ({d.lowestSharePct.toFixed(1)}%)
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <div className="relative h-2 w-16 rounded-full bg-muted">
                              <div
                                className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                                style={{ width: `${Math.min((d.spreadPp / 50) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend Insights */}
      {insights.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Trend Insights
            <HelpTip text={HELP_TEXT.attribution_trend_insights} />
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {insights.map((insight, i) => (
              <InsightCard
                key={i}
                severity={insight.severity}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
