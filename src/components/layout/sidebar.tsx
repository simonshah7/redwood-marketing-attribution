"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  Brain,
  Zap,
  DollarSign,
  FileText,
  Users,
  LineChart,
  ArrowRightLeft,
  ChevronDown,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  key: string;
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    key: "attribution",
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
      {
        label: "Attribution Trends",
        href: "/attribution-trends",
        icon: <LineChart className="h-4 w-4" />,
      },
    ],
  },
  {
    key: "deep-dives",
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
    key: "predictive",
    title: "Predictive",
    items: [
      {
        label: "Deal Scoring",
        href: "/deal-scoring",
        icon: <Brain className="h-4 w-4" />,
      },
      {
        label: "Revenue Forecast",
        href: "/revenue-forecast",
        icon: <LineChart className="h-4 w-4" />,
      },
      {
        label: "ABM Command",
        href: "/abm",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    key: "actions",
    title: "Actions",
    items: [
      {
        label: "Next Best Action",
        href: "/next-best-action",
        icon: <Zap className="h-4 w-4" />,
      },
      {
        label: "Spend Optimizer",
        href: "/spend-optimizer",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        label: "Content Intel",
        href: "/content-intelligence",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        label: "Cross-Sell",
        href: "/cross-sell",
        icon: <ArrowRightLeft className="h-4 w-4" />,
      },
    ],
  },
  {
    key: "explore",
    title: "Explore",
    items: [
      {
        label: "Attribution Explorer",
        href: "/explorer",
        icon: <Search className="h-4 w-4" />,
      },
      {
        label: "AI Insights",
        href: "/ai-insights",
        icon: <Sparkles className="h-4 w-4" />,
      },
    ],
  },
];

function useCollapsedSections() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored) setCollapsed(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return { collapsed, toggle };
}

export function SidebarContent() {
  const pathname = usePathname();
  const { collapsed, toggle } = useCollapsedSections();

  // Auto-expand section containing active item
  const activeSection = NAV_SECTIONS.find((s) =>
    s.items.some((item) => item.href === pathname)
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            Redwood
          </span>
          <span className="text-[10px] text-muted-foreground">
            Marketing Intelligence
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => {
          const isCollapsed =
            collapsed[section.key] && activeSection?.key !== section.key;
          const hasActive = section.items.some(
            (item) => item.href === pathname
          );

          return (
            <div key={section.key} className="mb-1">
              <button
                onClick={() => toggle(section.key)}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className={cn(hasActive && "text-primary")}>
                  {section.title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>
              <div
                className={cn(
                  "space-y-0.5 overflow-hidden transition-all duration-200",
                  isCollapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
                )}
              >
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
          );
        })}
      </nav>

      {/* Footer — Data Freshness Indicator (C4) */}
      <div className="border-t border-border px-6 py-4">
        <FreshnessIndicator />
      </div>
    </div>
  );
}
