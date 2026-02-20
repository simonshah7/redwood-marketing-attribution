"use client";

import { Target, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export interface ActionCardProps {
  title: string;
  finding: string;
  action: string;
  priority: "high" | "medium";
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function ActionCard({ title, finding, action, priority }: ActionCardProps) {
  const isHigh = priority === "high";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={`rounded-lg border bg-gradient-to-r p-4 ${
        isHigh
          ? "border-l-[3px] border-l-primary border-t-border border-r-border border-b-border from-primary/5 to-transparent"
          : "border-l-[3px] border-l-amber-500 border-t-border border-r-border border-b-border from-amber-500/5 to-transparent"
      }`}
    >
      <div className="flex gap-3">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isHigh ? "bg-primary/10" : "bg-amber-500/10"
        }`}>
          {isHigh ? (
            <Target className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{finding}</p>
          <p className="text-sm font-medium text-foreground">{action}</p>
        </div>
      </div>
    </motion.div>
  );
}
