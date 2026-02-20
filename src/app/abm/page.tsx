"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Flame,
  AlertTriangle,
  Snowflake,
  TrendingUp,
  TrendingDown,
  Minus,
  UserCheck,
  UserX,
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
import { scoreABMAccounts, type ABMAccountScore } from "@/lib/abm-scoring";
import { fmtCurrency } from "@/lib/format";
import { PageGuide } from "@/components/shared/page-guide";
import { PAGE_GUIDES } from "@/lib/guide-content";
import { stagger, fadeUp } from "@/lib/motion";

function TierBadge({ tier }: { tier: "hot" | "warm" | "cold" }) {
  const config = {
    hot: {
      bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      icon: <Flame className="h-3 w-3" />,
    },
    warm: {
      bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    cold: {
      bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      icon: <Snowflake className="h-3 w-3" />,
    },
  };
  const c = config[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${c.bg}`}
    >
      {c.icon}
      {tier}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "rising")
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === "declining")
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function EngagementBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-muted">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor:
              score >= 65
                ? "hsl(160, 60%, 45%)"
                : score >= 35
                ? "hsl(40, 80%, 55%)"
                : "hsl(0, 65%, 55%)",
          }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums text-muted-foreground">
        {score}
      </span>
    </div>
  );
}

function AccountHeatmapTile({ account }: { account: ABMAccountScore }) {
  const tierColors = {
    hot: "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10",
    warm: "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
    cold: "border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10",
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-colors cursor-default ${tierColors[account.tier]}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold leading-tight">
          {account.account_name}
        </p>
        <TrendIcon trend={account.trend} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <EngagementBar score={account.engagement_score} />
        <TierBadge tier={account.tier} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>{fmtCurrency(account.deal_amount)}</span>
        <span className="text-muted-foreground/50">|</span>
        <span>{account.stage.replace(/_/g, " ")}</span>
        <span className="text-muted-foreground/50">|</span>
        <span>{account.total_touchpoints} touches</span>
      </div>
    </div>
  );
}

export default function ABMCommandPage() {
  const abmScores = useMemo(() => scoreABMAccounts(ENRICHED_DATA), []);

  const hotCount = abmScores.filter((a) => a.tier === "hot").length;
  const warmCount = abmScores.filter((a) => a.tier === "warm").length;
  const coldCount = abmScores.filter((a) => a.tier === "cold").length;
  const avgScore =
    abmScores.length > 0
      ? Math.round(
          abmScores.reduce((s, a) => s + a.engagement_score, 0) /
            abmScores.length
        )
      : 0;
  const avgCoverage =
    abmScores.length > 0
      ? Math.round(
          abmScores.reduce((s, a) => s + a.committee_coverage, 0) /
            abmScores.length
        )
      : 0;

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
          ABM Command Centre
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Target account engagement heat map with buying committee visibility
          and recommended next plays.
        </p>
      </motion.div>

      {/* Page guide */}
      <motion.div variants={fadeUp}>
        <PageGuide {...PAGE_GUIDES["/abm"]} />
      </motion.div>

      {/* KPI Row */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Target Accounts</p>
            <p className="text-2xl font-bold tabular-nums">
              {abmScores.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Hot</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-emerald-600">
              {hotCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Warm</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-amber-600">
              {warmCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Cold</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-blue-600">
              {coldCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Avg Committee Coverage</p>
            <p className="text-2xl font-bold tabular-nums">{avgCoverage}%</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Heat Map Grid */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Engagement Heat Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {abmScores.map((account) => (
                <AccountHeatmapTile key={account.account_id} account={account} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Table with Buying Committee */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Account Details & Buying Committee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Deal</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Committee</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead className="w-72">Recommended Play</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abmScores.map((acc) => (
                  <TableRow key={acc.account_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{acc.account_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {acc.industry} | {acc.region}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <EngagementBar score={acc.engagement_score} />
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={acc.tier} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtCurrency(acc.deal_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {acc.stage.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 text-emerald-500">
                          <UserCheck className="h-3 w-3" />
                          <span className="text-xs">{acc.engaged_members}</span>
                        </div>
                        {acc.dark_members > 0 && (
                          <div className="flex items-center gap-0.5 text-red-400">
                            <UserX className="h-3 w-3" />
                            <span className="text-xs">{acc.dark_members}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          / {acc.total_committee_members}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-0.5">
                        {acc.channels_engaged.slice(0, 4).map((ch) => (
                          <Badge
                            key={ch}
                            variant="secondary"
                            className="text-[9px] px-1"
                          >
                            {ch.replace(/_/g, " ").split(" ")[0]}
                          </Badge>
                        ))}
                        {acc.channels_engaged.length > 4 && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1"
                          >
                            +{acc.channels_engaged.length - 4}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendIcon trend={acc.trend} />
                        <span className="text-[10px] text-muted-foreground">
                          {acc.recent_touchpoints_30d} / {acc.prior_touchpoints_30d}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {acc.recommended_play}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
