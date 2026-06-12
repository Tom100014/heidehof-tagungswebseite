import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { IndexHero } from "@/components/sections";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="font-serif text-xl md:text-2xl text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

const Datenschutz = () => (
  <div className="min-h-screen bg-background text-foreground">
    <PageSeo title="Datenschutz – Hotel Der Heidehof" description="Datenschutzerklärung gem. DSGVO des Hotel Der Heidehof Ingolstadt." noindex />
    <SiteHeader />
    <IndexHero eyebrow="Rechtliches" title="Datenschutz Erklärung" highlight="Erklärung" lead="Transparente Verarbeitung Ihrer Daten gemäß DSGVO." />
    <main className="max-w-3xl mx-auto px-5 sm:px-6 pb-24 space-y-10">
      <Section title="1. Verantwortlicher">
        Hotel Der Heidehof, Ingolstädter Str. 121, 85080 Gaimersheim.<br />
        E-Mail: <a href="mailto:bankett@der-heidehof.de" className="text-gold hover:underline">bankett@der-heidehof.de</a> · Telefon: +49 8458 64-590
      </Section>
      <Section title="2. Zweck der Datenverarbeitung">
        Diese Webseite dient der Vorstellung unseres Tagungs- und Bankettangebots sowie der Entgegennahme von Tagungsgäste-Bestellungen. Personenbezogene Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage bzw. Bestellung verarbeitet.
      </Section>
      <Section title="3. Erhobene Daten">
        <ul className="list-disc list-inside space-y-1">
          <li>Bei Bestellungen: Name, Zimmernummer bzw. Tagungsraum, Menüauswahl, optionale Kontaktangaben.</li>
          <li>Beim Aufruf der Seite: technisch notwendige Daten (IP, Browser, Zeitstempel).</li>
        </ul>
      </Section>
      <Section title="4. Rechtsgrundlage">
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung/-erfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb der Webseite).
      </Section>
      <Section title="5. Speicherdauer">
        Bestelldaten werden gelöscht, sobald der Zweck entfällt und keine gesetzlichen Aufbewahrungsfristen entgegenstehen.
      </Section>
      <Section title="6. Empfänger / Auftragsverarbeiter">
        Wir nutzen Lovable Cloud als Backend-Dienstleister auf Basis eines Auftragsverarbeitungsvertrags. Übermittlungen an Dritte außerhalb dieser Zweckbindung erfolgen nicht.
      </Section>
      <Section title="7. Ihre Rechte">
        Sie haben jederzeit Anspruch auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO) sowie Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO).
      </Section>
      <Section title="8. Cookies">
        Es werden ausschließlich technisch notwendige Cookies bzw. lokaler Speicher (z. B. zur Speicherung Ihrer Bestellauswahl im Browser) verwendet. Tracking- oder Marketing-Cookies setzen wir nicht ein.
      </Section>
    </main>
    <SiteFooter />
  </div>
);

export default Datenschutz;
