import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Premium top scroll-progress bar (Linear/Vercel style).
 */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: "0%" }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold to-gold/40 z-[60] pointer-events-none"
    />
  );
};

export default ScrollProgress;
