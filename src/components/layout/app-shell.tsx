"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarContent } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-[260px] shrink-0 border-r border-border bg-card lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <SidebarContent />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
