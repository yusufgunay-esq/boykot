/* haber.test.mjs — haber derleme hattı: 90 gün, https, relevans, kanonik URL, ≥%85 tekilleştirme, ≤40.
   Fikstürlerle ve ağsız çalışır. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { haberleriDerle, tarihCoz, kaynakListesi, gdeltAdresi } from '../araclar/haber-cek.mjs';
import { rssAyristir } from '../araclar/lib/rss.mjs';

const SIMDI = new Date('2026-11-13T12:00:00Z');
const SIRKETLER = [
  { id: 'chevron', ad: 'Chevron', markalar: ['Chevron', 'Caltex', 'Texaco'] },
  { id: 'intel', ad: 'Intel', markalar: ['Intel'] },
  { id: 'bae', ad: 'BAE Systems', markalar: ['BAE Systems'] },
  { id: 'airbnb', ad: 'Airbnb', markalar: ['Airbnb'] }
];

async function kos(kosul = {}) {
  const gdelt = JSON.parse(await readFile(new URL('./fikstur/gdelt.json', import.meta.url), 'utf8'));
  const xml = await readFile(new URL('./fikstur/rss.xml', import.meta.url), 'utf8');
  const rss = [{ ad: 'Fikstür RSS', url: 'https://ornek.test/rss.xml', kayitlar: rssAyristir(xml) }];
  return haberleriDerle({ gdelt, rss, sirketler: SIRKETLER, simdi: SIMDI, ...kosul });
}

test('yalnız şirkete bağlanan ve 90 gün içindeki haberler kalır', async () => {
  const h = await kos();
  assert.ok(h.length > 0);
  for (const x of h) {
    assert.ok(SIRKETLER.some(s => s.id === x.sirketId), 'bilinmeyen şirket: ' + x.sirketId);
    const t = Date.parse(x.tarih);
    assert.ok(t >= SIMDI.getTime() - 90 * 86400000, 'eski haber kaldı: ' + x.tarih);
  }
  assert.ok(!h.some(x => /Local weather/.test(x.baslik)));
  assert.ok(!h.some(x => /Intelligence agency/.test(x.baslik)), '"intel" yanlış eşleşti');
  assert.ok(!h.some(x => /Eski haber/.test(x.baslik)), '90 gün dışı kayıt kaldı');
});

test('https olmayan bağlantı veriye alınmaz', async () => {
  const h = await kos();
  assert.ok(h.every(x => x.url.startsWith('https://')));
  assert.ok(!h.some(x => x.baslik === 'HP supply chain note'));
});

test('URL kanonik: izleme parametreleri temizlenir', async () => {
  const h = await kos();
  for (const x of h) {
    assert.ok(!/[?&](utm_|fbclid|gclid)/.test(x.url), 'izleme parametresi kaldı: ' + x.url);
  }
});

test('aynı haber iki kez girmez (URL + başlık benzerliği ≥%85)', async () => {
  const h = await kos();
  const chevron = h.filter(x => x.sirketId === 'chevron' && /Noble Energy/.test(x.baslik));
  assert.equal(chevron.length, 1, 'Chevron kopyaları: ' + chevron.map(x => x.baslik).join(' | '));
  const bae = h.filter(x => x.sirketId === 'bae');
  assert.equal(bae.length, 1);
  const adresler = new Set(h.map(x => x.url));
  assert.equal(adresler.size, h.length);
});

test('haber kayıtları veri şemasına uyar', async () => {
  const h = await kos();
  for (const x of h) {
    assert.equal(typeof x.sirketId, 'string');
    assert.ok(x.baslik.length > 0);
    assert.match(x.url, /^https:\/\//);
    assert.ok(!Number.isNaN(Date.parse(x.tarih)));
    assert.ok(x.kaynakAd.length > 0);
    assert.deepEqual(Object.keys(x).sort(), ['baslik', 'kaynakAd', 'sirketId', 'tarih', 'url']);
  }
});

test('en çok 40 haber', async () => {
  const gdelt = {
    articles: Array.from({ length: 60 }, (_, i) => ({
      title: 'Chevron statement number ' + i + ' about gas field ' + i,
      url: 'https://ornek.test/cok/' + i,
      seendate: '202611' + String(10 + (i % 3)).padStart(2, '0') + 'T100000Z',
      domain: 'ornek.test'
    }))
  };
  const h = haberleriDerle({ gdelt, rss: [], sirketler: SIRKETLER, simdi: SIMDI });
  assert.ok(h.length <= 40);
  assert.ok(h.length > 0);
});

test('tarih çözümü GDELT ve ISO biçimlerini kabul eder', () => {
  assert.equal(tarihCoz('20261113T041500Z'), '2026-11-13T04:15:00.000Z');
  assert.equal(tarihCoz('2026-11-13T04:15:00Z'), '2026-11-13T04:15:00.000Z');
  assert.equal(tarihCoz('bozuk'), null);
});

test('kaynak listesi yalnız kullanılan kaynakları yazar', () => {
  assert.deepEqual(kaynakListesi([], false), []);
  const l = kaynakListesi([{ ad: 'Bir', url: 'https://a.test/rss', kayitlar: [1] }, { ad: 'Boş', url: 'https://b.test/rss', kayitlar: [] }], true);
  assert.deepEqual(l.map(x => x.ad), ['GDELT DOC 2.0', 'Bir']);
  assert.match(gdeltAdresi(), /^https:\/\/api\.gdeltproject\.org\/api\/v2\/doc\/doc\?/);
  assert.match(gdeltAdresi(), /timespan=90d/);
});
