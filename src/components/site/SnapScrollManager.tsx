import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Activates CSS scroll-snap on selected storytelling routes only.
 * Each <section> on those pages snaps softly into view as the user scrolls.
 *
 * Avoided on: admin, forms, menus, legal pages (where free scrolling matters).
 */
const SNAP_ROUTES: (string | RegExp)[] = [
  "/",
  "/ein-tag-bei-uns",
  "/wellness",
  "/spa",
  "/restaurant",
  "/tagungsraeume",
  "/tagungspauschalen",
  "/ausstattung-technik",
  "/outdoor-aktiv",
  "/veranstaltungen",
];

const matches = (path: string) =>
  SNAP_ROUTES.some((r) => (typeof r === "string" ? r === path : r.test(path)));

export const SnapScrollManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const active = matches(pathname);
    const root = document.documentElement;
    if (active) root.classList.add("snap-page");
    else root.classList.remove("snap-page");
    return () => root.classList.remove("snap-page");
  }, [pathname]);

  return null;
};

export default SnapScrollManager;
