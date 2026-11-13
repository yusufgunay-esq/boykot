/* filtre.test.mjs — durum/kategori/liste süzgeci ve Türkçe duyarlı arama. Saf modül. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrele, kucuk } from '../js/filtre.js';

const L = [
  { id: 'a', ad: 'Chevron', ulke: 'US', sehir: 'Houston', kod: 'VRL-0001', durum: 'bds', kategori: 'Enerji', liste: ['bds'], markalar: ['Chevron', 'Caltex'] },
  { id: 'b', ad: 'Airbnb', ulke: 'US', sehir: 'San Francisco', kod: 'VRL-0002', durum: 'baski', kategori: 'Turizm', liste: ['ohchr'], markalar: ['Airbnb'] },
  { id: 'c', ad: 'Şişli Tekstil', ulke: 'TR', sehir: 'İstanbul', kod: 'VRL-0003', durum: 'sonuc', kategori: 'Giyim', liste: ['ulke'], markalar: ['Şişli'] }
];

test('Türkçe aksan katlama', () => {
  assert.equal(kucuk('ŞİŞLİ'), 'sisli');
  assert.equal(kucuk('İstanbul'), 'istanbul');
  assert.equal(kucuk('IŞIK'), 'isik');
  assert.equal(kucuk('Crème Brûlée'), 'creme brulee');
});

test('durum süzgeci', () => {
  assert.deepEqual(filtrele(L, { durumF: new Set(['bds']) }).map(s => s.id), ['a']);
  assert.deepEqual(filtrele(L, { durumF: new Set(['bds', 'sonuc']) }).map(s => s.id), ['a', 'c']);
});

test('kategori süzgeci', () => {
  assert.deepEqual(filtrele(L, { katF: new Set(['Turizm']) }).map(s => s.id), ['b']);
});

test('kaynak liste süzgeci', () => {
  assert.deepEqual(filtrele(L, { listeF: new Set(['ohchr']) }).map(s => s.id), ['b']);
  assert.deepEqual(filtrele(L, { listeF: new Set(['bds', 'ulke']) }).map(s => s.id), ['a', 'c']);
});

test('sorgu: aksansız ve büyük/küçük harf duyarsız', () => {
  assert.deepEqual(filtrele(L, { sorgu: 'sisli' }).map(s => s.id), ['c']);
  assert.deepEqual(filtrele(L, { sorgu: 'ISTANBUL' }).map(s => s.id), ['c']);
  assert.deepEqual(filtrele(L, { sorgu: 'chevron' }).map(s => s.id), ['a']);
});

test('sorgu: marka, ülke ve kod üzerinden', () => {
  assert.deepEqual(filtrele(L, { sorgu: 'caltex' }).map(s => s.id), ['a']);
  assert.deepEqual(filtrele(L, { sorgu: 'us' }).map(s => s.id), ['a', 'b']);
  assert.deepEqual(filtrele(L, { sorgu: 'vrl-0003' }).map(s => s.id), ['c']);
});

test('kategoriAd ve ekMetin aramaya katılır', () => {
  const kategoriAd = k => ({ Enerji: 'energy petrol' }[k] || k);
  const ekMetin = s => s.id === 'a' ? 'leviathan field' : '';
  assert.deepEqual(filtrele(L, { sorgu: 'petrol', kategoriAd }).map(s => s.id), ['a']);
  assert.deepEqual(filtrele(L, { sorgu: 'leviathan', ekMetin }).map(s => s.id), ['a']);
});

test('süzgeçler birlikte çalışır, boş sonuç dönebilir', () => {
  assert.deepEqual(filtrele(L, { durumF: new Set(['bds']), sorgu: 'airbnb' }), []);
});

test('boş sorgu tüm listeyi döndürür', () => {
  assert.equal(filtrele(L, { sorgu: '   ' }).length, 3);
  assert.equal(filtrele(null, { sorgu: 'x' }).length, 0);
});
