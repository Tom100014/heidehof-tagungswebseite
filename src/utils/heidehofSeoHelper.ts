import { heidehofKnowledgeBase, heidehofSeoKeywords, heidehofFaq } from '@/data/heidehof-knowledge-base';

/**
 * SEO helper utilities specifically for Hotel Heidehof
 * Provides SEO-optimized content generation and structured data
 */

export interface SeoContentConfig {
  topic?: string;
  targetKeywords?: string[];
  contentType?: 'blog' | 'page' | 'product' | 'service';
  tone?: 'professional' | 'friendly' | 'luxury' | 'informative';
  audience?: 'business' | 'leisure' | 'wellness' | 'events';
}

/**
 * Generates SEO-optimized title tags for Hotel Heidehof
 */
export const generateSeoTitle = (
  config: SeoContentConfig & { customTitle?: string }
): string => {
  const { customTitle, topic, contentType } = config;
  const hotelName = heidehofKnowledgeBase.general.name;
  const location = `${heidehofKnowledgeBase.general.address.city}, ${heidehofKnowledgeBase.general.address.state}`;

  if (customTitle) {
    return `${customTitle} | ${hotelName} ${location}`.substring(0, 60);
  }

  const titleTemplates: { [key: string]: string } = {
    wellness: `Oriental Spa & Wellness | ${hotelName} ${location}`,
    dining: `Fine Dining & Restaurants | ${hotelName} ${location}`,
    conference: `Tagungsräume & Events | ${hotelName} ${location}`,
    accommodation: `4-Sterne Hotel | ${hotelName} ${location}`,
    'le-petit-chef': `Le Petit Chef 3D Dining | ${hotelName} ${location}`,
    default: `${hotelName} - 4-Sterne-Superior Conference & Spa Resort ${location}`
  };

  return titleTemplates[topic?.toLowerCase() || 'default'].substring(0, 60);
};

/**
 * Generates SEO-optimized meta descriptions
 */
export const generateSeoDescription = (
  config: SeoContentConfig & { customDescription?: string }
): string => {
  const { customDescription, topic, audience } = config;
  const hotelName = heidehofKnowledgeBase.general.fullName;
  const location = heidehofKnowledgeBase.general.address.city;

  if (customDescription) {
    return customDescription.substring(0, 160);
  }

  const descriptionTemplates: { [key: string]: string } = {
    wellness: `Entspannung im Oriental Spa des ${hotelName} in ${location}. Sauna, Pool, Massagen und Wellness-Behandlungen. 4-Sterne-Superior Hotel mit Spa.`,
    dining: `Exzellente Gastronomie im ${hotelName}. Fine Dining, Le Petit Chef 3D-Erlebnis, Restaurant Maxwell. Kulinarische Vielfalt in ${location}.`,
    conference: `Professionelle Tagungsräume im ${hotelName} ${location}. 8 klimatisierte Räume, moderne Technik, bis 150 Personen. Business Hotel.`,
    accommodation: `Komfortable Zimmer & Suiten im ${hotelName}. 115 Zimmer, 4-Sterne-Superior Standard, Oriental Spa, Fine Dining in ${location}.`,
    business: `Business Hotel ${hotelName} in ${location}. Tagungsräume, Restaurant, Spa, 115 Zimmer. Ideal für Geschäftsreisen und Events.`,
    leisure: `Erholungsurlaub im ${hotelName} ${location}. Oriental Spa, Fine Dining, komfortable Zimmer. 4-Sterne-Superior Wellness Hotel.`
  };

  const key = audience || topic || 'leisure';
  return (descriptionTemplates[key] || descriptionTemplates.leisure).substring(0, 160);
};

/**
 * Generates keyword lists for different topics
 */
export const generateTopicKeywords = (topic: string, includeLocal: boolean = true): string[] => {
  const baseKeywords = [
    heidehofKnowledgeBase.general.name,
    heidehofKnowledgeBase.general.fullName,
    heidehofKnowledgeBase.general.classification
  ];

  const localKeywords = includeLocal ? [
    heidehofKnowledgeBase.general.address.city,
    heidehofKnowledgeBase.general.address.state,
    'Ingolstadt Hotel',
    'Bayern Hotel',
    'Audi Forum nähe'
  ] : [];

  const topicSpecific: { [key: string]: string[] } = {
    wellness: ['Oriental Spa', 'Wellness Hotel', 'Spa Bayern', 'Massage', 'Sauna', 'Pool', 'Entspannung', 'Wellness Wochenende'],
    dining: ['Fine Dining', 'Le Petit Chef', 'Restaurant', 'Gastronomie', 'Küche Bayern', 'Hotel Restaurant', 'Dinner'],
    conference: ['Tagungshotel', 'Business Hotel', 'Seminarräume', 'Conference', 'Meeting', 'Event Location', 'Firmenevent'],
    accommodation: ['Hotel Zimmer', 'Suite', 'Übernachtung', '4-Sterne Hotel', 'Business Hotel', 'Familienhotel'],
    events: ['Hochzeit', 'Feier', 'Event Location', 'Bankett', 'Firmenfeier', 'Veranstaltung'],
    leisure: ['Urlaub Bayern', 'Kurzurlaub', 'Wellness Urlaub', 'Hotel Aufenthalt', 'Erholung']
  };

  return [
    ...baseKeywords,
    ...localKeywords,
    ...(topicSpecific[topic.toLowerCase()] || [])
  ];
};

/**
 * Generates internal link suggestions based on topic
 */
