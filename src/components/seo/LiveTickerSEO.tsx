import React from 'react';
import SEOHead from './SEOHead';
import { generateEnhancedHotelSchema, generateLocalBusinessSchema, generateFAQSchema } from '@/utils/enhancedStructuredData';

interface LiveTickerSEOProps {
  category: string;
  currentDate: string;
  eventCount: number;
  categoryName: string;
}

const LiveTickerSEO: React.FC<LiveTickerSEOProps> = ({ 
  category, 
  currentDate, 
  eventCount, 
  categoryName 
}) => {
  const getCategoryKeywords = (cat: string): string[] => {
    const baseKeywords = [
      'Ingolstadt heute',
      'Hotel Der Heidehof',
      'Ingolstadt Events',
      'Ingolstadt live',
      'was ist los in Ingolstadt',
      'Ingolstadt Veranstaltungen',
      'Ingolstadt Tipps',
      'Ingolstadt aktuell',
      'Bayern Events',
      'Oberbayern',
      'Audi Stadt'
    ];

    const categoryKeywords: Record<string, string[]> = {
      highlights: ['Ingolstadt Highlights', 'Top Events Ingolstadt', 'beste Events Ingolstadt heute'],
      gastronomy: ['Restaurants Ingolstadt', 'Essen Ingolstadt', 'Gastronomie Ingolstadt', 'Dinner Ingolstadt'],
      culture: ['Museen Ingolstadt', 'Kultur Ingolstadt', 'Ausstellungen Ingolstadt', 'Kunst Ingolstadt'],
      nightlife: ['Bars Ingolstadt', 'Nachtleben Ingolstadt', 'Cocktails Ingolstadt', 'Ausgehen Ingolstadt'],
      wellness: ['Wellness Ingolstadt', 'Spa Ingolstadt', 'Entspannung Ingolstadt', 'Massage Ingolstadt'],
      audi: ['Audi Forum Ingolstadt', 'Audi Werk Ingolstadt', 'Audi Museum', 'Audi Erlebnis'],
      sports: ['Sport Ingolstadt', 'FC Ingolstadt', 'ERC Ingolstadt', 'Eishockey Ingolstadt'],
      shopping: ['Shopping Ingolstadt', 'Einkaufen Ingolstadt', 'Boutiquen Ingolstadt', 'Westpark Ingolstadt'],
      kids: ['Kinder Ingolstadt', 'Familie Ingolstadt', 'Familienaktivitäten Ingolstadt'],
      cinema: ['Kino Ingolstadt', 'Filme Ingolstadt', 'Kinoprogramm Ingolstadt'],
      altmuehltal: ['Altmühltal', 'Naturpark Altmühltal', 'Wandern Altmühltal', 'Radfahren Altmühltal'],
      insider_tips: ['Geheimtipps Ingolstadt', 'Insider Ingolstadt', 'versteckte Orte Ingolstadt']
    };

    return [...baseKeywords, ...(categoryKeywords[cat] || [])];
  };

  const getTitle = (): string => {
    const titles: Record<string, string> = {
      highlights: `${categoryName} Events Ingolstadt ${currentDate} | Premium Hotel Heidehof Gaimersheim`,
      gastronomy: `Premium Restaurants Ingolstadt heute | Hotel Heidehof Gaimersheim empfiehlt`,
      culture: `Kultur & Museen Ingolstadt heute | Hotel Heidehof Gaimersheim bei Ingolstadt`,
      nightlife: `Gehobenes Nachtleben Ingolstadt heute | Hotel Heidehof Gaimersheim Concierge`,
      wellness: `Wellness & Spa Ingolstadt heute | Hotel Heidehof Gaimersheim Empfehlungen`,
      audi: `Audi Erlebnisse Ingolstadt heute | Hotel Heidehof Gaimersheim bei Ingolstadt`,
      sports: `Sport-Events Ingolstadt heute | Hotel Heidehof Gaimersheim Live Guide`,
      shopping: `Exklusives Shopping Ingolstadt heute | Hotel Heidehof Gaimersheim`,
      kids: `Familien-Events Ingolstadt heute | Hotel Heidehof Gaimersheim Kinder-Guide`,
      cinema: `Premium Kino Ingolstadt heute | Hotel Heidehof Gaimersheim Film-Guide`,
      altmuehltal: `Naturpark Altmühltal heute | Hotel Heidehof Gaimersheim Natur-Guide`,
      insider_tips: `Geheimtipps Ingolstadt heute | Hotel Heidehof Gaimersheim Insider`
    };
    
    return titles[category] || `${categoryName} Ingolstadt heute | Premium Hotel Heidehof Gaimersheim`;
  };

  const getDescription = (): string => {
    const descriptions: Record<string, string> = {
      highlights: `Premium Hotel Heidehof Gaimersheim bei Ingolstadt: ${eventCount} Top-Highlights heute (${currentDate}). Als führendes Hotel in der Ingolstadt Region kuratieren wir die besten Events für unsere Gäste. VIP-Zugang und Insider-Tipps inklusive.`,
      gastronomy: `${eventCount} Premium-Restaurants Ingolstadt heute (${currentDate}) - empfohlen von Hotel Heidehof Gaimersheim. Als Luxushotel bei Ingolstadt kennen wir die beste Gastronomie der Region. Reservierungen über unseren Concierge.`,
      culture: `${eventCount} Kultur-Highlights Ingolstadt heute (${currentDate}) - kuratiert von Hotel Heidehof Gaimersheim bei Ingolstadt. Museen, Galerien und Kunstevents in der Region mit exklusivem Hotel-Concierge Service.`,
      nightlife: `${eventCount} gehobenes Nachtleben Ingolstadt heute (${currentDate}) - empfohlen von Hotel Heidehof Gaimersheim. Premium-Bars und exklusive Events in der Ingolstadt Region mit VIP-Zugang.`,
      wellness: `${eventCount} Wellness-Angebote Ingolstadt heute (${currentDate}) - Hotel Heidehof Gaimersheim bei Ingolstadt empfiehlt. Spa und Entspannung in der Region, ergänzend zu unserem hauseigenen Wellness-Bereich.`,
      audi: `${eventCount} Audi-Erlebnisse Ingolstadt heute (${currentDate}) - VIP-Empfehlungen von Hotel Heidehof Gaimersheim. Als Premium Hotel bei Ingolstadt bieten wir exklusiven Zugang zu Audi Werksführungen und Events.`,
      sports: `${eventCount} Sport-Events Ingolstadt heute (${currentDate}) - Hotel Heidehof Gaimersheim bei Ingolstadt informiert. FC Ingolstadt, ERC Eishockey und mehr mit VIP-Tickets über unseren Concierge.`,
      shopping: `${eventCount} Shopping-Highlights Ingolstadt heute (${currentDate}) - kuratiert von Hotel Heidehof Gaimersheim. Premium-Boutiquen und Designer-Outlets in der Ingolstadt Region.`,
      kids: `${eventCount} Familien-Events Ingolstadt heute (${currentDate}) - empfohlen von Hotel Heidehof Gaimersheim bei Ingolstadt. Sichere und bildende Aktivitäten für Familien in der Region.`,
      cinema: `${eventCount} Kino-Highlights Ingolstadt heute (${currentDate}) - Hotel Heidehof Gaimersheim bei Ingolstadt empfiehlt. Premium-Kinos und VIP-Vorstellungen in der Region.`,
      altmuehltal: `${eventCount} Naturpark Altmühltal Aktivitäten heute (${currentDate}) - Hotel Heidehof Gaimersheim bei Ingolstadt. Wandern und Naturerlebnisse ideal für aktive Hotelgäste.`,
      insider_tips: `${eventCount} Geheimtipps Ingolstadt heute (${currentDate}) - exklusiv von Hotel Heidehof Gaimersheim. Versteckte Perlen der Region, nur unseren Stammgästen bekannt.`
    };
    
    return descriptions[category] || `${eventCount} ${categoryName} Events Ingolstadt heute (${currentDate}) - empfohlen von Premium Hotel Heidehof Gaimersheim bei Ingolstadt.`;
  };

  // Generate enhanced structured data combining hotel and local business schemas
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      // Live Ticker as a Service
      {
        "@type": "Service",
        "name": `Ingolstadt Live Ticker - ${categoryName}`,
        "description": getDescription(),
        "provider": {
          "@type": "Hotel",
          "name": "Hotel Der Heidehof",
          "url": "https://heidehof-app.lovable.app",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Manchinger Str. 49",
            "addressLocality": "Ingolstadt",
            "postalCode": "85053",
            "addressCountry": "DE"
          }
        },
        "areaServed": {
          "@type": "Place",
          "name": "Ingolstadt und Umgebung",
          "geo": {
            "@type": "GeoCircle",
            "geoMidpoint": {
              "@type": "GeoCoordinates",
              "latitude": 48.7844,
              "longitude": 11.4883
            },
            "geoRadius": "50000"
          }
        },
        "serviceType": "Concierge Service",
        "dateModified": new Date().toISOString(),
        "isAccessibleForFree": true
      },
      // Enhanced Hotel Schema
      generateEnhancedHotelSchema(),
      // Local Business for Ingolstadt area
      generateLocalBusinessSchema({
        city: "Ingolstadt",
        region: "Bayern",
        keyword: category
      }),
      // Event list schema
      {
        "@type": "ItemList",
        "name": `${categoryName} Events in Ingolstadt heute`,
        "description": `Live-Liste mit ${eventCount} ${categoryName} Events in Ingolstadt`,
        "numberOfItems": eventCount,
        "itemListOrder": "https://schema.org/ItemListOrderDescending"
      }
    ]
  };

  // Add geo-specific meta tags
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      // Geo meta tags for local SEO
      const setMetaTag = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = name;
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      setMetaTag('geo.region', 'DE-BY');
      setMetaTag('geo.placename', 'Ingolstadt');
      setMetaTag('geo.position', '48.7844;11.4883');
      setMetaTag('ICBM', '48.7844, 11.4883');
      setMetaTag('DC.title', getTitle());
      setMetaTag('DC.subject', `${categoryName} Ingolstadt Events`);
      setMetaTag('DC.description', getDescription());
      setMetaTag('DC.coverage', 'Ingolstadt, Bayern, Deutschland');
      
      // Open Graph location
      const setMetaProperty = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      setMetaProperty('og:locality', 'Ingolstadt');
      setMetaProperty('og:region', 'Bayern');
      setMetaProperty('og:country-name', 'Deutschland');
      setMetaProperty('og:latitude', '48.7844');
      setMetaProperty('og:longitude', '11.4883');
    }
  }, [category, categoryName, eventCount]);

  return (
    <SEOHead
      title={getTitle()}
      description={getDescription()}
      keywords={getCategoryKeywords(category)}
      url={`/ingolstadt-live?category=${category}`}
      canonicalUrl={`/ingolstadt-live?category=${category}`}
      type="website"
      author="Hotel Der Heidehof Concierge"
      structuredData={structuredData}
      image="https://images.unsplash.com/photo-1594969138407-ab7104e3395b?w=1200&h=630&fit=crop&auto=format"
    />
  );
};

export default LiveTickerSEO;