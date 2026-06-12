import { SiteHeader } from "@/components/site/SiteHeader";

import { PageSeo } from "@/components/seo/PageSeo";
import { useDayJourney } from "@/hooks/useDayJourney";
import { DayJourneyHero } from "@/components/day-journey/DayJourneyHero";

const EinTagBeiUns = () => {
  const { steps, loading } = useDayJourney();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo
        title="Ein Tag bei uns – Heidehof Conference & Spa"
        description="Erleben Sie einen Tag im Hotel Heidehof – Ankommen, Tagen, Pause, Erholen, Genießen. Cinematische Reise durch Ihren perfekten Tagungstag in Ingolstadt."
        keywords={["Tagung Ingolstadt", "Tagungstag Heidehof", "Ein Tag im Hotel", "Conference Hotel Bayern"]}
      />
      <SiteHeader />

      {/* Visually-hidden H1 always present for SEO/a11y; DayJourneyHero renders its own visible H1 */}
      <h1 className="sr-only">Ein Tag bei uns – Hotel Der Heidehof</h1>

      {loading && steps.length === 0 ? (
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        </div>
      ) : (
        <DayJourneyHero steps={steps} />
      )}
      
    </div>
  );
};

export default EinTagBeiUns;

