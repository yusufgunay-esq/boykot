/* liste.mjs — kaynak sayfalarındaki şirket listelerini ayrıştırır ve veriyle karşılaştırır.
   Kural: ayrıştırma şüphelenirse fark ÜRETİLMEZ (supheli:true, yeni/eksik boş).
   Gezinme bölgeleri (nav/header/footer/aside) atılır; cümle benzeri satırlar kayıt sayılmaz.
   Tabloda satırın ilk anlamlı hücresi ad sayılır; sektör/ülke sütunu kayıt olmaz.
   Saf; ağa çıkmaz. Test: test/liste.test.mjs */

import { normal } from './metin.mjs';

const KORUMA = /just a moment|challenges\.cloudflare\.com|cf-chl|attention required/i;
const SAYI = /^\d+([.,]\d+)*$/;
const YARDIM = /^(home|menu|search|login|log in|read more|share|next|previous|cookie|skip|you are here|contact us)\b/i;

function metinlestir(html) {
  return String(html == null ? '' : html)
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, ' ');
}

function temiz(s) {
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function aday(parca) {
  return temiz(parca)
    .replace(/^[\s•·\-–—*]+/, '')
    .replace(/\s*[|·].*$/, '')
    .trim();
}

/* Şirket adına benzemeyen adayları eler: sayı, menü etiketi, cümle. */
function gecerli(t) {
  if (t.length < 2 || t.length > 80) return false;
  if (SAYI.test(t) || YARDIM.test(t)) return false;
  const kelime = t.split(/\s+/).length;
  if (kelime > 8) return false;
  if (/^[a-z]/.test(t) && kelime >= 3) return false;
  return true;
}

/* Ham HTML'den liste satırlarını çıkarır. li içerikleri ve tablo satırları aday sayılır. */
export function listeAyristir(html) {
  if (KORUMA.test(String(html == null ? '' : html))) {
    return { supheli: true, kayitlar: [], not: 'kaynak bot koruması döndürdü; elle denetim gerekli' };
  }
  const metin = metinlestir(html);
  const adaylar = [];

  for (const m of metin.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const t = aday(m[1]);
    if (t) adaylar.push(t);
  }
  for (const m of metin.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const hucreler = [...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(x => aday(x[1]));
    const ad = hucreler.find(h => h && h.length >= 2 && !SAYI.test(h));
    if (ad) adaylar.push(ad);
  }

  const kayitlar = [...new Set(adaylar.filter(gecerli))];
  const supheli = kayitlar.length < 5;
  return {
    supheli,
    kayitlar: supheli ? [] : kayitlar,
    not: supheli ? 'ayrıştırma şüpheli: yeterli liste satırı bulunamadı (' + kayitlar.length + ')' : ''
  };
}

/* Veri kümesi adlarıyla fark. supheli ise boş fark döner. */
export function farkHesapla(kayitlar, veriAdlari) {
  const kaynak = new Set((kayitlar || []).map(normal).filter(Boolean));
  const veri = new Set((veriAdlari || []).map(normal).filter(Boolean));
  const yeni = [...kaynak].filter(x => !veri.has(x));
  const eksik = [...veri].filter(x => !kaynak.has(x));
  return { yeni, eksik };
}

export function listeKarsilastir({ supheli, kayitlar }, veriAdlari) {
  if (supheli) return { supheli: true, yeni: [], eksik: [] };
  return { supheli: false, ...farkHesapla(kayitlar, veriAdlari) };
}
