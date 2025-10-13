const CACHE_NAME = 'desbin-cache-v1';
const ASSETS = [
	'./',
	'./index.html',
	'./styles.css',
	'./script.js',
	'./manifest.webmanifest'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(
			keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
		))
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	event.respondWith(
		caches.match(request).then((cached) => {
			const fetchPromise = fetch(request).then((response) => {
				const resClone = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
				return response;
			}).catch(() => cached);
			return cached || fetchPromise;
		})
	);
});



