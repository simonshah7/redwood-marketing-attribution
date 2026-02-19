"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  MousePointerClick,
  Target,
  Layers,
  Radio,
  Route,
  TrendingUp,
  Sparkles,
  Search,
  Brain,
  Zap,
  DollarSign,
  FileText,
  Users,
  LineChart,
  ArrowRightLeft,
  Command,
} from "lucide-react";

interface NavResult {
  label: string;
  href: string;
  section: string;
  icon: React.ReactNode;
  keywords: string[];
}

const NAV_ITEMS: NavResult[] = [
  { label: "Overview", href: "/", section: "Attribution", icon: <BarChart3 className="h-4 w-4" />, keywords: ["home", "dashboard", "summary", "kpi"] },
  { label: "First-Touch Attribution", href: "/first-touch", section: "Attribution", icon: <MousePointerClick className="h-4 w-4" />, keywords: ["first", "touch", "awareness", "source"] },
  { label: "Last-Touch Attribution", href: "/last-touch", section: "Attribution", icon: <Target className="h-4 w-4" />, keywords: ["last", "touch", "conversion", "close"] },
  { label: "Multi-Touch Attribution", href: "/multi-touch", section: "Attribution", icon: <Layers className="h-4 w-4" />, keywords: ["multi", "touch", "linear", "time", "decay", "position"] },
  { label: "Attribution Trends", href: "/attribution-trends", section: "Attribution", icon: <LineChart className="h-4 w-4" />, keywords: ["trends", "momentum", "divergence", "period"] },
  { label: "Channel Performance", href: "/channels", section: "Deep Dives", icon: <Radio className="h-4 w-4" />, keywords: ["channel", "linkedin", "email", "events", "campaigns"] },
  { label: "Account Journeys", href: "/journeys", section: "Deep Dives", icon: <Route className="h-4 w-4" />, keywords: ["journey", "timeline", "account", "touchpoints"] },
  { label: "Pipeline Influence", href: "/pipeline", section: "Deep Dives", icon: <TrendingUp className="h-4 w-4" />, keywords: ["pipeline", "funnel", "stages", "influence", "region"] },
  { label: "Deal Scoring", href: "/deal-scoring", section: "Predictive", icon: <Brain className="h-4 w-4" />, keywords: ["deal", "scoring", "probability", "predictive", "risk"] },
  { label: "Revenue Forecast", href: "/revenue-forecast", section: "Predictive", icon: <LineChart className="h-4 w-4" />, keywords: ["revenue", "forecast", "pipeline", "projection"] },
  { label: "ABM Command Centre", href: "/abm", section: "Predictive", icon: <Users className="h-4 w-4" />, keywords: ["abm", "account", "engagement", "buying", "committee"] },
  { label: "Next Best Action", href: "/next-best-action", section: "Actions", icon: <Zap className="h-4 w-4" />, keywords: ["action", "next", "recommendation", "urgent"] },
  { label: "Spend Optimizer", href: "/spend-optimizer", section: "Actions", icon: <DollarSign className="h-4 w-4" />, keywords: ["spend", "budget", "optimize", "allocation", "roi"] },
  { label: "Content Intelligence", href: "/content-intelligence", section: "Actions", icon: <FileText className="h-4 w-4" />, keywords: ["content", "heatmap", "performance", "gap", "assets"] },
  { label: "Cross-Sell", href: "/cross-sell", section: "Actions", icon: <ArrowRightLeft className="h-4 w-4" />, keywords: ["cross", "sell", "upsell", "expansion", "product"] },
  { label: "Attribution Explorer", href: "/explorer", section: "Explore", icon: <Search className="h-4 w-4" />, keywords: ["explorer", "questions", "analysis", "deep", "dive"] },
  { label: "AI Insights", href: "/ai-insights", section: "Explore", icon: <Sparkles className="h-4 w-4" />, keywords: ["ai", "insights", "recommendations", "executive", "summary"] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter results
  const results = query.trim() === ""
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.keywords.some((kw) => kw.includes(q))
        );
      });

  // Group by section
  const grouped = results.reduce<Record<string, NavResult[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  // Flatten for keyboard nav
  const flatResults = Object.values(grouped).flat();

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      if (href !== pathname) {
        router.push(href);
      }
    },
    [router, pathname]
  );

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      // Small delay to allow render
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keyboard navigation within palette
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatResults[selectedIndex]) {
      e.preventDefault();
      navigate(flatResults[selectedIndex].href);
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg animate-in fade-in-0 slide-in-from-top-2 duration-150">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl shadow-black/20">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search pages..."
              className="flex-1 bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
            {flatResults.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No pages found.
              </p>
            ) : (
              Object.entries(grouped).map(([section, items]) => (
                <div key={section}>
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section}
                  </p>
                  {items.map((item) => {
                    const isCurrent = flatIndex === selectedIndex;
                    const isActive = item.href === pathname;
                    const thisIndex = flatIndex;
                    flatIndex++;

                    return (
                      <button
                        key={item.href}
                        data-selected={isCurrent}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setSelectedIndex(thisIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          isCurrent
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className={cn("shrink-0", isCurrent ? "text-primary" : "")}>
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && (
                          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Current
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-border px-4 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">
                <span className="text-[9px]">↑↓</span>
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">
                <span className="text-[9px]">↵</span>
              </kbd>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">
                <span className="text-[9px]">esc</span>
              </kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Small trigger button for the header */
export function CommandPaletteTrigger() {
  return (
    <button
      onClick={() => {
        // Dispatch Cmd+K to trigger the palette
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
        );
      }}
      className="hidden items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
    >
      <Search className="h-3 w-3" />
      <span>Search...</span>
      <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
        <Command className="mr-0.5 inline h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}
