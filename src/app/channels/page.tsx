"use client";
import { motion } from "framer-motion";

export default function ChannelsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Channel Performance</h1>
        <p className="text-muted-foreground">Deep dive into individual channel metrics and campaign performance</p>
      </div>
    </motion.div>
  );
}
