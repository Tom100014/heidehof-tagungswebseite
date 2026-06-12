// Enhanced Structured Data for Hotel Heidehof SEO Optimization

export const generateHotelStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": "Hotel Heidehof",
    "description": "Luxus Wellness Hotel und Spa Resort in Ingolstadt mit Le Petit Chef Erlebnis, erstklassigem Spa-Bereich und exzellenter Gastronomie",
    "url": "https://heidehof-app.lovable.app",
    "logo": "https://heidehof-app.lovable.app/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png",
    "image": [
      "https://heidehof-app.lovable.app/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auf der Schanz 2a",
      "addressLocality": "Ingolstadt",
      "postalCode": "85049",
      "addressRegion": "Bayern",
      "addressCountry": "DE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "48.7758",
      "longitude": "11.4226"
    },
    "telephone": "+49 841 49550",
    "email": "info@der-heidehof.de",
    "priceRange": "€€€€",
    "starRating": {
      "@type": "Rating",
      "ratingValue": "4.5",
      "bestRating": "5"
    },
    "amenityFeature": [
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
        "name": "Fitness Center",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Conference Room",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Bar",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Room Service",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Parking",
        "value": true
      }
    ],
    "checkinTime": "15:00",
    "checkoutTime": "11:00",
    "openingHours": "Mo-Su 00:00-24:00",
    "hasRestaurant": {
      "@type": "Restaurant",
      "name": "Restaurant Maxwell",
      "description": "Exquisite Gastronomie mit Le Petit Chef Erlebnis",
      "servesCuisine": ["International", "German", "European"],
      "priceRange": "€€€"
    },
    "hasMap": "https://maps.google.com/?q=Hotel+Heidehof+Ingolstadt",
    "sameAs": [
      "https://www.der-heidehof.de",
      "https://www.facebook.com/hotelheidehof",
      "https://www.instagram.com/hotelheidehof"
    ]
  };
};

export const generateRestaurantStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Restaurant Maxwell - Hotel Heidehof",
    "description": "Exquisite Gastronomie mit dem weltweit kleinsten Koch Le Petit Chef - einzigartiges kulinarisches Erlebnis in Ingolstadt",
    "url": "https://heidehof-app.lovable.app/service/restaurant-maxwell",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auf der Schanz 2a",
      "addressLocality": "Ingolstadt", 
      "postalCode": "85049",
      "addressRegion": "Bayern",
      "addressCountry": "DE"
    },
    "telephone": "+49 841 49550",
    "email": "restaurant@der-heidehof.de",
    "servesCuisine": ["International", "German", "European", "Fine Dining"],
    "priceRange": "€€€",
    "openingHours": [
      "Mo-Su 18:00-22:00"
    ],
    "hasMenu": "https://heidehof-app.lovable.app/restaurant-menu",
    "acceptsReservations": true,
    "speciality": "Le Petit Chef - Der kleinste Koch der Welt",
    "parentOrganization": {
      "@type": "Hotel",
      "name": "Hotel Heidehof"
    }
  };
};

export const generateEventsStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    "name": "Hotel Heidehof - Events & Veranstaltungen",
    "description": "Exklusive Event-Location für Tagungen, Hochzeiten, Firmenfeiern und besondere Anlässe in Ingolstadt",
    "url": "https://www.der-heidehof.de/de/kulinarik-locations/kulinarik/events.html",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auf der Schanz 2a",
      "addressLocality": "Ingolstadt",
      "postalCode": "85049", 
      "addressRegion": "Bayern",
      "addressCountry": "DE"
    },
    "telephone": "+49 841 49550",
    "email": "events@der-heidehof.de",
    "maximumAttendeeCapacity": 200,
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "Conference Facilities",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Wedding Venue",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Catering Service",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Audio Visual Equipment",
        "value": true
      }
    ],
    "parentOrganization": {
      "@type": "Hotel",
      "name": "Hotel Heidehof"
    }
  };
};

export const generateWellnessStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "name": "Wellness & Spa - Hotel Heidehof",
    "description": "Erstklassiger Wellness- und Spa-Bereich mit Sauna, Massage-Angeboten und Beauty-Behandlungen in Ingolstadt",
    "url": "https://heidehof-app.lovable.app/service/wellness",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auf der Schanz 2a",
      "addressLocality": "Ingolstadt",
      "postalCode": "85049",
      "addressRegion": "Bayern", 
      "addressCountry": "DE"
    },
    "telephone": "+49 841 49550",
    "email": "wellness@der-heidehof.de",
    "priceRange": "€€€",
    "openingHours": [
      "Mo-Su 06:00-22:00"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Wellness & Spa Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Massage Therapies"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Sauna & Steam Bath"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Beauty Treatments"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Fitness Center"
          }
        }
      ]
    },
    "parentOrganization": {
      "@type": "Hotel",
      "name": "Hotel Heidehof"
    }
  };
};

export const generateFAQStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Wo befindet sich das Hotel Heidehof?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Das Hotel Heidehof befindet sich in Ingolstadt, Bayern, in der Auf der Schanz 2a, 85049 Ingolstadt. Wir sind zentral gelegen und gut erreichbar."
        }
      },
      {
        "@type": "Question",
        "name": "Was ist Le Petit Chef?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Le Petit Chef ist der kleinste Koch der Welt und bietet ein einzigartiges kulinarisches Erlebnis mit 3D-Mapping-Technologie direkt auf Ihrem Teller im Restaurant Maxwell."
        }
      },
      {
        "@type": "Question",
        "name": "Welche Wellness-Angebote gibt es im Hotel Heidehof?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Unser Wellness-Bereich bietet Sauna, Dampfbad, Massage-Therapien, Beauty-Behandlungen, Fitness-Center und einen entspannenden Ruhebereich."
        }
      },
      {
        "@type": "Question",
        "name": "Ist das Hotel für Tagungen geeignet?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja, wir sind ein erstklassiges Tagungshotel mit modernen Konferenzräumen, technischer Ausstattung und professionellem Catering für Events bis zu 200 Personen."
        }
      },
      {
        "@type": "Question",
        "name": "Welche Zimmerausstattung bietet das Hotel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Alle Zimmer sind luxuriös ausgestattet mit modernen Annehmlichkeiten, kostenlosem WLAN, Klimaanlage, Minibar und exklusiven Badezimmern."
        }
      }
    ]
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{name: string, url: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": `https://heidehof-app.lovable.app${breadcrumb.url}`
    }))
  };
};

export const generateLocalBusinessStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Hotel Heidehof",
    "description": "Luxus Wellness Hotel und Tagungshotel in Ingolstadt mit erstklassigem Service und exzellenter Gastronomie",
    "url": "https://heidehof-app.lovable.app",
    "telephone": "+49 841 49550",
    "email": "info@der-heidehof.de",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auf der Schanz 2a",
      "addressLocality": "Ingolstadt",
      "postalCode": "85049",
      "addressRegion": "Bayern",
      "addressCountry": "DE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "48.7758",
      "longitude": "11.4226"
    },
    "openingHours": "Mo-Su 00:00-24:00",
    "priceRange": "€€€€",
    "image": "https://heidehof-app.lovable.app/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png",
    "logo": "https://heidehof-app.lovable.app/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png",
    "hasMap": "https://maps.google.com/?q=Hotel+Heidehof+Ingolstadt",
    "areaServed": {
      "@type": "City", 
      "name": "Ingolstadt"
    },
    "knowsAbout": [
      "Wellness", "Spa", "Hotel", "Restaurant", "Tagungen", "Events", "Le Petit Chef"
    ],
    "sameAs": [
      "https://www.der-heidehof.de"
    ]
  };
};