export const generateInternalLinks = (topic: string): Array<{ text: string; url: string; context: string }> => {
  const baseUrl = `https://${heidehofKnowledgeBase.general.contact.website}`;
  
  const linkSuggestions: { [key: string]: Array<{ text: string; url: string; context: string }> } = {
    wellness: [
      { text: 'Oriental Spa', url: `${baseUrl}/wellness`, context: 'Wellness-Bereich' },
      { text: 'Spa-Behandlungen', url: `${baseUrl}/spa-behandlungen`, context: 'Beauty & Wellness' },
      { text: 'Wellness-Pakete', url: `${baseUrl}/wellness-pakete`, context: 'Angebote' }
    ],
    dining: [
      { text: 'Restaurant Maxwell', url: `${baseUrl}/restaurant`, context: 'Gastronomie' },
      { text: 'Le Petit Chef', url: `${baseUrl}/le-petit-chef`, context: '3D-Dining-Erlebnis' },
      { text: 'Fine-Dining-Lounge', url: `${baseUrl}/fine-dining`, context: 'Gehobene Küche' },
      { text: 'Hotelbar Mäx', url: `${baseUrl}/bar`, context: 'Bar & Cocktails' }
    ],
    conference: [
      { text: 'Tagungsräume', url: `${baseUrl}/tagung`, context: 'Meeting & Events' },
      { text: 'Business-Angebote', url: `${baseUrl}/business`, context: 'Geschäftsreisen' },
      { text: 'Event-Location', url: `${baseUrl}/events`, context: 'Veranstaltungen' }
    ],
    accommodation: [
      { text: 'Zimmer & Suiten', url: `${baseUrl}/zimmer`, context: 'Übernachtung' },
      { text: 'Hotel-Ausstattung', url: `${baseUrl}/ausstattung`, context: 'Services' },
      { text: 'Angebote', url: `${baseUrl}/angebote`, context: 'Specials' }
    ]
  };

  return linkSuggestions[topic.toLowerCase()] || [];
};

/**
 * Generates FAQ structured data for specific topics
 */
export const generateTopicFaq = (topic: string): Array<{ question: string; answer: string }> => {
  const topicFaqs: { [key: string]: Array<{ question: string; answer: string }> } = {
    wellness: [
      {
        question: 'Welche Wellness-Angebote gibt es im Hotel Der Heidehof?',
        answer: `Das Oriental Spa bietet Innen- und Außenpool, verschiedene Saunen, Massagen und Beauty-Behandlungen. Öffnungszeiten: täglich 7:00-22:00 Uhr.`
      },
      {
        question: 'Können externe Gäste das Spa nutzen?',
        answer: 'Ja, Day-Spa für externe Gäste Mo-Do 10:00-22:00, So 12:00-22:00 Uhr für 49 €. Reservierung erforderlich.'
      }
    ],
    dining: [
      {
        question: 'Welche Restaurants gibt es im Hotel?',
        answer: 'Das Hotel verfügt über Restaurant Maxwell, Fine-Dining-Lounge, Le Petit Chef (3D-Dining) und die Hotelbar Mäx.'
      },
      {
        question: 'Was ist Le Petit Chef?',
        answer: 'Ein immersives 3D-Dinner-Erlebnis mit animiertem Koch. Verfügbar Do-So, Start 19:00 Uhr, ab 139 € pro Person.'
      }
    ],
    conference: [
      {
        question: 'Wie viele Tagungsräume gibt es?',
        answer: '8 klimatisierte, schallisolierte Räume mit Tageslicht. Größter Raum für bis 150 Personen, kombinierbar bis 150 Personen.'
      },
      {
        question: 'Welche Technik ist verfügbar?',
        answer: 'Beamer, Leinwand, Flipchart, Pinnwand, WLAN. Zusatztechnik: Mikrofone, Videokonferenzsystem, Bühnenpodeste.'
      }
    ]
  };

  return topicFaqs[topic.toLowerCase()] || heidehofFaq.slice(0, 3);
};

/**
 * Generates complete SEO package for a topic
 */
export const generateCompleteSeoPackage = (config: SeoContentConfig) => {
  const { topic = 'general' } = config;
  
  return {
    title: generateSeoTitle(config),
    metaDescription: generateSeoDescription(config),
    keywords: generateTopicKeywords(topic),
    internalLinks: generateInternalLinks(topic),
    faq: generateTopicFaq(topic),
    structuredData: {
      hotel: {
        "@context": "https://schema.org",
        "@type": "Hotel",
        "name": heidehofKnowledgeBase.general.fullName,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": heidehofKnowledgeBase.general.address.street,
          "addressLocality": heidehofKnowledgeBase.general.address.city,
          "addressRegion": heidehofKnowledgeBase.general.address.state,
          "postalCode": heidehofKnowledgeBase.general.address.postalCode,
          "addressCountry": heidehofKnowledgeBase.general.address.country
        }
      },
      faq: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": generateTopicFaq(topic).map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    }
  };
};

/**
 * Hotel brand guidelines for content
 */
export const heidehofBrandGuidelines = {
  tone: {
    professional: 'Kompetent, vertrauenswürdig, hochwertig',
    friendly: 'Herzlich, einladend, familiär',
    luxury: 'Exklusiv, elegant, anspruchsvoll'
  },
  messaging: {
    core: 'Familiär geführtes 4-Sterne-Superior Conference & Spa Resort',
    wellness: 'Oriental Spa - Ihre Oase der Entspannung',
    dining: 'Kulinarische Vielfalt auf höchstem Niveau',
    business: 'Ihr Partner für erfolgreiche Veranstaltungen'
  },
  mustMention: [
    '4-Sterne-Superior',
    'Familiär geführt',
    'Conference & Spa Resort',
    'Ingolstadt/Gaimersheim',
    'Oriental Spa'
  ],
  avoid: [
    'Billig', 'Günstig', 'Discount',
    'Standard Hotel',
    'Massentourismus'
  ]
};