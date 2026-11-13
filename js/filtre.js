/* filtre.js — saf arama ve durum/kategori/kaynak liste süzgeci. DOM'a dokunmaz; test/ bu modülü doğrudan koşar. */

const HARF = {
  'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
  'â': 'a', 'î': 'i', 'û': 'u', 'ê': 'e', 'ô': 'o', 'ß': 'ss',
  'é': 'e', 'è': 'e', 'ë': 'e', 'á': 'a', 'à': 'a', 'ä': 'a', 'å': 'a', 'ã': 'a',
  'ñ': 'n', 'ó': 'o', 'ò': 'o', 'õ': 'o', 'ú': 'u', 'ù': 'u', 'í': 'i', 'ì': 'i', 'ï': 'i', 'ý': 'y'
};

/* Türkçe küçük harf + aksan katlama: "ŞİŞLİ" → "sisli", "İstanbul" → "istanbul". */
export const kucuk = s => String(s == null ? '' : s)
  .replace(/İ/g, 'i').replace(/I/g, 'ı')
  .toLowerCase()
  .replace(/[ışğüöçâîûêôßéèëáàäåãñóòõúùíìïý]/g, h => HARF[h] || h);

export function filtrele(liste, { durumF, katF, listeF, sorgu = '', kategoriAd, ekMetin } = {}) {
  const q = kucuk(String(sorgu).trim());
  return (liste || []).filter(s => {
    if (durumF && !durumF.has(s.durum)) return false;
    if (katF && !katF.has(s.kategori)) return false;
    if (listeF && !(s.liste || []).some(l => listeF.has(l))) return false;
    if (!q) return true;
    const adlar = kategoriAd ? kategoriAd(s.kategori) : [s.kategori];
    const ek = ekMetin ? ekMetin(s) : '';
    const metin = [s.ad, s.ulke, s.sehir, s.kod, ...(s.markalar || []), ...(Array.isArray(adlar) ? adlar : [adlar]), ek].join(' ');
    return kucuk(metin).includes(q);
  });
}
