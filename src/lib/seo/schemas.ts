import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/components/seo/PageSeo";

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Ingolstädter Str. 121",
  addressLocality: "Gaimersheim",
  addressRegion: "BY",
  postalCode: "85080",
  addressCountry: "DE",
};

const GEO = {
  "@type": "GeoCoordinates",
  latitude: 48.8077,
  longitude: 11.3704,
};

const CONTACT = {
  telephone: "+49-8458-640",
  email: "reservierung@der-heidehof.de",
};

export const hotelSchema = () => ({
  "@context": "https://schema.org",
  "@type": ["Hotel", "LodgingBusiness"],
  "@id": `${SITE_URL}/#hotel`,
  name: SITE_NAME,
  url: SITE_URL,
  image: DEFAULT_OG_IMAGE,
  logo: `${SITE_URL}/heidehof/logo-white.svg`,
  description:
    "4★ Superior Conference & SPA Resort vor den Toren Ingolstadts – Tagungshotel mit 8 Tagungsräumen bis 150 Personen, 400 m² SPA, Restaurant und Pauschalen ab 69 €.",
  priceRange: "€€€",
  starRating: { "@type": "Rating", ratingValue: "4", bestRating: "5" },
  address: ADDRESS,
  geo: GEO,
  ...CONTACT,
  hasMap: "https://maps.google.com/?q=Hotel+Der+Heidehof+Ingolstadt",
  checkinTime: "15:00",
  checkoutTime: "11:00",
  numberOfRooms: 100,
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Gigabit-WLAN", value: true },
    { "@type": "LocationFeatureSpecification", name: "SPA & Wellness 400 m²", value: true },
    { "@type": "LocationFeatureSpecification", name: "Indoor-Pool", value: true },
    { "@type": "LocationFeatureSpecification", name: "Finnische Sauna", value: true },
    { "@type": "LocationFeatureSpecification", name: "Dampfbad", value: true },
    { "@type": "LocationFeatureSpecification", name: "Fitnesslounge Technogym", value: true },
    { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
    { "@type": "LocationFeatureSpecification", name: "Hotelbar", value: true },
    { "@type": "LocationFeatureSpecification", name: "200 Parkplätze", value: true },
    { "@type": "LocationFeatureSpecification", name: "8 Tagungsräume bis 150 Personen", value: true },
  ],
  sameAs: [
    "https://www.facebook.com/derheidehof",
    "https://www.instagram.com/der_heidehof",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "284",
  },
});

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/heidehof/logo-white.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: CONTACT.telephone,
    contactType: "reservations",
    areaServed: "DE",
    availableLanguage: ["German", "English"],
  },
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "de-DE",
  publisher: { "@id": `${SITE_URL}/#organization` },
});

export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: `${SITE_URL}${it.path}`,
  })),
});

export const meetingRoomListSchema = (
  rooms: { name: string; area: string; capTheater: number; capBanquet: number; image?: string }[],
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: rooms.map((r, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "MeetingRoom",
      name: r.name,
      floorSize: { "@type": "QuantitativeValue", value: parseInt(r.area), unitCode: "MTK" },
      maximumAttendeeCapacity: r.capTheater,
      image: r.image ? `${SITE_URL}${r.image}` : undefined,
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Tageslicht", value: true },
        { "@type": "LocationFeatureSpecification", name: "Beamer + Leinwand", value: true },
        { "@type": "LocationFeatureSpecification", name: "WLAN", value: true },
        { "@type": "LocationFeatureSpecification", name: "Klimatisiert", value: true },
      ],
    },
  })),
});

export const offerSchema = () => ({
  "@context": "https://schema.org",
  "@type": "AggregateOffer",
  name: "Tagungspauschalen Hotel Der Heidehof",
  priceCurrency: "EUR",
  lowPrice: "69",
  highPrice: "199",
  offerCount: "3",
  availability: "https://schema.org/InStock",
  url: `${SITE_URL}/tagungspauschalen`,
  seller: { "@id": `${SITE_URL}/#hotel` },
});

export const faqSchema = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

export const serviceSchema = (name: string, description: string, path: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name,
  description,
  provider: { "@id": `${SITE_URL}/#hotel` },
  areaServed: { "@type": "City", name: "Ingolstadt" },
  url: `${SITE_URL}${path}`,
});

export const contactPageSchema = () => ({
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE_URL}/tagungsraeume`,
  name: "Anfrage – Hotel Der Heidehof",
  about: { "@id": `${SITE_URL}/#hotel` },
});

export const spaBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": ["HealthAndBeautyBusiness", "SportsActivityLocation"],
  "@id": `${SITE_URL}/#spa`,
  name: "Oriental SPA – Hotel Der Heidehof",
  description:
    "400 m² Oriental SPA mit Innenpool mit Grotte, beheiztem Außenpool, Whirlpool, Himalaya-Salz-Sauna, Finnischer Sauna (90°C), Aromadampfbad, Tepidarium, Kneippgang und Beautyfarm Living Beauty.",
  url: `${SITE_URL}/wellness`,
  image: `${SITE_URL}/heidehof/spa-pool.jpg`,
  ...CONTACT,
  address: ADDRESS,
  geo: GEO,
  openingHours: "Mo-Su 10:00-22:00",
  priceRange: "€€€",
  containedInPlace: { "@id": `${SITE_URL}/#hotel` },
  areaServed: [
    { "@type": "City", name: "Ingolstadt" },
    { "@type": "City", name: "Gaimersheim" },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "284",
    bestRating: "5",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Spa & Wellness Angebote",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Innenpool mit Grotte" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Beheizter Außenpool" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Himalaya-Salz-Sauna" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Finnische Sauna 90°C" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Aromadampfbad" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Tepidarium" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Kneippgang" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Beautyfarm Living Beauty" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Fitnesslounge Technogym" } },
    ],
  },
});

export const restaurantSchema = () => ({
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  "@id": `${SITE_URL}/#restaurant`,
  name: "Restaurant Maxwell – Hotel Der Heidehof",
  description:
    "Vier kulinarische Welten im Hotel Der Heidehof: Restaurant Maxwell, Fine-Dining-Lounge, Le Petit Chef (3D-Dining) und Hotelbar Mäx.",
  url: `${SITE_URL}/restaurant`,
  image: `${SITE_URL}/heidehof/orig/restaurant-1.jpg`,
  ...CONTACT,
  address: ADDRESS,
  geo: GEO,
  servesCuisine: ["Internationale Küche", "Fine Dining", "Bayerische Küche"],
  priceRange: "€€€",
  hasMenu: `${SITE_URL}/speisekarte`,
  acceptsReservations: true,
  containedInPlace: { "@id": `${SITE_URL}/#hotel` },
  areaServed: { "@type": "City", name: "Ingolstadt" },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "284",
    bestRating: "5",
  },
});
