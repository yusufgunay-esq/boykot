/* liste.test.mjs — kaynak liste ayrıştırma ve fark hesabı. Fikstür; ağ yok. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { listeAyristir, farkHesapla, listeKarsilastir } from '../araclar/lib/liste.mjs';
import { raporKur, veriAdlari } from '../araclar/liste-denetle.mjs';

const oku = async ad => readFile(new URL('./fikstur/' + ad, import.meta.url), 'utf8');

const SIRKETLER = [
  { ad: 'Chevron', liste: ['bds'] },
  { ad: 'Intel', liste: ['bds'] },
  { ad: 'RE/MAX', liste: ['ohchr'] },
  { ad: 'Booking Holdings', liste: ['ohchr'] }
];

test('BDS fikstürü ayrışır; gezinme ve gürültü ayıklanır', async () => {
  const a = listeAyristir(await oku('liste-bds.html'));
  assert.equal(a.supheli, false);
  assert.ok(a.kayitlar.includes('Chevron'));
  assert.ok(a.kayitlar.includes('Acme Widgets Ltd'));
  assert.ok(!a.kayitlar.includes('Home'));
  assert.ok(!a.kayitlar.includes('Read more'));
  assert.ok(!a.kayitlar.some(x => x.includes('gürültü')));
});

test('OHCHR tablosu ayrışır; yalnız ad sütunu kayıt olur', async () => {
  const a = listeAyristir(await oku('liste-ohchr.html'));
  assert.equal(a.supheli, false);
  assert.ok(a.kayitlar.includes('RE/MAX'));
  assert.ok(a.kayitlar.includes('Afikim Public Transportation'));
  assert.deepEqual(a.kayitlar, ['RE/MAX', 'Booking Holdings', 'Airbnb', 'Expedia', 'Afikim Public Transportation']);
});

test('gezinme bölgeleri ve cümle satırları kayıt olmaz', () => {
  const html = `
    <header><ul><li>Home</li><li>Guide to BDS</li></ul></header>
    <main><ul>
      <li>Chevron</li><li>Intel</li><li>Siemens</li><li>HP</li><li>Microsoft</li>
      <li>learn bds call</li><li>what is bds</li>
      <li>Level of complicity based on accurate convincing research that proves complicity</li>
    </ul></main>
    <footer><ul><li>Read more</li><li>Share</li></ul></footer>`;
  const a = listeAyristir(html);
  assert.equal(a.supheli, false);
  assert.deepEqual(a.kayitlar, ['Chevron', 'Intel', 'Siemens', 'HP', 'Microsoft']);
});

test('bot koruması fark üretmez', () => {
  const a = listeAyristir('<html><head><title>Just a moment...</title></head><body>challenges.cloudflare.com</body></html>');
  assert.equal(a.supheli, true);
  assert.equal(a.kayitlar.length, 0);
  assert.match(a.not, /koruma/);
  assert.deepEqual(listeKarsilastir(a, ['Chevron']), { supheli: true, yeni: [], eksik: [] });
});

test('az satırlı sayfa şüpheli sayılır ve fark üretmez', () => {
  const a = listeAyristir('<html><body><ul><li>Chevron</li><li>Intel</li></ul></body></html>');
  assert.equal(a.supheli, true);
  assert.deepEqual(a.kayitlar, []);
  assert.deepEqual(listeKarsilastir(a, ['Chevron', 'Intel', 'Siemens']), { supheli: true, yeni: [], eksik: [] });
});

test('fark: yeni ve eksik adlar normalize edilerek bulunur', () => {
  const f = farkHesapla(['Chevron', 'Şişli Tekstil'], ['chevron', 'Siemens']);
  assert.deepEqual(f.yeni, ['sisli tekstil']);
  assert.deepEqual(f.eksik, ['siemens']);
});

test('raporKur sayfa alınamazsa şüpheli kayıt yazar', () => {
  const r = raporKur(SIRKETLER, {}, '2026-11-13T00:00:00.000Z');
  assert.equal(r.surum, 1);
  assert.equal(r.fark, 0);
  assert.ok(r.listeler.every(l => l.supheli === true));
  assert.equal(r.listeler.find(l => l.anahtar === 'bds').elle, true);
  assert.equal(r.listeler.find(l => l.anahtar === 'ulke').elle, true);
  assert.equal(r.listeler.find(l => l.anahtar === 'ohchr').elle, undefined);
});

test('elle kaynak fark üretmez, sayfa verilse de', async () => {
  const r = raporKur(SIRKETLER, { bds: { html: await oku('liste-bds.html') } }, '2026-11-13T00:00:00.000Z');
  const bds = r.listeler.find(l => l.anahtar === 'bds');
  assert.equal(bds.supheli, true);
  assert.deepEqual(bds.yeni, []);
  assert.deepEqual(bds.eksik, []);
  assert.match(bds.not, /elle/);
  assert.equal(r.fark, 0);
});

test('raporKur fikstürlerle gerçek farkı raporlar, veri değiştirmez', async () => {
  const r = raporKur(SIRKETLER, { ohchr: { html: await oku('liste-ohchr.html') } });
  const ohchr = r.listeler.find(l => l.anahtar === 'ohchr');
  assert.equal(ohchr.supheli, false);
  assert.ok(ohchr.yeni.includes('airbnb'));
  assert.ok(ohchr.yeni.includes('expedia'));
  assert.ok(ohchr.yeni.includes('afikim public transportation'));
  assert.deepEqual(ohchr.eksik, []);
  assert.ok(r.fark > 0);
});

test('veriAdlari listeye göre süzer', () => {
  assert.deepEqual(veriAdlari(SIRKETLER, 'bds'), ['Chevron', 'Intel']);
  assert.deepEqual(veriAdlari(SIRKETLER, 'ulke'), []);
});
