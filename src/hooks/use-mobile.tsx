import * as React from "react";
import { isBrowser } from "@/utils/safeImport";

// Mobile breakpoint - tablet (>=768) is considered desktop for layout purposes
const MOBILE_BREAKPOINT = 768;

const getIsMobile = () => {
  if (!isBrowser) return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Reactive mobile detection. Uses matchMedia so the sidebar/layout updates
 * correctly when rotating an iPad or resizing in DevTools.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile);

  React.useEffect(() => {
    if (!isBrowser) return;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
