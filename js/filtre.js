/* filtre.js — saf arama ve durum/kategori/kaynak liste süzgeci. DOM'a dokunmaz; test/ bu modülü doğrudan koşar. */

export const kucuk = s => String(s).toLocaleLowerCase();

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
