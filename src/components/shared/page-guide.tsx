"use client";

import { Eye, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuide } from "@/lib/guide-context";

interface PageGuideProps {
  whatItShows: string;
  whenToUseIt: string;
  whatToDo: string;
}

export function PageGuide({ whatItShows, whenToUseIt, whatToDo }: PageGuideProps) {
  const { guideMode } = useGuide();

  return (
    <AnimatePresence>
      {guideMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">What this shows</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {whatItShows}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">When to use it</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {whenToUseIt}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">What to do</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {whatToDo}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
