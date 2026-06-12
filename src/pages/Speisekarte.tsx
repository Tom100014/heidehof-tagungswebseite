import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";
import { MenuItemCard } from "@/components/site/MenuItemCard";
import { AddToCartControl } from "@/components/cart/AddToCartControl";
import { parsePriceLabel } from "@/lib/cart/cart-store";
import { UtensilsCrossed } from "lucide-react";
import { MenuFilters, passesMenuFilters, type DietFilter } from "@/components/menu/MenuFilters";
import { DietBadges } from "@/components/menu/DietBadges";

type Course = "vorspeise" | "suppe" | "salat" | "hauptgang_fleisch" | "hauptgang_fisch" | "hauptgang_vegi" | "beilage" | "dessert" | "kinder" | "snack";

interface Food {
  id: string; slug: string; title: string; description: string | null;
  course: Course; allergens: string[]; is_vegan: boolean; is_vegetarian: boolean; is_glutenfree: boolean;
  price_label: string | null; image_url: string | null; sort_order: number;
}

const COURSE_ORDER: Course[] = ["vorspeise","suppe","salat","hauptgang_fleisch","hauptgang_fisch","hauptgang_vegi","beilage","dessert","kinder","snack"];
const COURSE_LABELS: Record<Course, string> = {
  vorspeise: "Vorspeisen", suppe: "Suppen", salat: "Salate",
  hauptgang_fleisch: "Hauptgänge · Fleisch", hauptgang_fisch: "Hauptgänge · Fisch", hauptgang_vegi: "Hauptgänge · Vegetarisch",
  beilage: "Beilagen", dessert: "Desserts", kinder: "Für Kinder", snack: "Snacks",
};

