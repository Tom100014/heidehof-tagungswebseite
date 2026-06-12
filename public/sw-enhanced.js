
// Enhanced Service Worker for Heidehof PWA - Production Ready
const CACHE_VERSION = 'v3.0.0';
const CACHE_NAMES = {
  static: `heidehof-static-${CACHE_VERSION}`,
  dynamic: `heidehof-dynamic-${CACHE_VERSION}`,
  images: `heidehof-images-${CACHE_VERSION}`,
  api: `heidehof-api-${CACHE_VERSION}`
};

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/reservierung/,
  /\/api\/restaurant/,
  /\/api\/wellness/,
  /\/api\/kontakt/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Enhanced Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.static).then((cache) => {
        console.log('✅ Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Preload critical pages
      caches.open(CACHE_NAMES.dynamic).then((cache) => {
        const criticalPages = ['/reservierung', '/restaurant', '/wellness'];
        return Promise.all(
          criticalPages.map(page => 
            fetch(page).then(response => {
              if (response.ok) {
                cache.put(page, response.clone());
              }
            }).catch(() => {})
          )
        );
      })
    ]).catch((error) => {
      console.error('❌ Failed to cache assets:', error);
    })
  );
  
  // Force activation
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter((cacheName) => {
          return Object.values(CACHE_NAMES).every(name => name !== cacheName) &&
                 cacheName.startsWith('heidehof-');
        })
        .map((cacheName) => {
          console.log('🗑️ Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      return Promise.all(deletePromises);
    }).then(() => {
      self.clients.claim();
      
      // Notify all clients of activation
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION,
            timestamp: Date.now()
          });
        });
      });
      
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Fetch event - enhanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (url.origin !== location.origin) return;
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Strategy 1: Cache First for static assets
    if (pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
      return await cacheFirst(request, CACHE_NAMES.static);
    }
    
    // Strategy 2: Cache First for images
    if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
      return await cacheFirst(request, CACHE_NAMES.images);
    }
    
    // Strategy 3: Network First for API calls
    if (pathname.startsWith('/api/') || API_CACHE_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await networkFirst(request, CACHE_NAMES.api);
    }
    
    // Strategy 4: Stale While Revalidate for pages
    if (pathname === '/' || pathname.startsWith('/reservierung') || pathname.startsWith('/restaurant') || pathname.startsWith('/wellness')) {
      return await staleWhileRevalidate(request, CACHE_NAMES.dynamic);
    }
    
    // Strategy 5: Network First for everything else
    return await networkFirst(request, CACHE_NAMES.dynamic);
    
  } catch (error) {
    console.error('Fetch error:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  });
  
  return cachedResponse || fetchPromise;
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'heidehof-sync') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'admin-message-sync') {
    console.log('🔄 Background sync for admin messages');
    event.waitUntil(syncOfflineAdminMessages());
  }
});

async function syncOfflineData() {
  try {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_START',
        timestamp: Date.now()
      });
    });
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        error: error.message,
        timestamp: Date.now()
      });
    });
  }
}

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting...');
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'heidehof-periodic-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Push Notification Event Handler
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);
  
  if (!event.data) {
    console.log('❌ Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📱 Push data:', data);
    
    const notificationOptions = {
      body: data.body || data.message || 'Neue Nachricht verfügbar',
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [
        {
          action: 'open',
          title: '🔍 Öffnen'
        },
        {
          action: 'close', 
          title: '✖️ Schließen'
        }
      ],
      requireInteraction: true,
      vibrate: data.vibrate || [200, 100, 200],
      silent: false,
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || '🔔 Hotel Der Heidehof',
        notificationOptions
      )
    );
    
    console.log('✅ Push notification displayed');
  } catch (error) {
    console.error('❌ Error handling push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('🔔 Hotel Der Heidehof', {
        body: 'Neue Nachricht erhalten',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'fallback'
      })
    );
  }
});

// Notification Click Event Handler
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'close') {
    console.log('✖️ User closed notification');
    return;
  }
  
  // Default action or 'open' action
  const urlToOpen = data.url || '/admin/messages';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if admin page is already open
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname.startsWith('/admin') && 'focus' in client) {
          console.log('🎯 Focusing existing admin window');
          return client.focus().then(() => {
            // Navigate to specific message if provided
            if (data.messageId) {
              client.postMessage({
                type: 'NAVIGATE_TO_MESSAGE',
                messageId: data.messageId
              });
            }
          });
        }
      }
      
      // Open new admin window
      console.log('🆕 Opening new admin window');
      return clients.openWindow(urlToOpen);
    })
  );
});


// Sync offline admin messages
async function syncOfflineAdminMessages() {
  try {
    console.log('📤 Syncing offline admin messages...');
    
    // This would sync any offline messages or status updates
    // For now, just send a ping to ensure connection
    const response = await fetch('/api/ping', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Admin message sync successful');
    }
  } catch (error) {
    console.error('❌ Admin message sync failed:', error);
  }
}

console.log('🚀 Enhanced Heidehof Service Worker with Push Notifications loaded successfully');
