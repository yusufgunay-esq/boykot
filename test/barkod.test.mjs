/* barkod.test.mjs — EAN-13 doğrulaması ve 729 ön eki. Saf modül; ağ/DOM yok. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ean13, barkodDegerlendir } from '../js/barkod.js';

test('geçerli EAN-13 kabul edilir', () => {
  assert.equal(ean13('7290000000008'), true);
  assert.equal(ean13('4006381333931'), true);
});

test('yanlış denetim hanesi reddedilir', () => {
  assert.equal(ean13('4006381333932'), false);
  assert.equal(ean13('7290000000004'), false);
});

test('13 hane dışı girdi hane kuralına takılır', () => {
  assert.deepEqual(barkodDegerlendir('123').tur, 'uzunluk');
  assert.deepEqual(barkodDegerlendir('').tur, 'uzunluk');
  assert.deepEqual(barkodDegerlendir('12345678901234').tur, 'uzunluk');
});

test('boşluk ve tire temizlenir', () => {
  assert.equal(barkodDegerlendir('729 0000 000008').tur, 'bds');
  assert.equal(barkodDegerlendir('729-0000-000008').tur, 'bds');
});

test('729 ön eki BDS olarak işaretlenir', () => {
  const d = barkodDegerlendir('7290000000008');
  assert.equal(d.tur, 'bds');
  assert.equal(d.onek, '729');
});

test('729 dışı geçerli kod temiz sayılır', () => {
  const d = barkodDegerlendir('4006381333931');
  assert.equal(d.tur, 'temiz');
  assert.equal(d.onek, '400');
});

test('denetim hanesi hatalı kod ayrı tur döner', () => {
  assert.equal(barkodDegerlendir('4006381333932').tur, 'hane');
});
