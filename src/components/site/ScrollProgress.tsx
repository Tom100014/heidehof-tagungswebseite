import { useEffect, useState } from "react";

export const ScrollProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setP(total > 0 ? (h.scrollTop / total) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] z-[9998] pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-gold/40 via-gold to-gold/40 transition-[width] duration-150"
        style={{ width: `${p}%`, boxShadow: "0 0 12px hsla(88,70%,60%,0.6)" }}
      />
    </div>
  );
};

export default ScrollProgress;
