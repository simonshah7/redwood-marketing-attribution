"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/first-touch": "First-Touch Attribution",
  "/last-touch": "Last-Touch Attribution",
  "/multi-touch": "Multi-Touch Attribution",
  "/channels": "Channel Performance",
  "/journeys": "Account Journeys",
  "/pipeline": "Pipeline Influence",
  "/ai-insights": "AI Insights",
};

export function Header() {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] || "Dashboard";
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <span className="text-muted-foreground">RunMyJobs</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">{pageTitle}</span>
        </div>
        <span className="font-medium text-foreground sm:hidden">
          {pageTitle}
        </span>
      </div>

      {/* Date badge */}
      <Badge variant="secondary" className="hidden text-xs sm:inline-flex">
        Pipeline Jan 31, 2025
      </Badge>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Toggle theme"
      >
        {mounted ? (
          resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>
    </header>
  );
}
