#!/usr/bin/env node
/* kaynak-denetle.mjs — veri dosyalarındaki kaynak URL'lerinin canlılığını ve içerik tipini raporlar.
   Veri dosyalarını DEĞİŞTİRMEZ. Rapor stdout'a JSON olarak yazılır; --rapor verilirse ayrı bir
   rapor dosyasına da yazılır. */

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { basDenetle, esZamanli } from './http.mjs';
import { raporMetni } from './lib/rapor.mjs';

const VERI = 'data/sirketler.json';
const HABER = 'data/haberler.json';

/* Veri dosyalarındaki benzersiz https URL'leri toplar. */
export function kaynakUrl(sirketler, haberler) {
  const set = new Set();
  for (const s of sirketler || []) for (const k of s.kaynak || []) if (Array.isArray(k) && /^https:\/\//.test(k[1])) set.add(k[1]);
  for (const h of haberler || []) if (h && /^https:\/\//.test(h.url)) set.add(h.url);
  return [...set];
}

function arglar(argv) {
  const a = { rapor: null, sinir: Infinity };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--rapor') a.rapor = argv[++i];
    else if (argv[i] === '--sinir') a.sinir = Number(argv[++i]) || Infinity;
  }
  return a;
}

async function calistir() {
  const a = arglar(process.argv.slice(2));
  const sirketler = (JSON.parse(await readFile(VERI, 'utf8')).sirketler) || [];
  let haberler = [];
  try { haberler = JSON.parse(await readFile(HABER, 'utf8')).haberler || []; } catch (e) { /* haber yok */ }
  const urller = kaynakUrl(sirketler, haberler).slice(0, a.sinir);

  const denetim = await esZamanli(urller.map(u => async () => {
    const r = await basDenetle(u);
    /* Hata sebebi raporda görünmeli; yoksa "hata" satırı teşhis edilemez. */
    return r.durum === 'hata'
      ? { url: u, durum: r.durum, kod: null, tip: '', boyut: null, hata: r.hata || 'bilinmeyen' }
      : { url: u, durum: r.durum, kod: r.kod, tip: r.tip, boyut: r.boyut };
  }));

  const rapor = { surum: 1, tarih: new Date().toISOString(), denetim };
  if (a.rapor) await writeFile(a.rapor, JSON.stringify(rapor, null, 1) + '\n', 'utf8');
  console.log(JSON.stringify(rapor, null, 1));
  console.error(raporMetni(rapor));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  calistir().catch(e => { console.error('hata: ' + (e.message || e)); process.exit(1); });
}
