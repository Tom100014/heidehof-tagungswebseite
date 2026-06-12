import React, { useEffect, useState } from 'react';
import { usePWAEnhanced } from '@/hooks/use-pwa-enhanced';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { PWAUnifiedPopup } from './PWAUnifiedPopup';
import { pwaSecurity } from '@/utils/pwa-security';
import { PWAContext } from './PWAContext';

interface PWAProviderProps {
  children: React.ReactNode;
  showUI?: boolean;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ 
  children, 
  showUI = true 
}) => {
  const pwaState = usePWAEnhanced();
  const [initialized, setInitialized] = useState(false);
  
  // Aktiviere Push Notifications System
  usePushNotifications();

  useEffect(() => {
    // Initialize PWA features
    const initializePWA = async () => {
      try {
        // Initialize security features
        pwaSecurity.initializeSecurityHeaders();
        
        // Performance monitoring
        setTimeout(() => {
          pwaSecurity.measurePerformance();
        }, 2000);

        // Service Worker handling — guard against Lovable preview/iframe contexts
        // (SW would cache stale builds and break preview navigation).
        const isInIframe = (() => {
          try { return window.self !== window.top; } catch { return true; }
        })();
        const hostname = window.location.hostname;
        const isPreviewHost =
          hostname.includes('id-preview--') ||
          hostname.includes('lovableproject.com') ||
          hostname.includes('lovable.app');

        if ('serviceWorker' in navigator) {
          if (isPreviewHost || isInIframe) {
            // In preview/iframe: actively unregister any SW + clear caches so the
            // preview always shows the latest build.
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
            }
          } else {
            // Production: clean up old SWs/caches, then register current one.
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              const sw = registration.active;
              if (sw && !sw.scriptURL.includes('sw.js')) {
                await registration.unregister();
              }
            }

            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              if (cacheName.startsWith('heidehof-') && !cacheName.includes('v3.0.0')) {
                await caches.delete(cacheName);
              }
            }

            const registration = await navigator.serviceWorker.register('/sw.js', {
              updateViaCache: 'none',
              scope: '/'
            });

            if (import.meta.env.DEV) {
              console.log('✅ Service Worker registered:', registration.scope);
            }

            // Listen for service worker messages
            navigator.serviceWorker.addEventListener('message', (event) => {
              switch (event.data?.type) {
                case 'SW_ACTIVATED':
                  break;
                case 'SYNC_START':
                  break;
                case 'SYNC_COMPLETE':
                  pwaState.checkOfflineData();
                  break;
                case 'SYNC_FAILED':
                  console.error('Background sync failed:', event.data.error);
                  break;
              }
            });

            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    window.dispatchEvent(new CustomEvent('pwa-update-available'));
                  }
                });
              }
            });
          }
        }

        // Viewport is now managed in index.html - no manipulation needed here

        // Add iOS specific meta tags for better PWA experience
        const iosMetaTags = [
          { name: 'apple-mobile-web-app-capable', content: 'yes' },
          { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
          { name: 'apple-mobile-web-app-title', content: 'Der Heidehof' },
          { name: 'mobile-web-app-capable', content: 'yes' },
          { name: 'msapplication-TileColor', content: '#171717' },
          { name: 'theme-color', content: '#D4AF37', media: '(prefers-color-scheme: light)' },
          { name: 'theme-color', content: '#171717', media: '(prefers-color-scheme: dark)' }
        ];

        iosMetaTags.forEach(({ name, content, media }) => {
          if (!document.querySelector(`meta[name="${name}"]`)) {
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            if (media) meta.media = media;
            document.head.appendChild(meta);
          }
        });

        // iOS input-zoom prevention is handled in src/index.css (font-size: 16px on
        // input/select/textarea) — no JS focus listeners needed.
        
        setInitialized(true);
      } catch (error) {
        console.error('❌ PWA initialization failed:', error);
        setInitialized(true); // Still show content even if PWA features fail
      }
    };

    initializePWA();
  }, [pwaState]);

  // Add keyboard shortcuts for PWA features
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl+Shift+I for install
      if (e.ctrlKey && e.shiftKey && e.key === 'I' && pwaState.isInstallable) {
        e.preventDefault();
        pwaState.installPWA();
      }
      
      // Ctrl+Shift+N for notifications
      if (e.ctrlKey && e.shiftKey && e.key === 'N' && pwaState.notificationPermission !== 'granted') {
        e.preventDefault();
        pwaState.enableNotifications();
      }
      
      // Ctrl+Shift+S for sync
      if (e.ctrlKey && e.shiftKey && e.key === 'S' && pwaState.hasOfflineData) {
        e.preventDefault();
        pwaState.syncOfflineData();
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [pwaState]);

  // Add gesture support for mobile
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].screenY;
      const swipeDistance = touchStartY - touchEndY;
      
      // Pull to refresh gesture (swipe down)
      if (swipeDistance < -100 && window.scrollY === 0) {
        if (pwaState.hasOfflineData) {
          pwaState.syncOfflineData();
        } else {
          window.location.reload();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pwaState]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <PWAContext.Provider value={pwaState}>
      {children}
      {showUI && <PWAUnifiedPopup />}
    </PWAContext.Provider>
  );
};

export default PWAProvider;
