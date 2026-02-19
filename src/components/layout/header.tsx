"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FreshnessIndicator } from "@/components/shared/freshness";
import { PeriodSelector } from "@/components/controls/period-selector";
import { SidebarContent } from "./sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/first-touch": "First-Touch Attribution",
  "/last-touch": "Last-Touch Attribution",
  "/multi-touch": "Multi-Touch Attribution",
  "/channels": "Channel Performance",
  "/journeys": "Account Journeys",
  "/pipeline": "Pipeline Influence",
  "/explorer": "Attribution Explorer",
  "/ai-insights": "AI Insights",
  "/deal-scoring": "Predictive Deal Scoring",
  "/revenue-forecast": "Revenue Forecast",
  "/abm": "ABM Command Centre",
  "/next-best-action": "Next Best Action",
  "/spend-optimizer": "Spend Optimizer",
  "/content-intelligence": "Content Intelligence",
  "/cross-sell": "Cross-Sell Attribution",
};

export function Header() {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] || "Dashboard";
  const { theme, setTheme } = useTheme();

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
      <div className="flex flex-1 items-center gap-2">
        <div className="hidden items-center gap-2 text-sm sm:flex">
          <span className="text-muted-foreground">Redwood</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">{pageTitle}</span>
        </div>
        <span className="font-medium text-foreground sm:hidden">
          {pageTitle}
        </span>
      </div>

      {/* Data freshness in header */}
      <div className="hidden md:block">
        <FreshnessIndicator />
      </div>

      {/* Period selector */}
      <PeriodSelector />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </button>
    </header>
  );
}
