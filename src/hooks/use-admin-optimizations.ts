
import React, { useEffect } from 'react';
import { useIsMobile } from './use-mobile.tsx';

export const useAdminOptimizations = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // Optimiere Touch-Verhalten
      document.documentElement.style.touchAction = 'manipulation';
      
      // Verhindere Overscroll
      document.body.style.overscrollBehavior = 'none';
      
      // Optimiere Viewport
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        );
      }
      
      // Füge Klasse für mobile Optimierungen hinzu
      document.documentElement.classList.add('admin-mobile');
    }

    return () => {
      document.documentElement.style.touchAction = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.classList.remove('admin-mobile');
    };
  }, [isMobile]);
};
