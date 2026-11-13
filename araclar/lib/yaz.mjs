/* yaz.mjs — atomik dosya yazımı: aynı dizinde geçici dosya, sonra rename.
   Okuyucu hiçbir an yarım dosya görmez; işlem yarıda kalırsa geçici dosya silinir.
   Test: test/yaz.test.mjs */

import { writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

const YARIS_HATA = new Set(['EPERM', 'EBUSY', 'EACCES']);

function bekle(ms) { return new Promise(r => setTimeout(r, ms)); }

/* Windows'ta aynı hedefe yarışan rename anlık EPERM/EBUSY verebilir;
   artan kısa beklemeyle 5 deneme yapılır. */
async function tasi(gecici, yol) {
  for (let den = 1; den <= 5; den++) {
    try {
      await rename(gecici, yol);
      return;
    } catch (e) {
      if (!YARIS_HATA.has(e.code) || den === 5) throw e;
      await bekle(20 * 2 ** (den - 1));
    }
  }
}

export async function atomikYaz(yol, icerik) {
  await mkdir(dirname(yol), { recursive: true });
  const gecici = yol + '.' + process.pid + '.' + Math.random().toString(36).slice(2) + '.tmp';
  try {
    await writeFile(gecici, icerik, 'utf8');
    await tasi(gecici, yol);
  } catch (e) {
    try { await unlink(gecici); } catch (_) { /* geçici dosya yoktu */ }
    throw e;
  }
}

/* Siteyle aynı biçim: 1 boşluk girinti + satır sonu. */
export function jsonMetni(veri) {
  return JSON.stringify(veri, null, 1) + '\n';
}

export async function jsonYaz(yol, veri) {
  await atomikYaz(yol, jsonMetni(veri));
}
