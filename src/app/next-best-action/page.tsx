"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Clock,
  CalendarDays,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENRICHED_DATA } from "@/lib/mock-enriched-data";
import { scoreAllOpenDeals } from "@/lib/deal-scoring";
import {
  generateAllNextBestActions,
  type AccountActions,
  type RecommendedAction,
} from "@/lib/next-best-action";
import { fmtCurrency } from "@/lib/format";

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

function UrgencyBadge({ urgency }: { urgency: RecommendedAction["urgency"] }) {
  const config = {
    immediate: {
      bg: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
      icon: <Zap className="h-3 w-3" />,
    },
    this_week: {
      bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      icon: <CalendarDays className="h-3 w-3" />,
    },
    this_month: {
      bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      icon: <Calendar className="h-3 w-3" />,
    },
  };
  const c = config[urgency];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c.bg}`}
    >
      {c.icon}
      {urgency.replace(/_/g, " ")}
    </span>
  );
}

function ImpactDot({ impact }: { impact: RecommendedAction["expected_impact"] }) {
  const color =
    impact === "high"
      ? "bg-emerald-500"
      : impact === "medium"
      ? "bg-amber-500"
      : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[10px] text-muted-foreground">{impact} impact</span>
    </div>
  );
}

function ActionCard({ action }: { action: RecommendedAction }) {
  return (
    <div className="rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium leading-snug">{action.action}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {action.rationale}
          </p>
          <p className="mt-1 text-[10px] text-primary italic">
            {action.based_on}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <UrgencyBadge urgency={action.urgency} />
          <ImpactDot impact={action.expected_impact} />
        </div>
      </div>
    </div>
  );
}

function AccountActionGroup({ accountActions }: { accountActions: AccountActions }) {
  const [expanded, setExpanded] = useState(true);
  const topUrgency = accountActions.actions[0]?.urgency || "this_month";
  const borderColor =
    topUrgency === "immediate"
      ? "border-l-red-500"
      : topUrgency === "this_week"
      ? "border-l-amber-500"
      : "border-l-blue-500";

  return (
    <div className={`rounded-lg border border-border border-l-4 ${borderColor}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-semibold">{accountActions.account_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {accountActions.stage.replace(/_/g, " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {fmtCurrency(accountActions.deal_amount)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Score: {accountActions.deal_score}%
              </span>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {accountActions.actions.length} action{accountActions.actions.length > 1 ? "s" : ""}
        </Badge>
      </button>
      {expanded && (
        <div className="space-y-2 p-4 pt-0">
          {accountActions.actions.map((action, i) => (
            <ActionCard key={i} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NextBestActionPage() {
  const dealScores = useMemo(() => scoreAllOpenDeals(ENRICHED_DATA), []);
  const allActions = useMemo(
    () => generateAllNextBestActions(ENRICHED_DATA, dealScores),
    [dealScores]
  );

  const [filter, setFilter] = useState<"all" | "immediate" | "this_week" | "this_month">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return allActions;
    return allActions
      .map((aa) => ({
        ...aa,
        actions: aa.actions.filter((a) => a.urgency === filter),
      }))
      .filter((aa) => aa.actions.length > 0);
  }, [allActions, filter]);

  const totalActions = allActions.reduce((s, a) => s + a.actions.length, 0);
  const immediateCount = allActions.reduce(
    (s, a) => s + a.actions.filter((x) => x.urgency === "immediate").length,
    0
  );
  const thisWeekCount = allActions.reduce(
    (s, a) => s + a.actions.filter((x) => x.urgency === "this_week").length,
    0
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
          Next Best Action Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prescriptive recommendations for every open deal based on winning
          patterns, engagement gaps, and stage-appropriate actions.
        </p>
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
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold tabular-nums">{totalActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <Zap className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Immediate</p>
                <p className="text-2xl font-bold tabular-nums text-red-600">
                  {immediateCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <CalendarDays className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold tabular-nums text-amber-600">
                  {thisWeekCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Accounts Covered</p>
                <p className="text-2xl font-bold tabular-nums">
                  {allActions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {(
          [
            { key: "all", label: "All" },
            { key: "immediate", label: "Immediate" },
            { key: "this_week", label: "This Week" },
            { key: "this_month", label: "This Month" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Action Feed */}
      <motion.div variants={fadeUp} className="space-y-3">
        {filtered.map((aa) => (
          <AccountActionGroup key={aa.account_id} accountActions={aa} />
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No actions match the selected filter.
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
