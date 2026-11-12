#!/usr/bin/env node
/* ekran-cek.mjs — tasarim prototipini yerel sunucudan açar, Playwright ile ekran görüntüsü alır.
   Kullanım:
     node araclar/ekran-cek.mjs --ad v06-koyu-genel
     node araclar/ekran-cek.mjs --ad v06-koyu-secili --sec
     node araclar/ekran-cek.mjs --ad v06-brifing --brifing
     node araclar/ekran-cek.mjs --ad v06-mobil --genislik 390 --yukseklik 844
     node araclar/ekran-cek.mjs --ad v06-acilis --acilis
   Seçenekler: --site <html> (varsayılan tasarim/index.html), --cikis <dizin> (varsayılan _claude/kanit),
   --dil <tr|en|es|zh>, --playwright <modül yolu>, --bekle <ms>, --acilis (açılış perdesini kapatmadan çeker).
   Playwright modülü sırayla: yerel node_modules, PLAYWRIGHT_MODUL, komşu projelerin node_modules klasörleri. */
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
const sayfa = await tarayici.newPage({ viewport: { width: genislik, height: yukseklik }, deviceScaleFactor: 1 });
const hatalar = [];
sayfa.on('console', m => { if (m.type() === 'error') hatalar.push('konsol: ' + m.text()); });
sayfa.on('pageerror', e => hatalar.push('sayfa: ' + e.message));
try {
  if (dil) await sayfa.addInitScript(d => { try { localStorage.setItem('dil', d); } catch {} }, dil);
  await sayfa.goto(`http://127.0.0.1:${port}/${site}`, { waitUntil: 'load' });
  await sayfa.evaluate(() => document.fonts && document.fonts.ready);
  if (acilisCek) {
    await sayfa.waitForTimeout(2400); /* daktilo dizisi bitince */
  } else {
    await sayfa.waitForTimeout(600);
    const aBasla = await sayfa.$('#aBasla');
    if (aBasla && await aBasla.isVisible()) { await sayfa.click('#aBasla'); await sayfa.waitForTimeout(700); }
    if (dil) { await sayfa.click(`.dil[data-dil="${dil}"]`); }
    await sayfa.waitForTimeout(5500); /* küre + harita katmanı */
    if (sec) {
      await sayfa.click('#liste .oge');
      await sayfa.waitForTimeout(400);
      /* gerekçe daktilosu bitene kadar bekle: kanıtta imleç kalmasın */
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
  fs.mkdirSync(cikis, { recursive: true });
  const yol = path.join(cikis, ad + '.png');
  await sayfa.screenshot({ path: yol });
  console.log(JSON.stringify({ ekran: yol, genislik, yukseklik, yatayTasma: tasma, konsolHatasi: hatalar.length, hatalar }, null, 1));
  if (hatalar.length || tasma > 0) process.exitCode = 1;
} finally {
  await tarayici.close();
  srv.close();
}
