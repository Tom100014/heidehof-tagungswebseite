
-- Wipe existing entries (some contained fictional rooms like Schiller/Goethe)
DELETE FROM public.clara_knowledge;

INSERT INTO public.clara_knowledge (title, category, content, sort_order, is_active) VALUES

('Hotel – Basisdaten', 'general',
'**Name:** Hotel Der Heidehof (Parkhotel Heidehof GmbH)
**Kategorie:** 4-Sterne Superior Conference & Spa Resort
**Adresse:** Ingolstädter Straße 121, 85080 Gaimersheim (bei Ingolstadt), Bayern
**Zimmer:** 115 Zimmer & Suiten
**Tagungsräume:** 8 Räume, größter 120 m², Gesamtkapazität bis 150 Personen, in Summe 435 m²
**Spa:** über 400 m² Wellnessbereich mit Innen- und Außenpool
**Entfernungen:** Innenstadt Ingolstadt 4,5 km · Hbf 6,0 km · Flughafen München 80 km',
10, true),

('Kontakt & Reservierung', 'kontakt',
'**Telefon:** +49 (0)841 9531-0
**E-Mail Reservierung:** reservierung@der-heidehof.de
**Webseite:** www.der-heidehof.de
**Anschrift:** Hotel Der Heidehof, Ingolstädter Straße 121, 85080 Gaimersheim
Tisch- oder Spa-Reservierung sind erforderlich; Tagungsanfragen über das Bankett-Team.',
20, true),

('Lage & Anreise', 'kontakt',
'Ruhige Lage am Stadtrand von Ingolstadt, in Gaimersheim.
- Auto: direkt über die A9 erreichbar
- Bahn: Hauptbahnhof Ingolstadt ca. 6 km
- Flughafen München (MUC) ca. 80 km
- Innenstadt & Shopping Village Ingolstadt 4,5 km
Hauseigene Parkplätze und E-Ladesäulen vorhanden.',
30, true),

('Zimmer & Suiten', 'general',
'115 Zimmer und Suiten, elegant und luxuriös eingerichtet.
**Ausstattung:** Schreib-/Sitzecke, Telefon, TV (teils DVD-Player), Minibar, exklusives Bad mit Dusche oder Badewanne, Handtuchwärmer, Haartrockner, Kosmetikspiegel, Pflegeprodukte.
**Viele Zimmer:** Safe und privater Balkon.
**WLAN:** 24-Stunden High-Speed-WLAN, im gesamten Haus kostenfrei.
Suiten verfügen über separaten Wohnbereich.
Zusätzlich Appartements am Hotel sowie Longstay-Appartements in Ingolstadt.',
40, true),

('Arrangements & Pauschalen', 'general',
'**Balance Escape** (2 Nächte): DZ, Frühstück, 1× 3-Gang-HP, Welcome-Drink, St. Barth Massage 30 Min., Spa-Nutzung, Bademantel/Tasche – ab 275 € p. P.
**Me Time** (2 Nächte): DZ, 2× 3-Gang-Dinner, Frühstück, Klapp Vitamin-A-Gesichtsbehandlung 40 Min., Welcome-Drink, Spa – ab 326 € p. P.
**Touch of Luxury** (2 Nächte): Suite, Prosecco, Obst, 1× 3-Gang-HP, St. Barth Massage 30 Min., VIP-Ruhebereich, VIP-Parkplatz – ab 441 € p. P.
**2 plus 1** (3 Nächte, 1 Nacht geschenkt): DZ, Frühstück, Welcome-Drink, Wasser, Spa – ab 260 € p. P.
Alle Arrangements 03.01. – 21.12.2026 buchbar. Green Stay: Zwischenreinigung 25 €.',
50, true),

('Spa & Wellness', 'spa',
'**Über 400 m² Spa-Bereich mit Fitnesslounge.**
- Saunen: Himalaya-Salz-Sauna, Finnische Sauna, Aromatherapie-Dampfbad, Tepidarium, Sole-Inhalations-Kabine
- Wasser: Innenbecken mit Wassergrotte, beheiztes Außenbecken, Whirlpool, Erlebnisdusche, Kneippgang
- Ruhe: Gang der Sinne, Japanischer Garten, Ruheraum, VIP-Ruhebereich
- Fitnesslounge: 10:00 – 22:00 Uhr
**Day-Spa-Öffnungszeiten:** Mo–Do 10:00–22:00, So 12:00–22:00 (Fr/Sa Reservierung notwendig).
**Eintritt extern:** 52 € pro Person/Tag.
**Hinweis:** Im gesamten Spa- und Saunabereich besteht Textilpflicht.',
60, true),

('Spa-Pakete & Beauty', 'spa',
'**St. Barth Luxuspaket** 175 € – Karibische Gesichtsbehandlung, Bürstenmassage, Bodylotion 2×25 ml + Spa.
**Wellness-Beauty-Tag** 155 € – Klassik-Gesichtsbehandlung 50 Min., Brauenkorrektur, Hand-Spa, Wellnesstee + Spa.
**Seelen-Balance Tag** 139 € – Peeling, Aroma-Massage 30 Min. + Spa.
**Entspannungstag SPA** 110 € – Clean-&-Easy-Gesichtsbehandlung + Spa.
**Men Face + Body** 145 € – Klapp-Gesichtsbehandlung, Bürstenmassage, Beauty-Pack + Spa.
**Men DAY OFF** 120 € – Aroma-Ölmassage, A-Klapp-Gesichtsbehandlung + Spa.
Termine immer mit Voranmeldung; Gutscheine über voucherbooking.de/parkhotelheidehof.',
70, true),

