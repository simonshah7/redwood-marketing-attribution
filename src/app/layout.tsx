import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarContent } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunMyJobs Marketing Attribution",
  description:
    "Marketing attribution dashboard for Redwood Software RunMyJobs product line",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
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
      </body>
    </html>
  );
}
