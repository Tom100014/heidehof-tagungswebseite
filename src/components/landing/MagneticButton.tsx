import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface MagneticButtonProps {
  to?: string;
  href?: string;
  children: ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Magnetic CTA: button subtly attracts to cursor. Award-site standard
 * (see Awwwards SOTD winners 2024-2025).
 */
export const MagneticButton = ({ to, href, children, className = "", strength = 0.35 }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const tx = useTransform(sx, (v) => v);
  const ty = useTransform(sy, (v) => v);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const reset = () => { x.set(0); y.set(0); };

  const inner = <motion.div style={{ x: tx, y: ty }} className="sm:inline-block">{children}</motion.div>;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`sm:inline-block ${className}`}
    >
      {to ? <Link to={to} className="block sm:inline-block">{inner}</Link> : href ? <a href={href} className="block sm:inline-block">{inner}</a> : inner}
    </div>
  );
};

export default MagneticButton;
