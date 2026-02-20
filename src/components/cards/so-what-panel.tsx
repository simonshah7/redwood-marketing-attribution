"use client";

import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface SoWhatPanelProps {
  interpretations: string[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function SoWhatPanel({ interpretations }: SoWhatPanelProps) {
  if (interpretations.length === 0) return null;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="rounded-lg border border-border/50 bg-muted/20 p-3"
    >
      <div className="flex gap-2.5">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <div className="space-y-1">
          {interpretations.map((text, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {text}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
