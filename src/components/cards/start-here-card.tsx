"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "redwood-start-here-dismissed";

export function StartHereCard() {
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-5">
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Dismiss welcome card"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-2 pr-6">
                <p className="text-sm font-semibold text-foreground">
                  Welcome to Redwood Marketing Intelligence
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    This dashboard connects your marketing touchpoints to pipeline and revenue using multiple attribution models.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    Start with this Overview to see which channels drive the most pipeline, then explore Multi-Touch Attribution for a deeper model comparison.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    The <span className="font-medium text-foreground">Guide Mode</span> toggle in the header adds explanations to every page — keep it on until you&apos;re comfortable.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
