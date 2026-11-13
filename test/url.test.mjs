/* url.test.mjs — kanonikleştirme. Ağ yok. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { kanonik, httpsMu, alanAdi } from '../araclar/lib/url.mjs';

test('izleme parametreleri ayıklanır', () => {
  assert.equal(
    kanonik('https://ornek.test/haber/a?utm_source=rss&utm_medium=feed&id=7'),
    'https://ornek.test/haber/a?id=7'
  );
  assert.equal(
    kanonik('https://ornek.test/a?fbclid=x&gclid=y&mc_cid=z'),
    'https://ornek.test/a'
  );
});

test('sorgu parametreleri sıralanır', () => {
  assert.equal(
    kanonik('https://ornek.test/a?b=2&a=1&c=3'),
    'https://ornek.test/a?a=1&b=2&c=3'
  );
});

test('host küçültülür, www. atılır, varsayılan port düşer', () => {
  assert.equal(kanonik('HTTPS://WWW.Ornek.TEST:443/A'), 'https://ornek.test/A');
  assert.equal(kanonik('http://ornek.test:80/a'), 'http://ornek.test/a');
});

test('fragment ve sondaki eğik çizgi atılır, kök korunur', () => {
  assert.equal(kanonik('https://ornek.test/haber/#bolum'), 'https://ornek.test/haber');
  assert.equal(kanonik('https://ornek.test/'), 'https://ornek.test/');
});

test('aynı haberin kopyaları aynı kanonik URL üretir', () => {
  const a = kanonik('https://www.ornek.test/haber/x/?utm_source=a');
  const b = kanonik('https://ornek.test/haber/x#yorum');
  assert.equal(a, b);
});

test('göreli adres tabanla çözülür', () => {
  assert.equal(kanonik('/haber/x?b=2&a=1', 'https://ornek.test/kok/'), 'https://ornek.test/haber/x?a=1&b=2');
});

test('geçersiz ve desteklenmeyen adresler null', () => {
  assert.equal(kanonik(''), null);
  assert.equal(kanonik('javascript:alert(1)'), null);
  assert.equal(kanonik('ftp://ornek.test/a'), null);
  assert.equal(kanonik('boşluk lu adres'), null);
});

test('httpsMu yalnız https kabul eder', () => {
  assert.equal(httpsMu('https://ornek.test/a'), true);
  assert.equal(httpsMu('http://ornek.test/a'), false);
  assert.equal(httpsMu('ornek.test'), false);
  assert.equal(httpsMu(''), false);
});

test('alanAdi www. temizler', () => {
  assert.equal(alanAdi('https://www.ornek.test/a'), 'ornek.test');
  assert.equal(alanAdi('bozuk'), '');
});
