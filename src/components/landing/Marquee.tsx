import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface MarqueeProps {
  items: ReactNode[];
  speed?: number; // seconds per loop
  className?: string;
}

/**
 * Infinite horizontal marquee. Used by award-winning sites
 * (Stripe, Linear, Apple) to showcase awards / clients / values.
 */
export const Marquee = ({ items, speed = 38, className = "" }: MarqueeProps) => {
  const loop = [...items, ...items];
  return (
    <div className={`overflow-hidden relative ${className}`}>
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <motion.div
        className="flex gap-16 whitespace-nowrap will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((it, i) => (
          <div key={i} className="shrink-0 flex items-center">
            {it}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Marquee;