('Restaurants & Bar', 'restaurant',
'**Restaurants & Locations:**
- Fine Dining Lounge – stilvolles Abend-Restaurant
- Dining – Restaurant mit eleganter Tischkultur
- Breakfast Lounge – Frühstücksbereich
- Hotelbar – gemütliche Bar-Atmosphäre
- Poolbar Mäx – Mittagstisch & leichte Küche
- Terrassen am Außenpool
**Küche:** internationale & mediterrane Küche, leichte sowie regionale und saisonale Speisen. Glutenfreie und laktosefreie Gerichte auf Anfrage.',
80, true),

('Restaurant – Öffnungszeiten', 'restaurant',
'**Frühstück:** Mo–Sa 6:00–10:00 Uhr · So 6:00–11:00 Uhr
**Mittagessen:** Poolbar Mäx ab 11:30 Uhr
**Restaurant abends:** 18:00–23:00 Uhr (sonntags geschlossen)
**24.12.:** ausschließlich Heilig-Abend-5-Gang-Menü, kein À-la-carte.
Reservierung empfohlen – online über die Hotelwebseite.',
90, true),

('Tagungscenter – Räume', 'raum',
'**Tagungscenter (Haupträume):**
| Raum | L × B × H (m) | Fläche |
|---|---|---|
| Bonn / Berlin (kombiniert) | 16,5 × 7,0 × 2,7 | 120 m² |
| Frankfurt | 9,0 × 9,0 × 2,7 | 80 m² |
| Berlin | 9,5 × 7,0 × 2,7 | 70 m² |
| München | – | 70 m² |
| Hamburg | 9,0 × 5,5 × 2,7 | 50 m² |
| Bonn | 7,0 × 7,0 × 2,7 | 50 m² |
Alle mit Tageslicht.',
100, true),

('Art Center – Räume', 'raum',
'**Art Center (kreative kleinere Räume):**
| Raum | L × B × H (m) | Fläche |
|---|---|---|
| Feuer | 7,8 × 5,5 × 2,7 | 42 m² |
| Wasser | 8,1 × 4,4 × 2,7 | 38 m² |
| Holz | 7,6 × 4,2 × 2,7 | 35 m² |
Ideal für Workshops, Breakouts und Teambuilding.',
110, true),

('Tagungsraum – Kapazitäten je Bestuhlung', 'raum',
'Maximal-Personenzahlen je Raum und Bestuhlung:
| Raum | Parlament | U-Form | Block | Stuhlreihe/Kino |
|---|---|---|---|---|
| Bonn/Berlin (120 m²) | 80 | 48 | 48 | 150 |
| Frankfurt (80 m²) | 45 | 21 | 30 | 70 |
| Berlin (70 m²) | 45 | 24 | 30 | 70 |
| München (70 m²) | 48 | 20 | 26 | 70 |
| Hamburg (50 m²) | 24 | 17 | 22 | 30 |
| Bonn (50 m²) | 24 | 17 | 22 | 30 |
| Feuer (42 m²) | 19 | 15 | 18 | 28 |
| Wasser (38 m²) | 16 | 15 | 15 | 25 |
| Holz (35 m²) | – | – | 14 | – |
**Gesamtkapazität Haus:** bis 150 Personen Tagung, 8 Räume, 435 m² gesamt.',
120, true),

('Tagungstechnik & Service', 'raum',
'Moderne Tagungstechnik, viel Tageslicht in allen Hauptäumen, erfahrenes Veranstaltungsteam, flexibel kombinierbare Räume, Rundum-Tagungsbetreuung inkl. Kulinarik. Maßgeschneiderte Angebote auf Anfrage über das Bankett-Team.',
130, true),

('Kulinarik für Tagungen', 'raum',
'Bei mehrtägigen Tagungen mit Mittag- und Abendessen stellt die Küche täglich pro Mahlzeit ein Menü mit:
- **3 vegetarischen Hauptgängen**
- **4 Fleischgerichten**
- **4 Fischgerichten**
zur Wahl. Vorspeise und Dessert ergänzen das Menü; Allergene und Spezialwünsche (glutenfrei, laktosefrei, vegan) werden berücksichtigt.',
140, true),

('Conference & Spa Resort – Positionierung', 'general',
'Der Heidehof ist ein 4-Sterne-Superior Conference & Spa Resort und richtet sich gleichermaßen an Wellnessgäste, Geschäftsreisende, Tagungsgruppen und Naturliebhaber. Kombination aus Tagungshotel, Wellnessresort und gehobenem Restaurantbetrieb am Rand von Ingolstadt.',
150, true),

('Aktiv & Umgebung', 'outdoor',
'In der Umgebung des Hotels: Altstadt Ingolstadt, Ingolstadt Village (Outlet), Naturpark Altmühltal, Radwege entlang der Donau, Schanz/Klenze-Park, Audi Forum Ingolstadt. Aktivangebote: Wandern, Radfahren, Stadtbummel.',
160, true);
