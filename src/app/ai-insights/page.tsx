"use client";
import { motion } from "framer-motion";

export default function AIInsightsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">AI-powered attribution intelligence and recommendations</p>
      </div>
    </motion.div>
  );
}
