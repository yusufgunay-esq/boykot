#!/usr/bin/env node
/* ekran-cek.mjs — prototipi ve siteyi yerel sunucudan açar, Playwright ile ekran görüntüsü alır.
   Kullanım:
     node araclar/ekran-cek.mjs --ad v06-koyu-genel
     node araclar/ekran-cek.mjs --ad v06-koyu-secili --sec
     node araclar/ekran-cek.mjs --ad v06-brifing --brifing
     node araclar/ekran-cek.mjs --ad v06-mobil --genislik 390 --yukseklik 844
     node araclar/ekran-cek.mjs --ad v06-acilis --acilis --acilis-an 700
     node araclar/ekran-cek.mjs --yan-yana --ad t4-genel   (prototip | site yan yana)
   Seçenekler: --site <html> (varsayılan tasarim/index.html), --cikis <dizin> (varsayılan _claude/kanit),
   --dil <tr|en|es|zh>, --playwright <modül yolu>, --bekle <ms>, --acilis (açılış perdesini kapatmadan çeker),
   --acilis-an <ms> (açılış karesinin zamanı), --yan-yana (tasarim/index.html + index.html birleşik),
   --hareket-azalt (prefers-reduced-motion: reduce), --olcum (açılış animasyonu süresini ölç).
   Çıktı JSON: her sayfa için konsol hatası ve yatay taşma. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const kok = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const arg = (ad, vars) => { const i = process.argv.indexOf('--' + ad); return i > -1 ? (vars === false ? true : process.argv[i + 1]) : null; };
const site = arg('site') || 'tasarim/index.html';
const cikis = path.resolve(kok, arg('cikis') || '_claude/kanit');
const ad = arg('ad') || 'ekran';
const genislik = +(arg('genislik') || 1440), yukseklik = +(arg('yukseklik') || 900);
const dil = arg('dil');
const bekle = +(arg('bekle') || 0);
const sec = arg('sec', false), brifing = arg('brifing', false), acilisCek = arg('acilis', false);
const yanYana = arg('yan-yana', false);
const acilisAn = arg('acilis-an');
const azHareket = arg('hareket-azalt', false);
const olcum = arg('olcum', false);
const SITELER = yanYana ? [
  { etiket: 'PROTOTİP · tasarim/index.html', site: 'tasarim/index.html', ek: 'prototip' },
  { etiket: 'SİTE · index.html', site: 'index.html', ek: 'site' }
] : [{ etiket: 'PROTOTİP', site, ek: null }];

function playwrightBul() {
  const require = createRequire(import.meta.url);
  const adaylar = [arg('playwright'), process.env.PLAYWRIGHT_MODUL].filter(Boolean);
  try { return require.resolve('playwright'); } catch {}
  for (const a of adaylar) { try { return require.resolve(a); } catch {} }
  const ust = path.dirname(kok);
  try {
    for (const d of fs.readdirSync(ust)) {
      const p = path.join(ust, d, 'node_modules', 'playwright');
      if (fs.existsSync(path.join(p, 'package.json'))) return p;
    }
  } catch {}
  throw new Error('Playwright bulunamadı. --playwright <modül yolu> ver ya da PLAYWRIGHT_MODUL ayarla.');
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function sunucu() {
  return new Promise(res => {
    const s = http.createServer((req, rep) => {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = path.join(kok, path.normalize(u).replace(/^([/\\])+/, ''));
      if (!f.startsWith(kok) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rep.writeHead(404); rep.end('yok'); return; }
      rep.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rep);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

const srv = await sunucu();
const { port } = srv.address();
const pw = createRequire(import.meta.url)(playwrightBul());
const tarayici = await pw.chromium.launch();
fs.mkdirSync(cikis, { recursive: true });

/* Açılış animasyonu süresi: brifing.js perde görünür olunca data-bas, animasyon bitince
   data-bitis yazar. Fark = animasyonun gerçek süresi; gecikme = gezinmeden perdeye kadar. */
async function acilisSuresi(sayfa) {
  return sayfa.evaluate(() => new Promise(res => {
    const el = document.querySelector('#acilis');
    if (!el) return res(null);
    const bas = performance.now();
    const bak = () => {
      if (el.dataset.bitis) return res({ ms: +el.dataset.bitis - +el.dataset.bas, gecikme: +el.dataset.bas });
      if (performance.now() - bas > 8000) return res(null);
      requestAnimationFrame(bak);
    };
    bak();
  }));
}

