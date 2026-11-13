/* rss.mjs — bağımlılıksız RSS 2.0 / Atom ayrıştırıcı. Girdi metindir; ağa çıkmaz.
   Çıktı: [{baslik, url, tarih, ozet}] — tarih ISO 8601 ya da null. Test: test/rss.test.mjs */

const VARLIK = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function coz(s) {
  return String(s == null ? '' : s).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (t, k) => {
    if (k[0] === '#') {
      const n = k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : t;
    }
    return VARLIK[k.toLowerCase()] != null ? VARLIK[k.toLowerCase()] : t;
  });
}

function duz(s) {
  return coz(String(s == null ? '' : s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function etiket(blok, ad) {
  const m = blok.match(new RegExp('<' + ad + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + ad + '>', 'i'));
  return m ? m[1] : '';
}

function tarihCoz(s) {
  if (!s) return null;
  const d = new Date(String(s).trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function atomBag(blok) {
  const m = blok.match(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/i);
  return m ? coz(m[1]) : duz(etiket(blok, 'link'));
}

/* RSS ve Atom karışık beslemeleri tek geçişte ayrıştırır. */
export function rssAyristir(xml) {
  const metin = String(xml == null ? '' : xml);
  const kayitlar = [];
  for (const m of metin.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const blok = m[1];
    const baslik = duz(etiket(blok, 'title'));
    const url = duz(etiket(blok, 'link')) || duz(etiket(blok, 'guid'));
    const tarih = tarihCoz(duz(etiket(blok, 'pubDate')) || duz(etiket(blok, 'dc:date')));
    const ozet = duz(etiket(blok, 'description'));
    if (baslik && url) kayitlar.push({ baslik, url, tarih, ozet });
  }
  for (const m of metin.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const blok = m[1];
    const baslik = duz(etiket(blok, 'title'));
    const url = atomBag(blok);
    const tarih = tarihCoz(duz(etiket(blok, 'published')) || duz(etiket(blok, 'updated')));
    const ozet = duz(etiket(blok, 'summary') || etiket(blok, 'content'));
    if (baslik && url) kayitlar.push({ baslik, url, tarih, ozet });
  }
  return kayitlar;
}
