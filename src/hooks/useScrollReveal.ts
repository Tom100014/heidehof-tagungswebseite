import { useEffect } from "react";

const SELECTORS = [
  ".scroll-reveal",
  ".scroll-reveal-left",
  ".scroll-reveal-right",
  ".scroll-reveal-scale",
  ".clip-reveal",
  ".clip-reveal-up",
].join(", ");

export function useScrollReveal(rootSelector?: string) {
  useEffect(() => {
    const root = rootSelector ? document.querySelector(rootSelector) : document;
    if (!root) return;

    const elements = root.querySelectorAll(SELECTORS);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootSelector]);
}
