"use client";
import { motion } from "framer-motion";

export default function LastTouchPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Last-Touch Attribution</h1>
        <p className="text-muted-foreground">Full credit to the final marketing interaction before conversion</p>
      </div>
    </motion.div>
  );
}
