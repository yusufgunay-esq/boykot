/* sema.test.mjs — data/ dosyalarının şeması. Ağ yok; gerçek veri okunur. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const oku = async yol => JSON.parse(await readFile(new URL('../' + yol, import.meta.url), 'utf8'));
const DURUMLAR = new Set(['bds', 'baski', 'halk', 'sonuc']);
const LISTELER = new Set(['bds', 'ohchr', 'ulke']);
const dolu = d => typeof d === 'string' && d.trim().length > 0;
const dort = d => Array.isArray(d) && d.length === 4 && d.every(dolu);

test('sirketler.json: üst şema', async () => {
  const p = await oku('data/sirketler.json');
  assert.equal(typeof p.surum, 'number');
  assert.ok(Array.isArray(p.sirketler) && p.sirketler.length > 0);
});

test('sirketler.json: her kayıt zorunlu alanları taşır', async () => {
  const { sirketler } = await oku('data/sirketler.json');
  for (const s of sirketler) {
    assert.match(s.id, /^[a-z0-9-]+$/, 'id biçimi: ' + s.id);
    assert.ok(dolu(s.ad), 'ad: ' + s.id);
    assert.match(s.ulke, /^[A-Z]{2}$/, 'ülke kodu: ' + s.id);
    assert.ok(dolu(s.sehir), 'şehir: ' + s.id);
    /* Kaynakta şehir yoksa uydurulmaz: "—" yazılır ve koordinat ülke düzeyindedir. */
    if (s.sehir === '—') assert.equal(s.konumKesin, false, 'şehirsiz kayıt ülke koordinatlı olmalı: ' + s.id);
    if (s.konumKesin === false) assert.equal(s.sehir, '—', 'ülke koordinatlı kayıt şehir taşımamalı: ' + s.id);
    assert.ok(Number.isFinite(s.lat) && s.lat >= -90 && s.lat <= 90, 'lat: ' + s.id);
    assert.ok(Number.isFinite(s.lng) && s.lng >= -180 && s.lng <= 180, 'lng: ' + s.id);
    assert.ok(dolu(s.kategori), 'kategori: ' + s.id);
    assert.ok(DURUMLAR.has(s.durum), 'durum: ' + s.id + ' → ' + s.durum);
    assert.ok(Array.isArray(s.markalar) && s.markalar.length > 0 && s.markalar.every(dolu), 'markalar: ' + s.id);
    assert.ok(dort(s.neden), 'neden 4 dil dolu değil: ' + s.id);
    assert.ok(Array.isArray(s.liste) && s.liste.length > 0 && s.liste.every(l => LISTELER.has(l)), 'liste: ' + s.id);
  }
});

test('sirketler.json: id benzersiz', async () => {
  const { sirketler } = await oku('data/sirketler.json');
  const gorulen = new Set();
  for (const s of sirketler) {
    assert.ok(!gorulen.has(s.id), 'yinelenen id: ' + s.id);
    gorulen.add(s.id);
  }
});

test('sirketler.json: olaylar tarih + 4 dilli metin', async () => {
  const { sirketler } = await oku('data/sirketler.json');
  for (const s of sirketler) {
    assert.ok(Array.isArray(s.zaman) && s.zaman.length > 0, 'zaman boş: ' + s.id);
    for (const z of s.zaman) {
      assert.ok(Array.isArray(z) && z.length === 2, 'zaman kaydı: ' + s.id);
      assert.match(String(z[0]), /^\d{4}(-\d{2}){0,2}$/, 'tarih biçimi: ' + s.id + ' → ' + z[0]);
      assert.ok(dort(z[1]), 'olay 4 dil dolu değil: ' + s.id + ' → ' + z[0]);
    }
  }
});

test('sirketler.json: kaynaklar https, başlık 4 dilli, yıl geçerli', async () => {
  const { sirketler } = await oku('data/sirketler.json');
  for (const s of sirketler) {
    assert.ok(Array.isArray(s.kaynak) && s.kaynak.length > 0, 'kaynak yok: ' + s.id);
    for (const k of s.kaynak) {
      assert.ok(Array.isArray(k) && k.length === 3, 'kaynak üçlüsü: ' + s.id);
      assert.ok(dort(k[0]), 'kaynak başlığı 4 dil değil: ' + s.id);
      assert.match(k[1], /^https:\/\//, 'kaynak https değil: ' + s.id + ' → ' + k[1]);
      assert.match(String(k[2]), /^\d{4}$/, 'kaynak yılı: ' + s.id + ' → ' + k[2]);
    }
  }
});

test('sirketler.json: bağ (faaliyet sahası) varsa koordinat ve 4 dil', async () => {
  const { sirketler } = await oku('data/sirketler.json');
  for (const s of sirketler) {
    if (!s.bag) continue;
    assert.ok(Array.isArray(s.bag), 'bag dizi değil: ' + s.id);
    for (const b of s.bag) {
      assert.ok(Number.isFinite(b.lat) && b.lat >= -90 && b.lat <= 90, 'bağ lat: ' + s.id);
      assert.ok(Number.isFinite(b.lng) && b.lng >= -180 && b.lng <= 180, 'bağ lng: ' + s.id);
      assert.ok(dort(b.e), 'bağ adı 4 dil değil: ' + s.id);
    }
  }
});

test('haberler.json: şema ve şirket id bağları', async () => {
  const p = await oku('data/haberler.json');
  assert.equal(typeof p.surum, 'number');
  assert.ok(p.guncelleme === null || !Number.isNaN(Date.parse(p.guncelleme)), 'guncelleme ISO değil');
  assert.ok(Array.isArray(p.kaynaklar));
  assert.ok(Array.isArray(p.haberler));

  const { sirketler } = await oku('data/sirketler.json');
  const idler = new Set(sirketler.map(s => s.id));
  for (const h of p.haberler) {
    assert.ok(idler.has(h.sirketId), 'bilinmeyen şirket id: ' + h.sirketId);
    assert.ok(dolu(h.baslik), 'haber başlığı boş');
    assert.match(h.url, /^https:\/\//, 'haber URL https değil: ' + h.url);
    assert.ok(!Number.isNaN(Date.parse(h.tarih)), 'haber tarihi geçersiz: ' + h.tarih);
  }
  for (const k of p.kaynaklar) {
    assert.ok(dolu(k.ad), 'kaynak adı boş');
    assert.match(k.url, /^https:\/\//, 'kaynak URL https değil: ' + k.url);
  }
});