const Speisekarte = () => {
  const [items, setItems] = useState<Food[]>([]);
  const [active, setActive] = useState<Course | "all">("all");
  const [diet, setDiet] = useState<Set<DietFilter>>(new Set());
  const [excludedAllergens, setExcludedAllergens] = useState<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("food_menu" as never)
        .select("id, slug, title, description, course, allergens, is_vegan, is_vegetarian, is_glutenfree, price_label, image_url, sort_order")
        .eq("is_active", true)
        .order("course")
        .order("sort_order");
      setItems((data as unknown as Food[]) ?? []);
    })();
  }, []);

  const courses = useMemo(() => COURSE_ORDER.filter((c) => items.some((i) => i.course === c)), [items]);
  const filtered = useMemo(() => {
    const byCourse = active === "all" ? items : items.filter((i) => i.course === active);
    return byCourse.filter((i) => passesMenuFilters(i, diet, excludedAllergens));
  }, [items, active, diet, excludedAllergens]);
  const grouped = useMemo(() => {
    const g: Record<string, Food[]> = {};
    filtered.forEach((d) => { (g[d.course] ||= []).push(d); });
    return g;
  }, [filtered]);


  return (
    <SubPageLayout
      title="Speisekarte."
      titleAccent="Bayern, neu komponiert."
      seoTitle="Speisekarte Restaurant Ingolstadt | Hotel Der Heidehof"
      metaDescription="Speisekarte des Restaurants im 4★ Superior Hotel Der Heidehof Ingolstadt: saisonale Vorspeisen, Hauptgänge aus regionalen Zutaten, vegetarisch & vegan, hausgemachte Desserts."
      eyebrow="Restaurant Maxwell · Ingolstadt"
      heroImage="/heidehof/speisekarte-hero.jpg"
      heroSlug="speisekarte-hero"
      intro="Regional verwurzelt, weltoffen gewürzt — die saisonale Karte unserer Küchencrew. Tagesgäste herzlich willkommen."
      breadcrumbs={[{ name: "Speisekarte", path: "/speisekarte" }]}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Menu",
        name: "Speisekarte Heidehof",
        url: "https://hotel-der-heidehof.de/speisekarte",
        hasMenuSection: Object.entries(grouped).map(([course, list]) => ({
          "@type": "MenuSection",
          name: COURSE_LABELS[course as Course] || course,
          hasMenuItem: list.map((item) => ({
            "@type": "MenuItem",
            name: item.title,
            description: item.description || "",
            offers: item.price_label ? {
              "@type": "Offer",
              price: parseFloat(item.price_label.replace(/[^0-9.,]/g, "").replace(",", ".")) || undefined,
              priceCurrency: "EUR"
            } : undefined,
            suitableForDiet: [
              item.is_vegan && "https://schema.org/VeganDiet",
              item.is_vegetarian && "https://schema.org/VegetarianDiet",
              item.is_glutenfree && "https://schema.org/GlutenFreeDiet"
            ].filter((diet): diet is string => typeof diet === "string")
          }))
        }))
      }}
    >
      {/* ── Karten-Wechsel (Editorial-Tabs) ── */}
      <nav className="flex justify-center gap-12 mb-12 text-xs uppercase tracking-[0.35em]">
        <Link to="/speisekarte" className="pb-2 border-b text-gold border-gold">Speisen</Link>
        <Link to="/getraenkekarte" className="pb-2 border-b border-transparent text-foreground/50 hover:text-foreground/80 transition-colors">Getränke</Link>
      </nav>

      {/* ── Kapitel-Index (Editorial Chapter Links) ── */}
      <nav aria-label="Speisekarte Kapitel" className="max-w-5xl mx-auto mb-24 border-t border-b border-gold/25 bg-[#080808]">
        <button
          onClick={() => setActive("all")}
          className={`group w-full grid grid-cols-12 gap-4 md:gap-8 items-baseline py-7 px-2 -mx-2 text-left border-b border-gold/25 transition-colors hover:bg-gold/[0.04] ${active === "all" ? "bg-gold/[0.06]" : ""}`}
        >
          <span className={`col-span-12 md:col-span-9 font-serif text-3xl md:text-5xl leading-[0.95] ${active === "all" ? "text-white" : "text-white/85 group-hover:text-white"}`}>
            Gesamte <span className="italic text-gold/90">Karte</span>
          </span>
          <span className="hidden md:inline-block col-span-3 text-right text-[10px] uppercase tracking-[0.3em] text-foreground/55">
            {items.length} Gerichte
          </span>
        </button>
        {courses.map((c) => {
          const count = items.filter((i) => i.course === c).length;
          const isActive = active === c;
          const label = COURSE_LABELS[c];
          const [main, sub] = label.includes(" · ") ? label.split(" · ") : [label, ""];
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`group w-full grid grid-cols-12 gap-4 md:gap-8 items-baseline py-7 px-2 -mx-2 text-left border-b border-gold/25 last:border-b-0 transition-colors hover:bg-gold/[0.04] ${isActive ? "bg-gold/[0.06]" : ""}`}
            >
              <span className={`col-span-12 md:col-span-9 font-serif text-3xl md:text-5xl leading-[0.95] ${isActive ? "text-white" : "text-white/85 group-hover:text-white"}`}>
                {main}
                {sub && <span className="italic text-gold/90"> · {sub}</span>}
              </span>
              <span className="hidden md:inline-block col-span-3 text-right text-[10px] uppercase tracking-[0.3em] text-foreground/55">
                {count} {count === 1 ? "Gericht" : "Gerichte"}
              </span>
            </button>
          );
        })}
      </nav>

      <MenuFilters
        diet={diet}
        excludedAllergens={excludedAllergens}
        onDietChange={setDiet}
        onAllergensChange={setExcludedAllergens}
        variant="food"
      />

      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-foreground/60 py-24 font-serif text-xl">
          {items.length === 0 ? "Karte wird gerade aktualisiert." : "Keine Gerichte entsprechen Ihrem Filter."}
        </p>
      )}

      {Object.entries(grouped).map(([course, list], idx) => (

        <section
          key={course}
          id={course}
          data-clara-anchor
          data-clara-target={course}
          data-clara-context={`${COURSE_LABELS[course as Course]} in der Speisekarte`}
          data-clara-category="food"
          className="mb-24"
        >
          <header className="mb-10 text-center">
            <p className="eyebrow-cine mb-4 justify-center">
              <span className="text-gold">Gang</span>
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[0.95]">
              {COURSE_LABELS[course as Course]}
            </h2>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {list.map((d) => {
              const tags = [
                d.is_vegan && "vegan",
                d.is_vegetarian && !d.is_vegan && "vegetarisch",
                d.is_glutenfree && "glutenfrei",
              ].filter(Boolean) as string[];
              const allTags = [
                ...tags,
                ...(d.allergens?.length ? [`Allergene: ${d.allergens.join(", ")}`] : []),
              ];
              const ctx = {
                topic: d.title,
                category: "food" as const,
                source: "/speisekarte",
                details: [d.price_label, ...tags].filter(Boolean) as string[],
              };
              return (
                <MenuItemCard
                  key={d.id}
                  id={d.slug}
                  title={d.title}
                  description={d.description}
                  imageUrl={d.image_url}
                  priceLabel={d.price_label}
                  tags={allTags}
                  claraContext={`${d.title}${d.price_label ? ` · ${d.price_label}` : ""}`}
                  claraCategory="food"
                  imageAspect="landscape"
                  imageFallback={
                    <div className="absolute inset-0 flex items-center justify-center text-gold/25 bg-gradient-to-br from-stone-900 to-stone-950">
                      <UtensilsCrossed className="w-12 h-12" />
                    </div>
                  }
                  onClick={() => openClaraBubble(ctx)}
                  footer={
                    <AddToCartControl
                      item={{
                        id: `food:${d.slug}`,
                        kind: "food",
                        title: d.title,
                        priceLabel: d.price_label,
                        priceEur: parsePriceLabel(d.price_label),
                        imageUrl: d.image_url,
                      }}
                    />
                  }
                />
              );
            })}
          </div>
        </section>
      ))}

      <div className="mt-24 flex justify-center">
        <AskClaraButton
          context={{ category: "food", topic: "Tischreservierung", source: "/speisekarte" }}
          label="Tisch mit Clara reservieren"
        />
      </div>
    </SubPageLayout>
  );
};

export default Speisekarte;
