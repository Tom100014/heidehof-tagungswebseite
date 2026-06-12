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

const AGB = () => (
  <div className="min-h-screen bg-background text-foreground">
    <PageSeo
      title="AGB – Hotel Der Heidehof Ingolstadt"
      description="Allgemeine Geschäftsbedingungen für Beherbergung, Tagungen und Veranstaltungen im Hotel Der Heidehof."
      noindex
    />
    <SiteHeader />
    <IndexHero
      eyebrow="Rechtliches"
      title="Allgemeine Geschäfts­bedingungen"
      highlight="Geschäfts­bedingungen"
      lead="Stand: Mai 2026. Konditionen für Beherbergung, Tagungen und Veranstaltungen."
    />
    <main className="max-w-3xl mx-auto px-5 sm:px-6 pb-24 space-y-10">
      <Section title="§ 1 Geltungsbereich">
        Diese Allgemeinen Geschäftsbedingungen gelten für Verträge über die mietweise Überlassung von Hotelzimmern zur Beherbergung sowie für alle in diesem Zusammenhang erbrachten weiteren Leistungen des Hotel Der Heidehof (Tagungs-, Bankett-, Wellness- und Restaurantleistungen). Abweichende Bedingungen des Kunden werden nur Vertragsbestandteil, wenn das Hotel diese ausdrücklich schriftlich bestätigt.
      </Section>
      <Section title="§ 2 Vertragsabschluss">
        Der Vertrag kommt durch die Annahme des Antrags des Kunden durch das Hotel zustande. Anfragen über die Webseite (z. B. „Mit Clara anfragen") stellen kein bindendes Angebot dar. Es gelten die schriftlichen oder per E-Mail bestätigten Konditionen des Hotels.
      </Section>
      <Section title="§ 3 Leistungen, Preise, Zahlung">
        Das Hotel ist verpflichtet, die vom Kunden gebuchten Leistungen bereitzuhalten. Die ausgewiesenen Preise verstehen sich inkl. der jeweils gültigen gesetzlichen Mehrwertsteuer. Erhöhen sich die gesetzlichen Abgaben oder kommen neue hinzu, behält sich das Hotel eine entsprechende Preisanpassung vor. Rechnungen sind ohne Abzug innerhalb von 14 Tagen ab Rechnungsdatum zur Zahlung fällig.
      </Section>
      <Section title="§ 4 Tagungen & Veranstaltungen">
        Bei Tagungs- und Veranstaltungsbuchungen ist die endgültige Teilnehmerzahl spätestens 5 Werktage vor Veranstaltungsbeginn schriftlich mitzuteilen. Erhöht sich die Teilnehmerzahl, wird die tatsächlich höhere Anzahl berechnet. Bei Reduzierungen von mehr als 10 % behält sich das Hotel vor, die bestätigte Teilnehmerzahl in Rechnung zu stellen.
      </Section>
      <Section title="§ 5 Stornierung & Rücktritt">
        <ul className="list-disc list-inside space-y-1.5">
          <li>Hotelzimmer: bis 18:00 Uhr am Anreisetag kostenfrei stornierbar, sofern nicht anders vereinbart.</li>
          <li>Tagungspauschalen ab 10 Personen: bis 14 Tage vor Veranstaltungsbeginn kostenfrei, danach 50 %, ab 7 Tagen 80 %, ab 3 Tagen 100 % der bestätigten Leistungen.</li>
          <li>Individuelle Bankett- und Eventbuchungen: gemäß schriftlicher Vereinbarung im Veranstaltungsvertrag.</li>
        </ul>
      </Section>
      <Section title="§ 6 An- und Abreise">
        Gebuchte Zimmer stehen ab 15:00 Uhr am Anreisetag zur Verfügung und sind am Abreisetag bis 11:00 Uhr zu räumen. Eine spätere Abreise (Late Check-out) ist nach Verfügbarkeit gegen Aufpreis möglich.
      </Section>
      <Section title="§ 7 Haftung">
        Das Hotel haftet für Vorsatz und grobe Fahrlässigkeit. Für eingebrachte Sachen haftet das Hotel nach Maßgabe der §§ 701 ff. BGB. Wertgegenstände können im Hotelsafe verwahrt werden.
      </Section>
      <Section title="§ 8 Mitgebrachte Speisen und Getränke">
        Speisen und Getränke dürfen zu Veranstaltungen grundsätzlich nicht mitgebracht werden. Ausnahmen bedürfen einer schriftlichen Vereinbarung; in diesen Fällen wird ein Servicegeld berechnet.
      </Section>
      <Section title="§ 9 Hausrecht & Hausordnung">
        Mit Buchung erkennt der Gast die jeweils gültige Hausordnung an. Das Hotel ist berechtigt, Personen, die gegen die Hausordnung verstoßen oder andere Gäste belästigen, des Hauses zu verweisen.
      </Section>
      <Section title="§ 10 Schlussbestimmungen">
        Es gilt deutsches Recht. Erfüllungsort und Gerichtsstand ist – soweit gesetzlich zulässig – Ingolstadt. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
      </Section>
      <div className="pt-6 border-t border-gold/15 text-sm text-muted-foreground">
        Hotel Der Heidehof · Ingolstädter Str. 121 · 85080 Gaimersheim / Ingolstadt ·{" "}
        <a href="mailto:reservierung@der-heidehof.de" className="text-gold hover:underline">reservierung@der-heidehof.de</a>{" "} · +49 8458 64-0
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default AGB;
