/**
 * Shared Framer Motion animation variants.
 * Centralised here to avoid duplicating in every page.
 * When `prefers-reduced-motion` is active, the global CSS rule
 * kills CSS transitions/animations. These variants use short
 * durations so Framer sees them complete instantly under that rule.
 */

import type { Variants } from "framer-motion";

export const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
