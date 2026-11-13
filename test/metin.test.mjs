/* metin.test.mjs — Türkçe katlama, relevans, başlık benzerliği ve tekilleştirme. Saf. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { katla, sozcukler, normal, benzerlik, relevans, tekrarAyikla } from '../araclar/lib/metin.mjs';

test('Türkçe aksan katlama', () => {
  assert.equal(katla('ŞİŞLİ'), 'sisli');
  assert.equal(katla('IŞIK'), 'isik');
  assert.equal(katla('ÇĞÜÖİ'), 'cguoi');
  assert.equal(katla('İstanbul'), 'istanbul');
  assert.equal(katla('Crème Brûlée'), 'creme brulee');
  assert.equal(katla('Straße'), 'strasse');
});

test('sözcükler noktalama ve aksandan arınır', () => {
  assert.deepEqual(sozcukler('Şişli, İstanbul! 2026'), ['sisli', 'istanbul', '2026']);
  assert.equal(normal('  Çok   BOŞLUK  '), 'cok bosluk');
});

test('başlık benzerliği aynı haberi ≥0,85 sayar', () => {
  const a = 'Chevron agrees to buy Noble Energy for $5 billion';
  const b = 'Chevron to buy Noble Energy for $5 billion';
  assert.ok(benzerlik(a, b) >= 0.85, 'benzerlik: ' + benzerlik(a, b));
});

test('farklı haberler eşiğin altında kalır', () => {
  assert.ok(benzerlik('Chevron buys Noble Energy', 'Israel boycott targets Chevron') < 0.5);
  assert.equal(benzerlik('', 'başlık'), 0);
  assert.equal(benzerlik(null, null), 0);
});

test('relevans sözcük sınırına saygılıdır', () => {
  const s = { ad: 'Intel', markalar: ['Intel'] };
  assert.ok(relevans('Intel expands Arizona plant', s) >= 3);
  assert.equal(relevans('Intelligence agency annual review', s), 0);
});

test('relevans marka adını sayar, ülke adını saymaz', () => {
  const s = { ad: 'Chevron', markalar: ['Chevron', 'Caltex', 'Texaco'] };
  assert.ok(relevans('Caltex station closed', s) >= 2);
  assert.equal(relevans('Texaco and Caltex', s), 4);
  assert.equal(relevans('günlük hava durumu', s), 0);
});

test('tekrarAyikla: aynı URL ve benzer başlık tekilleşir', () => {
  const liste = [
    { url: 'https://a.test/1', baslik: 'Chevron agrees to buy Noble Energy for $5 billion' },
    { url: 'https://a.test/1', baslik: 'tamamen farklı başlık' },
    { url: 'https://a.test/2', baslik: 'Chevron to buy Noble Energy for $5 billion' },
    { url: 'https://a.test/3', baslik: 'Intel expands Arizona plant' }
  ];
  const k = tekrarAyikla(liste);
  assert.equal(k.length, 2);
  assert.equal(k[0].url, 'https://a.test/1');
  assert.equal(k[1].url, 'https://a.test/3');
});

test('tekrarAyikla eşiği değiştirilebilir', () => {
  const liste = [
    { url: 'https://a.test/1', baslik: 'Chevron buys Noble Energy' },
    { url: 'https://a.test/2', baslik: 'Chevron to buy Noble Energy' }
  ];
  assert.equal(tekrarAyikla(liste, { esik: 0.6 }).length, 1);
  assert.equal(tekrarAyikla(liste, { esik: 0.99 }).length, 2);
});
