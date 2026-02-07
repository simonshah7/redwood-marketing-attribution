"use client";
import { motion } from "framer-motion";

export default function AIInsightsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          AI Insights
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered attribution intelligence and recommendations
        </p>
      </div>
    </motion.div>
  );
}
