/* veri.js — data/ dosyalarını yükler, ortak veri yardımcılarını verir.
   Şema: sirketler.json {surum, sirketler[]}, haberler.json {surum, guncelleme, kaynaklar[], haberler[]}. */

export const DURUM = { bds: ['d-bds', '--bds'], baski: ['d-baski', '--baski'], halk: ['d-halk', '--halk'], sonuc: ['d-sonuc', '--sonuc'] };
export const renk = s => `var(${DURUM[s.durum][1]})`;

async function jsonAl(yol) {
  const r = await fetch(yol, { cache: 'no-cache' });
  if (!r.ok) throw new Error(yol + ' ' + r.status);
  return r.json();
}

export async function veriYukle() {
  const sirketPaket = await jsonAl('data/sirketler.json');
  const metinler = await jsonAl('data/metinler.json');
  let haberPaket = null;
  try { haberPaket = await jsonAl('data/haberler.json'); } catch (e) { /* haber akışı yoksa site çalışır */ }

  const sirketler = Array.isArray(sirketPaket.sirketler) ? sirketPaket.sirketler : [];
  const SIRKETLER = sirketler.map((s, i) => ({ ...s, kod: 'VRL-' + String(i + 1).padStart(4, '0') }));
  const idler = new Set(SIRKETLER.map(s => s.id));
  const HABERLER = ((haberPaket && haberPaket.haberler) || []).filter(h =>
    h && typeof h.url === 'string' && /^https:\/\//.test(h.url) && h.baslik && idler.has(h.sirketId));
  return {
    SIRKETLER,
    HABERLER,
    GUNCELLEME: (haberPaket && haberPaket.guncelleme) || null,
    KAYNAKLAR: (haberPaket && haberPaket.kaynaklar) || [],
    METINLER: metinler
  };
}

export function utcParcala() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return {
    dosya: 'GD-' + d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()),
    tarih: d.getUTCFullYear() + '.' + p(d.getUTCMonth() + 1) + '.' + p(d.getUTCDate()),
    damga: p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ' UTC'
  };
}

export function utcDamga() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + 'Z';
}

export function alanAdi(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return String(u || ''); }
}

/* "2024-02", "2024" ya da "2024-02-11" → ondalık yıl */
export function tarihYil(z) {
  const [y, m] = String(z).split('-').map(Number);
  if (!y) return 0;
  return y + ((m || 6) - 1) / 12;
}

export function simdiYil() {
  const d = new Date();
  return d.getUTCFullYear() + (d.getUTCMonth() + d.getUTCDate() / 30.4) / 12;
}

export function km(a, b) {
  const r = Math.PI / 180;
  const d = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(d)));
}

export function guncellemeMetni(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = n => String(n).padStart(2, '0');
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + 'Z';
}

/* Dış kaynaklı metinleri HTML şablonlarına güvenli koymak için */
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
