// Shared mapping for Clara's "navigate_to_section" tool — opens real Heidehof pages.
export const HEIDEHOF_BASE = "https://www.der-heidehof.de";

export const HEIDEHOF_SECTIONS: Record<string, string> = {
  // Hotel & allgemein
  home: `${HEIDEHOF_BASE}/`,
  hotel: `${HEIDEHOF_BASE}/de/hotel.html`,
  lage: `${HEIDEHOF_BASE}/de/hotel/lage.html`,
  conference_spa_resort: `${HEIDEHOF_BASE}/de/hotel/conference-spa-resort.html`,
  impressionen: `${HEIDEHOF_BASE}/de/hotel/impressionen.html`,
  parken: `${HEIDEHOF_BASE}/de/hotel/parken-e-tanken.html`,
  bewertungen: `${HEIDEHOF_BASE}/de/hotel/bewertungen.html`,

  // Zimmer & Suiten
  zimmer: `${HEIDEHOF_BASE}/de/zimmer-suiten.html`,
  zimmer_uebersicht: `${HEIDEHOF_BASE}/de/zimmer-suiten/zimmer-suiten.html`,
  classic_einzelzimmer: `${HEIDEHOF_BASE}/de/zimmer-suiten/zimmer-suiten/classic-einzelzimmer.html`,
  deluxe_einzelzimmer: `${HEIDEHOF_BASE}/de/zimmer-suiten/zimmer-suiten/deluxe-einzelzimmer.html`,
  classic_doppelzimmer: `${HEIDEHOF_BASE}/de/zimmer-suiten/zimmer-suiten/classic-doppelzimmer.html`,
  deluxe_doppelzimmer: `${HEIDEHOF_BASE}/de/zimmer-suiten/zimmer-suiten/deluxe-doppelzimmer.html`,
  heidehof_suite: `${HEIDEHOF_BASE}/de/zimmer-suiten/zimmer-suiten/heidehof-suite.html`,
  panorama_suite: `${HEIDEHOF_BASE}/de/zimmer-suiten/zimmer-suiten/panorama-suiten.html`,
  zusatzleistungen: `${HEIDEHOF_BASE}/de/zimmer-suiten/zusatzleistungen.html`,
  appartements: `${HEIDEHOF_BASE}/de/zimmer-suiten/appartements-am-hotel.html`,
  longstay: `${HEIDEHOF_BASE}/de/zimmer-suiten/longstay-appartements-in-ingolstadt.html`,
  last_minute: `${HEIDEHOF_BASE}/de/zimmer-suiten/last-minute.html`,
  onlinebucher_vorteil: `${HEIDEHOF_BASE}/de/zimmer-suiten/onlinebucher-vorteil.html`,
  wissenswertes: `${HEIDEHOF_BASE}/de/zimmer-suiten/wissenswertes.html`,

  // Arrangements / Angebote
  angebote: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements.html`,
  arrangements: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements.html`,
  arr_st_barth: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/st-barth-feeling.html`,
  arr_4beiner: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/4-beiner-trip-mit-2-erwachsenen.html`,
  arr_relaxing: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/relaxing-pur.html`,
  arr_3_2: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/3-2.html`,
  arr_3fuer2: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/3fuer2.html`,
  arr_2_plus_1: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/2-plus-1.html`,
  arr_luxus: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/luxus.html`,
  arr_touch_of_luxury: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/touch-of-luxury.html`,
  arr_me_time: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/me-time.html`,
  arr_balance_escape: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/balance-escape.html`,
  arr_muttertag: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements/muttertags-special.html`,

  // Pages (Saison-/Specials)
  silvester: `${HEIDEHOF_BASE}/de/pages/ein-jahreswechsel-zum-verlieben-silvester-im-heidehof.html`,
  weihnachtstraum: `${HEIDEHOF_BASE}/de/pages/weihnachtstraum-im-heidehof.html`,
  heiligabend: `${HEIDEHOF_BASE}/de/pages/besinnlicher-heiligabend.html`,
  heiligabend_traumzeit: `${HEIDEHOF_BASE}/de/pages/heiligabend-traumzeit.html`,
  zimt_weihnachten: `${HEIDEHOF_BASE}/de/pages/zimt-weihnachtstraum.html`,
  winterleuchten: `${HEIDEHOF_BASE}/de/pages/winterleuchten-zeit-fuer-das-schoenste-sie-selbst.html`,
  easter_hideaway: `${HEIDEHOF_BASE}/de/pages/easter-hideaway.html`,
  ostern_2n: `${HEIDEHOF_BASE}/de/pages/ostern-2-naechte.html`,
  ostern_3n: `${HEIDEHOF_BASE}/de/pages/ostern-3-naechte.html`,
  moms_weekend: `${HEIDEHOF_BASE}/de/pages/mom-s-weekend.html`,
  shopping_prosecco: `${HEIDEHOF_BASE}/de/pages/shopping-und-prosecco.html`,
  shopping_ingolstadt: `${HEIDEHOF_BASE}/de/pages/shopping-it-s-ingolstadt.html`,
  zarte_extravaganze: `${HEIDEHOF_BASE}/de/pages/zarte-extravaganze.html`,
  reise_2025: `${HEIDEHOF_BASE}/de/pages/reise-in-2025.html`,
  geheimnis_der_sinne: `${HEIDEHOF_BASE}/de/pages/geheimnis-der-sinne-2025.html`,
  entfuehrt_alltag: `${HEIDEHOF_BASE}/de/pages/entfuehrt-aus-dem-alltag.html`,

  // Bankett & Tagung
  bankett: `${HEIDEHOF_BASE}/de/bankett-tagung.html`,
  tagungsraeume: `${HEIDEHOF_BASE}/de/bankett-tagung/raeumlichkeiten.html`,
  tagungsangebote: `${HEIDEHOF_BASE}/de/bankett-tagung/tagungsangebote.html`,
  outdoor: `${HEIDEHOF_BASE}/de/bankett-tagung/outdoor-tagen.html`,
  outdoor_events: `${HEIDEHOF_BASE}/de/bankett-tagung/outdoor-events.html`,
  bankett_menues: `${HEIDEHOF_BASE}/de/bankett-tagung/bankett-menues.html`,
  ausstattung_technik: `${HEIDEHOF_BASE}/de/bankett-tagung/ausstattung-technik.html`,
  anfrage: `${HEIDEHOF_BASE}/de/bankett-tagung/tagungsanfrage.html`,

  // Kulinarik & Restaurants
  kulinarik: `${HEIDEHOF_BASE}/de/kulinarik-locations.html`,
  kulinarik_uebersicht: `${HEIDEHOF_BASE}/de/kulinarik-locations/kulinarik.html`,
  speisekarten: `${HEIDEHOF_BASE}/de/kulinarik-locations/kulinarik/speisekarten.html`,
  kulinarik_events: `${HEIDEHOF_BASE}/de/kulinarik-locations/kulinarik/events.html`,
  kulinarik_bilder: `${HEIDEHOF_BASE}/de/kulinarik-locations/kulinarik/bilder.html`,
  restaurant: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants.html`,
  restaurants: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants.html`,
  fine_dining: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants/fine-dining.html`,
  fine_dining_anfrage: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants/fine-dining/eventanfrage.html`,
  dining: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants/dining.html`,
  breakfast_dining: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants/breakfast-dining.html`,
  hotelbar: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants/hotelbar.html`,
  terrassen: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants/terrassen.html`,
  tischreservierung: `${HEIDEHOF_BASE}/de/kulinarik-locations/restaurants/tischreservierung.html`,

  // Spa
  spa: `${HEIDEHOF_BASE}/de/spa-area.html`,
  wasserwelt: `${HEIDEHOF_BASE}/de/spa-area/wasserwelt.html`,
  saunen: `${HEIDEHOF_BASE}/de/spa-area/saunen.html`,
  fitness: `${HEIDEHOF_BASE}/de/spa-area/fitnesslounge.html`,
  day_spa: `${HEIDEHOF_BASE}/de/spa-area/day-spa.html`,

  // Living Beauty
  beauty: `${HEIDEHOF_BASE}/de/living-beauty.html`,
  beauty_for_men: `${HEIDEHOF_BASE}/de/living-beauty/beauty-for-men.html`,
  beauty_for_women: `${HEIDEHOF_BASE}/de/living-beauty/beauty-for-woman.html`,
  beautytreatment: `${HEIDEHOF_BASE}/de/living-beauty/beautytreatment.html`,
  beauty_klapp: `${HEIDEHOF_BASE}/de/living-beauty/beautytreatment/beautytreatment-klapp-cosmetic.html`,
  beauty_st_barth: `${HEIDEHOF_BASE}/de/living-beauty/beautytreatment/beautytreatment-st-barth.html`,
  dr_bolat: `${HEIDEHOF_BASE}/de/living-beauty/dr-bolat.html`,
  massagen: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen.html`,
  massagen_klassisch: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen/massagen.html`,
  baeder: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen/baeder.html`,
  packungen_peeling: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen/packungen-peeling.html`,
  hand_fuss: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen/hand-fuss.html`,
  augen_auf: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen/augen-auf.html`,
  depilation: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen/depilation.html`,
  beauty_terminanfrage: `${HEIDEHOF_BASE}/de/living-beauty/massagen-anwendungen/terminanfrage.html`,
  shop: `${HEIDEHOF_BASE}/de/living-beauty/produkteshop.html`,
  produkteshop: `${HEIDEHOF_BASE}/de/living-beauty/produkteshop.html`,

  // Aktiv / Umgebung
  aktiv: `${HEIDEHOF_BASE}/de/aktiv-umgebung.html`,
  ingolstadt: `${HEIDEHOF_BASE}/de/aktiv-umgebung/ingolstadt.html`,
  altmuehltal: `${HEIDEHOF_BASE}/de/aktiv-umgebung/altmuehltal.html`,
  ausflugsziele: `${HEIDEHOF_BASE}/de/aktiv-umgebung/ausflugsziele.html`,
  urlaubswetter: `${HEIDEHOF_BASE}/de/aktiv-umgebung/urlaubswetter.html`,

  // Service & Kontakt
  service: `${HEIDEHOF_BASE}/de/service-kontakt.html`,
  kontakt: `${HEIDEHOF_BASE}/de/service-kontakt/kontakt.html`,
  anreise: `${HEIDEHOF_BASE}/de/service-kontakt/anreise.html`,
  newsletter: `${HEIDEHOF_BASE}/de/service-kontakt/newsletter.html`,
  partner: `${HEIDEHOF_BASE}/de/service-kontakt/partner.html`,
  rueckruf: `${HEIDEHOF_BASE}/de/service-kontakt/rueckrufbitte.html`,
  bewertungen_service: `${HEIDEHOF_BASE}/de/service-kontakt/bewertungen.html`,

  // Buchung (externes Booking-Tool des Hotels)
  buchung: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements.html`,
  booking: `${HEIDEHOF_BASE}/de/zimmer-suiten/arrangements.html`,

  // Infos / SEO-Landingpages
  infos: `${HEIDEHOF_BASE}/de/infos.html`,
  info_4sterne: `${HEIDEHOF_BASE}/de/infos/4-sterne-superior-hotel-in-ingolstadt.html`,
  info_hotel_ingolstadt: `${HEIDEHOF_BASE}/de/infos/hotel-in-ingolstadt.html`,
  info_tagungen: `${HEIDEHOF_BASE}/de/infos/tagungen-und-seminare-in-ingolstadt.html`,
  info_urlaub: `${HEIDEHOF_BASE}/de/infos/urlaub-in-ingolstadt.html`,
  info_wellness: `${HEIDEHOF_BASE}/de/infos/wellnesshotel-in-ingolstadt.html`,

  // Rechtliches
  impressum: `${HEIDEHOF_BASE}/de/impressum.html`,
  datenschutz: `${HEIDEHOF_BASE}/de/datenschutz.html`,
  barrierefreiheit: `${HEIDEHOF_BASE}/de/barrierefreiheit.html`,
};

export const HEIDEHOF_SECTION_KEYS = Object.keys(HEIDEHOF_SECTIONS) as Array<keyof typeof HEIDEHOF_SECTIONS>;

export function resolveHeidehofUrl(section?: string): string {
  if (!section) return HEIDEHOF_BASE;
  return HEIDEHOF_SECTIONS[section] ?? HEIDEHOF_BASE;
}
