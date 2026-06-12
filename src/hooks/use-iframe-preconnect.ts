import { useEffect } from 'react';

interface PreconnectOptions {
  domains: string[];
  preload?: boolean;
}

export const useIframePreconnect = ({ domains, preload = false }: PreconnectOptions) => {
  useEffect(() => {
    domains.forEach(domain => {
      // Create preconnect link
      const link = document.createElement('link');
      link.rel = preload ? 'preload' : 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      
      // Add to head if not already present
      const existing = document.querySelector(`link[href="${domain}"]`);
      if (!existing) {
        document.head.appendChild(link);
      }
    });

    // Cleanup function
    return () => {
      domains.forEach(domain => {
        const link = document.querySelector(`link[href="${domain}"]`);
        if (link) {
          document.head.removeChild(link);
        }
      });
    };
  }, [domains, preload]);
};

// Predefined domain sets for common iframe sources
export const IFRAME_DOMAINS = {
  booking: ['https://onepagebooking.com', 'https://voucherbooking.de'],
  ai: ['https://elven-whispers-agent.lovable.app'],
  hotel: ['https://www.der-heidehof.de'],
  external: ['https://ingolstadt-live-now.lovable.app']
} as const;