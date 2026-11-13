/* metin.mjs — Türkçe aksan katlama, arama normalizasyonu, başlık benzerliği ve relevans.
   Saf; ağ, dosya ve DOM'a dokunmaz. Test: test/metin.test.mjs */

const HARF = {
  'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
  'â': 'a', 'î': 'i', 'û': 'u', 'ê': 'e', 'ô': 'o', 'ß': 'ss'
};

/* Türkçe küçük harfe indirir: I → ı, İ → i. */
export function trKucuk(s) {
  return String(s == null ? '' : s)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase();
}

/* Aksanları ve Türkçeye özgü harfleri ASCII'ye katlar: "ŞİŞLİ" → "sisli". */
export function katla(s) {
  return trKucuk(s)
    .replace(/[ışğüöçâîûêôß]/g, h => HARF[h] || h)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ø/g, 'o');
}

/* Aramada kullanılacak sözcükler. */
export function sozcukler(s) {
  return katla(s).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}

/* Karşılaştırma için tek satır normal biçim. */
export function normal(s) {
  return sozcukler(s).join(' ');
}

/* Sözcük kümesi (başlık benzerliği için). Sayı ve noktalama farkı skoru bozmasın diye
   sözcük düzeyinde Dice kullanılır. */
function kumeler(s) {
  return new Set(sozcukler(s));
}

/* Dice katsayısı: 0..1. ≥0,85 aynı haber sayılır. */
export function benzerlik(a, b) {
  const A = kumeler(a), B = kumeler(b);
  if (!A.size || !B.size) return 0;
  let ortak = 0;
  for (const x of A) if (B.has(x)) ortak++;
  return (2 * ortak) / (A.size + B.size);
}

/* Bir metnin bir şirkete relevansı. Şirket adı 3, marka adı 2 puan; sözcük sınırına saygılı. */
export function relevans(metin, sirket) {
  const m = ' ' + normal(metin) + ' ';
  if (!m.trim()) return 0;
  let puan = 0;
  const ad = normal(sirket && sirket.ad);
  if (ad && ad.length >= 3 && m.includes(' ' + ad + ' ')) puan += 3;
  for (const marka of (sirket && sirket.markalar) || []) {
    const x = normal(marka);
    if (x.length >= 3 && x !== ad && m.includes(' ' + x + ' ')) puan += 2;
  }
  return puan;
}

/* Aynı URL ya da ≥esik benzer başlığı olan kayıtları ayıklar; ilk gelen kalır. */
export function tekrarAyikla(liste, { esik = 0.85, url = x => x.url, baslik = x => x.baslik } = {}) {
  const urller = new Set(), kalan = [];
  for (const kayit of liste || []) {
    const u = url(kayit);
    if (u) {
      if (urller.has(u)) continue;
      urller.add(u);
    }
    const b = baslik(kayit) || '';
    if (kalan.some(k => benzerlik(baslik(k) || '', b) >= esik)) continue;
    kalan.push(kayit);
  }
  return kalan;
}
