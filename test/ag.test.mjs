/* ag.test.mjs — AĞ yerleşimi: sektör dilimleri, düğüm konumları, etiket çakışması, süzgeç kararlılığı. Saf. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { agYerlesim } from '../js/ag.js';

const KAT = ['Enerji', 'Gıda', 'Finans', 'Medya'];
const DURUMLAR = ['bds', 'baski', 'halk', 'sonuc'];
const W = 760, H = 680;

function veri() {
  const l = [];
  KAT.forEach((k, ki) => {
    const n = [13, 7, 3, 1][ki];
    for (let i = 0; i < n; i++) l.push({
      id: `${ki}-${i}`, ad: `Varlık ${ki}-${i}`, kategori: k, durum: DURUMLAR[i % 4],
      ulke: ['TR', 'US', 'IL'][i % 3], markalar: [], kaynak: [], zaman: []
    });
  });
  return l;
}

test('her görünür varlık tam bir kez yerleşir', () => {
  const S = veri(), Y = agYerlesim(S, S, KAT, W, H);
  const idler = Y.sektorler.flatMap(s => s.dugumler.map(d => d.s.id));
  assert.equal(idler.length, S.length);
  assert.equal(new Set(idler).size, S.length);
});

test('sektör dilimleri 2π’yi kapatır; süzgeç geometriyi oynatmaz', () => {
  const S = veri(), Y = agYerlesim(S, S, KAT, W, H);
  const toplam = Y.sektorler.reduce((a, s) => a + s.span, 0);
  assert.ok(Math.abs(toplam - Math.PI * 2) < 1e-9, 'toplam: ' + toplam);
  assert.deepEqual(Y.sektorler.map(s => s.kategori), KAT);

  const sadeceEnerji = S.filter(s => s.kategori === 'Enerji');
  const Y2 = agYerlesim(S, sadeceEnerji, KAT, W, H);
  const a = Y.sektorler.find(s => s.kategori === 'Enerji'), b = Y2.sektorler.find(s => s.kategori === 'Enerji');
  assert.equal(a.span, b.span);
  assert.deepEqual(a.hub, b.hub);
  assert.equal(Y2.toplam, sadeceEnerji.length);
});

test('düğümler yay üzerinde ve kendi diliminde kalır', () => {
  const S = veri(), Y = agYerlesim(S, S, KAT, W, H);
  for (const sek of Y.sektorler) for (const d of sek.dugumler) {
    const r = Math.hypot(d.x - Y.cx, d.y - Y.cy);
    assert.ok(Math.abs(r - Y.R2) < 0.5, 'yarıçap ' + r);
    let fark = d.a - sek.bas;
    if (fark < 0) fark += Math.PI * 2;
    assert.ok(fark >= -1e-9 && fark <= sek.span + 1e-9, `açı ${d.a} dilim ${sek.bas}+${sek.span}`);
  }
});

test('etiketler sağ/sol sütunda çakışmaz ve sahne içinde kalır', () => {
  const S = veri(), Y = agYerlesim(S, S, KAT, W, H);
  for (const yan of ['sag', 'sol']) {
    const l = Y.sektorler.map(s => s.etiket).filter(e => e.yan === yan).sort((a, b) => a.y - b.y);
    for (let i = 1; i < l.length; i++) assert.ok(l[i].y - l[i - 1].y >= 15.99, 'boşluk ' + (l[i].y - l[i - 1].y));
    for (const e of l) {
      assert.ok(e.y >= 60 - 1e-9, 'üst: ' + e.y);
      assert.ok(e.y <= H - 42 + 1e-9, 'alt: ' + e.y);
    }
  }
});

test('güvenli kutu: halka panellerin arasına ortalanır', () => {
  const S = veri(), K = { x: 300, y: 0, w: 760, h: 656 };
  const Y = agYerlesim(S, S, KAT, 1440, 856, K);
  assert.equal(Y.cx, 680);
  assert.equal(Y.cy, 328);
  assert.equal(Y.dar, false);
  assert.equal(Y.sik, false);
  assert.ok(Y.R2 <= K.h / 2 - 54 + 1e-9, 'R2 ' + Y.R2);
  for (const s of Y.sektorler) for (const d of s.dugumler) {
    assert.ok(d.x >= K.x - 1 && d.x <= K.x + K.w + 1);
    assert.ok(d.y >= K.y - 1 && d.y <= K.y + K.h + 1);
  }
});

test('dar ekranda halka sahneye sığar ve rim etiketleri kapanır', () => {
  const S = veri();
  for (const [w, h] of [[390, 540], [480, 640]]) {
    const Y = agYerlesim(S, S, KAT, w, h);
    assert.equal(Y.dar, true);
    assert.equal(Y.sik, true);
    assert.ok(Y.R2 + 14 < Math.min(w, h) / 2, `R2 ${Y.R2} sahne ${w}x${h}`);
    assert.ok(Y.sektorler.every(s => s.etiket.y === undefined));
  }
});

test('süzgeç düğümleri azaltır, sektörleri ve sırayı korur', () => {
  const S = veri(), Y = agYerlesim(S, S.filter(s => s.id.endsWith('-1')), KAT, W, H);
  assert.equal(Y.sektorler.length, KAT.length);
  assert.deepEqual(Y.sektorler.map(s => s.kategori), KAT);
  assert.equal(Y.toplam, S.filter(s => s.id.endsWith('-1')).length);
  assert.ok(Y.sektorler.some(s => s.n === 0), 'boş sektör görünmeli');
});
