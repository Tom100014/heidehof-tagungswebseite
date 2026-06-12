import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { IndexHero } from "@/components/sections";
import { useSiteContent } from "@/hooks/useSiteContent";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="font-serif text-xl md:text-2xl text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{children}</div>
  </div>
);

const Impressum = () => {
  const { t } = useSiteContent("impressum");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo title="Impressum – Hotel Der Heidehof" description="Impressum und rechtliche Angaben des Hotel Der Heidehof Ingolstadt." noindex />
      <SiteHeader />
      <IndexHero eyebrow="Rechtliches" title="Impressum" highlight="Impressum" lead="Anbieter und rechtliche Angaben gemäß § 5 DDG." />
      <main className="max-w-3xl mx-auto px-5 sm:px-6 pb-24 space-y-10">
        <Section title="Anbieter">
          {t("anbieter", "Hotel Der Heidehof\nIngolstädter Str. 121\n85080 Gaimersheim\nDeutschland")}
        </Section>
        <Section title="Kontakt">
          {t("kontakt", "Telefon: +49 8458 64-590\nE-Mail: bankett@der-heidehof.de")}
        </Section>
        <Section title="Vertretungsberechtigt / Geschäftsführung">
          {t("geschaeftsfuehrung", "Geschäftsführung Hotel Der Heidehof GmbH & Co. KG")}
        </Section>
        <Section title="Registereintrag">
          {t("registergericht", "Handelsregister Amtsgericht Ingolstadt\nHRA-Nummer auf Anfrage erhältlich.")}
        </Section>
        <Section title="Umsatzsteuer-ID">
          {t("ust_id", "Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz auf Anfrage erhältlich.")}
        </Section>
        <Section title="EU-Streitschlichtung">
          <>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer" className="text-gold hover:underline">https://ec.europa.eu/consumers/odr</a>. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</>
        </Section>
        <Section title="Haftung für Inhalte">
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </Section>
        <Section title="Urheberrecht">
          Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors.
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Impressum;
