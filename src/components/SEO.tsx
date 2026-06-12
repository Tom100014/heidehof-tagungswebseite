import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

const SEO = ({ 
  title = "Hotel Der Heidehof - Luxus & Wellness in Ingolstadt",
  description = "Erleben Sie erstklassigen Service, exklusive Wellness-Angebote und kulinarische Highlights im Hotel Der Heidehof. Ihr Premium-Hotel in Ingolstadt.",
  keywords = ['Hotel Ingolstadt', 'Wellness', 'Spa', 'Restaurant', 'Tagung', 'Luxushotel'],
  image = "https://obwhklmahawqmwyfzkke.supabase.co/storage/v1/object/public/hotel-images/hero-image.jpg",
  url = "https://hotel-der-heidehof.de",
  type = 'website'
}: SEOProps) => {
  const fullTitle = title.includes('Hotel Der Heidehof') ? title : `${title} | Hotel Der Heidehof`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:site_name" content="Hotel Der Heidehof" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Hotel Der Heidehof" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          "name": "Hotel Der Heidehof",
          "description": description,
          "image": image,
          "url": url,
          "telephone": "+49-841-xxx",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Heidehofstraße",
            "addressLocality": "Ingolstadt",
            "postalCode": "85055",
            "addressCountry": "DE"
          },
          "priceRange": "€€€",
          "amenityFeature": [
            { "@type": "LocationFeatureSpecification", "name": "Spa" },
            { "@type": "LocationFeatureSpecification", "name": "Restaurant" },
            { "@type": "LocationFeatureSpecification", "name": "Bar" },
            { "@type": "LocationFeatureSpecification", "name": "Fitness Center" }
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
