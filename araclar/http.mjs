/* http.mjs — veri toplama hattının tek ağ kapısı.
   Kurallar: yalnız https · 15 sn zaman aşımı · 2 deneme · eşzamanlılık ≤4 ·
   host başına ≥1 sn aralık · yanıt ≤2 MB · dürüst User-Agent.
   Test: test/http.test.mjs (ağsız davranışlar) */

import { httpsMu } from './lib/url.mjs';

/* User-Agent yalnız ASCII olabilir: Türkçe karakter (ı, ü) fetch'te ByteString hatası verir. */
export const UA = 'BoykotVeriBot/0.1 (+https://github.com/yusufgunay-esq/boykot; acik kaynak boykot rehberi veri guncellemesi)';
export const ZAMAN_ASIMI = 15000;
export const DENEME = 2;
export const ES_ZAMANLI = 4;
export const HOST_ARALIK = 1000;
export const AZAMI_BAYT = 2 * 1024 * 1024;

const sonIstek = new Map();
const hostZincir = new Map();

/* Host başına istek başlangıçlarını ≥1 sn aralıkla sıraya sokar. */
function hostBekle(host) {
  const onceki = hostZincir.get(host) || Promise.resolve();
  const simdi = onceki.then(async () => {
    const son = sonIstek.get(host) || 0;
    const bekle = HOST_ARALIK - (Date.now() - son);
    if (bekle > 0) await new Promise(r => setTimeout(r, bekle));
    sonIstek.set(host, Date.now());
  });
  hostZincir.set(host, simdi.catch(() => { /* zincir kopmasın */ }));
  return simdi;
}

/* Basit eşzamanlılık havuzu: en çok `es` iş aynı anda. Sıra korunur. */
export async function esZamanli(isler, { es = ES_ZAMANLI } = {}) {
  const sonuc = new Array(isler.length);
  let imlec = 0;
  const isci = async () => {
    while (true) {
      const i = imlec++;
      if (i >= isler.length) return;
      sonuc[i] = await isler[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(es, isler.length) }, isci));
  return sonuc;
}

/* Gövdeyi en çok AZAMI_BAYT okuyup metne çevirir. */
async function govdeOku(yanit) {
  const sayi = Number(yanit.headers.get('content-length'));
  if (Number.isFinite(sayi) && sayi > AZAMI_BAYT) {
    throw new Error('yanıt 2 MB sınırını aşıyor (' + sayi + ' bayt)');
  }
  if (!yanit.body) return { metin: '', boyut: 0 };
  const okuyucu = yanit.body.getReader();
  const parcalar = [];
  let boyut = 0;
  while (true) {
    const { done, value } = await okuyucu.read();
    if (done) break;
    boyut += value.byteLength;
    if (boyut > AZAMI_BAYT) {
      try { await okuyucu.cancel(); } catch (_) { /* yok */ }
      throw new Error('yanıt 2 MB sınırını aşıyor');
    }
    parcalar.push(value);
  }
  const buf = new Uint8Array(boyut);
  let konum = 0;
  for (const p of parcalar) { buf.set(p, konum); konum += p.byteLength; }
  return { metin: new TextDecoder('utf-8').decode(buf), boyut };
}

/* Tek istek; kural ihlallerinde ağa çıkmadan reddeder. */
export async function httpAl(url, { yontem = 'GET', deneme = DENEME } = {}) {
  if (!httpsMu(url)) throw new Error('yalnız https adresler desteklenir: ' + url);
  const host = new URL(url).hostname;
  let sonHata;
  for (let den = 1; den <= deneme; den++) {
    await hostBekle(host);
    try {
      const yanit = await fetch(url, {
        method: yontem,
        redirect: 'follow',
        signal: AbortSignal.timeout(ZAMAN_ASIMI),
        headers: { 'user-agent': UA, 'accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.5' }
      });
      const tip = yanit.headers.get('content-type') || '';
      if (yontem === 'HEAD') {
        return { url: yanit.url || url, kod: yanit.status, tip, boyut: Number(yanit.headers.get('content-length')) || null, metin: '' };
      }
      const { metin, boyut } = await govdeOku(yanit);
      const hata = yanit.status >= 500;
      const sonuc = { url: yanit.url || url, kod: yanit.status, tip, boyut, metin };
      if (!hata || den === deneme) return sonuc;
      sonHata = new Error('sunucu hatası: ' + yanit.status);
    } catch (e) {
      sonHata = e;
      if (den === deneme) break;
      await new Promise(r => setTimeout(r, 600 * den));
    }
  }
  throw sonHata || new Error('istek başarısız: ' + url);
}

/* Yalnız canlılık/içerik tipi: HEAD dener, 405/501 ise GET'e düşer. */
export async function basDenetle(url) {
  try {
    const h = await httpAl(url, { yontem: 'HEAD', deneme: 1 });
    if (h.kod < 400) return { ...h, durum: 'canli' };
    if (h.kod === 405 || h.kod === 501) {
      const g = await httpAl(url, { yontem: 'GET', deneme: 1 });
      return { ...g, metin: '', durum: g.kod < 400 ? 'canli' : 'olu' };
    }
    return { ...h, durum: 'olu' };
  } catch (e) {
    try {
      const g = await httpAl(url, { yontem: 'GET', deneme: 1 });
      return { ...g, metin: '', durum: g.kod < 400 ? 'canli' : 'olu' };
    } catch (e2) {
      return { url, kod: null, tip: '', boyut: null, durum: 'hata', hata: String(e2.message || e2) };
    }
  }
}
