import type { DayJourneyStep } from "@/hooks/useDayJourney";

import { ArrowRight, Sparkles } from "lucide-react";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";

interface Props {
  steps: DayJourneyStep[];
}

export const DayJourneyStory = ({ steps }: Props) => {
  return (
    <section id="story" className="relative bg-background py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Komplette Story</p>
        <h2 className="font-serif text-4xl md:text-6xl text-foreground leading-tight mb-16">
          Ein Tag, der <span className="italic text-gold">in Erinnerung bleibt.</span>
        </h2>

        <ol className="space-y-20 md:space-y-32">
          {steps.map((step, i) => (
            <li
              key={step.id}
              id={`story-${step.slug}`}
              className="grid md:grid-cols-12 gap-8 md:gap-12 items-center"
            >
              <div
                className={`md:col-span-6 ${
                  i % 2 === 1 ? "md:order-2" : ""
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-gold/15 shadow-2xl">
                  {step.media_type === "video" && step.media_url ? (
                    <video
                      src={step.media_url}
                      poster={step.poster_url ?? undefined}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={step.media_url ?? "/placeholder.svg"}
                      alt={step.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="md:col-span-6">
                <p className="text-[11px] tracking-[0.3em] uppercase text-gold/80 mb-3">
                  {String(i + 1).padStart(2, "0")} · {step.slug}
                </p>
                <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-5 leading-tight">
                  {step.title}
                </h3>
                <p className="text-foreground/80 text-base md:text-lg leading-relaxed whitespace-pre-line">
                  {step.story_md || step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Outro CTA */}
        <div className="mt-32 text-center border-t border-border/40 pt-20">
          <Sparkles className="w-8 h-8 text-gold mx-auto mb-6" />
          <h3 className="font-serif text-3xl md:text-5xl text-foreground mb-6">
            So könnte <span className="italic text-gold">Ihr Tag</span> bei uns aussehen.
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10">
            Erzählen Sie uns von Ihrer Veranstaltung – Clara erstellt in zwei Minuten ein
            unverbindliches Angebot.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, "", "/tagungspauschalen");
                window.dispatchEvent(new PopStateEvent("popstate"));
                setTimeout(() => openClaraBubble({
                  category: "tagung",
                  topic: "Ein Tag bei uns – Anfrage",
                  trigger: "day-journey-outro",
                }), 220);
              }}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full uppercase tracking-[0.32em] text-[10px] font-medium text-white border border-[hsl(38_45%_75%/0.55)] bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.10] hover:border-[hsl(38_55%_82%/0.85)] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_30px_-12px_rgba(0,0,0,0.7)] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Clara plant Ihren Tag</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold/80 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
