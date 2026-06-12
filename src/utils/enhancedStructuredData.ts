// Enhanced Schema.org markup with full geo-location data
export const generateEnhancedHotelSchema = () => {
  const baseUrl = 'https://heidehof-app.lovable.app';
  
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": "Hotel Heidehof",
    "description": "Luxuriöses Hotel & Spa Resort in Ingolstadt mit erstklassigem Service",
    "url": baseUrl,
    "logo": `${baseUrl}/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png`,
    "image": [
      `${baseUrl}/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png`
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Münchener Straße 8",
      "addressLocality": "Ingolstadt",
      "addressRegion": "Bayern",
      "postalCode": "85051",
      "addressCountry": "DE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 48.7665,
      "longitude": 11.4257
    },
    "telephone": "+49 841 4810",
    "email": "info@heidehof.com",
    "priceRange": "€€€",
    "starRating": {
      "@type": "Rating", 
      "ratingValue": "4.5",
      "bestRating": "5"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "127",
      "bestRating": "5"
    },
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "Conference Facilities",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification", 
        "name": "Spa",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Restaurant", 
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Conference Rooms",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Free WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Parking",
        "value": true
      }
    ],
    "openingHours": [
      "Mo-Su 00:00-24:00"
    ],
    "hasMap": "https://maps.google.com/maps?q=Hotel+Heidehof+Gaimersheim+Ingolstadt",
    "areaServed": [
      "Ingolstadt",
      "Gaimersheim", 
      "Bayern",
      "Oberbayern",
      "Eichstätt"
    ],
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 48.7665,
        "longitude": 11.4257
      },
      "geoRadius": "50000"
    }
  };
};

export const generateLocalBusinessSchema = (locationData?: {
  city?: string;
  region?: string;
  keyword?: string;
}) => {
  const city = locationData?.city || "Ingolstadt";
  const region = locationData?.region || "Bayern";
  const keyword = locationData?.keyword || "Hotel";
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Hotel Heidehof - ${keyword} in ${city}`,
    "description": `Erstklassiges ${keyword} in ${city}, ${region}. Hotel & Spa Resort mit luxuriösen Zimmern und Premium-Service.`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Münchener Straße 8",
      "addressLocality": city,
      "addressRegion": region,
      "postalCode": "85051",
      "addressCountry": "DE"
    },
    "geo": {
      "@type": "GeoCoordinates", 
      "latitude": 48.7665,
      "longitude": 11.4257
    },
    "containsPlace": [
      {
        "@type": "Restaurant",
        "name": "Heidehof Restaurant"
      },
      {
        "@type": "SportsActivityLocation",
        "name": "Heidehof Conference Center"
      },
      {
        "@type": "HealthAndBeautyBusiness",
        "name": "Heidehof Spa"
      }
    ]
  };
};

export const generateFAQSchema = (location?: string) => {
  const city = location || "Ingolstadt";
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Wo liegt das Hotel Heidehof in ${city}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Das Hotel Heidehof befindet sich in der Münchener Straße 8, 85051 ${city}, Bayern. Wir sind zentral gelegen und gut erreichbar.`
        }
      },
      {
        "@type": "Question",
        "name": "Welche Annehmlichkeiten bietet das Hotel?",
        "acceptedAnswer": {
          "@type": "Answer", 
          "text": "Unser Hotel verfügt über einen Spa-Bereich, Restaurant, Konferenzräume, Wellness-Einrichtungen, kostenloses WLAN und Parkplätze."
        }
      },
      {
        "@type": "Question",
        "name": `Wie weit ist das Hotel vom Zentrum ${city} entfernt?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Das Hotel Heidehof liegt nur wenige Minuten vom Zentrum ${city} entfernt und ist ideal für Business- und Freizeitreisende.`
        }
      }
    ]
  };
};