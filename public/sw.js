// Hotel Heidehof Admin Dashboard Service Worker
console.log('🔧 Hotel Heidehof Service Worker loaded');

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('⚙️ Service Worker installing...');
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('📥 Push notification received:', event);
  
  if (!event.data) {
    console.log('⚠️ Push event ohne Daten empfangen');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('❌ Fehler beim Parsen der Push-Daten:', error);
    notificationData = {
      title: 'Hotel Heidehof',
      body: 'Neue Nachricht verfügbar',
      icon: '/favicon.ico'
    };
  }

  console.log('📋 Notification Data:', notificationData);

  // Hotel-spezifische Notification anzeigen
  const notificationOptions = {
    body: notificationData.body || notificationData.message,
    icon: notificationData.icon || '/favicon.ico',
    badge: notificationData.badge || '/favicon.ico',
    tag: notificationData.tag || 'hotel-notification',
    data: {
      url: '/admin/messages',
      messageType: notificationData.messageType,
      timestamp: Date.now(),
      ...notificationData.data
    },
    actions: [
      {
        action: 'open',
        title: 'Dashboard öffnen'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ],
    requireInteraction: false,
    vibrate: getVibrationPattern(notificationData.messageType),
    silent: false
  };

  const title = notificationData.title || '🏨 Hotel Heidehof Dashboard';

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
      .then(() => {
        console.log('✅ Push notification angezeigt:', title);
      })
      .catch((error) => {
        console.error('❌ Fehler beim Anzeigen der Notification:', error);
      })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  
  notification.close();

  if (action === 'close') {
    console.log('❌ Notification geschlossen');
    return;
  }

  // Dashboard öffnen oder fokussieren
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      console.log('🔍 Suche nach offenen Tabs...', clientList.length);
      
      // Versuche zuerst ein bereits offenes Admin-Dashboard zu finden
      for (const client of clientList) {
        if (client.url.includes('/admin')) {
          console.log('📱 Admin-Dashboard bereits offen, fokussiere:', client.url);
          return client.focus();
        }
      }
      
      // Kein Admin-Dashboard offen, öffne neues
      const targetUrl = self.location.origin + '/admin/messages';
      console.log('🌐 Öffne neues Admin-Dashboard:', targetUrl);
      
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Hilfsfunktionen
function getVibrationPattern(messageType) {
  const patterns = {
    'restaurant_reservation': [200, 100, 200],
    'bar_max_order': [150, 50, 150, 50, 150],
    'beauty_appointment': [300, 150, 300],
    'contact_complaint': [100, 50, 100, 50, 100, 50, 100],
    'conference_order': [250, 100, 250],
    'shop_order': [180, 80, 180]
  };
  return patterns[messageType] || [200, 100, 200];
}

// Background Sync (für zukünftige Erweiterungen)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event.tag);
  
  if (event.tag === 'hotel-admin-sync') {
    event.waitUntil(
      // Hier könnten wir offline Nachrichten synchronisieren
      console.log('📊 Admin-Sync durchgeführt')
    );
  }
});

console.log('🏨 Hotel Heidehof Service Worker ready for push notifications');