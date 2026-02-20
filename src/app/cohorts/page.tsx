"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTip } from "@/components/shared/help-tip";
import { CHANNELS, CHANNEL_KEYS, DATA, type Channel } from "@/lib/data";
import { usePeriod } from "@/lib/period-context";
import { cn, fmt } from "@/lib/utils";
import {
  analyzeCohorts,
  type CohortAnalysis,
  type TimeCohort,
  type ChannelCohort,
  type DensityCohort,
  type IndustryCohort,
} from "@/lib/cohort-analysis";
import { Users, Trophy, Zap, TrendingUp } from "lucide-react";

/* ── Animation variants ────────────────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

/* ── Tabs ──────────────────────────────────────────────────── */

const tabs = [
  { id: "time", label: "Time Cohorts" },
  { id: "channel", label: "Channel Origin" },
  { id: "density", label: "Engagement Density" },
  { id: "industry", label: "Industry" },
] as const;

type TabId = (typeof tabs)[number]["id"];

/* ── Helpers ───────────────────────────────────────────────── */

function pctLabel(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

/* ── Tab Content Components ────────────────────────────────── */

function TimeCohortTab({ cohorts }: { cohorts: TimeCohort[] }) {
  const chartData = cohorts.map((c) => ({
    name: c.label,
    pipeline: c.pipeline,
    winRate: +(c.winRate * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Dual-axis chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Cohort Pipeline &amp; Win Rate by Month
            <HelpTip text="Pipeline value (bars) and win rate (line) for accounts grouped by the month of their first marketing touch." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--chart-axis))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(var(--chart-axis))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v: number) => fmt(v)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "hsl(var(--chart-axis))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} className="text-xs text-muted-foreground">
                          {p.dataKey === "pipeline" ? "Pipeline" : "Win Rate"}:{" "}
                          <span className="font-mono font-medium text-foreground">
                            {p.dataKey === "pipeline" ? fmt(p.value) : `${p.value}%`}
                          </span>
                        </p>
                      ))}
                    </div>
                  );
                }}
                cursor={{ fill: "hsl(var(--chart-cursor))" }}
              />
              <Bar
                yAxisId="left"
                dataKey="pipeline"
                fill="hsl(168, 55%, 45%)"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="winRate"
                stroke="hsl(38, 55%, 55%)"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(38, 55%, 55%)" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Cohort Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4">Month</th>
                  <th className="pb-3 pr-4 text-right">Accounts</th>
                  <th className="pb-3 pr-4 text-right">Pipeline</th>
                  <th className="pb-3 pr-4 text-right">Revenue</th>
                  <th className="pb-3 pr-4 text-right">Win Rate</th>
                  <th className="pb-3 text-right">Avg Touches</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr
                    key={c.month}
                    className="border-b border-border/50 transition-colors hover:bg-accent/50"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">{c.label}</td>
                    <td className="py-3 pr-4 text-right font-mono">{c.accountCount}</td>
                    <td className="py-3 pr-4 text-right font-mono">{fmt(c.pipeline)}</td>
                    <td className="py-3 pr-4 text-right font-mono">{fmt(c.revenue)}</td>
                    <td className="py-3 pr-4 text-right font-mono">{pctLabel(c.winRate)}</td>
                    <td className="py-3 text-right font-mono">{c.avgTouches.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChannelOriginTab({ cohorts }: { cohorts: ChannelCohort[] }) {
  const mixChartData = cohorts.map((c) => {
    const row: Record<string, string | number> = {
      name: CHANNELS[c.channel].shortName,
    };
    for (const ch of CHANNEL_KEYS) {
      row[ch] = +(c.subsequentChannelMix[ch] * 100).toFixed(1);
    }
    return row;
  });

  return (
    <div className="space-y-6">
      {/* Channel cohort cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {cohorts.map((c) => (
          <Card key={c.channel}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: CHANNELS[c.channel].color }}
                />
                <h3 className="text-sm font-semibold text-foreground">
                  {CHANNELS[c.channel].name} Origin
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Accounts</span>
                  <p className="font-mono font-medium text-foreground">{c.accountCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pipeline</span>
                  <p className="font-mono font-medium text-foreground">{fmt(c.pipeline)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Win Rate</span>
                  <p className="font-mono font-medium text-foreground">{pctLabel(c.winRate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Touches</span>
                  <p className="font-mono font-medium text-foreground">{c.avgTouches.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Deal Size</span>
                  <p className="font-mono font-medium text-foreground">{fmt(c.avgDealSize)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Velocity</span>
                  <p className="font-mono font-medium text-foreground">{Math.round(c.avgVelocityDays)}d</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subsequent channel mix stacked bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Subsequent Channel Mix
            <HelpTip text="After the first touch from each origin channel, what channels appear in the rest of the journey?" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mixChartData} layout="vertical" barCategoryGap="20%">
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--chart-axis))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(var(--chart-axis))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                      <p className="mb-1 text-xs font-semibold text-foreground">{label} origin</p>
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
                cursor={{ fill: "hsl(var(--chart-cursor))" }}
              />
              {CHANNEL_KEYS.map((ch) => (
                <Bar
                  key={ch}
                  dataKey={ch}
                  stackId="mix"
                  fill={CHANNELS[ch].color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {CHANNEL_KEYS.map((ch) => (
              <div key={ch} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: CHANNELS[ch].color }}
                />
                <span className="text-xs text-muted-foreground">{CHANNELS[ch].shortName}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DensityTab({ cohorts }: { cohorts: DensityCohort[] }) {
  const chartData = cohorts.map((c) => ({
    name: c.bucket,
    winRate: +(c.winRate * 100).toFixed(1),
    accounts: c.accountCount,
  }));

  // Compute insight: high-touch vs low-touch win rate multiplier
  const lowBucket = cohorts.find((c) => c.bucket === "1-3");
  const highBucket = cohorts.find((c) => c.bucket === "7-9") ?? cohorts.find((c) => c.bucket === "10+");
  const multiplier =
    lowBucket && highBucket && lowBucket.winRate > 0
      ? (highBucket.winRate / lowBucket.winRate).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Win rate by bucket chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Win Rate by Engagement Density
            <HelpTip text="How win rates change as accounts accumulate more marketing touchpoints." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--chart-axis))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Touches",
                  position: "insideBottom",
                  offset: -5,
                  style: { fill: "hsl(var(--chart-axis))", fontSize: 11 },
                }}
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
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                      <p className="mb-1 text-xs font-semibold text-foreground">{label} touches</p>
                      <p className="text-xs text-muted-foreground">
                        Win Rate:{" "}
                        <span className="font-mono font-medium text-foreground">{d.winRate}%</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accounts:{" "}
                        <span className="font-mono font-medium text-foreground">{d.accounts}</span>
                      </p>
                    </div>
                  );
                }}
                cursor={{ fill: "hsl(var(--chart-cursor))" }}
              />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === chartData.length - 1
                        ? "hsl(168, 55%, 45%)"
                        : i === chartData.length - 2
                        ? "hsl(168, 45%, 52%)"
                        : "hsl(220, 20%, 50%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Bucket Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4">Touches</th>
                  <th className="pb-3 pr-4 text-right">Accounts</th>
                  <th className="pb-3 pr-4 text-right">Pipeline</th>
                  <th className="pb-3 pr-4 text-right">Win Rate</th>
                  <th className="pb-3 pr-4 text-right">Avg Deal Size</th>
                  <th className="pb-3 text-right">Avg Velocity</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr
                    key={c.bucket}
                    className="border-b border-border/50 transition-colors hover:bg-accent/50"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">{c.bucket}</td>
                    <td className="py-3 pr-4 text-right font-mono">{c.accountCount}</td>
                    <td className="py-3 pr-4 text-right font-mono">{fmt(c.pipeline)}</td>
                    <td className="py-3 pr-4 text-right font-mono">{pctLabel(c.winRate)}</td>
                    <td className="py-3 pr-4 text-right font-mono">{fmt(c.avgDealSize)}</td>
                    <td className="py-3 text-right font-mono">{Math.round(c.avgVelocityDays)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insight card */}
      {multiplier && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Insight:</span> Accounts with 7+ touches
              win at{" "}
              <span className="font-mono font-bold text-primary">{multiplier}x</span>{" "}
              the rate of accounts with 1-3 touches.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IndustryTab({ cohorts }: { cohorts: IndustryCohort[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
          Industry Cohorts
          <HelpTip text="Account cohorts grouped by industry, sorted by pipeline value." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4">Industry</th>
                <th className="pb-3 pr-4 text-right">Accounts</th>
                <th className="pb-3 pr-4 text-right">Pipeline</th>
                <th className="pb-3 pr-4 text-right">Win Rate</th>
                <th className="pb-3 pr-4 text-right">Avg Deal Size</th>
                <th className="pb-3 text-right">Top Channel</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr
                  key={c.industry}
                  className="border-b border-border/50 transition-colors hover:bg-accent/50"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">{c.industry}</td>
                  <td className="py-3 pr-4 text-right font-mono">{c.accountCount}</td>
                  <td className="py-3 pr-4 text-right font-mono">{fmt(c.pipeline)}</td>
                  <td className="py-3 pr-4 text-right font-mono">{pctLabel(c.winRate)}</td>
                  <td className="py-3 pr-4 text-right font-mono">{fmt(c.avgDealSize)}</td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHANNELS[c.topFirstTouchChannel].color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {CHANNELS[c.topFirstTouchChannel].shortName}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function CohortsPage() {
  const { period } = usePeriod();
  const [activeTab, setActiveTab] = useState<TabId>("time");

  const analysis = useMemo(() => analyzeCohorts(DATA), []);

  // Summary KPIs
  const totalCohorts =
    analysis.timeCohorts.length +
    analysis.channelCohorts.length +
    analysis.densityCohorts.length +
    analysis.industryCohorts.length;

  const allCohortRows = [
    ...analysis.timeCohorts,
    ...analysis.channelCohorts,
    ...analysis.densityCohorts,
    ...analysis.industryCohorts,
  ];

  const highestWinRate = allCohortRows.reduce(
    (best, c) => (c.winRate > best.winRate ? c : best),
    allCohortRows[0],
  );

  const fastestCohort = allCohortRows
    .filter((c) => c.avgVelocityDays > 0)
    .reduce(
      (best, c) => (c.avgVelocityDays < best.avgVelocityDays ? c : best),
      allCohortRows[0],
    );

  const highestPipeline = allCohortRows.reduce(
    (best, c) => (c.pipeline > best.pipeline ? c : best),
    allCohortRows[0],
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cohort Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze account cohorts by first-touch timing, channel origin,
          engagement density, and industry to uncover patterns in pipeline
          performance.
        </p>
      </motion.div>

      {/* KPI Summary Row */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Cohorts</p>
                <p className="text-2xl font-bold tabular-nums">{totalCohorts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Trophy className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Highest Win Rate</p>
                <p className="text-lg font-bold tabular-nums">
                  {pctLabel(highestWinRate.winRate)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {highestWinRate.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fastest Cohort</p>
                <p className="text-lg font-bold tabular-nums">
                  {Math.round(fastestCohort.avgVelocityDays)}d
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {fastestCohort.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Highest Pipeline</p>
                <p className="text-lg font-bold tabular-nums">
                  {fmt(highestPipeline.pipeline)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {highestPipeline.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab bar */}
      <motion.div variants={fadeUp}>
        <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div variants={fadeUp}>
        {activeTab === "time" && (
          <TimeCohortTab cohorts={analysis.timeCohorts} />
        )}
        {activeTab === "channel" && (
          <ChannelOriginTab cohorts={analysis.channelCohorts} />
        )}
        {activeTab === "density" && (
          <DensityTab cohorts={analysis.densityCohorts} />
        )}
        {activeTab === "industry" && (
          <IndustryTab cohorts={analysis.industryCohorts} />
        )}
      </motion.div>
    </motion.div>
  );
}
