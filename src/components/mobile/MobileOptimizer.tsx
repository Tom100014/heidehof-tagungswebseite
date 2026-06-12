
import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileOptimizations } from '@/hooks/use-mobile-optimizations';
import { isBrowser, runIfBrowser } from '@/utils/safeImport';

/**
 * This component provides global mobile optimizations.
 * It adjusts viewport settings and improves touch interactions.
 */
export const MobileOptimizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Call hooks only if we're in a browser environment
  const isMobile = useIsMobile();
  
  // Safe browser-side effects
  useEffect(() => {
    // Skip effect in server-side rendering
    if (!isBrowser) return;

    if (isMobile) {
      try {
        // Optimal viewport settings for mobile devices
        runIfBrowser(() => {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 
              'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
            );
          }
          
          // Add a class to the body for mobile-specific styles
          document.body.classList.add('mobile');
          document.body.classList.add('has-bottom-nav');
          
          // Prevent bounce effect on iOS
          document.documentElement.style.overscrollBehavior = 'none';
          
          // Enable smooth scrolling on mobile
          document.documentElement.style.scrollBehavior = 'smooth';
          
          // Larger touch targets for interactive elements
          document.querySelectorAll('button, [role="button"], a, .interactive').forEach(el => {
            el.classList.add('mobile-touch-target');
          });
          
          // Increased letter spacing for better readability
          document.body.style.letterSpacing = '0.01em';
          document.body.style.wordSpacing = '0.02em';
          
          // Optimize form inputs
          document.querySelectorAll('input, textarea, select').forEach(el => {
            el.classList.add('mobile-input');
            
            // iOS specific - prevent zoom on focus
            if (el instanceof HTMLElement) {
              el.style.fontSize = '16px';
            }
          });
          
          // Add safe area insets support
          document.body.classList.add('safe-area-inset-bottom');
          document.body.classList.add('safe-area-inset-top');
          
          // Check if iOS and add specific optimizations
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          
          if (isIOS) {
            document.body.classList.add('ios');
            
            // Add iOS-specific device classes
            const screenHeight = window.screen.height;
            if (screenHeight >= 932) {
              document.body.classList.add('ios-dynamic-island');
            } else if (screenHeight >= 812) {
              document.body.classList.add('ios-notch');
            }
            
            // Add safe area support
            document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
            document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
            document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
            
            // Fix for iOS notches and home indicator
            const header = document.querySelector('header');
            if (header && header instanceof HTMLElement) {
              header.style.paddingTop = 'max(env(safe-area-inset-top), 20px)';
            }
            
            // Apply smooth scrolling fix for iOS
            document.querySelectorAll('.scroll-container').forEach(el => {
              if (el instanceof HTMLElement) {
                // Use type assertion to handle non-standard webkit property
                (el.style as any).webkitOverflowScrolling = 'touch';
              }
            });
          }
          
          // Set proper height for mobile viewports (iOS 100vh fix)
          const setMobileHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
          };
          
          setMobileHeight();
          window.addEventListener('resize', setMobileHeight);
          window.addEventListener('orientationchange', setMobileHeight);
        });
      } catch (error) {
        console.error("Error applying mobile optimizations:", error);
      }
      
      return () => {
        runIfBrowser(() => {
          document.body.classList.remove('mobile');
          document.body.classList.remove('has-bottom-nav');
          document.body.classList.remove('ios');
          document.body.classList.remove('safe-area-inset-bottom');
          document.body.classList.remove('safe-area-inset-top');
          document.documentElement.style.overscrollBehavior = '';
          document.documentElement.style.scrollBehavior = '';
          document.body.style.letterSpacing = '';
          document.body.style.wordSpacing = '';
          
          // Clean up event listeners
          window.removeEventListener('resize', () => {});
          window.removeEventListener('orientationchange', () => {});
        });
      };
    }
  }, [isMobile]);

  // Apply mobile optimizations - safely
  if (isBrowser) {
    useMobileOptimizations();
  }

  return <>{children}</>;
};

export default MobileOptimizer;
