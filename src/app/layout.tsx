import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PeriodProvider } from "@/lib/period-context";
import { SidebarContent } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
            <TooltipProvider delayDuration={0}>
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
            <Toaster position="bottom-right" theme="dark" richColors />
          </PeriodProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
