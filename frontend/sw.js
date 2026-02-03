const CACHE_NAME = 'kojenerasyon-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Cache First, Network Fallback
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Skip external API calls, script.js and styles.css for development
  if (request.url.includes('localhost:3000') || 
      request.url.includes('127.0.0.1:3000') ||
      request.url.includes('script.js') ||
      request.url.includes('styles.css')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('📋 Serving from cache:', request.url);
          return response;
        }

        // Network request
        console.log('🌐 Fetching from network:', request.url);
        return fetch(request).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Offline fallback
          console.log('📴 Offline, serving fallback');
          
          // Return cached index.html for navigation requests
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Return offline page for other requests
          return new Response('Çevrimdışı mod - İnternet bağlantısı gerekiyor', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Push Notifications
self.addEventListener('push', event => {
  console.log('📬 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Yeni bildirim',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Görüntüle',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Kojenerasyon Sistemi', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background Sync Function
async function doBackgroundSync() {
  try {
    // Sync offline data with backend
    console.log('🔄 Syncing offline data...');
    
    // Get all offline stored data
    const offlineData = await getOfflineData();
    
    // Send to backend
    for (const data of offlineData) {
      try {
        await fetch('http://localhost:3000/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        // Remove synced data
        await removeOfflineData(data.id);
      } catch (error) {
        console.error('❌ Sync failed for item:', data.id, error);
      }
    }
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Offline Storage Helpers
async function getOfflineData() {
  // Implementation for getting offline stored data
  return [];
}

async function removeOfflineData(id) {
  // Implementation for removing synced offline data
  console.log('🗑️ Removed offline data:', id);
}
