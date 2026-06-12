import { useMemo } from 'react';
import { 
  heidehofKnowledgeBase, 
  heidehofSeoKeywords, 
  heidehofFaq,
  type HeidehofKnowledgeBase 
} from '@/data/heidehof-knowledge-base';

/**
 * Hook for accessing Hotel Heidehof knowledge base
 * Provides structured access to hotel information for SEO, content generation, and general use
 */
export const useHeidehofKnowledge = () => {
  // Get specific sections of the knowledge base
  const getGeneralInfo = useMemo(() => heidehofKnowledgeBase.general, []);
  const getLocationInfo = useMemo(() => heidehofKnowledgeBase.location, []);
  const getAccommodationInfo = useMemo(() => heidehofKnowledgeBase.accommodation, []);
  const getGastronomyInfo = useMemo(() => heidehofKnowledgeBase.gastronomy, []);
  const getWellnessInfo = useMemo(() => heidehofKnowledgeBase.wellness, []);
  const getEventsInfo = useMemo(() => heidehofKnowledgeBase.events, []);
  const getServicesInfo = useMemo(() => heidehofKnowledgeBase.services, []);
  const getSustainabilityInfo = useMemo(() => heidehofKnowledgeBase.sustainability, []);
  const getSurroundingsInfo = useMemo(() => heidehofKnowledgeBase.surroundings, []);
  const getEmergencyInfo = useMemo(() => heidehofKnowledgeBase.emergency, []);

  // SEO-optimized content generators
  const generateHotelDescription = useMemo(() => {
    const { general, wellness, gastronomy } = heidehofKnowledgeBase;
    return `${general.fullName} ist ein ${general.classification} Hotel in ${general.address.city}, ${general.address.state}. 
    Unser familiär geführtes Resort bietet ${gastronomy.restaurants.length} Restaurants, das ${wellness.name} 
    mit umfassenden Wellness-Angeboten und ${heidehofKnowledgeBase.accommodation.totalRooms} komfortable Zimmer und Suiten.`;
  }, []);

  const generateContactInfo = useMemo(() => {
    const { general } = heidehofKnowledgeBase;
    return {
      name: general.fullName,
      address: `${general.address.street}, ${general.address.postalCode} ${general.address.city}`,
      phone: general.contact.phone,
      email: general.contact.email,
      website: general.contact.website
    };
  }, []);

  // SEO keywords grouped by category
  const getSeoKeywords = useMemo(() => heidehofSeoKeywords, []);

  // FAQ for structured data
  const getFaq = useMemo(() => heidehofFaq, []);

  // Get keywords for specific topics
  const getTopicKeywords = (topic: string): string[] => {
    const topicKeywords: { [key: string]: string[] } = {
      wellness: [
        ...heidehofSeoKeywords.primary,
        "Oriental Spa", "Wellness", "Spa Hotel", "Massage", "Sauna", "Pool", "Entspannung"
      ],
      dining: [
        ...heidehofSeoKeywords.primary,
        "Restaurant", "Fine Dining", "Le Petit Chef", "Gastronomie", "Küche", "Bar"
      ],
      conference: [
        ...heidehofSeoKeywords.primary,
        "Tagung", "Conference", "Business", "Meeting", "Veranstaltung", "Event"
      ],
      accommodation: [
        ...heidehofSeoKeywords.primary,
        "Zimmer", "Suite", "Übernachtung", "Hotel", "Unterkunft"
      ],
      location: [
        ...heidehofSeoKeywords.location,
        "Ingolstadt", "Gaimersheim", "Bayern", "Audi Forum", "Ingolstadt Village"
      ]
    };

    return topicKeywords[topic.toLowerCase()] || heidehofSeoKeywords.primary;
  };

  // Generate meta description for specific topics
  const generateMetaDescription = (topic?: string, customContent?: string): string => {
    const base = `${heidehofKnowledgeBase.general.fullName} in ${heidehofKnowledgeBase.general.address.city}`;
    
    if (customContent) {
      return `${base} - ${customContent}`.substring(0, 160);
    }

    const topicDescriptions: { [key: string]: string } = {
      wellness: `${base} - Oriental Spa mit Sauna, Pool, Massagen. 4-Sterne-Superior Wellness Hotel.`,
      dining: `${base} - Fine Dining, Le Petit Chef, Restaurant Maxwell. Exzellente Gastronomie.`,
      conference: `${base} - Moderne Tagungsräume, Business Hotel, Conference Resort.`,
      accommodation: `${base} - 115 komfortable Zimmer & Suiten, 4-Sterne-Superior Hotel.`
    };

    return topicDescriptions[topic?.toLowerCase() || ''] || 
           `${base} - 4-Sterne-Superior Conference & Spa Resort mit Oriental Spa, Fine Dining und Tagungsräumen.`;
  };

  // Generate JSON-LD structured data
  const generateStructuredData = () => {
    const { general } = heidehofKnowledgeBase;
    
    return {
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": general.fullName,
      "description": generateHotelDescription,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": general.address.street,
        "addressLocality": general.address.city,
        "addressRegion": general.address.state,
        "postalCode": general.address.postalCode,
        "addressCountry": general.address.country
      },
      "telephone": general.contact.phone,
      "email": general.contact.email,
      "url": `https://${general.contact.website}`,
      "starRating": {
        "@type": "Rating",
        "ratingValue": "4"
      },
      "amenityFeature": [
        { "@type": "LocationFeatureSpecification", "name": "Spa" },
        { "@type": "LocationFeatureSpecification", "name": "Restaurant" },
        { "@type": "LocationFeatureSpecification", "name": "Conference Rooms" },
        { "@type": "LocationFeatureSpecification", "name": "Free Parking" },
        { "@type": "LocationFeatureSpecification", "name": "Free WiFi" }
      ]
    };
  };

  // Content generation helpers
  const getContentContext = (topic: string) => {
    const context = {
      hotel: heidehofKnowledgeBase.general,
      keywords: getTopicKeywords(topic),
      metaDescription: generateMetaDescription(topic),
      relatedInfo: {} as any
    };

    // Add topic-specific context
    switch (topic.toLowerCase()) {
      case 'wellness':
        context.relatedInfo = heidehofKnowledgeBase.wellness;
        break;
      case 'dining':
        context.relatedInfo = heidehofKnowledgeBase.gastronomy;
        break;
      case 'conference':
        context.relatedInfo = { 
          rooms: "8 klimatisierte Tagungsräume",
          capacity: "Bis 150 Personen",
          location: heidehofKnowledgeBase.location
        };
        break;
      case 'accommodation':
        context.relatedInfo = heidehofKnowledgeBase.accommodation;
        break;
      default:
        context.relatedInfo = heidehofKnowledgeBase;
    }

    return context;
  };

  return {
    // Full knowledge base
    knowledgeBase: heidehofKnowledgeBase,
    
    // Specific sections
    general: getGeneralInfo,
    location: getLocationInfo,
    accommodation: getAccommodationInfo,
    gastronomy: getGastronomyInfo,
    wellness: getWellnessInfo,
    events: getEventsInfo,
    services: getServicesInfo,
    sustainability: getSustainabilityInfo,
    surroundings: getSurroundingsInfo,
    emergency: getEmergencyInfo,
    
    // SEO utilities
    seoKeywords: getSeoKeywords,
    faq: getFaq,
    getTopicKeywords,
    generateMetaDescription,
    generateHotelDescription,
    generateContactInfo,
    generateStructuredData,
    
    // Content generation
    getContentContext
  };
};

export default useHeidehofKnowledge;
