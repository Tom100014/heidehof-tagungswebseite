import { NavLink } from "react-router-dom";
import { Waves, Sparkles } from "lucide-react";

/**
 * Shared tab strip linking the two Spa & Wellness experiences.
 * Renders identical chrome on both pages so they feel like one section.
 */
export const SpaTabs = () => (
  <nav
    aria-label="Spa & Wellness Navigation"
    className="max-w-5xl mx-auto px-5 sm:px-6 -mt-6 md:-mt-10 mb-10"
  >
    <div className="inline-flex w-full sm:w-auto items-center gap-1 p-1 rounded-2xl border border-gold/20 bg-card/40 backdrop-blur-md">
      <NavLink
        to="/wellness"
        end
        className={({ isActive }) =>
          `flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-[0.22em] transition-colors ${
            isActive
              ? "bg-gold text-background"
              : "text-foreground/70 hover:text-foreground hover:bg-gold/10"
          }`
        }
      >
        <Waves className="w-3.5 h-3.5" /> Wellness
      </NavLink>
      <NavLink
        to="/spa"
        className={({ isActive }) =>
          `flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-[0.22em] transition-colors ${
            isActive
              ? "bg-gold text-background"
              : "text-foreground/70 hover:text-foreground hover:bg-gold/10"
          }`
        }
      >
        <Sparkles className="w-3.5 h-3.5" /> Spa &amp; Beauty
      </NavLink>
    </div>
  </nav>
);
