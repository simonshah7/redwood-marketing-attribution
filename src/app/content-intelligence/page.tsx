"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ENRICHED_DATA } from "@/lib/mock-enriched-data";
import {
  buildContentHeatmap,
  identifyContentGaps,
  generateContentRecommendations,
} from "@/lib/content-intelligence";
import { fmtCurrency } from "@/lib/format";
import { PageGuide } from "@/components/shared/page-guide";
import { PAGE_GUIDES } from "@/lib/guide-content";
import { stagger, fadeUp } from "@/lib/motion";

const STAGE_LABELS: Record<string, string> = {
  disco_set: "Discovery",
  disco_completed: "Disco Done",
  solution_accepted: "Solution",
  eval_planning: "Evaluation",
  negotiation: "Negotiation",
};

function HeatmapCell({
  count,
  intensity,
}: {
  count: number;
  intensity: number;
}) {
  return (
    <div
      className="flex h-10 w-full items-center justify-center rounded-sm text-xs font-mono tabular-nums transition-colors"
      style={{
        backgroundColor:
          count > 0
            ? `hsl(168, 55%, 42%, ${0.1 + intensity * 0.8})`
            : "hsl(var(--muted) / 0.3)",
        color: intensity > 0.5 ? "white" : "hsl(var(--muted-foreground))",
      }}
    >
      {count > 0 ? count : "—"}
    </div>
  );
}

export default function ContentIntelligencePage() {
  const heatmap = useMemo(() => buildContentHeatmap(ENRICHED_DATA), []);
  const gaps = useMemo(
    () => identifyContentGaps(heatmap, ENRICHED_DATA),
    [heatmap]
  );
  const recommendations = useMemo(
    () => generateContentRecommendations(gaps, heatmap),
    [gaps, heatmap]
  );

  const totalAssets = heatmap.length;
  const criticalGaps = gaps.filter((g) => g.severity === "critical").length;
  const topPerformer = heatmap[0];

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
          Content Performance Intelligence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Which content accelerates deals, which is dead weight, and what should
          the content team create next.
        </p>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/content-intelligence"]} />
      </motion.div>

      {/* KPI Row */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Content Assets Tracked</p>
                <p className="text-2xl font-bold tabular-nums">{totalAssets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Critical Gaps</p>
                <p className="text-2xl font-bold tabular-nums">{criticalGaps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top Performer</p>
                <p className="text-sm font-semibold truncate max-w-36">
                  {topPerformer?.content_asset || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Lightbulb className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommendations</p>
                <p className="text-2xl font-bold tabular-nums">
                  {recommendations.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content × Stage Heatmap */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Content × Funnel Stage Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header row */}
                <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-1 mb-1">
                  <div className="text-xs font-semibold text-muted-foreground px-2">
                    Content Asset
                  </div>
                  {Object.entries(STAGE_LABELS).map(([key, label]) => (
                    <div
                      key={key}
                      className="text-xs font-semibold text-center text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                {/* Data rows */}
                {heatmap.slice(0, 12).map((content) => (
                  <div
                    key={content.content_asset}
                    className="grid grid-cols-[200px_repeat(5,1fr)] gap-1 mb-1"
                  >
                    <div className="flex items-center px-2">
                      <span className="text-xs truncate" title={content.content_asset}>
                        {content.content_asset}
                      </span>
                    </div>
                    {content.stage_distribution.map((cell) => (
                      <HeatmapCell
                        key={cell.stage}
                        count={cell.count}
                        intensity={cell.intensity}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Darker cells indicate higher engagement density. Empty cells represent content gaps.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Ranking Table */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Performance Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Engagements</TableHead>
                  <TableHead className="text-right">Pipeline Influenced</TableHead>
                  <TableHead className="text-right">Won Deal %</TableHead>
                  <TableHead className="text-right">Lost Deal %</TableHead>
                  <TableHead className="text-right">Acceleration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heatmap.slice(0, 10).map((content) => (
                  <TableRow key={content.content_asset}>
                    <TableCell className="font-medium text-sm max-w-48 truncate">
                      {content.content_asset}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {content.asset_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {content.total_engagements}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtCurrency(content.pipeline_influenced)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-sm font-mono ${
                          content.appears_in_won_pct > 20
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {content.appears_in_won_pct}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-sm font-mono ${
                          content.appears_in_lost_pct > 20
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {content.appears_in_lost_pct}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-sm font-mono ${
                          content.acceleration_days > 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {content.acceleration_days > 0 ? "+" : ""}
                        {content.acceleration_days}d
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gap Analysis + Recommendations side by side */}
      <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-2">
        {/* Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Content Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gaps.map((gap, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${
                  gap.severity === "critical"
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-amber-500/20 bg-amber-500/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      gap.severity === "critical"
                        ? "bg-red-500/15 text-red-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {gap.severity}
                  </Badge>
                  <span className="text-sm font-medium">{gap.stageLabel}</span>
                  <span className="text-[10px] text-muted-foreground">
                    avg {gap.avg_days_stalled}d stall
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {gap.description}
                </p>
                <p className="mt-1.5 text-xs font-medium text-primary">
                  {gap.recommendation}
                </p>
              </div>
            ))}
            {gaps.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No significant content gaps detected.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Content Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      rec.priority === "high"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted"
                    }`}
                  >
                    {rec.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {rec.type.replace(/_/g, " ")}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary" className="text-[10px]">
                    {STAGE_LABELS[rec.target_stage] || rec.target_stage}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm font-medium">{rec.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {rec.rationale}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
