/* barkod.js — EAN-13 doğrulaması ve 729 ön eki yorumu. Saf; DOM'a dokunmaz. */

export function ean13(k) {
  if (!/^\d{13}$/.test(String(k))) return false;
  const top = [...String(k).slice(0, 12)].reduce((a, d, i) => a + +d * (i % 2 ? 3 : 1), 0);
  return (10 - top % 10) % 10 === +String(k)[12];
}

/* tur: uzunluk | hane | bds | temiz */
export function barkodDegerlendir(girdi) {
  const k = String(girdi == null ? '' : girdi).replace(/\D/g, '');
  if (k.length !== 13) return { tur: 'uzunluk', k };
  if (!ean13(k)) return { tur: 'hane', k };
  if (k.startsWith('729')) return { tur: 'bds', k, onek: k.slice(0, 3) };
  return { tur: 'temiz', k, onek: k.slice(0, 3) };
}
