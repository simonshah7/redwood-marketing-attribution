"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FilterBar, DEFAULT_FILTERS, type ExplorerFilters } from "@/components/explorer/filter-bar";
import { PageInfluencePanel } from "@/components/explorer/page-influence-panel";
import { ContentImpactPanel } from "@/components/explorer/content-impact-panel";
import { WinLossPanel } from "@/components/explorer/win-loss-panel";
import { FirstTouchPanel } from "@/components/explorer/first-touch-panel";
import { BDREffectivenessPanel } from "@/components/explorer/bdr-effectiveness-panel";
import { WinningSequencesPanel } from "@/components/explorer/winning-sequences-panel";
import { ENRICHED_DATA, ALL_TOUCHPOINTS } from "@/lib/mock-enriched-data";
import { cn } from "@/lib/utils";
import {
  Globe,
  FileText,
  Scale,
  MousePointerClick,
  Phone,
  Workflow,
} from "lucide-react";

const QUESTIONS = [
  {
    id: "page-influence",
    number: 1,
    shortTitle: "Page Influence",
    description: "Which website pages appear in converting journeys?",
    icon: Globe,
  },
  {
    id: "content-impact",
    number: 2,
    shortTitle: "Content Impact",
    description: "Which content assets move deals forward?",
    icon: FileText,
  },
  {
    id: "win-loss",
    number: 3,
    shortTitle: "Win/Loss Signals",
    description: "Which touchpoints predict won vs lost?",
    icon: Scale,
  },
  {
    id: "first-touch",
    number: 4,
    shortTitle: "First Touch Origins",
    description: "What are the actual door-openers?",
    icon: MousePointerClick,
  },
  {
    id: "bdr-effectiveness",
    number: 5,
    shortTitle: "BDR Effectiveness",
    description: "Which outbound sequences generate pipeline?",
    icon: Phone,
  },
  {
    id: "winning-sequences",
    number: 6,
    shortTitle: "Winning Sequences",
    description: "Which multi-step combinations convert best?",
    icon: Workflow,
  },
] as const;

type QuestionId = (typeof QUESTIONS)[number]["id"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ExplorerPage() {
  const [filters, setFilters] = useState<ExplorerFilters>(DEFAULT_FILTERS);
  const [activeQuestion, setActiveQuestion] = useState<QuestionId>("page-influence");

  // Apply filters to enriched data
  const filteredAccounts = useMemo(() => {
    return ENRICHED_DATA.filter((acc) => {
      if (filters.dealType !== "All" && acc.deal_type !== filters.dealType) return false;
      if (filters.segment !== "All" && acc.segment !== filters.segment) return false;
      if (filters.productLine !== "All" && acc.product_line !== filters.productLine) return false;
      if (filters.stages.length > 0 && !filters.stages.includes(acc.stage)) return false;
      return true;
    });
  }, [filters]);

  const filteredTouchpoints = useMemo(() => {
    const oppIds = new Set(filteredAccounts.map((a) => a.opportunity_id));
    return ALL_TOUCHPOINTS.filter((t) => oppIds.has(t.opportunity_id));
  }, [filteredAccounts]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Attribution Explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Direct answers to the 6 key business questions about marketing attribution.
        </p>
      </motion.div>

      {/* Global Filter Bar */}
      <motion.div variants={item}>
        <FilterBar filters={filters} onChange={setFilters} />
      </motion.div>

      {/* Question Selector */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {QUESTIONS.map((q) => {
            const Icon = q.icon;
            const isActive = activeQuestion === q.id;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestion(q.id)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:bg-accent/50",
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {q.number}
                  </div>
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isActive ? "text-primary" : "text-foreground",
                  )}
                >
                  {q.shortTitle}
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {q.description}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Data summary */}
      <motion.div variants={item}>
        <p className="text-xs text-muted-foreground">
          Showing {filteredAccounts.length} accounts · {filteredTouchpoints.length} touchpoints
        </p>
      </motion.div>

      {/* Answer Panel */}
      <motion.div variants={item}>
        {activeQuestion === "page-influence" && (
          <PageInfluencePanel
            touchpoints={filteredTouchpoints}
            accounts={filteredAccounts}
          />
        )}
        {activeQuestion === "content-impact" && (
          <ContentImpactPanel
            touchpoints={filteredTouchpoints}
            accounts={filteredAccounts}
          />
        )}
        {activeQuestion === "win-loss" && (
          <WinLossPanel accounts={filteredAccounts} />
        )}
        {activeQuestion === "first-touch" && (
          <FirstTouchPanel accounts={filteredAccounts} />
        )}
        {activeQuestion === "bdr-effectiveness" && (
          <BDREffectivenessPanel
            touchpoints={filteredTouchpoints}
            accounts={filteredAccounts}
          />
        )}
        {activeQuestion === "winning-sequences" && (
          <WinningSequencesPanel accounts={filteredAccounts} />
        )}
      </motion.div>
    </motion.div>
  );
}
