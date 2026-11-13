/* rapor.mjs — kaynak-denetle çıktısının ayrıştırıcısı ve insan okunur özeti.
   Saf. Test: test/rapor.test.mjs

   Rapor biçimi (JSON):
   {surum:1, tarih:"ISO", denetim:[{url, durum:"canli"|"olu"|"hata", kod, tip, boyut}]}
*/

const DURUMLAR = new Set(['canli', 'olu', 'hata']);

/* null/undefined/'' bilinmiyor demektir; 0 geçerli bir değerdir, null'a çevrilmez. */
function sayi(deger) {
  if (deger == null || deger === '') return null;
  const n = Number(deger);
  return Number.isFinite(n) ? n : null;
}

/* Metnin içinden ilk JSON nesnesini bulur; başında/sonunda bot günlüğü olsa da çalışır. */
export function raporuCoz(metin) {
  const s = String(metin == null ? '' : metin);
  const bas = s.indexOf('{'), son = s.lastIndexOf('}');
  if (bas < 0 || son <= bas) throw new Error('rapor çözülemedi: JSON bulunamadı');
  let ham;
  try { ham = JSON.parse(s.slice(bas, son + 1)); }
  catch (e) { throw new Error('rapor çözülemedi: geçersiz JSON (' + e.message + ')'); }
  if (!ham || typeof ham !== 'object' || !Array.isArray(ham.denetim)) {
    throw new Error('rapor çözülemedi: "denetim" dizisi yok');
  }
  const denetim = ham.denetim.map((k, i) => {
    if (!k || typeof k !== 'object') throw new Error('rapor çözülemedi: ' + i + '. kayıt nesne değil');
    const url = String(k.url || '');
    if (!/^https?:\/\//.test(url)) throw new Error('rapor çözülemedi: ' + i + '. kayıt URL geçersiz');
    const durum = String(k.durum || '');
    if (!DURUMLAR.has(durum)) throw new Error('rapor çözülemedi: ' + i + '. kayıt durumu geçersiz');
    return {
      url,
      durum,
      kod: sayi(k.kod),
      tip: k.tip ? String(k.tip) : '',
      boyut: sayi(k.boyut)
    };
  });
  return {
    surum: sayi(ham.surum) || 1,
    tarih: typeof ham.tarih === 'string' ? ham.tarih : null,
    denetim
  };
}

export function raporOzet(rapor) {
  const s = { toplam: rapor.denetim.length, canli: 0, olu: 0, hata: 0 };
  for (const k of rapor.denetim) s[k.durum]++;
  return s;
}

/* İnsan okunur kısa metin; tekil satırlar bot günlüğüne düşer. */
export function raporMetni(rapor) {
  const o = raporOzet(rapor);
  const satirlar = [
    'kaynak denetimi · ' + (rapor.tarih || '—'),
    'toplam ' + o.toplam + ' · canlı ' + o.canli + ' · ölü ' + o.olu + ' · hata ' + o.hata
  ];
  for (const k of rapor.denetim) {
    if (k.durum === 'canli') continue;
    satirlar.push(k.durum + ' ' + (k.kod == null ? '—' : k.kod) + ' · ' + (k.tip || '—') + ' · ' + k.url);
  }
  return satirlar.join('\n');
}
