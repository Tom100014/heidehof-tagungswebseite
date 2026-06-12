import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useSiteSeo } from "@/hooks/useSiteSeo";

export const SITE_URL = "https://hotel-der-heidehof.de";
export const SITE_NAME = "Hotel Der Heidehof";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/heidehof/orig/hero-conference.jpg`;

interface PageSeoProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  /** Optional JSON-LD object(s) — Hotel, MeetingRoom, Offer, FAQPage, BreadcrumbList … */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const GEO = {
  region: "DE-BY",
  placename: "Ingolstadt",
  position: "48.7665;11.4257",
  icbm: "48.7665, 11.4257",
};

export const PageSeo = ({
  title,
  description,
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
}: PageSeoProps) => {
  const { pathname } = useLocation();
  const override = useSiteSeo(pathname);

  const effTitle = override?.title || title;
  const effDescription = override?.description || description;
  const effImage = override?.og_image_url || image;
  const effKeywords = override?.keywords ? override.keywords.split(",").map(k => k.trim()).filter(Boolean) : keywords;
  const effNoindex = override?.noindex ?? noindex;
  const url = override?.canonical || `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const fullTitle = effTitle.includes("Heidehof") ? effTitle : `${effTitle} | ${SITE_NAME}`;
  const ldArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={effDescription} />
      {effKeywords.length > 0 && <meta name="keywords" content={effKeywords.join(", ")} />}
      <link rel="canonical" href={url} />
      <meta name="robots" content={effNoindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"} />
      <meta name="author" content={SITE_NAME} />
      <meta httpEquiv="content-language" content="de-DE" />

      {/* Geo */}
      <meta name="geo.region" content={GEO.region} />
      <meta name="geo.placename" content={GEO.placename} />
      <meta name="geo.position" content={GEO.position} />
      <meta name="ICBM" content={GEO.icbm} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="de-DE" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={effDescription} />
      <meta property="og:image" content={effImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={effDescription} />
      <meta name="twitter:image" content={effImage} />

      {/* JSON-LD */}
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default PageSeo;
