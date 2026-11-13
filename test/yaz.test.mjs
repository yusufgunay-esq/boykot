/* yaz.test.mjs — atomik yazma. Geçici dizinde çalışır; depoya dosya bırakmaz. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { atomikYaz, jsonYaz, jsonMetni } from '../araclar/lib/yaz.mjs';

async function gecici() {
  return mkdtemp(join(tmpdir(), 'boykot-yaz-'));
}

test('atomikYaz içeriği yazar, geçici dosya bırakmaz', async () => {
  const d = await gecici();
  try {
    const yol = join(d, 'a.json');
    await atomikYaz(yol, '{"a":1}');
    assert.equal(await readFile(yol, 'utf8'), '{"a":1}');
    assert.deepEqual(await readdir(d), ['a.json']);
  } finally { await rm(d, { recursive: true, force: true }); }
});

test('jsonYaz 1 boşluk girinti ve satır sonu kullanır', async () => {
  const d = await gecici();
  try {
    const yol = join(d, 'b.json');
    const veri = { surum: 1, haberler: [{ a: 1 }] };
    await jsonYaz(yol, veri);
    assert.equal(await readFile(yol, 'utf8'), jsonMetni(veri));
    assert.equal(JSON.parse(await readFile(yol, 'utf8')).surum, 1);
  } finally { await rm(d, { recursive: true, force: true }); }
});

test('var olan dosya bütün olarak değişir', async () => {
  const d = await gecici();
  try {
    const yol = join(d, 'c.txt');
    await atomikYaz(yol, 'eski uzun içerik');
    await atomikYaz(yol, 'yeni');
    assert.equal(await readFile(yol, 'utf8'), 'yeni');
  } finally { await rm(d, { recursive: true, force: true }); }
});

test('eşzamanlı yazmalar bozuk dosya bırakmaz', async () => {
  const d = await gecici();
  try {
    const yol = join(d, 'd.json');
    await Promise.all(Array.from({ length: 8 }, (_, i) => jsonYaz(yol, { i, dolgu: 'x'.repeat(2000) })));
    const son = JSON.parse(await readFile(yol, 'utf8'));
    assert.equal(typeof son.i, 'number');
    assert.equal(son.dolgu.length, 2000);
    assert.deepEqual((await readdir(d)).filter(x => x.endsWith('.tmp')), []);
  } finally { await rm(d, { recursive: true, force: true }); }
});

test('olmayan alt dizin oluşturulur', async () => {
  const d = await gecici();
  try {
    const yol = join(d, 'alt', 'klasor', 'e.json');
    await jsonYaz(yol, { ok: true });
    assert.equal(JSON.parse(await readFile(yol, 'utf8')).ok, true);
  } finally { await rm(d, { recursive: true, force: true }); }
});
