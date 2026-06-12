import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "heidehof:brightness";
const HIDE_ON = ["/admin"];

export const BrightnessControl = () => {
  const { pathname } = useLocation();
  const hidden = HIDE_ON.some((p) => pathname.startsWith(p));
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number>(() => {
    if (typeof window === "undefined") return 1.1;
    const v = parseFloat(localStorage.getItem(KEY) ?? "1.1");
    return Number.isFinite(v) ? v : 1.1;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--site-brightness", String(value));
    localStorage.setItem(KEY, String(value));
  }, [value]);

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[1080] print:hidden">
      {open ? (
        <div className="bg-background/95 backdrop-blur-xl border border-gold/25 rounded-2xl shadow-2xl shadow-black/40 p-4 w-72 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.25em] text-gold flex items-center gap-1.5">
              <Sun className="w-3 h-3" /> Bildhelligkeit
            </p>
            <button onClick={() => setOpen(false)} aria-label="Schließen" className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.02}
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="flex items-center justify-between mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>Dunkel</span>
            <span className="text-gold">{Math.round(value * 100)}%</span>
            <span>Hell</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[
              { l: "Standard", v: 1.0 },
              { l: "Hell", v: 1.15 },
              { l: "Sehr hell", v: 1.3 },
            ].map((p) => (
              <button
                key={p.l}
                onClick={() => setValue(p.v)}
                className={cn(
                  "flex-1 text-xs uppercase tracking-[0.18em] py-1.5 rounded-md border transition-colors",
                  Math.abs(value - p.v) < 0.02
                    ? "border-gold/60 bg-gold/10 text-gold"
                    : "border-gold/15 hover:border-gold/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {p.l}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Helligkeit anpassen"
          className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-md border border-gold/30 hover:border-gold/60 hover:bg-gold/10 text-gold flex items-center justify-center shadow-lg shadow-black/30 transition-all"
        >
          <Sun className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default BrightnessControl;
