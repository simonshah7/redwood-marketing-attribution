"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DATA, CHANNELS, CHANNEL_KEYS, type Channel } from "@/lib/data";
import { markovAttribution, markovDiagnostics, runAttribution } from "@/lib/attribution";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { HelpTip, HELP_TEXT } from "@/components/shared/help-tip";
import { usePeriod } from "@/lib/period-context";
import { PageGuide } from "@/components/shared/page-guide";
import { SoWhatPanel } from "@/components/cards/so-what-panel";
import { stagger, fadeUp } from "@/lib/motion";

export default function DataDrivenPage() {
  const { periodLabel } = usePeriod();

  const markov = useMemo(() => markovAttribution(DATA), []);
  const linear = useMemo(() => runAttribution("linear", DATA), []);
  const diagnostics = useMemo(() => markovDiagnostics(DATA), []);

  const totalMarkov = CHANNEL_KEYS.reduce((s, ch) => s + markov[ch].pipeline, 0);
  const totalLinear = CHANNEL_KEYS.reduce((s, ch) => s + linear[ch].pipeline, 0);

  // Bar chart data: Markov vs Linear
  const comparisonData = CHANNEL_KEYS.map((ch) => ({
    name: CHANNELS[ch].shortName,
    markov: totalMarkov > 0 ? (markov[ch].pipeline / totalMarkov) * 100 : 0,
    linear: totalLinear > 0 ? (linear[ch].pipeline / totalLinear) * 100 : 0,
    markovRaw: markov[ch].pipeline,
    linearRaw: linear[ch].pipeline,
    color: CHANNELS[ch].color,
  }));

  // Transition matrix data
  const transitionStates = ["start", ...CHANNEL_KEYS, "conversion", "null"];
  const transitionRows = transitionStates
    .filter((from) => diagnostics.transitionMatrix[from])
    .map((from) => ({
      from,
      ...Object.fromEntries(
        transitionStates.map((to) => [
          to,
          diagnostics.transitionMatrix[from]?.[to] ?? 0,
        ])
      ),
    }));

  // Dynamic interpretations
  const soWhats = useMemo(() => {
    const sorted = CHANNEL_KEYS
      .map((ch) => ({
        ch,
        name: CHANNELS[ch].name,
        markovShare: totalMarkov > 0 ? markov[ch].pipeline / totalMarkov : 0,
        linearShare: totalLinear > 0 ? linear[ch].pipeline / totalLinear : 0,
      }))
      .sort((a, b) => b.markovShare - a.markovShare);

    const topGainer = sorted.reduce((best, c) =>
      (c.markovShare - c.linearShare) > (best.markovShare - best.linearShare) ? c : best
    );
    const topLoser = sorted.reduce((best, c) =>
      (c.markovShare - c.linearShare) < (best.markovShare - best.linearShare) ? c : best
    );

    return [
      `Under the data-driven model, ${sorted[0].name} receives the largest share at ${fmtPct(sorted[0].markovShare)} of pipeline — compared to ${fmtPct(sorted[0].linearShare)} under linear attribution.`,
      `${topGainer.name} gains the most from Markov analysis: +${((topGainer.markovShare - topGainer.linearShare) * 100).toFixed(1)}pp vs linear, suggesting its incremental conversion impact is undervalued by simpler models.`,
      `${topLoser.name} loses ${((topLoser.linearShare - topLoser.markovShare) * 100).toFixed(1)}pp share when switching to data-driven — it may be getting credit from linear models for touches that don't actually influence conversion.`,
      `Base conversion probability from the Markov chain: ${(diagnostics.baseConversionRate * 100).toFixed(1)}%. This reflects the probability a random journey through the channel graph reaches closed-won.`,
    ];
  }, [markov, linear, totalMarkov, totalLinear, diagnostics]);

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
            Data-Driven Attribution (Markov)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Probabilistic attribution via Markov chain removal effects &middot; {periodLabel}
          </p>
        </div>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide
          whatItShows="The Markov model builds a state-transition graph of your channel journeys and computes each channel's incremental conversion impact by measuring what happens when that channel is removed from the graph."
          whenToUseIt="When you need an unbiased, data-driven view that accounts for channel interactions and journey sequencing — not just position or equal weighting."
          whatToDo="Compare Markov weights against linear to find channels that are over- or under-valued. Channels that gain share under Markov have more true conversion influence than simpler models suggest."
        />
      </motion.div>

      {/* Channel Cards — Markov Attribution */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CHANNEL_KEYS.map((ch) => {
          const markovShare = totalMarkov > 0 ? markov[ch].pipeline / totalMarkov : 0;
          const linearShare = totalLinear > 0 ? linear[ch].pipeline / totalLinear : 0;
          const delta = markovShare - linearShare;
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
                    {fmtCurrency(markov[ch].pipeline)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmtPct(markovShare)} of pipeline &middot; {markov[ch].opps.toFixed(1)} opps
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-mono ${
                        delta > 0.01
                          ? "bg-emerald-500/10 text-emerald-600"
                          : delta < -0.01
                          ? "bg-red-500/10 text-red-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}{(delta * 100).toFixed(1)}pp vs Linear
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Markov vs Linear Comparison Chart */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Markov vs Linear Attribution Share
              <HelpTip text="Compare how pipeline credit shifts when switching from equal-weight linear to probability-based Markov attribution. Differences highlight channels with outsized conversion influence." />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pipeline share (%) under each attribution model
            </p>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label="Grouped bar chart comparing Markov and Linear attribution share by channel">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={comparisonData} barCategoryGap="25%">
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--chart-axis))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--chart-axis))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload) return null;
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                          <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
                          {payload.map((p: any) => (
                            <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: p.fill }}
                              />
                              <span className="text-muted-foreground">
                                {p.dataKey === "markov" ? "Markov" : "Linear"}:
                              </span>
                              <span className="font-mono font-medium text-foreground">
                                {p.value.toFixed(1)}% ({fmtCurrency(p.payload[`${p.dataKey}Raw`])})
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                    cursor={{ fill: "hsl(var(--chart-cursor))" }}
                  />
                  <Bar dataKey="markov" fill="hsl(168, 55%, 42%)" radius={[4, 4, 0, 0]} name="Markov" />
                  <Bar dataKey="linear" fill="hsl(220, 50%, 58%)" radius={[4, 4, 0, 0]} name="Linear" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(168,55%,42%)]" />
                <span className="text-xs text-muted-foreground">Data-Driven (Markov)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(220,50%,58%)]" />
                <span className="text-xs text-muted-foreground">Multi-Touch (Linear)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interpretation */}
      <motion.div variants={fadeUp}>
        <SoWhatPanel interpretations={soWhats} />
      </motion.div>

      {/* Path Frequency Analysis */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Channel Conversion Path Analysis
              <HelpTip text="Shows how each channel appears in winning vs losing deal journeys. Higher win-rate presence and touch density in winning paths indicate stronger conversion influence." />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Frequency and density of each channel in converting vs non-converting journeys
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Won Path %</TableHead>
                  <TableHead className="text-right">Lost Path %</TableHead>
                  <TableHead className="text-right">Win Lift</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Avg Touches (Won)</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Removal Effect</TableHead>
                  <TableHead className="text-right">Composite Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CHANNEL_KEYS.map((ch) => {
                  const pf = diagnostics.pathFrequency[ch];
                  const winLift = pf.wonRate - pf.lostRate;
                  return (
                    <TableRow key={ch}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CHANNELS[ch].color }}
                          />
                          {CHANNELS[ch].name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {(pf.wonRate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {(pf.lostRate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-sm ${winLift > 0 ? "text-emerald-600" : winLift < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {winLift > 0 ? "+" : ""}{(winLift * 100).toFixed(0)}pp
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm hidden sm:table-cell">
                        {pf.wonDensity.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm hidden md:table-cell">
                        {(diagnostics.removalEffects[ch] * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {pf.score.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transition Matrix */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Channel Transition Probability Matrix
              <HelpTip text="The Markov chain transition matrix showing the probability of moving from one channel state to another. 'start' is the initial state, 'conversion' means closed-won, and 'null' means non-conversion." />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Probability of transitioning between channel states in the marketing journey
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 pr-3 text-left font-semibold text-muted-foreground">From \ To</th>
                  {transitionStates.map((s) => (
                    <th key={s} className="pb-2 px-2 text-right font-semibold text-muted-foreground capitalize">
                      {s === "null" ? "drop" : s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transitionRows.map((row) => (
                  <tr key={row.from} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground capitalize">
                      {row.from}
                    </td>
                    {transitionStates.map((to) => {
                      const val = (row as any)[to] as number;
                      return (
                        <td
                          key={to}
                          className={`py-2 px-2 text-right font-mono ${
                            val > 0.3
                              ? "text-foreground font-semibold"
                              : val > 0
                              ? "text-muted-foreground"
                              : "text-muted-foreground/30"
                          }`}
                        >
                          {val > 0 ? val.toFixed(2) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Methodology */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50 bg-muted/10">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Methodology</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Markov Chain Model:</strong> Each account journey is modeled as a sequence of channel states.
                A transition probability matrix captures how likely users move between channels (and to conversion or drop-off).
              </p>
              <p>
                <strong className="text-foreground">Removal Effect:</strong> For each channel, we compute the conversion probability when that
                channel is entirely removed from the graph. The drop in conversion measures the channel&apos;s incremental impact.
              </p>
              <p>
                <strong className="text-foreground">Path Frequency Enhancement:</strong> For small datasets where removal effects may be subtle,
                we blend removal effects with a conversion path frequency analysis — measuring how much each channel&apos;s presence and density in
                winning vs losing journeys contributes to deal success.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
