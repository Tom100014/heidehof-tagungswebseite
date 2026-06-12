export const hotelStructuredData = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  "name": "Hotel Der Heidehof",
  "description": "Luxushotel mit erstklassigem Wellness-Bereich, exzellenter Gastronomie und modernen Tagungsräumen im Herzen von Ingolstadt.",
  "url": "https://hotel-der-heidehof.de",
  "telephone": "+49-841-xxx",
  "email": "info@hotel-der-heidehof.de",
  "image": "https://obwhklmahawqmwyfzkke.supabase.co/storage/v1/object/public/hotel-images/hero-image.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Heidehofstraße",
    "addressLocality": "Ingolstadt",
    "addressRegion": "Bayern",
    "postalCode": "85055",
    "addressCountry": "DE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "48.7665",
    "longitude": "11.4257"
  },
  "priceRange": "€€€",
  "starRating": {
    "@type": "Rating",
    "ratingValue": "4"
  },
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Spa & Wellness", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Restaurant", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Bar", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Fitness Center", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Konferenzräume", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Kostenloses WLAN", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Parkplatz", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "24h Rezeption", "value": true }
  ],
  "checkinTime": "15:00",
  "checkoutTime": "11:00",
  "petsAllowed": false
};

export const restaurantStructuredData = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Restaurant Maxwell - Hotel Der Heidehof",
  "description": "Exzellente Küche mit regionalen und internationalen Spezialitäten in elegantem Ambiente.",
  "url": "https://hotel-der-heidehof.de/restaurant-menu",
  "telephone": "+49-841-xxx",
  "image": "https://obwhklmahawqmwyfzkke.supabase.co/storage/v1/object/public/hotel-images/restaurant.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Heidehofstraße",
    "addressLocality": "Ingolstadt",
    "postalCode": "85055",
    "addressCountry": "DE"
  },
  "servesCuisine": ["Deutsche Küche", "Internationale Küche", "Mediterrane Küche"],
  "priceRange": "€€€",
  "acceptsReservations": true,
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "18:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "12:00",
      "closes": "22:00"
    }
  ]
};

export const spaStructuredData = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "name": "Spa & Wellness - Hotel Der Heidehof",
  "description": "Luxuriöser Wellness-Bereich mit Sauna, Pool, Massagen und exklusiven Beauty-Behandlungen.",
  "url": "https://hotel-der-heidehof.de/service/beauty-wellness",
  "telephone": "+49-841-xxx",
  "image": "https://obwhklmahawqmwyfzkke.supabase.co/storage/v1/object/public/hotel-images/spa.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Heidehofstraße",
    "addressLocality": "Ingolstadt",
    "postalCode": "85055",
    "addressCountry": "DE"
  },
  "priceRange": "€€€",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Spa-Behandlungen",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Massage",
          "description": "Entspannende Massagen verschiedener Art"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Gesichtsbehandlung",
          "description": "Professionelle Gesichtspflege und Anti-Aging"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Sauna & Pool",
          "description": "Wellness-Bereich mit Sauna und beheiztem Pool"
        }
      }
    ]
  }
};

export const breadcrumbStructuredData = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `https://hotel-der-heidehof.de${item.url}`
  }))
});

export const generateBreadcrumbStructuredData = breadcrumbStructuredData;

export const blogPostStructuredData = (post: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  image?: string;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.description,
  "image": post.image,
  "datePublished": post.publishedAt,
  "author": {
    "@type": "Person",
    "name": post.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Hotel Der Heidehof",
    "logo": {
      "@type": "ImageObject",
      "url": "https://hotel-der-heidehof.de/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": post.url
  }
});

export const generateBlogPostStructuredData = blogPostStructuredData;

export const generateOrganizationStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Hotel Der Heidehof",
  "url": "https://hotel-der-heidehof.de",
  "logo": "https://hotel-der-heidehof.de/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+49-841-xxx",
    "contactType": "customer service",
    "areaServed": "DE",
    "availableLanguage": ["de", "en"]
  },
  "sameAs": [
    "https://facebook.com/hotel-der-heidehof",
    "https://instagram.com/hotel-der-heidehof"
  ]
});
