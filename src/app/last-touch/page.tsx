"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DATA, CHANNELS, CHANNEL_KEYS, type Channel } from "@/lib/data";
import { type AttributionModel, runAttribution } from "@/lib/attribution";
import { ModelSwitcher } from "@/components/controls/model-switcher";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";
import { usePeriod } from "@/lib/period-context";
import { PageGuide } from "@/components/shared/page-guide";
import { SoWhatPanel } from "@/components/cards/so-what-panel";
import { ActionCard } from "@/components/cards/action-card";
import { PAGE_GUIDES } from "@/lib/guide-content";
import { interpretSingleTouch } from "@/lib/interpretation-engine";

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

export default function LastTouchPage() {
  const { periodLabel } = usePeriod();
  const [model, setModel] = useState<AttributionModel>("last_touch");
  const lt = useMemo(() => runAttribution(model, DATA), [model]);
  const totalPipeline = CHANNEL_KEYS.reduce((s, ch) => s + lt[ch].pipeline, 0);

  const barData = CHANNEL_KEYS
    .map((ch) => ({
      name: CHANNELS[ch].name,
      pipeline: lt[ch].pipeline,
      color: CHANNELS[ch].color,
      channel: ch,
    }))
    .sort((a, b) => b.pipeline - a.pipeline);

  const interpretation = useMemo(
    () => interpretSingleTouch({ attribution: lt, channelKeys: CHANNEL_KEYS, modelName: "last-touch" }),
    [lt]
  );

  const accountData = DATA.map((acc) => ({
    ...acc,
    lastTouch:
      acc.touches.length > 0
        ? acc.touches[acc.touches.length - 1].channel
        : null,
  }));

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
            Last-Touch Attribution
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full credit to the final marketing interaction before conversion &middot; {periodLabel}
          </p>
        </div>
        <ModelSwitcher value={model} onChange={setModel} />
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/last-touch"]} />
      </motion.div>

      {/* Channel Cards */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CHANNEL_KEYS.map((ch) => {
          const share = totalPipeline > 0 ? lt[ch].pipeline / totalPipeline : 0;
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
                      <HelpTip text={HELP_TEXT.channel_pipeline} />
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground">
                    {fmtCurrency(lt[ch].pipeline)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmtPct(share)} of pipeline
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="text-emerald-400">
                      Revenue: {fmtCurrency(lt[ch].revenue)}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(lt[ch].opps)} opps
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Horizontal Bar Chart */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Pipeline by Channel (Last Touch)
              <HelpTip text={HELP_TEXT.last_touch} />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Channels ranked by attributed pipeline value
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" barCategoryGap="20%">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "hsl(var(--chart-axis))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                        <p className="text-xs font-semibold text-foreground">
                          {d.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {fmtCurrency(d.pipeline)}
                        </p>
                      </div>
                    );
                  }}
                  cursor={{ fill: "hsl(var(--chart-cursor))" }}
                />
                <Bar dataKey="pipeline" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Channel interpretation */}
      <motion.div variants={fadeUp}>
        <SoWhatPanel interpretations={interpretation.soWhats} />
      </motion.div>

      {/* Action Cards */}
      {interpretation.actions.length > 0 && (
        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
          {interpretation.actions.map((a) => (
            <ActionCard key={a.title} {...a} />
          ))}
        </motion.div>
      )}

      {/* Account Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Account Last-Touch Attribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              All {DATA.length} accounts with their final marketing touchpoint
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Account</th>
                    <th className="pb-3 pr-4">Stage</th>
                    <th className="pb-3 pr-4 text-right">Deal</th>
                    <th className="pb-3">Last Touch</th>
                  </tr>
                </thead>
                <tbody>
                  {accountData.map((acc) => (
                    <tr
                      key={acc.name}
                      className="border-b border-border/50 transition-colors hover:bg-accent/50"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">
                          {acc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {acc.industry} &middot; {acc.size}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className={getStageColor(acc.stage)}
                        >
                          {getStageName(acc.stage)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-foreground">
                        {fmtCurrency(acc.deal)}
                      </td>
                      <td className="py-3">
                        {acc.lastTouch && (
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  CHANNELS[acc.lastTouch].color,
                              }}
                            />
                            <span className="text-muted-foreground">
                              {CHANNELS[acc.lastTouch].name}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
