"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FreshnessIndicator } from "@/components/shared/freshness";
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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Attribution",
    items: [
      {
        label: "Overview",
        href: "/",
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        label: "First Touch",
        href: "/first-touch",
        icon: <MousePointerClick className="h-4 w-4" />,
      },
      {
        label: "Last Touch",
        href: "/last-touch",
        icon: <Target className="h-4 w-4" />,
      },
      {
        label: "Multi-Touch",
        href: "/multi-touch",
        icon: <Layers className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Deep Dives",
    items: [
      {
        label: "Channels",
        href: "/channels",
        icon: <Radio className="h-4 w-4" />,
      },
      {
        label: "Journeys",
        href: "/journeys",
        icon: <Route className="h-4 w-4" />,
      },
      {
        label: "Pipeline",
        href: "/pipeline",
        icon: <TrendingUp className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Explorer",
    items: [
      {
        label: "Attribution Explorer",
        href: "/explorer",
        icon: <Search className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        label: "AI Insights",
        href: "/ai-insights",
        icon: <Sparkles className="h-4 w-4" />,
      },
    ],
  },
];

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            RunMyJobs
          </span>
          <span className="text-[10px] text-muted-foreground">
            Marketing Attribution
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — Data Freshness Indicator (C4) */}
      <div className="border-t border-border px-6 py-4">
        <FreshnessIndicator />
      </div>
    </div>
  );
}
