import { useEffect } from 'react';

/**
 * Hook that tracks visible sections on the page and sends context to parent window (iframe)
 * Used to provide scroll context to the Clara Widget
 */
export const useScrollContextTracker = () => {
  useEffect(() => {
    // Only run if we're in an iframe
    if (window.parent === window) {
      return;
    }

    const sections = document.querySelectorAll('section[id]');
    
    if (sections.length === 0) {
      console.log('📍 ScrollContextTracker: No sections with IDs found');
      return;
    }

    console.log(`📍 ScrollContextTracker: Observing ${sections.length} sections`);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          
          console.log(`📍 ScrollContextTracker: Section "${sectionId}" is now visible`);
          
          // Send message to parent window (Clara Widget)
          window.parent.postMessage({
            type: 'SCROLL_CONTEXT',
            sectionId: sectionId,
            timestamp: Date.now()
          }, '*'); // In production, replace '*' with specific origin
        }
      });
    }, {
      root: null, // Observe viewport
      threshold: 0.5 // Trigger when 50% of section is visible
    });

    sections.forEach(section => {
      observer.observe(section);
    });

    // Cleanup
    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);
};
