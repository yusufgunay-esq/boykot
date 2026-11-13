#!/usr/bin/env node
/* parca-cek.mjs — tek bir DOM öğesinin büyük kopyasını çeker (kanıt incelemesi için).
   Kullanım: node araclar/parca-cek.mjs <secici> <cikti.png> [--genislik 1440] [--yukseklik 900] */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const kok = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const secici = process.argv[2] || '#zc';
const cikti = path.resolve(kok, process.argv[3] || '_claude/kanit/parca.png');
const genislik = +(process.argv[4] || 1440), yukseklik = +(process.argv[5] || 900);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const srv = await new Promise(res => {
  const s = http.createServer((req, rep) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(kok, path.normalize(u).replace(/^([/\\])+/, ''));
    if (!f.startsWith(kok) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rep.writeHead(404); rep.end('yok'); return; }
    rep.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rep);
  });
  s.listen(0, '127.0.0.1', () => res(s));
});
const { port } = srv.address();
const require = createRequire(import.meta.url);
let pwYol = process.env.PLAYWRIGHT_MODUL;
if (!pwYol) {
  for (const d of fs.readdirSync(path.dirname(kok))) {
    const p = path.join(path.dirname(kok), d, 'node_modules', 'playwright');
    if (fs.existsSync(path.join(p, 'package.json'))) { pwYol = p; break; }
  }
}
const pw = require(pwYol || 'playwright');
const tarayici = await pw.chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: genislik, height: yukseklik }, deviceScaleFactor: 2 });
await sayfa.addInitScript(() => { try { sessionStorage.clear(); } catch (e) {} });
await sayfa.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
await sayfa.evaluate(() => document.fonts && document.fonts.ready);
await sayfa.waitForTimeout(600);
const b = await sayfa.$('#aBasla');
if (b && await b.isVisible()) { await sayfa.click('#aBasla'); }
await sayfa.waitForTimeout(5500);
const el = await sayfa.$(secici);
if (!el) { console.error('öğe yok: ' + secici); process.exit(1); }
fs.mkdirSync(path.dirname(cikti), { recursive: true });
await el.screenshot({ path: cikti });
console.log(cikti);
await tarayici.close();
srv.close();
