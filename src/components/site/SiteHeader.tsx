import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, ArrowLeft, Phone, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesktopNav, MobileNav } from "@/components/site/SiteHeaderNav";
import { MobileBottomBar } from "@/components/site/MobileBottomBar";

/* ─────────────────────────────────────────────────────────────────────────
   Apple-style glass header.
   Left: wordmark logo. Center: horizontal nav with dropdowns.
   Right: "Menüauswahl" CTA. Mobile: hamburger drawer.
   ───────────────────────────────────────────────────────────────────── */

const HamburgerIcon = ({ open }: { open: boolean }) => (
  <span aria-hidden className="relative inline-block w-5 h-3">
    <span
      className={cn(
        "absolute left-0 right-0 h-px bg-current transition-all duration-500",
        open ? "top-1/2 rotate-45" : "top-0",
      )}
    />
    <span
      className={cn(
        "absolute left-0 right-0 h-px bg-current top-1/2 transition-opacity duration-300",
        open ? "opacity-0" : "opacity-100",
      )}
    />
    <span
      className={cn(
        "absolute left-0 right-0 h-px bg-current transition-all duration-500",
        open ? "top-1/2 -rotate-45" : "bottom-0",
      )}
    />
  </span>
);

const MobileDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hauptmenü"
      className={cn(
        "fixed inset-0 z-[9999] transition-all duration-500 lg:hidden",
        "bg-[#080808]/95 backdrop-blur-2xl",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
    >
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between px-5 h-20 border-b border-gold/10">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <img src="/heidehof/logo-white.svg" alt="" className="h-8 w-auto" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/85 font-serif">
              Der Heidehof
            </span>
          </Link>
          <a
            href="tel:+4984586400"
            className="inline-flex items-center gap-2 text-white/85 hover:text-gold transition-colors min-h-11 px-2"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-[#F5F0E8] hover:text-gold transition-colors"
            aria-label="Menü schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <MobileNav onNavigate={onClose} />

          <div className="px-5 py-6 border-t border-white/[0.07] mt-4">
            <Link
              to="/tagungsraeume"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gold/10 border border-gold/40 text-gold text-[11px] uppercase tracking-[0.4em] hover:bg-gold/15 transition-colors"
            >
              <CalendarDays className="w-4 h-4" /> Tagung anfragen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SiteHeader = ({ transparentOnTop = true }: { transparentOnTop?: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const canGoBack =
    pathname !== "/" && typeof window !== "undefined" && window.history.length > 1;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const solid = scrolled || !transparentOnTop;
  const fg = solid ? "text-foreground/85" : "text-white/90";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-500",
          // Glass / Apple style: subtle translucent background with strong blur,
          // hairline gold underline. Stays glassy whether on top or scrolled.
          solid
            ? "bg-background/25 backdrop-blur-2xl border-b border-gold/15 py-4"
            : "bg-black/15 backdrop-blur-2xl border-b border-white/[0.06] py-5",
        )}
        style={{
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          backdropFilter: "blur(28px) saturate(160%)",
        }}
      >
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-6">
          {/* LEFT: Logo + Wordmark */}
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={() => navigate(-1)}
                aria-label="Zurück"
                className={cn(
                  "shrink-0 p-2 rounded-full transition-colors hover:text-gold hidden md:inline-flex",
                  fg,
                )}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Link
              to="/"
              className="flex items-center gap-3 group min-w-0"
              aria-label="Hotel Der Heidehof – Conference & Spa"
            >
              <img
                src="/heidehof/logo-white.svg"
                alt=""
                className={cn(
                  "transition-all duration-500 w-auto shrink-0 block",
                  solid ? "h-12 md:h-14" : "h-14 md:h-16",
                )}
              />
              <span className="hidden sm:flex flex-col leading-tight">
                <span
                  className={cn(
                    "text-[11px] md:text-[12px] uppercase font-serif tracking-[0.35em] transition-colors",
                    solid ? "text-foreground/90" : "text-white/95",
                  )}
                >
                  Der Heidehof
                </span>
                <span
                  className={cn(
                    "text-[9px] md:text-[10px] uppercase tracking-[0.4em] mt-0.5 transition-colors",
                    solid ? "text-foreground/55" : "text-white/65",
                  )}
                >
                  Conference & Spa ★★★★
                </span>
              </span>
            </Link>
          </div>

          {/* CENTER: Desktop horizontal nav with glass dropdowns */}
          <div className="justify-self-center">
            <DesktopNav solid={solid} />
          </div>

          {/* RIGHT: Menüauswahl CTA + mobile hamburger */}
          <div className="flex items-center gap-2 justify-end">
            <Link
              to="/tagungsraeume"
              className={cn(
                "hidden md:inline-flex items-center gap-2 px-5 py-2.5 border text-[10px] uppercase tracking-[0.4em] rounded-none transition-all duration-300",
                solid
                  ? "border-gold/40 text-gold hover:bg-gold/10"
                  : "border-white/30 text-white/95 bg-white/[0.06] hover:bg-white/[0.12] hover:border-gold/50 hover:text-gold",
              )}
            >
              Tagung anfragen
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Menü öffnen"
              aria-expanded={open}
              className={cn(
                "lg:hidden inline-flex items-center gap-3 px-2 py-3 min-h-[44px] transition-colors hover:text-gold",
                fg,
              )}
            >
              <HamburgerIcon open={open} />
            </button>
          </div>
        </div>
      </header>

      {/* MobileBottomBar must live OUTSIDE <header> — backdrop-filter on the header
          creates a new CSS containing block, trapping position:fixed children. */}
      <MobileBottomBar />
      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
};
