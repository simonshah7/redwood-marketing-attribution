import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PeriodProvider } from "@/lib/period-context";
import { GuideProvider } from "@/lib/guide-context";
import { SidebarContent } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/command-palette";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Redwood Marketing Intelligence",
  description:
    "Marketing attribution and pipeline intelligence dashboard for Redwood Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          <PeriodProvider>
            <GuideProvider>
              <TooltipProvider delayDuration={0}>
              {/* Skip to content — a11y */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none"
              >
                Skip to content
              </a>

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
                  <main id="main-content" className="flex-1 p-6" tabIndex={-1}>{children}</main>
                </div>
              </div>

              <CommandPalette />
              <ScrollToTop />
            </TooltipProvider>
            <Toaster position="bottom-right" theme="dark" richColors />
            </GuideProvider>
          </PeriodProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
