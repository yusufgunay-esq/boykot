/* rss.test.mjs — RSS 2.0 / Atom ayrıştırıcı, fikstürle ve ağsız. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { rssAyristir } from '../araclar/lib/rss.mjs';

const oku = async ad => readFile(new URL('./fikstur/' + ad, import.meta.url), 'utf8');

test('RSS: kayıtlar, CDATA ve varlık çözümü', async () => {
  const k = rssAyristir(await oku('rss.xml'));
  assert.equal(k.length, 6);
  assert.equal(k[0].baslik, 'Chevron agrees to buy Noble Energy for $5 billion');
  assert.equal(k[0].url, 'https://ornek.test/haber/chevron-noble?utm_source=rss&utm_medium=feed');
  assert.equal(k[0].tarih, '2026-11-10T08:00:00.000Z');
  assert.equal(k[0].ozet, 'Chevron said the deal & financing are complete.');
});

test('RSS: başlık ve tarih alanları dolu, http bağlantı da ayrışır', async () => {
  const k = rssAyristir(await oku('rss.xml'));
  for (const x of k) {
    assert.ok(x.baslik.length > 0);
    assert.ok(x.url.startsWith('http'));
    assert.ok(x.tarih === null || !Number.isNaN(Date.parse(x.tarih)));
  }
  assert.ok(k.some(x => x.url.startsWith('http://')));
});

test('Atom: link href, published ve varlık çözümü', async () => {
  const k = rssAyristir(await oku('atom.xml'));
  assert.equal(k.length, 2);
  assert.equal(k[0].baslik, 'UN OHCHR updates business database');
  assert.equal(k[0].url, 'https://ornek.test/atom/ohchr?fbclid=abc123');
  assert.equal(k[0].tarih, '2026-11-07T06:00:00.000Z');
  assert.equal(k[0].ozet, 'UN OHCHR database update.');
});

test('Atom: tarihsiz kayıt null tarihle döner', async () => {
  const k = rssAyristir(await oku('atom.xml'));
  assert.equal(k[1].tarih, null);
});

test('bozuk ve boş girdi çökmez', () => {
  assert.deepEqual(rssAyristir(''), []);
  assert.deepEqual(rssAyristir(null), []);
  assert.deepEqual(rssAyristir('<rss><channel>yarım'), []);
  assert.deepEqual(rssAyristir('<item><title>başlık yok link</title></item>'), []);
});
