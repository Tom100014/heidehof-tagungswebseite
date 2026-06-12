import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";
import { MenuItemCard } from "@/components/site/MenuItemCard";
import { AddToCartControl } from "@/components/cart/AddToCartControl";
import { parsePriceLabel } from "@/lib/cart/cart-store";
import { Wine, Search } from "lucide-react";

type Cat = "aperitif" | "weisswein" | "rotwein" | "rose" | "dessertwein" | "bier" | "softdrink" | "wasser" | "kaffee" | "tee" | "spirituose" | "cocktail" | "longdrink" | "digestif";

interface Drink {
  id: string; slug: string; title: string; description: string | null;
  category: Cat; producer: string | null; region: string | null;
  volume_label: string | null; price_label: string | null;
  image_url: string | null; sort_order: number;
}

const CAT_ORDER: Cat[] = ["aperitif","weisswein","rose","rotwein","dessertwein","bier","cocktail","longdrink","spirituose","digestif","softdrink","wasser","kaffee","tee"];
const CAT_LABELS: Record<Cat, string> = {
  aperitif: "Aperitif & Champagner", weisswein: "Weißwein", rotwein: "Rotwein", rose: "Roséwein",
  dessertwein: "Dessertwein", bier: "Bier", softdrink: "Softdrinks", wasser: "Wasser",
  kaffee: "Kaffee", tee: "Tee", spirituose: "Spirituosen / Whisky", cocktail: "Cocktails",
  longdrink: "Longdrinks", digestif: "Digestifs / Grappa / Bitters",
};

