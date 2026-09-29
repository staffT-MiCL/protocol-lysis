// GaaaaaaS VADER Ⅱ Service Worker
// ゲームを更新したら CACHE の番号を上げてください（例: v2 → v3）。
const CACHE = 'vader2-v54';
const CORE = ['./', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  // アイコンが1つ欠けていても、残りは保存できるように1つずつ追加する
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ゲーム本体(HTML)はネット優先 → 圏外ならキャッシュ
  // index.html 以外のページ（確認用ページなど）は保存しない。保存するとゲーム本体として使われてしまうため
  if (req.mode === 'navigate' && !(url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'))) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Google Fonts などはキャッシュ優先（初回オンライン時に保存 → 以後オフラインでも表示）
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => new Response('', { status: 504, statusText: 'offline' }))));   // 圏外で未保存のファイルは空の応答を返す（エラーにしない）
});
