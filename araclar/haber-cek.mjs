#!/usr/bin/env node
/* haber-cek.mjs — GDELT DOC 2.0 + RSS beslemelerinden şirket haberlerini toplar.
   Kurallar: son 90 gün · en çok 40 haber · kanonik URL + başlık benzerliği ≥%85 ile tekilleştirme ·
   atomik yazma · --kuru fikstür modu (ağa çıkmaz, veri dosyasına dokunmaz).
   Test: test/haber.test.mjs */

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { httpAl, esZamanli } from './http.mjs';
import { kanonik, alanAdi } from './lib/url.mjs';
import { relevans, tekrarAyikla } from './lib/metin.mjs';
import { rssAyristir } from './lib/rss.mjs';
import { jsonYaz } from './lib/yaz.mjs';

const VERI = 'data/sirketler.json';
const HEDEF = 'data/haberler.json';
const AZAMI = 40;
const GUN = 90;

export const RSS_KAYNAKLARI = [
  { ad: 'BDS Movement', url: 'https://bdsmovement.net/rss.xml' },
  { ad: 'The Electronic Intifada', url: 'https://electronicintifada.net/rss.xml' },
  { ad: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss' },
  { ad: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' }
];

export function gdeltAdresi() {
  const q = encodeURIComponent('(boycott OR BDS OR divestment OR "UN OHCHR")');
  return 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + q +
    '&mode=artlist&format=json&maxrecords=100&timespan=' + GUN + 'd&sort=datedesc';
}

/* GDELT "20261113T041500Z" ve RSS ISO tarihlerini ISO'ya çevirir. */
export function tarihCoz(deger) {
  const s = String(deger == null ? '' : deger).trim();
  const g = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  const d = g ? new Date(Date.UTC(+g[1], +g[2] - 1, +g[3], +g[4], +g[5], +g[6])) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function gdeltKayitlari(paket) {
  const makaleler = (paket && (paket.articles || paket.artlist)) || [];
  return makaleler.map(a => ({
    baslik: a.title || '',
    url: a.url || '',
    tarih: tarihCoz(a.seendate || a.date),
    ozet: a.domain || '',
    kaynakAd: a.domain || alanAdi(a.url)
  }));
}

function rssKayitlari(beslemeler) {
  return (beslemeler || []).flatMap(b => (b.kayitlar || []).map(k => ({
    baslik: k.baslik || '',
    url: k.url || '',
    tarih: k.tarih,
    ozet: k.ozet || '',
    kaynakAd: b.ad || alanAdi(k.url)
  })));
}

/* Saf derleme: ağ yok. Testler bunu fikstürlerle koşar. */
export function haberleriDerle({ gdelt, rss, sirketler, simdi = new Date(), azami = AZAMI, gun = GUN }) {
  const sinir = simdi.getTime() - gun * 24 * 60 * 60 * 1000;
  const adaylar = [...gdeltKayitlari(gdelt), ...rssKayitlari(rss)];

  const eslesen = [];
  for (const a of adaylar) {
    if (!a.baslik || !a.url) continue;
    const url = kanonik(a.url);
    if (!url || !/^https:\/\//.test(url)) continue;
    const t = a.tarih ? new Date(a.tarih) : null;
    if (!t || t.getTime() < sinir || t.getTime() > simdi.getTime() + 24 * 60 * 60 * 1000) continue;

    let enIyi = null, enIyiPuan = 0;
    for (const s of sirketler) {
      const puan = relevans(a.baslik + ' ' + a.ozet, s);
      if (puan > enIyiPuan) { enIyi = s; enIyiPuan = puan; }
    }
    if (!enIyi) continue;

    eslesen.push({
      sirketId: enIyi.id,
      baslik: String(a.baslik).replace(/\s+/g, ' ').trim(),
      url,
      kaynakAd: a.kaynakAd || alanAdi(url),
      tarih: t.toISOString(),
      _puan: enIyiPuan
    });
  }

  /* Aynı URL ve ≥%85 benzer başlık tekilleştirilir; daha yüksek relevans önce gelir. */
  eslesen.sort((a, b) => b._puan - a._puan || String(b.tarih).localeCompare(String(a.tarih)));
  const tekil = tekrarAyikla(eslesen, { esik: 0.85 });
  tekil.sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
  return tekil.slice(0, azami).map(({ _puan, ...h }) => h);
}

export function kaynakListesi(rss, gdeltKullanildi) {
  const liste = [];
  if (gdeltKullanildi) liste.push({ ad: 'GDELT DOC 2.0', url: 'https://api.gdeltproject.org/' });
  for (const b of rss || []) if ((b.kayitlar || []).length) liste.push({ ad: b.ad, url: b.url });
  return liste;
}

/* ---------- CLI ---------- */
function arglar(argv) {
  const a = { kuru: false, cikti: null, azami: AZAMI, gun: GUN };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--kuru') a.kuru = true;
    else if (x === '--cikti') a.cikti = argv[++i];
    else if (x === '--azami') a.azami = Number(argv[++i]) || AZAMI;
    else if (x === '--gun') a.gun = Number(argv[++i]) || GUN;
  }
  return a;
}

async function fiksturOku(yol) {
  return JSON.parse(await readFile(yol, 'utf8'));
}

async function calistir() {
  const a = arglar(process.argv.slice(2));
  const sirketler = (JSON.parse(await readFile(VERI, 'utf8')).sirketler) || [];
  let gdelt = null, rss = [], gdeltKullanildi = false;

  if (a.kuru) {
    gdelt = await fiksturOku('test/fikstur/gdelt.json');
    gdeltKullanildi = true;
    const xml = await readFile('test/fikstur/rss.xml', 'utf8');
    rss = [{ ad: 'Fikstür RSS', url: 'https://ornek.test/rss.xml', kayitlar: rssAyristir(xml) }];
  } else {
    try {
      const y = await httpAl(gdeltAdresi());
      gdelt = JSON.parse(y.metin); gdeltKullanildi = true;
    } catch (e) { console.error('GDELT alınamadı: ' + e.message); }

    rss = await esZamanli(RSS_KAYNAKLARI.map(b => async () => {
      try {
        const y = await httpAl(b.url);
        return { ...b, kayitlar: rssAyristir(y.metin) };
      } catch (e) {
        console.error('RSS alınamadı (' + b.ad + '): ' + e.message);
        return { ...b, kayitlar: [] };
      }
    }));
  }

  const haberler = haberleriDerle({ gdelt, rss, sirketler, azami: a.azami, gun: a.gun });

  let onceki = { surum: 1 };
  try { onceki = JSON.parse(await readFile(HEDEF, 'utf8')); } catch (e) { /* ilk çalıştırma */ }

  const paket = {
    surum: Number(onceki.surum) || 1,
    guncelleme: new Date().toISOString(),
    kaynaklar: kaynakListesi(rss, gdeltKullanildi),
    haberler
  };

  const hedef = a.cikti || (a.kuru ? null : HEDEF);
  if (hedef) await jsonYaz(hedef, paket);

  console.log(JSON.stringify({
    kuru: a.kuru,
    haber: haberler.length,
    sirket: new Set(haberler.map(h => h.sirketId)).size,
    kaynak: paket.kaynaklar.length,
    yazildi: hedef || '(yazılmadı)'
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  calistir().catch(e => { console.error('hata: ' + (e.message || e)); process.exit(1); });
}
