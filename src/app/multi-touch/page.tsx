"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightCard } from "@/components/cards/insight-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DATA, CHANNELS, CHANNEL_KEYS, type Channel } from "@/lib/data";
import {
  type AttributionModel,
  runAttribution,
  firstTouchAttribution,
  lastTouchAttribution,
  multiTouchAttribution,
} from "@/lib/attribution";
import { ModelSwitcher } from "@/components/controls/model-switcher";
import { fmtCurrency, fmtPct } from "@/lib/format";

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

function computeDeltas() {
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);
  const mt = multiTouchAttribution(DATA);

  return CHANNEL_KEYS.map((ch) => {
    const ftPipe = ft[ch].pipeline;
    const ltPipe = lt[ch].pipeline;
    const mtPipe = mt[ch].pipeline;

    const ftDelta = ftPipe > 0 ? ((mtPipe - ftPipe) / ftPipe) * 100 : 0;
    const ltDelta = ltPipe > 0 ? ((mtPipe - ltPipe) / ltPipe) * 100 : 0;

    return {
      channel: ch,
      ft: ftPipe,
      lt: ltPipe,
      mt: mtPipe,
      ftDelta,
      ltDelta,
    };
  });
}

function computeWonVsLost() {
  const wonDeals = DATA.filter((d) => d.stage === "closed_won");
  const lostDeals = DATA.filter((d) => d.stage === "closed_lost");

  return CHANNEL_KEYS.map((ch) => {
    const wonAvg =
      wonDeals.length > 0
        ? wonDeals.reduce(
            (s, d) => s + d.touches.filter((t) => t.channel === ch).length,
            0
          ) / wonDeals.length
        : 0;
    const lostAvg =
      lostDeals.length > 0
        ? lostDeals.reduce(
            (s, d) => s + d.touches.filter((t) => t.channel === ch).length,
            0
          ) / lostDeals.length
        : 0;

    return {
      name: CHANNELS[ch].shortName,
      won: Number(wonAvg.toFixed(1)),
      lost: Number(lostAvg.toFixed(1)),
    };
  });
}

export default function MultiTouchPage() {
  const [model, setModel] = useState<AttributionModel>("linear");
  const mt = useMemo(() => runAttribution(model, DATA), [model]);
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);
  const totalPipeline = CHANNEL_KEYS.reduce((s, ch) => s + mt[ch].pipeline, 0);
  const deltas = computeDeltas();
  const wonVsLost = computeWonVsLost();

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
            Multi-Touch Attribution
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Credit distributed across all touchpoints by engagement weight. This
            model provides the most balanced view of channel influence across the
            entire buyer journey.
          </p>
        </div>
        <ModelSwitcher value={model} onChange={setModel} />
      </motion.div>

      {/* Channel Cards with deltas */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CHANNEL_KEYS.map((ch) => {
          const d = deltas.find((x) => x.channel === ch)!;
          const share = totalPipeline > 0 ? mt[ch].pipeline / totalPipeline : 0;
          return (
            <motion.div key={ch} variants={fadeUp}>
              <Card className="overflow-hidden">
                <div
                  className="h-1"
                  style={{ backgroundColor: CHANNELS[ch].color }}
                />
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CHANNELS[ch].color }}
                    />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {CHANNELS[ch].name}
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground">
                    {fmtCurrency(mt[ch].pipeline)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmtPct(share)} of pipeline
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        d.ftDelta >= 0
                          ? "bg-emerald-500/10 text-emerald-400 text-[11px]"
                          : "bg-destructive/10 text-destructive text-[11px]"
                      }
                    >
                      {d.ftDelta >= 0 ? "+" : ""}
                      {d.ftDelta.toFixed(0)}% vs FT
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        d.ltDelta >= 0
                          ? "bg-emerald-500/10 text-emerald-400 text-[11px]"
                          : "bg-destructive/10 text-destructive text-[11px]"
                      }
                    >
                      {d.ltDelta >= 0 ? "+" : ""}
                      {d.ltDelta.toFixed(0)}% vs LT
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Comparison Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Model Comparison
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              How multi-touch attribution differs from single-touch models
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Channel</th>
                    <th className="pb-3 pr-4 text-right">First Touch</th>
                    <th className="pb-3 pr-4 text-right">Last Touch</th>
                    <th className="pb-3 pr-4 text-right">Multi-Touch</th>
                    <th className="pb-3 pr-4 text-right">FT→MT</th>
                    <th className="pb-3 text-right">LT→MT</th>
                  </tr>
                </thead>
                <tbody>
                  {deltas.map((d) => (
                    <tr
                      key={d.channel}
                      className="border-b border-border/50 transition-colors hover:bg-accent/50"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: CHANNELS[d.channel].color,
                            }}
                          />
                          <span className="font-medium text-foreground">
                            {CHANNELS[d.channel].name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-foreground">
                        {fmtCurrency(d.ft)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-foreground">
                        {fmtCurrency(d.lt)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono font-semibold text-foreground">
                        {fmtCurrency(d.mt)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Badge
                          variant="secondary"
                          className={
                            d.ftDelta >= 0
                              ? "bg-emerald-500/10 text-emerald-400 text-[11px]"
                              : "bg-destructive/10 text-destructive text-[11px]"
                          }
                        >
                          {d.ftDelta >= 0 ? "+" : ""}
                          {d.ftDelta.toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant="secondary"
                          className={
                            d.ltDelta >= 0
                              ? "bg-emerald-500/10 text-emerald-400 text-[11px]"
                              : "bg-destructive/10 text-destructive text-[11px]"
                          }
                        >
                          {d.ltDelta >= 0 ? "+" : ""}
                          {d.ltDelta.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Won vs Lost Bar Chart */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Won vs Lost: Average Touches by Channel
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              How channel engagement differs between won and lost deals
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={wonVsLost} barCategoryGap="20%">
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
                  width={30}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                        <p className="mb-1 text-xs font-semibold text-foreground">
                          {label}
                        </p>
                        {payload.map((p: any) => (
                          <div
                            key={p.dataKey}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: p.fill }}
                            />
                            <span className="text-muted-foreground">
                              {p.dataKey === "won" ? "Won Deals" : "Lost Deals"}:
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {p.value} avg touches
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                  cursor={{ fill: "hsl(var(--chart-cursor))" }}
                />
                <Bar
                  dataKey="won"
                  fill="hsl(168, 55%, 42%)"
                  radius={[4, 4, 0, 0]}
                  name="Won Deals"
                />
                <Bar
                  dataKey="lost"
                  fill="hsl(0, 72%, 55%)"
                  radius={[4, 4, 0, 0]}
                  name="Lost Deals"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(168,55%,42%)]" />
                <span className="text-xs text-muted-foreground">Won Deals</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(0,72%,55%)]" />
                <span className="text-xs text-muted-foreground">Lost Deals</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insight Cards */}
      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Multi-Touch Insights
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InsightCard
            severity="info"
            title="Marketo Email: Hidden Workhorse"
            description="Multi-touch reveals significantly more email influence than either single-touch model. Email nurtures consistently appear in the middle of winning journeys but are invisible to first/last-touch attribution."
          />
          <InsightCard
            severity="warning"
            title="LinkedIn Over-Credited in First Touch"
            description="First-touch gives LinkedIn ~50% of pipeline credit, but multi-touch shows a more balanced distribution. LinkedIn starts conversations but other channels do the heavy lifting to close."
          />
          <InsightCard
            severity="info"
            title="Events Punch Above Weight"
            description="Won deals average significantly more event touches than lost deals. Events may be the strongest leading indicator of deal success — consider increasing investment in event marketing."
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
