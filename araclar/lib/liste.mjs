/* liste.mjs — kaynak sayfalarındaki şirket listelerini ayrıştırır ve veriyle karşılaştırır.
   Kural: ayrıştırma şüphelenirse fark ÜRETİLMEZ (supheli:true, yeni/eksik boş).
   Saf; ağa çıkmaz. Test: test/liste.test.mjs */

import { normal } from './metin.mjs';

function metinlestir(html) {
  return String(html == null ? '' : html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
}

function temiz(s) {
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

/* Ham HTML'den liste satırlarını çıkarır. li/td içerikleri ve satır sonları aday sayılır. */
export function listeAyristir(html) {
  const metin = metinlestir(html);
  const adaylar = [];
  for (const m of metin.matchAll(/<(li|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = temiz(m[2]);
    if (t) adaylar.push(t);
  }
  const kayitlar = adaylar
    .map(t => t.replace(/^[\s•·\-–—*]+/, '').replace(/\s*[|·].*$/, '').trim())
    .filter(t => t.length >= 2 && t.length <= 80)
    .filter(t => !/^(home|menu|search|login|read more|share|next|previous|cookie)/i.test(t));

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
