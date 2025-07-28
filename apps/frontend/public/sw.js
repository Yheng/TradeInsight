// TradeInsight Service Worker
const CACHE_NAME = 'tradeinsight-v1.0.0';
const STATIC_CACHE = 'tradeinsight-static-v1.0.0';
const DYNAMIC_CACHE = 'tradeinsight-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/trading',
  '/charts',
  '/analytics',
  '/manifest.json',
  '/favicon.svg'
];

// API endpoints that can be cached
const CACHEABLE_APIS = [
  '/api/trades/stats/summary',
  '/api/analytics/risk',
  '/api/market/symbols'
];

// Assets that should not be cached
const EXCLUDE_FROM_CACHE = [
  '/api/auth/',
  '/api/monitoring/',
  '/api/backup/',
  '/sockjs-node/',
  '/hot-update'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE && 
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip requests that shouldn't be cached
  if (EXCLUDE_FROM_CACHE.some(pattern => url.pathname.includes(pattern))) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for cacheable APIs
    if (networkResponse.ok && CACHEABLE_APIS.some(api => url.pathname.includes(api))) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Network unavailable',
        offline: true,
        message: 'You are currently offline. Some features may be limited.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Both cache and network failed for:', request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return basic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle background sync for failed API requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  
  try {
    // Sync cached data when back online
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/')) {
        try {
          await fetch(request);
          console.log('[SW] Synced:', request.url);
        } catch (error) {
          console.log('[SW] Failed to sync:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from TradeInsight',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: data.image,
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'TradeInsight', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const clickAction = event.action;
  const notificationData = event.notification.data;
  
  let urlToOpen = '/dashboard';
  
  if (clickAction === 'view_trade') {
    urlToOpen = `/trading?trade=${notificationData.tradeId}`;
  } else if (clickAction === 'view_alert') {
    urlToOpen = `/alerts?alert=${notificationData.alertId}`;
  } else if (notificationData.url) {
    urlToOpen = notificationData.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle message events from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'market-data-sync') {
    event.waitUntil(syncMarketData());
  }
});

async function syncMarketData() {
  console.log('[SW] Syncing market data...');
  
  try {
    // Fetch latest market data
    const response = await fetch('/api/market/symbols/popular');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put('/api/market/symbols/popular', response.clone());
    }
  } catch (error) {
    console.error('[SW] Failed to sync market data:', error);
  }
}