import * as React from 'react';

interface GeoTagsProps {
  placename: string;
  region: string; // e.g., DE-BY
  latitude: number;
  longitude: number;
}

const GeoTags: React.FC<GeoTagsProps> = ({ placename, region, latitude, longitude }) => {
  React.useEffect(() => {
    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const setProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Geo meta tags - Dual positioning for SEO
    setMeta('geo.region', region);
    setMeta('geo.placename', placename);
    setMeta('geo.position', `${latitude};${longitude}`);
    setMeta('ICBM', `${latitude}, ${longitude}`);
    
    // Additional geo targeting for Ingolstadt region
    setMeta('geo.business-region', 'Ingolstadt,Gaimersheim,Bayern');
    setMeta('geo.market-area', 'Ingolstadt');

    // Locale / OpenGraph place tags
    setProperty('og:locale', 'de_DE');
    setProperty('place:location:latitude', String(latitude));
    setProperty('place:location:longitude', String(longitude));
    setProperty('place:business:contact_data:region', 'Ingolstadt');
  }, [placename, region, latitude, longitude]);

  return null;
};

export default GeoTags;
