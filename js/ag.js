/* ag.js — AĞ görünümünün saf yerleşimi.
   Her kategori bir sektör dilimi; varlıklar yay üzerine durum sırasıyla dizilir.
   Geometri tam veriye göre kurulur, süzgeç yalnız noktaları değiştirir: sektörler yerinde kalır.
   Etiketler masaüstünde dış çemberde çakışma çözülerek yerleşir; dar ekranda gizlenir. */

import { DURUM } from './veri.js';

const TAU = Math.PI * 2;
const DURUM_SIRA = new Map(Object.keys(DURUM).map((k, i) => [k, i]));

const p = v => Math.round(v * 10) / 10;

/* Etiketleri sağ/sol sütunda yukarıdan aşağı iter; üst ve alt HUD payını korur. */
function etiketCoz(etiketler, K) {
  const bosluk = 16, ust = K.y + 60, alt = K.y + K.h - 42;
  for (const yan of ['sag', 'sol']) {
    const l = etiketler.filter(e => e.yan === yan).sort((a, b) => a.y0 - b.y0);
    if (!l.length) continue;
    let y = ust;
    for (const e of l) { e.y = Math.max(e.y0, y); y = e.y + bosluk; }
    for (let i = l.length - 1; i >= 0; i--) {
      const sinir = i === l.length - 1 ? alt : l[i + 1].y - bosluk;
      l[i].y = Math.min(l[i].y, sinir);
    }
    const tasan = ust - l[0].y;
    if (tasan > 0) for (const e of l) e.y += tasan;
  }
}

export function agYerlesim(tum, gorunen, kategoriler, W, H, kutu) {
  /* Sahne tam ekran; panellerin arasında kalan güvenli kutuya yerleş. */
  const K = kutu || { x: 0, y: 0, w: W, h: H };
  const dar = K.w < 700, sik = K.w < 620;
  const cx = p(K.x + K.w / 2), cy = p(K.y + K.h / 2);
  const R2 = Math.max(60, dar
    ? Math.min(K.w * 0.43, K.h * 0.42)
    : Math.min(K.w / 2 - 112, K.h / 2 - 54));
  const R1 = R2 * 0.62;

  /* Sektör ağırlığı tam veriden: süzgeç değişince halka dönmez. */
  const tam = new Map(kategoriler.map(k => [k, 0]));
  for (const s of tum) if (tam.has(s.kategori)) tam.set(s.kategori, tam.get(s.kategori) + 1);
  const agirlik = kategoriler.reduce((a, k) => a + (tam.get(k) || 0) + 4, 0) || 1;
  const gorunenK = new Map(kategoriler.map(k => [k, []]));
  for (const s of gorunen) {
    if (!gorunenK.has(s.kategori)) gorunenK.set(s.kategori, []);
    gorunenK.get(s.kategori).push(s);
  }

  const sektorler = [];
  let a0 = -Math.PI / 2;
  for (const k of kategoriler) {
    const nTam = tam.get(k) || 0, span = TAU * (nTam + 4) / agirlik, ort = a0 + span / 2;
    const liste = gorunenK.get(k).slice().sort((x, y) =>
      (DURUM_SIRA.get(x.durum) ?? 9) - (DURUM_SIRA.get(y.durum) ?? 9) ||
      String(x.ad).localeCompare(String(y.ad), 'tr'));
    const n = liste.length;
    const icBosluk = n > 1 ? Math.min(span * 0.06, 2.4 / R2) : 0;
    const dugumler = liste.map((s, i) => {
      const a = a0 + icBosluk + (span - 2 * icBosluk) * (i + 0.5) / n;
      return { s, a, x: p(cx + Math.cos(a) * R2), y: p(cy + Math.sin(a) * R2) };
    });
    sektorler.push({
      kategori: k, tam: nTam, n, bas: a0, span, ort,
      hub: { x: p(cx + Math.cos(ort) * R1), y: p(cy + Math.sin(ort) * R1) },
      dugumler,
      etiket: {
        a: ort, yan: Math.cos(ort) >= 0 ? 'sag' : 'sol',
        x0: p(cx + Math.cos(ort) * (R2 + 14)), y0: p(cy + Math.sin(ort) * (R2 + 14)),
        capaX: p(cx + Math.cos(ort) * R2), capaY: p(cy + Math.sin(ort) * R2)
      }
    });
    a0 += span;
  }
  if (!dar) etiketCoz(sektorler.map(s => s.etiket), K);

  const durum = {};
  for (const s of gorunen) durum[s.durum] = (durum[s.durum] || 0) + 1;
  return {
    cx, cy, R1: p(R1), R2: p(R2), dar, sik, kutu: K, sektorler,
    toplam: gorunen.length, ulke: new Set(gorunen.map(s => s.ulke)).size, durum
  };
}
