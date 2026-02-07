"use client";
import { motion } from "framer-motion";

export default function JourneysPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Journeys</h1>
        <p className="text-muted-foreground">Visualize the complete marketing journey for key accounts</p>
      </div>
    </motion.div>
  );
}
