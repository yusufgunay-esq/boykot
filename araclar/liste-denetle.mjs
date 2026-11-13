#!/usr/bin/env node
/* liste-denetle.mjs — BDS / UN OHCHR / ülke listelerini veriyle karşılaştırır.
   Yalnız rapor üretir; veri dosyalarını ASLA değiştirmez.
   Ayrıştırma şüphesinde fark üretmez (supheli:true, yeni/eksik boş).
   --kuru: test/fikstur/liste-*.html dosyalarını okur, ağa çıkmaz. */

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { httpAl, esZamanli } from './http.mjs';
import { listeAyristir, listeKarsilastir } from './lib/liste.mjs';

const VERI = 'data/sirketler.json';

export const LISTELER = [
  { anahtar: 'bds', ad: 'BDS', url: 'https://bdsmovement.net/Guide-to-BDS-Boycott' },
  { anahtar: 'ohchr', ad: 'UN OHCHR', url: 'https://www.ohchr.org/en/hr-bodies/hrc/ffm/opt-businesses' },
  { anahtar: 'ulke', ad: 'Ülke listesi', url: '' }
];

/* Veri kümesinden liste başına adlar. */
export function veriAdlari(sirketler, anahtar) {
  return (sirketler || []).filter(s => (s.liste || []).includes(anahtar)).map(s => s.ad);
}

/* Raporu kurar. girdiler: {anahtar:{html}} */
export function raporKur(sirketler, girdiler, tarih = new Date().toISOString()) {
  const listeler = [];
  for (const l of LISTELER) {
    if (!l.url && l.anahtar === 'ulke') {
      listeler.push({ ad: l.ad, anahtar: l.anahtar, url: null, supheli: true, kayit: 0, yeni: [], eksik: [], not: 'ülke listesi için tek bir kaynak URL yok' });
      continue;
    }
    const g = (girdiler || {})[l.anahtar];
    if (!g || typeof g.html !== 'string') {
      listeler.push({ ad: l.ad, anahtar: l.anahtar, url: l.url, supheli: true, kayit: 0, yeni: [], eksik: [], not: 'sayfa alınamadı' });
      continue;
    }
    const ayrisim = listeAyristir(g.html);
    const karsi = listeKarsilastir(ayrisim, veriAdlari(sirketler, l.anahtar));
    listeler.push({
      ad: l.ad,
      anahtar: l.anahtar,
      url: l.url,
      supheli: karsi.supheli,
      kayit: ayrisim.kayitlar.length,
      yeni: karsi.yeni,
      eksik: karsi.eksik,
      not: ayrisim.not || ''
    });
  }
  const fark = listeler.reduce((a, l) => a + l.yeni.length + l.eksik.length, 0);
  return { surum: 1, tarih, fark, listeler };
}

function arglar(argv) {
  const a = { kuru: false, rapor: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--kuru') a.kuru = true;
    else if (argv[i] === '--rapor') a.rapor = argv[++i];
  }
  return a;
}

async function calistir() {
  const a = arglar(process.argv.slice(2));
  const sirketler = (JSON.parse(await readFile(VERI, 'utf8')).sirketler) || [];
  const girdiler = {};

  if (a.kuru) {
    girdiler.bds = { html: await readFile('test/fikstur/liste-bds.html', 'utf8') };
    girdiler.ohchr = { html: await readFile('test/fikstur/liste-ohchr.html', 'utf8') };
  } else {
    await esZamanli(LISTELER.filter(l => l.url).map(l => async () => {
      try { girdiler[l.anahtar] = { html: (await httpAl(l.url)).metin }; }
      catch (e) { console.error(l.ad + ' alınamadı: ' + e.message); }
    }));
  }

  const rapor = raporKur(sirketler, girdiler);
  const metin = JSON.stringify(rapor, null, 1);
  if (a.rapor) await writeFile(a.rapor, metin + '\n', 'utf8');
  console.log(metin);
  if (rapor.fark > 0) console.error('liste farkı: ' + rapor.fark + ' kayıt (veri değiştirilmedi)');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  calistir().catch(e => { console.error('hata: ' + (e.message || e)); process.exit(1); });
}
