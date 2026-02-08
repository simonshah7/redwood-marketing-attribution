"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link as LinkIcon, FileText } from "lucide-react";
import { FilterBar, DEFAULT_FILTERS, type ExplorerFilters } from "@/components/explorer/filter-bar";
import { FilterPills } from "@/components/controls/filter-pills";
import { SavedViews } from "@/components/controls/saved-views";
import { PageInfluencePanel } from "@/components/explorer/page-influence-panel";
import { ContentImpactPanel } from "@/components/explorer/content-impact-panel";
import { WinLossPanel } from "@/components/explorer/win-loss-panel";
import { FirstTouchPanel } from "@/components/explorer/first-touch-panel";
import { BDREffectivenessPanel } from "@/components/explorer/bdr-effectiveness-panel";
import { WinningSequencesPanel } from "@/components/explorer/winning-sequences-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ENRICHED_DATA, ALL_TOUCHPOINTS } from "@/lib/mock-enriched-data";
import { applyStageTransitionFilter } from "@/lib/explorer-analysis";
import { exportViewAsPdf } from "@/lib/export-pdf";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  FileText as FileTextIcon,
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
    icon: FileTextIcon,
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

const STAGE_TRANSITIONS = [
  { value: "all", label: "Full Journey" },
  { value: "disco_completed", label: "\u2192 Discos Completed" },
  { value: "solution_accepted", label: "\u2192 Solution Accepted" },
  { value: "eval_planning", label: "\u2192 Evaluation Planning" },
  { value: "negotiation", label: "\u2192 Negotiation" },
  { value: "closed_won", label: "\u2192 Closed (Won/Lost)" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ExplorerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">Loading explorer…</div>}>
      <ExplorerContent />
    </Suspense>
  );
}

function ExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewRef = useRef<HTMLDivElement>(null);

  // Initialize from URL params
  const [filters, setFilters] = useState<ExplorerFilters>(() => {
    const dt = searchParams.get("deal_type");
    const seg = searchParams.get("segment");
    const prod = searchParams.get("product");
    return {
      ...DEFAULT_FILTERS,
      dealType: dt === "new_logo" ? "New Logo" : dt === "expansion" ? "Expansion" : dt === "all" ? "All" : DEFAULT_FILTERS.dealType,
      segment: seg === "enterprise" ? "Enterprise" : seg === "mid_market" ? "Mid-Market" : seg === "all" ? "All" : DEFAULT_FILTERS.segment,
      productLine: prod === "rmj" ? "RunMyJobs" : prod === "fa" ? "Finance Automation" : prod === "all" ? "All" : DEFAULT_FILTERS.productLine,
    };
  });

  const [activeQuestion, setActiveQuestion] = useState<QuestionId>(() => {
    const q = searchParams.get("q");
    const idx = q ? parseInt(q) : 0;
    return idx >= 1 && idx <= 6 ? QUESTIONS[idx - 1].id : "page-influence";
  });

  const [stageTransition, setStageTransition] = useState(() => {
    return searchParams.get("stage") || "all";
  });

  // Update URL when filters change (C2: deep-link URLs)
  useEffect(() => {
    const params = new URLSearchParams();
    const qIdx = QUESTIONS.findIndex((q) => q.id === activeQuestion) + 1;
    params.set("q", String(qIdx));
    if (filters.dealType !== DEFAULT_FILTERS.dealType) {
      params.set("deal_type", filters.dealType === "New Logo" ? "new_logo" : filters.dealType === "Expansion" ? "expansion" : "all");
    }
    if (filters.segment !== DEFAULT_FILTERS.segment) {
      params.set("segment", filters.segment === "Enterprise" ? "enterprise" : filters.segment === "Mid-Market" ? "mid_market" : "all");
    }
    if (filters.productLine !== DEFAULT_FILTERS.productLine) {
      params.set("product", filters.productLine === "RunMyJobs" ? "rmj" : filters.productLine === "Finance Automation" ? "fa" : "all");
    }
    if (stageTransition !== "all") params.set("stage", stageTransition);
    router.replace(`/explorer?${params.toString()}`, { scroll: false });
  }, [filters, activeQuestion, stageTransition, router]);

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

  // Apply stage transition filter (A3)
  const { accounts: stageFilteredAccounts, touchpoints: stageFilteredTouchpoints } = useMemo(() => {
    return applyStageTransitionFilter(filteredAccounts, stageTransition);
  }, [filteredAccounts, stageTransition]);

  // Build filter pills (D3)
  const pills = useMemo(() => {
    const p: { key: string; label: string; value: string }[] = [];
    if (filters.dealType !== "All") p.push({ key: "dealType", label: "Deal Type", value: filters.dealType });
    if (filters.segment !== "All") p.push({ key: "segment", label: "Segment", value: filters.segment });
    if (filters.productLine !== "All") p.push({ key: "productLine", label: "Product", value: filters.productLine });
    if (stageTransition !== "all") {
      const st = STAGE_TRANSITIONS.find((s) => s.value === stageTransition);
      if (st) p.push({ key: "stageTransition", label: "Stage", value: st.label });
    }
    return p;
  }, [filters, stageTransition]);

  function handleDismissPill(key: string) {
    if (key === "stageTransition") {
      setStageTransition("all");
    } else {
      setFilters({ ...filters, [key]: "All" });
    }
  }

  function handleClearAll() {
    setFilters({ ...DEFAULT_FILTERS, dealType: "All", segment: "All", productLine: "All" });
    setStageTransition("all");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied — share it with your team");
  }

  return (
    <motion.div
      ref={viewRef}
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attribution Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Direct answers to the 6 key business questions about marketing attribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Copy Link
          </button>
          <button
            onClick={async () => {
              if (viewRef.current) {
                await exportViewAsPdf(viewRef.current, "Explorer");
                toast.success("PDF exported");
              }
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </button>
        </div>
      </motion.div>

      {/* Global Filter Bar + Stage Transition + Saved Views */}
      <motion.div variants={item} className="space-y-3">
        <FilterBar filters={filters} onChange={setFilters} />
        <div className="flex flex-wrap items-center gap-4">
          {/* Stage Transition Filter (A3) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Stage Transition
            </label>
            <Select value={stageTransition} onValueChange={setStageTransition}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_TRANSITIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          {/* Saved Views (C1) */}
          <SavedViews currentFilters={filters} onApply={setFilters} />
        </div>

        {/* Stage transition context badge */}
        {stageTransition !== "all" && (
          <Badge variant="secondary" className="text-xs">
            Showing touchpoints in the 30 days before {STAGE_TRANSITIONS.find((s) => s.value === stageTransition)?.label}
          </Badge>
        )}
      </motion.div>

      {/* Filter Pills (D3) */}
      {pills.length > 0 && (
        <motion.div variants={item}>
          <FilterPills
            pills={pills}
            onDismiss={handleDismissPill}
            onClearAll={handleClearAll}
          />
        </motion.div>
      )}

      {/* Question Selector */}
      <motion.div variants={item}>
        {/* Desktop: grid cards */}
        <div className="hidden sm:grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
        {/* Mobile: dropdown (D5) */}
        <div className="sm:hidden">
          <Select
            value={activeQuestion}
            onValueChange={(v) => setActiveQuestion(v as QuestionId)}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTIONS.map((q) => (
                <SelectItem key={q.id} value={q.id} className="text-sm">
                  Q{q.number}: {q.shortTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Data summary */}
      <motion.div variants={item}>
        <p className="text-xs text-muted-foreground">
          Showing {stageFilteredAccounts.length} accounts · {stageFilteredTouchpoints.length} touchpoints
        </p>
      </motion.div>

      {/* Answer Panel */}
      <motion.div variants={item}>
        {stageFilteredAccounts.length === 0 ? (
          <EmptyState
            message={stageTransition !== "all"
              ? "No touchpoints found in the 30-day window before this stage."
              : "No deals match this filter combination"}
            suggestion={stageTransition !== "all"
              ? "Try 'Full Journey' or a different transition."
              : "Try broadening your filters — remove the segment or deal type restriction"}
          />
        ) : (
          <>
            {activeQuestion === "page-influence" && (
              <PageInfluencePanel
                touchpoints={stageFilteredTouchpoints}
                accounts={stageFilteredAccounts}
              />
            )}
            {activeQuestion === "content-impact" && (
              <ContentImpactPanel
                touchpoints={stageFilteredTouchpoints}
                accounts={stageFilteredAccounts}
              />
            )}
            {activeQuestion === "win-loss" && (
              <WinLossPanel accounts={stageFilteredAccounts} />
            )}
            {activeQuestion === "first-touch" && (
              <FirstTouchPanel accounts={stageFilteredAccounts} />
            )}
            {activeQuestion === "bdr-effectiveness" && (
              <BDREffectivenessPanel
                touchpoints={stageFilteredTouchpoints}
                accounts={stageFilteredAccounts}
              />
            )}
            {activeQuestion === "winning-sequences" && (
              <WinningSequencesPanel accounts={stageFilteredAccounts} />
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
