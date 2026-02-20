"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, ChevronRight, BookOpen } from "lucide-react";
import { useGuide } from "@/lib/guide-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FreshnessIndicator } from "@/components/shared/freshness";
import { PeriodSelector } from "@/components/controls/period-selector";
import { CommandPaletteTrigger } from "@/components/command-palette";
import { SidebarContent } from "./sidebar";

interface PageMeta {
  title: string;
  section: string;
}

const PAGE_META: Record<string, PageMeta> = {
  "/": { title: "Overview", section: "Attribution" },
  "/first-touch": { title: "First-Touch Attribution", section: "Attribution" },
  "/last-touch": { title: "Last-Touch Attribution", section: "Attribution" },
  "/multi-touch": { title: "Multi-Touch Attribution", section: "Attribution" },
  "/attribution-trends": { title: "Attribution Trends", section: "Attribution" },
  "/channels": { title: "Channel Performance", section: "Deep Dives" },
  "/journeys": { title: "Account Journeys", section: "Deep Dives" },
  "/pipeline": { title: "Pipeline Influence", section: "Deep Dives" },
  "/explorer": { title: "Attribution Explorer", section: "Explore" },
  "/ai-insights": { title: "AI Insights", section: "Explore" },
  "/deal-scoring": { title: "Predictive Deal Scoring", section: "Predictive" },
  "/revenue-forecast": { title: "Revenue Forecast", section: "Predictive" },
  "/abm": { title: "ABM Command Centre", section: "Predictive" },
  "/next-best-action": { title: "Next Best Action", section: "Actions" },
  "/spend-optimizer": { title: "Spend Optimizer", section: "Actions" },
  "/content-intelligence": { title: "Content Intelligence", section: "Actions" },
  "/cross-sell": { title: "Cross-Sell Attribution", section: "Actions" },
  "/cohorts": { title: "Cohort Analysis", section: "Deep Dives" },
  "/data-driven": { title: "Data-Driven Attribution", section: "Attribution" },
};

export function Header() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] || { title: "Dashboard", section: "Attribution" };
  const { theme, setTheme } = useTheme();
  const { guideMode, toggleGuideMode } = useGuide();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+Shift+D → toggle dark mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }
      // Cmd/Ctrl+Shift+G → toggle guide mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "G") {
        e.preventDefault();
        toggleGuideMode();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [theme, setTheme, toggleGuideMode]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle navigation</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <nav className="hidden items-center gap-1.5 text-sm sm:flex" aria-label="Breadcrumb">
          <span className="text-muted-foreground">Redwood</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-muted-foreground">{meta.section}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          <span className="font-medium text-foreground truncate">{meta.title}</span>
        </nav>
        <span className="font-medium text-foreground sm:hidden truncate">
          {meta.title}
        </span>
      </div>

      {/* Command palette trigger */}
      <div className="hidden sm:block">
        <CommandPaletteTrigger />
      </div>

      {/* Data freshness in header */}
      <div className="hidden xl:block">
        <FreshnessIndicator />
      </div>

      {/* Period selector */}
      <div className="hidden sm:block">
        <PeriodSelector />
      </div>

      {/* Guide Mode toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleGuideMode}
            className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
              guideMode
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            aria-label="Toggle guide mode"
            aria-pressed={guideMode}
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Guide Mode {guideMode ? "On" : "Off"} <kbd className="ml-1 rounded border border-border bg-muted/50 px-1 py-0.5 font-mono text-[10px]">⌘⇧G</kbd></p>
        </TooltipContent>
      </Tooltip>

      {/* Theme toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Toggle theme <kbd className="ml-1 rounded border border-border bg-muted/50 px-1 py-0.5 font-mono text-[10px]">⌘⇧D</kbd></p>
        </TooltipContent>
      </Tooltip>
    </header>
  );
}