async function cek(hedef) {
  const sayfa = await tarayici.newPage({ viewport: { width: genislik, height: yukseklik }, deviceScaleFactor: 1 });
  const hatalar = [];
  sayfa.on('console', m => { if (m.type() === 'error') hatalar.push('konsol: ' + m.text()); });
  sayfa.on('pageerror', e => hatalar.push('sayfa: ' + e.message));
  if (azHareket) await sayfa.emulateMedia({ reducedMotion: 'reduce' });
  try {
    await sayfa.addInitScript(() => { try { sessionStorage.clear(); } catch (e) { /* yok */ } });
    if (dil) await sayfa.addInitScript(d => { try { localStorage.setItem('dil', d); } catch (e) { /* yok */ } }, dil);
    await sayfa.goto(`http://127.0.0.1:${port}/${hedef.site}`, { waitUntil: 'load' });
    await sayfa.evaluate(() => document.fonts && document.fonts.ready);

    let sureP = null, sure = null;
    if (acilisCek) {
      const ms = acilisAn == null ? (azHareket ? 500 : 2400) : +acilisAn;
      /* Ölçüm bekleme süresini yemesin: söz arka planda ilerler, kare alındıktan sonra okunur. */
      if (olcum) sureP = acilisSuresi(sayfa);
      await sayfa.waitForTimeout(Math.max(0, ms));
    } else {
      await sayfa.waitForTimeout(600);
      const aBasla = await sayfa.$('#aBasla');
      if (aBasla && await aBasla.isVisible()) { await sayfa.click('#aBasla'); await sayfa.waitForTimeout(700); }
      if (dil) { await sayfa.click(`.dil[data-dil="${dil}"]`); }
      await sayfa.waitForTimeout(5500); /* küre + harita katmanı */
      if (sec) {
        await sayfa.click('#liste .oge');
        await sayfa.waitForTimeout(400);
        await sayfa.waitForFunction(() => { const n = document.querySelector('#neden'); return !n || !n.classList.contains('imlec'); }, null, { timeout: 15000 }).catch(() => {});
        await sayfa.waitForTimeout(500);
      }
      if (brifing) {
        await sayfa.click('#brifingAc');
        await sayfa.waitForTimeout(500);
        const basla = await sayfa.$('#gBasla');
        if (basla && await basla.isVisible()) await sayfa.keyboard.press('Enter');
        await sayfa.waitForTimeout(9000);
      }
    }
    if (bekle) await sayfa.waitForTimeout(bekle);

    const tasma = await sayfa.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
    const dosya = path.join(cikis, (yanYana ? ad + '-' + hedef.ek : ad) + '.png');
    await sayfa.screenshot({ path: dosya });
    /* Hareket azaltmada açılış perdesi statik mi: sınıf ve metin iki zamanda aynı olmalı. */
    let statik = null;
    if (azHareket && acilisCek) {
      const durum = () => sayfa.evaluate(() => {
        const el = document.querySelector('#acilis');
        if (!el) return null;
        const ust = el.querySelector('.g-ust');
        return [el.className, document.querySelector('#a1').textContent, ust ? ust.textContent : ''].join('|');
      });
      const a = await durum();
      await sayfa.waitForTimeout(900);
      const b = await durum();
      statik = a === b;
    }
    if (sureP) sure = await sureP;
    return { etiket: hedef.etiket, site: hedef.site, ekran: dosya, genislik, yukseklik, yatayTasma: tasma, konsolHatasi: hatalar.length, hatalar, acilisMs: sure ? sure.ms : null, acilisGecikme: sure ? sure.gecikme : null, statik };
  } finally {
    await sayfa.close();
  }
}

/* İki PNG'yi etiketleriyle yan yana dizer; birleşik kare tek dosyaya yazılır. */
async function birlestir(sonuclar) {
  const bosluk = 20, ustluk = 34;
  const g = genislik * sonuclar.length + bosluk * (sonuclar.length + 1);
  const y = yukseklik + ustluk + bosluk;
  const sayfa = await tarayici.newPage({ viewport: { width: g, height: y }, deviceScaleFactor: 1 });
  const img = s => `http://127.0.0.1:${port}/` + path.relative(kok, s).split(path.sep).join('/');
  const html = `<!doctype html><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#0b0b0c;color:#e8e4dc;font:11px/1.4 ui-monospace,Consolas,monospace}
    .satir{display:flex;gap:${bosluk}px;padding:${bosluk}px}
    .kol{display:flex;flex-direction:column;gap:8px}
    .et{letter-spacing:.16em;text-transform:uppercase;color:#8d8a83;height:12px}
    img{display:block;width:${genislik}px;height:${yukseklik}px;border:1px solid #2a2a2c}
  </style><div class="satir">${sonuclar.map(s => `<div class="kol"><span class="et">${s.etiket}</span><img src="${img(s.ekran)}"></div>`).join('')}</div>`;
  await sayfa.setContent(html, { waitUntil: 'load' });
  await sayfa.waitForTimeout(250);
  const birlesik = path.join(cikis, ad + '.png');
  await sayfa.screenshot({ path: birlesik });
  await sayfa.close();
  return birlesik;
}

try {
  const sonuclar = [];
  for (const h of SITELER) sonuclar.push(await cek(h));
  const cikti = yanYana ? { yanYana: await birlestir(sonuclar), kareler: sonuclar } : sonuclar[0];
  console.log(JSON.stringify(cikti, null, 1));
  if (sonuclar.some(s => s.hatalar.length || s.yatayTasma > 0)) process.exitCode = 1;
} finally {
  await tarayici.close();
  srv.close();
}
