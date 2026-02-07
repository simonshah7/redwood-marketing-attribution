"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightCard } from "@/components/cards/insight-card";
import { DATA, CHANNELS, CHANNEL_KEYS } from "@/lib/data";
import {
  firstTouchAttribution,
  lastTouchAttribution,
  multiTouchAttribution,
} from "@/lib/attribution";
import { fmt } from "@/lib/utils";

function buildData() {
  const ft = firstTouchAttribution(DATA);
  const lt = lastTouchAttribution(DATA);
  const mt = multiTouchAttribution(DATA);

  const ftTotal = CHANNEL_KEYS.reduce((s, ch) => s + ft[ch].pipeline, 0);
  const ltTotal = CHANNEL_KEYS.reduce((s, ch) => s + lt[ch].pipeline, 0);
  const mtTotal = CHANNEL_KEYS.reduce((s, ch) => s + mt[ch].pipeline, 0);

  const channelCards = CHANNEL_KEYS.map((ch) => {
    const ftPct = ftTotal > 0 ? ft[ch].pipeline / ftTotal : 0;
    const ltPct = ltTotal > 0 ? lt[ch].pipeline / ltTotal : 0;
    const mtPct = mtTotal > 0 ? mt[ch].pipeline / mtTotal : 0;
    const ftDelta = ftPct > 0 ? ((mtPct - ftPct) / ftPct) * 100 : 0;
    const ltDelta = ltPct > 0 ? ((mtPct - ltPct) / ltPct) * 100 : 0;

    return {
      key: ch,
      name: CHANNELS[ch].name,
      color: CHANNELS[ch].color,
      pipeline: mt[ch].pipeline,
      ftDelta,
      ltDelta,
    };
  });

  const comparisonTable = CHANNEL_KEYS.map((ch) => ({
    key: ch,
    name: CHANNELS[ch].name,
    color: CHANNELS[ch].color,
    ft: ft[ch].pipeline,
    lt: lt[ch].pipeline,
    mt: mt[ch].pipeline,
    ftMtDelta:
      ft[ch].pipeline > 0
        ? ((mt[ch].pipeline - ft[ch].pipeline) / ft[ch].pipeline) * 100
        : 0,
    ltMtDelta:
      lt[ch].pipeline > 0
        ? ((mt[ch].pipeline - lt[ch].pipeline) / lt[ch].pipeline) * 100
        : 0,
  }));

  const wonDeals = DATA.filter((d) => d.stage === "closed_won");
  const lostDeals = DATA.filter((d) => d.stage === "closed_lost");

  const wonLostData = CHANNEL_KEYS.map((ch) => {
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

  return { channelCards, comparisonTable, wonLostData };
}

interface WonLostTooltipPayload {
  dataKey: string;
  value: number;
  color: string;
}

function WonLostTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: WonLostTooltipPayload[];
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">
            {p.dataKey === "won" ? "Won" : "Lost"}:
          </span>
          <span className="font-mono font-medium text-foreground">
            {p.value} avg touches
          </span>
        </div>
      ))}
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  return (
    <Badge
      variant="secondary"
      className={`text-[11px] font-medium ${
        isPositive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {value.toFixed(0)}%
    </Badge>
  );
}

export default function MultiTouchPage() {
  const { channelCards, comparisonTable, wonLostData } = buildData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Multi-Touch Attribution
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Multi-touch attribution distributes credit across all touchpoints
          proportional to engagement. This model reveals the true influence of
          mid-funnel channels often hidden by first/last-touch models.
        </p>
      </div>

      {/* Channel Cards with Delta Badges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channelCards.map((c) => (
          <Card key={c.key} className="relative overflow-hidden">
            <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ backgroundColor: c.color }}
            />
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <p className="text-sm font-medium text-foreground">{c.name}</p>
              </div>
              <p className="mt-3 font-mono text-xl font-bold text-foreground">
                {fmt(c.pipeline)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[11px] text-muted-foreground">
                  vs FT: <DeltaBadge value={c.ftDelta} />
                </span>
                <span className="text-[11px] text-muted-foreground">
                  vs LT: <DeltaBadge value={c.ltDelta} />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Model Comparison by Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Channel</th>
                  <th className="pb-2 pr-4 text-right">First Touch</th>
                  <th className="pb-2 pr-4 text-right">Last Touch</th>
                  <th className="pb-2 pr-4 text-right">Multi-Touch</th>
                  <th className="pb-2 pr-4 text-center">FT &rarr; MT</th>
                  <th className="pb-2 text-center">LT &rarr; MT</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-border/50 transition-colors hover:bg-secondary/50"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-medium text-foreground">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-foreground">
                      {fmt(row.ft)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-foreground">
                      {fmt(row.lt)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs text-foreground">
                      {fmt(row.mt)}
                    </td>
                    <td className="py-2.5 pr-4 text-center">
                      <DeltaBadge value={row.ftMtDelta} />
                    </td>
                    <td className="py-2.5 text-center">
                      <DeltaBadge value={row.ltMtDelta} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Won vs Lost Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Won vs Lost — Average Touches by Channel
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Average number of touches per deal for won vs lost deals
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={wonLostData} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                content={<WonLostTooltip />}
                cursor={{ fill: "hsl(222, 14%, 14%)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "hsl(220, 10%, 55%)" }}
              />
              <Bar
                dataKey="won"
                name="Won"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="lost"
                name="Lost"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insight Cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Key Insights</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InsightCard
            severity="info"
            title="Marketo is the hidden workhorse"
            description="Multi-touch reveals email nurture drives far more pipeline influence than first or last-touch models suggest. Marketo is the connective tissue of the funnel."
          />
          <InsightCard
            severity="warning"
            title="LinkedIn is over-credited by first-touch"
            description="First-touch over-weights LinkedIn by giving 100% credit for awareness. Multi-touch shows a more balanced view where LinkedIn's share decreases significantly."
          />
          <InsightCard
            severity="info"
            title="Events punch above their weight"
            description="Events show strong multi-touch influence despite lower volume. Won deals have significantly more event touches, making events the strongest predictor of winning."
          />
        </div>
      </div>
    </motion.div>
  );
}
