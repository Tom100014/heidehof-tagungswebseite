
import React, { useEffect } from 'react';
import { useDeviceType } from '@/hooks/use-device-type';
import { useMobileOptimizations } from '@/hooks/use-mobile-optimizations';
import { isBrowser, runIfBrowser } from '@/utils/safeImport';

/**
 * This component provides global optimizations for different device types.
 * It adjusts viewport settings and improves touch interactions based on device.
 */
export const ResponsiveOptimizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the more detailed device type detection
  const { isMobile, isTablet, isTouchDevice } = useDeviceType();
  
  // Always call hooks at the top level, regardless of conditions
  useMobileOptimizations();
  
  // Force dark theme application immediately
  useEffect(() => {
    if (isBrowser) {
      // Force dark theme - first priority
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.backgroundColor = '#171717';
      document.documentElement.style.color = '#f9f9f9';
      document.body.style.backgroundColor = '#171717';
      document.body.style.color = '#f9f9f9';
      document.body.classList.add('dark');
      
      // Apply dark mode to welcome page specifically
      const welcomePage = document.querySelector('.welcome-page');
      if (welcomePage instanceof HTMLElement) {
        welcomePage.style.backgroundColor = '#171717';
        welcomePage.classList.add('dark');
      }
      
      // Force dark background on all sections and main elements
      document.querySelectorAll('section, main, .bg-background').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.backgroundColor = '#171717';
        }
      });
    }
  }, []);
  
  // Simplified device-specific optimizations (viewport is now in index.html)
  useEffect(() => {
    if (!isBrowser) return;

    try {
      runIfBrowser(() => {
        // Only set device-specific classes (no viewport manipulation!)
        document.body.classList.remove('mobile', 'tablet', 'desktop');
        
        if (isMobile) {
          document.body.classList.add('mobile');
          document.body.classList.add('has-bottom-nav');
        } else if (isTablet) {
          document.body.classList.add('tablet');
          document.body.classList.add('has-tablet-nav');
        } else {
          document.body.classList.add('desktop');
        }
        
        // Ensure dark theme is applied
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        
        // Enhanced scrolling behavior
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // iOS-specific class detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (isIOS) {
          document.body.classList.add('ios');
        }
        
        // Set CSS variable for dynamic viewport height (iOS Safari fix)
        const setVh = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVh();
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);
        
        return () => {
          window.removeEventListener('resize', setVh);
          window.removeEventListener('orientationchange', setVh);
        };
      });
    } catch (error) {
      console.error("Error applying device optimizations:", error);
    }
    
    return () => {
      runIfBrowser(() => {
        document.body.classList.remove('mobile', 'tablet', 'desktop', 'ios');
        document.body.classList.remove('has-bottom-nav', 'has-tablet-nav');
        document.documentElement.style.overscrollBehavior = '';
        document.documentElement.style.scrollBehavior = '';
      });
    };
  }, [isMobile, isTablet, isTouchDevice]);

  return <>{children}</>;
};

export default ResponsiveOptimizer;
