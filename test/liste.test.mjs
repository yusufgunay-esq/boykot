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
  { ad: 'RE/MAX', liste: ['ohchr'] }
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

test('OHCHR tablosu ayrışır', async () => {
  const a = listeAyristir(await oku('liste-ohchr.html'));
  assert.equal(a.supheli, false);
  assert.ok(a.kayitlar.includes('RE/MAX'));
  assert.ok(a.kayitlar.includes('Afikim Public Transportation'));
});

test('az satırlı sayfa şüpheli sayılır ve fark üretmez', async () => {
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
});

test('raporKur fikstürlerle gerçek farkı raporlar, veri değiştirmez', async () => {
  const r = raporKur(SIRKETLER, {
    bds: { html: await oku('liste-bds.html') },
    ohchr: { html: await oku('liste-ohchr.html') }
  });
  const bds = r.listeler.find(l => l.anahtar === 'bds');
  assert.equal(bds.supheli, false);
  assert.ok(bds.yeni.includes('acme widgets ltd'));
  assert.ok(bds.yeni.includes('dell technologies'));
  assert.ok(bds.eksik.includes('chevron') === false);
  assert.ok(r.fark > 0);
});

test('veriAdlari listeye göre süzer', () => {
  assert.deepEqual(veriAdlari(SIRKETLER, 'bds'), ['Chevron', 'Intel']);
  assert.deepEqual(veriAdlari(SIRKETLER, 'ulke'), []);
});
