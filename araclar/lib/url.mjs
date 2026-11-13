/* url.mjs — URL kanonikleştirme. Aynı haberin farklı izleme parametreleriyle gelen
   kopyalarını tekilleştirmek için kullanılır. Saf; ağa çıkmaz. Test: test/url.test.mjs */

const TAKIP = [
  /^utm_/i, /^fbclid$/i, /^gclid$/i, /^dclid$/i, /^msclkid$/i, /^yclid$/i,
  /^igshid$/i, /^mc_cid$/i, /^mc_eid$/i, /^_hsenc$/i, /^_hsmi$/i, /^mkt_tok$/i
];

const takipMi = ad => TAKIP.some(r => r.test(ad));

/* Kanonik biçim: küçük şema/host, www. atılmış, varsayılan port yok, fragment yok,
   izleme parametreleri ayıklanmış, kalan parametreler sıralı, sondaki / atılmış.
   Yalnız http(s) kabul edilir; geçersizse null. */
export function kanonik(girdi, taban) {
  let u;
  try { u = taban ? new URL(String(girdi), taban) : new URL(String(girdi)); }
  catch (e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  u.hash = '';
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
  if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) u.port = '';
  const kalan = [...u.searchParams.entries()]
    .filter(([ad]) => !takipMi(ad))
    .sort(([a1, v1], [a2, v2]) => a1 === a2 ? v1.localeCompare(v2) : a1.localeCompare(a2));
  u.search = '';
  for (const [ad, deger] of kalan) u.searchParams.append(ad, deger);
  let s = u.toString();
  if (u.pathname !== '/' && s.endsWith('/')) s = s.slice(0, -1);
  return s;
}

/* Yalnız https ve geçerli mi? */
export function httpsMu(girdi) {
  try { return new URL(String(girdi)).protocol === 'https:'; } catch (e) { return false; }
}

export function alanAdi(girdi) {
  try { return new URL(String(girdi)).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}