const Getraenkekarte = () => {
  const [items, setItems] = useState<Drink[]>([]);
  const [active, setActive] = useState<Cat | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("drinks_menu" as never)
        .select("id, slug, title, description, category, producer, region, volume_label, price_label, image_url, sort_order")
        .eq("is_active", true)
        .order("category")
        .order("sort_order");
      setItems((data as unknown as Drink[]) ?? []);
    })();
  }, []);

  const cats = useMemo(() => CAT_ORDER.filter((c) => items.some((i) => i.category === c)), [items]);
  const filtered = useMemo(() => {
    const byCat = active === "all" ? items : items.filter((i) => i.category === active);
    if (!query.trim()) return byCat;
    const q = query.trim().toLowerCase();
    return byCat.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.producer?.toLowerCase().includes(q) ||
        d.region?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q),
    );
  }, [items, active, query]);
  const grouped = useMemo(() => {
    const g: Record<string, Drink[]> = {};
    filtered.forEach((d) => { (g[d.category] ||= []).push(d); });
    return g;
  }, [filtered]);


  return (
    <SubPageLayout
      title="Getränkekarte."
      titleAccent="Vom Riesling bis zum Signature-Drink."
      seoTitle="Getränkekarte – Bar Mäx & Weinkeller | Hotel Der Heidehof Ingolstadt"
      metaDescription="Getränkekarte des 4★ Superior Hotel Der Heidehof: kuratierte Weine, regionale Biere, Aperitifs, Signature-Cocktails der Bar Mäx, Kaffee- und Tee-Spezialitäten."
      eyebrow="Bar Mäx · Weinkeller · Ingolstadt"
      heroImage="/heidehof/getraenkekarte-hero.jpg"
      heroSlug="getraenkekarte-hero"
      intro="Kuratierte Weine, regionale Biere und Signature-Cocktails der Bar Mäx — eine Karte für jeden Moment des Tages."
      breadcrumbs={[{ name: "Getränkekarte", path: "/getraenkekarte" }]}
      keywords={["Getränkekarte", "Wein", "Bar", "Cocktails", "Heidehof"]}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Menu",
        name: "Getränkekarte Heidehof",
        url: "https://hotel-der-heidehof.de/getraenkekarte",
        hasMenuSection: Object.entries(grouped).map(([cat, list]) => ({
          "@type": "MenuSection",
          name: CAT_LABELS[cat as Cat] || cat,
          hasMenuItem: list.map((item) => ({
            "@type": "MenuItem",
            name: item.title,
            description: item.description || "",
            offers: item.price_label ? {
              "@type": "Offer",
              price: parseFloat(item.price_label.replace(/[^0-9.,]/g, "").replace(",", ".")) || undefined,
              priceCurrency: "EUR"
            } : undefined
          }))
        }))
      }}
    >
      <nav className="flex justify-center gap-12 mb-10 text-xs uppercase tracking-[0.35em]">
        <Link to="/speisekarte" className="pb-2 border-b border-transparent text-foreground/50 hover:text-foreground/80 transition-colors">Speisen</Link>
        <Link to="/getraenkekarte" className="pb-2 border-b text-gold border-gold">Getränke</Link>
      </nav>

      {/* Sticky category bar */}
      <div className="sticky top-[88px] z-30 -mx-4 px-4 mb-16 bg-background/85 backdrop-blur-md border-y border-gold/15">
        <div className="flex gap-x-7 gap-y-3 overflow-x-auto py-4 text-[11px] uppercase tracking-[0.25em] no-scrollbar">
          <button
            onClick={() => setActive("all")}
            className={`whitespace-nowrap pb-1 border-b transition-colors ${active === "all" ? "text-gold border-gold" : "text-foreground/55 border-transparent hover:text-foreground/85"}`}
          >
            Alle · {items.length}
          </button>
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`whitespace-nowrap pb-1 border-b transition-colors ${active === c ? "text-gold border-gold" : "text-foreground/55 border-transparent hover:text-foreground/85"}`}
            >
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Search across drink names, producers & regions */}
      <div className="max-w-5xl mx-auto mb-10">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Erzeuger, Region oder Stil …"
            className="w-full bg-[#0a0a0a]/60 border border-gold/15 rounded-full pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-gold/50 focus:outline-none transition-colors"
          />
        </label>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-foreground/60 py-24 font-serif text-xl">
          {items.length === 0 ? "Karte wird gerade aktualisiert." : "Keine Treffer für Ihre Suche."}
        </p>
      )}


      {Object.entries(grouped).map(([cat, list], idx) => (
        <section
          key={cat}
          id={cat}
          data-clara-anchor
          data-clara-target={cat}
          data-clara-context={`${CAT_LABELS[cat as Cat]} in der Getränkekarte`}
          data-clara-category="drink"
          className="mb-24"
        >
          <header className="mb-10 text-center">
            <p className="eyebrow-cine mb-4 justify-center">
              <span className="text-gold">Kategorie</span>
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[0.95]">
              {CAT_LABELS[cat as Cat]}
            </h2>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {list.map((d) => {
              const tags = [d.producer, d.region, d.volume_label].filter(Boolean) as string[];
              const ctx = {
                topic: d.title,
                category: "drink" as const,
                source: "/getraenkekarte",
                details: [d.producer, d.region, d.volume_label, d.price_label].filter(Boolean) as string[],
              };
              return (
                <MenuItemCard
                  key={d.id}
                  id={d.slug}
                  title={d.title}
                  description={d.description}
                  imageUrl={d.image_url}
                  priceLabel={d.price_label}
                  tags={tags}
                  claraContext={`${d.title}${d.price_label ? ` · ${d.price_label}` : ""}`}
                  claraCategory="drink"
                  imageAspect="landscape"
                  imageFallback={
                    <div className="absolute inset-0 flex items-center justify-center text-gold/25 bg-gradient-to-br from-stone-900 to-stone-950">
                      <Wine className="w-12 h-12" />
                    </div>
                  }
                  onClick={() => openClaraBubble(ctx)}
                  footer={
                    <AddToCartControl
                      item={{
                        id: `drink:${d.slug}`,
                        kind: "drink",
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
          context={{ category: "drink", topic: "Getränkewunsch", source: "/getraenkekarte" }}
          label="Mit Clara reservieren"
        />
      </div>
    </SubPageLayout>
  );
};

export default Getraenkekarte;
