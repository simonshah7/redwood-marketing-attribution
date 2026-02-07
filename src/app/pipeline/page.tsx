"use client";
import { motion } from "framer-motion";

export default function PipelinePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Pipeline Influence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Channel influence across pipeline stages and segments
        </p>
      </div>
    </motion.div>
  );
}
