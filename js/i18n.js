/* i18n.js — dil durumu, arayüz metinleri ve veri alanı çözümleyicileri.
   Metinler data/metinler.json'dan gelir; tr asıl, en/es/zh çeviridir. */

export const DILLER = ['tr', 'en', 'es', 'zh'];

let S = {};
let DURUM_AD = {};
let KAT_AD = {};
let LISTE_AD = {};
export let dil = 'tr';

export function metinleriAl(paket) {
  S = (paket && paket.metinler) || {};
  DURUM_AD = (paket && paket.durumAd) || {};
  KAT_AD = (paket && paket.kategoriAd) || {};
  LISTE_AD = (paket && paket.listeAd) || {};
}

export function dilBaslat() {
  try {
    const d = localStorage.getItem('dil');
    if (DILLER.includes(d)) { dil = d; return; }
    const n = (navigator.language || 'tr').slice(0, 2);
    if (DILLER.includes(n)) dil = n;
  } catch (e) { /* gizli mod: varsayılan tr */ }
}

export function dilSec(d) { if (DILLER.includes(d)) dil = d; }

export const di = () => DILLER.indexOf(dil);

export function t(k, v = {}) {
  const dizi = S[k];
  let s = dizi ? (dizi[di()] ?? dizi[0]) : k;
  for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b);
  return s;
}

/* Veri alanı: [tr,en,es,zh] ya da düz metin */
export const L = x => Array.isArray(x) ? (x[di()] || x[0]) : x;

export const B = s => String(s).toLocaleUpperCase(dil === 'zh' ? 'en' : dil);

export const sayiTR = n => Number(n).toLocaleString({ tr: 'tr-TR', en: 'en-US', es: 'es-ES', zh: 'zh-CN' }[dil]);

export const durumAd = d => L(DURUM_AD[d] || [d]);
export const katAd = k => L(KAT_AD[k] || [k]);
export const listeAd = l => L(LISTE_AD[l] || [l]);
export const kategoriAdlari = k => KAT_AD[k] || [k];

/* Ülke kodu → yerel ülke adı (Intl varsa), yoksa kod. */
let bolgeAdlari = null;
export function ulkeAd(kod) {
  if (!kod) return '';
  try {
    if (!bolgeAdlari) bolgeAdlari = new Intl.DisplayNames([dil === 'zh' ? 'zh-CN' : dil], { type: 'region' });
    return bolgeAdlari.of(kod) || kod;
  } catch (e) { return kod; }
}

/* Şehir yoksa ülke adı gösterilir (kaynak yalnız ülke düzeyinde konum veriyorsa). */
export const yerAdi = s => s.sehir || ulkeAd(s.ulke);
