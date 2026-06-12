
import React from "react";
import { Sparkles } from "lucide-react";

interface PremiumLoaderProps {
  message?: string;
  heightClass?: string; // z.B. "h-[50vh]" oder "h-[70vh]"
}

/**
 * Premium 3s Ladeerlebnis: dezente Gold-Animation, Branding, smooth.
 */
export const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  message = "Premium Empfehlungen werden geladen ...",
  heightClass = "h-[50vh]"
}) => {
  return (
    <div className={`w-full ${heightClass} flex items-center justify-center`}>
      <div className="w-full max-w-md bg-card/60 backdrop-blur-md rounded-2xl p-6 border border-gold/20 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-gold animate-pulse" />
          <p className="text-gold font-semibold">Exklusiver Service</p>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {message}
        </p>

        <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
          <div className="h-2 bg-gold animate-[loader_3s_linear] rounded-full" />
        </div>

        <style>{`
          @keyframes loader_3s_linear {
            0% { width: 0% }
            100% { width: 100% }
          }
        `}</style>
      </div>
    </div>
  );
};
