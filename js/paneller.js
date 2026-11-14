/* paneller.js — sol panel: durum, kategori ve kaynak liste süzgeçleri, arama, varlık listesi,
   ağ görünümü ve görünüm sekmeleri. */

import { t, B, sayiTR, durumAd, katAd, listeAd, kategoriAdlari, ulkeAd, yerAdi } from './i18n.js';
import { DURUM, renk, tarihYil, simdiYil, esc } from './veri.js';
import { filtrele as safFiltrele, kucuk } from './filtre.js';
import { agYerlesim } from './ag.js';

let D = null;
const $ = s => document.querySelector(s);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

export const LISTELER = ['bds', 'ohchr', 'ulke'];
let KATEGORI = [];
let sorgu = '', durumF = new Set(), katF = new Set(), listeF = new Set();
let gorunum = 'kure';

export const durumKumesi = () => durumF;
export const kategoriKumesi = () => katF;
export const listeKumesi = () => listeF;
export const kategoriListesi = () => KATEGORI;
export const getSorgu = () => sorgu;

export function filtrele() {
  return safFiltrele(D.SIRKETLER, {
    durumF, katF, listeF, sorgu,
    kategoriAd: kategoriAdlari,
    ekMetin: s => [ulkeAd(s.ulke), yerAdi(s), ...(s.liste || []).map(listeAd)].join(' ')
  });
}

export function ciplerCiz() {
  const top = D.SIRKETLER.length;
  const durumEl = $('#durumlar');
  if (durumEl) durumEl.innerHTML = Object.keys(DURUM).map(k => {
    const n = D.SIRKETLER.filter(s => s.durum === k).length;
    return `<button class="dk ${DURUM[k][0]}" aria-pressed="${durumF.has(k)}" data-d="${k}"><span class="nokta"></span><span class="ad">${durumAd(k)}</span><i><span style="width:${n / top * 100}%"></span></i><b>${n}</b></button>`;
  }).join('');
  const katEl = $('#kategoriler');
  if (katEl) katEl.innerHTML = KATEGORI.map(k => `<button class="cip" aria-pressed="${katF.has(k)}" data-c="${esc(k)}">${katAd(k)}<span class="m">${D.SIRKETLER.filter(s => s.kategori === k).length}</span></button>`).join('');
  const listeEl = $('#listeler');
  if (listeEl) listeEl.innerHTML = LISTELER.map(l => `<button class="cip" aria-pressed="${listeF.has(l)}" data-l="${l}">${listeAd(l)}<span class="m">${D.SIRKETLER.filter(s => (s.liste || []).includes(l)).length}</span></button>`).join('');
}

const cipBagla = (el, kume, att) => el && el.addEventListener('click', e => {
  const b = e.target.closest('[aria-pressed]'); if (!b) return;
  const v = b.dataset[att]; kume.has(v) ? kume.delete(v) : kume.add(v);
  b.setAttribute('aria-pressed', kume.has(v)); tabloCiz();
});

const ikiHarf = s => s.ad.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
function izSvg(s) {
  const W = 64, H = 20, x = y => 3 + (y - 2016) / (2027 - 2016) * (W - 6), r = css(DURUM[s.durum][1]);
  const ys = s.zaman.map(z => tarihYil(z[0])), son = s.durum === 'sonuc' ? Math.max(...ys) : simdiYil();
  return `<svg class="iz" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><line x1="3" y1="10" x2="${W - 3}" y2="10" stroke="var(--cizgi2)"/><line x1="${x(Math.min(...ys))}" y1="10" x2="${x(son)}" y2="10" stroke="var(--ikincil)" stroke-width="1.5"/>${ys.map(y => `<rect x="${x(y) - 2}" y="8" width="4" height="4" fill="var(--yuzey)" stroke="var(--ikincil)"/>`).join('')}</svg>`;
}

export function tabloCiz() {
  const l = filtrele();
  const sayi = $('#sayiGor'); if (sayi) sayi.textContent = l.length + ' / ' + D.SIRKETLER.length;
  D.hudSayCiz && D.hudSayCiz();
  const el = $('#liste');
  if (el) el.innerHTML = l.length ? l.map(s => {
    const ilk = s.zaman[0][0].slice(0, 4), son = s.durum === 'sonuc' ? s.zaman.at(-1)[0].slice(0, 4) : '';
    const secili = D.getSecili();
    return `<li class="oge" role="option" tabindex="0" data-id="${esc(s.id)}" aria-selected="${secili && secili.id === s.id}" style="--r:${renk(s)}"><span class="mono-k">${s.kod.slice(4)}</span><span style="min-width:0"><span class="ad">${esc(s.ad)}</span><span class="alt-satir"><span class="etiket ${DURUM[s.durum][0]}"><span class="nokta"></span>${durumAd(s.durum)}</span><span class="m">${esc(s.ulke)}</span></span></span><span class="sag-k">${izSvg(s)}<span class="m">${ilk} ${son ? '– ' + son : '→'}</span></span></li>`;
  }).join('') : `<li class="bos">${t('bos')}</li>`;
  D.isaretFiltrele && D.isaretFiltrele(l);
  agCiz(); D.zcCiz && D.zcCiz();
}

const p = v => Math.round(v * 10) / 10;

/* Sahne tam ekran (küre panellerin altına taşar); AĞ haritası panellerin arasına yerleşir. */
function agKutu(W, H) {
  if (innerWidth < 1024) return { x: 0, y: 0, w: W, h: H };
  const sol = parseFloat(css('--sol')) || 300;
  const sag = parseFloat(css('--sag')) || 380;
  const alt = parseFloat(css('--alt')) || 176;
  return { x: sol, y: 0, w: Math.max(320, W - sol - sag), h: Math.max(320, H - alt - 24) };
}

function yayYolu(cx, cy, R, bas, span) {
  const x1 = p(cx + Math.cos(bas) * R), y1 = p(cy + Math.sin(bas) * R);
  const x2 = p(cx + Math.cos(bas + span) * R), y2 = p(cy + Math.sin(bas + span) * R);
  return `M${x1},${y1}A${R},${R} 0 ${span > Math.PI ? 1 : 0} 1 ${x2},${y2}`;
}

/* Merkez plakası: süzgeçli toplam ve durum bileşimi; seçimde varlık kimliği. */
function merkezHtml(Y, sec) {
  const w = Math.round(Y.R1 * (Y.dar ? 1.5 : 1.6));
  const yer = `left:${Y.cx}px;top:${Y.cy}px;width:${w}px`;
  if (sec) {
    return `<div class="ag-merkez secili" style="${yer};--r:${renk(sec)}">
      <div class="ag-m-ust"><i class="ag-m-kare"></i>${esc(t('agSecili'))} · ${sec.kod}</div>
      <b class="ag-m-ad">${esc(sec.ad)}</b>
      <div class="ag-m-meta">${esc(B(katAd(sec.kategori)))} · ${esc(ulkeAd(sec.ulke))}</div>
      <div class="ag-m-durum"><i class="ag-m-nokta"></i>${esc(B(durumAd(sec.durum)))}<i>${sayiTR(sec.markalar.length)} ${esc(t('marka'))} · ${sayiTR(sec.kaynak.length)} ${esc(t('kaynak'))}</i></div>
    </div>`;
  }
  const sira = Object.keys(DURUM), top = Math.max(1, Y.toplam);
  const bar = sira.filter(k => Y.durum[k]).map(k => `<i style="width:${(Y.durum[k] / top * 100).toFixed(2)}%;background:${renk({ durum: k })}"></i>`).join('');
  return `<div class="ag-merkez" style="${yer}">
    <b class="ag-m-sayi">${sayiTR(Y.toplam)}</b>
    <span class="ag-m-birim">${esc(t('agVarlik'))}</span>
    <div class="ag-m-bar">${bar}</div>
    <dl class="ag-m-legend">${sira.map(k => `<div><dt><i style="background:${renk({ durum: k })}"></i>${esc(B(durumAd(k)))}</dt><dd>${sayiTR(Y.durum[k] || 0)}</dd></div>`).join('')}</dl>
    <div class="ag-m-alt">${sayiTR(Y.sektorler.length)} ${esc(t('agSektor'))} · ${sayiTR(Y.ulke)} ${esc(t('agUlke'))}</div>
  </div>`;
}

/* AĞ: sektör halkası. Kategori = yay dilimi, varlık = yay üzerinde durum renginde nokta.
   Seçimde yalnız seçilinin sektörü açık kalır; kimlik merkez plakasında okunur. */
export function agCiz() {
  if (gorunum !== 'ag') return;
  const el = $('#ag'), W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
  const l = filtrele();
  const K = agKutu(W, H);
  const Y = agYerlesim(D.SIRKETLER, l, KATEGORI, W, H, K);
  const secHam = D.getSecili();
  const sec = secHam ? (l.find(x => x.id === secHam.id) || null) : null;
  const secKat = sec ? sec.kategori : null;

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('ag') + ' · ' + sayiTR(Y.toplam) + ' ' + t('agVarlik'))}">`;
  svg += `<g class="ag-izgara" aria-hidden="true"><circle cx="${Y.cx}" cy="${Y.cy}" r="${Y.R1}"/><circle cx="${Y.cx}" cy="${Y.cy}" r="${Y.R2}"/>`;
  for (let i = 0; i < 36; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 36, r1 = Y.R2 + 3, r2 = Y.R2 + (i % 3 === 0 ? 10 : 7);
    svg += `<line class="ag-tik-cizgi" x1="${p(Y.cx + Math.cos(a) * r1)}" y1="${p(Y.cy + Math.sin(a) * r1)}" x2="${p(Y.cx + Math.cos(a) * r2)}" y2="${p(Y.cy + Math.sin(a) * r2)}"/>`;
  }
  svg += `</g>`;

  for (let si = 0; si < Y.sektorler.length; si++) {
    const sektor = Y.sektorler[si];
    const aktif = sektor.kategori === secKat, r = aktif && sec ? renk(sec) : '';
    svg += `<g class="ag-sektor${aktif ? ' aktif' : ''}"${r ? ` style="--r:${r}"` : ''}>`;
    const sx1 = p(Y.cx + Math.cos(sektor.bas) * Y.R1), sy1 = p(Y.cy + Math.sin(sektor.bas) * Y.R1);
    const sx2 = p(Y.cx + Math.cos(sektor.bas) * Y.R2), sy2 = p(Y.cy + Math.sin(sektor.bas) * Y.R2);
    const ex2 = p(Y.cx + Math.cos(sektor.bas + sektor.span) * Y.R2), ey2 = p(Y.cy + Math.sin(sektor.bas + sektor.span) * Y.R2);
    svg += `<path class="ag-dilim${si % 2 ? '' : ' cift'}" d="M${sektor.hub.x},${sektor.hub.y}L${sx2},${sy2}A${Y.R2},${Y.R2} 0 ${sektor.span > Math.PI ? 1 : 0} 1 ${ex2},${ey2}Z"/>`;
    svg += `<line class="ag-sinir" x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}"/>`;
    const ux = p(Y.cx + Math.cos(sektor.ort) * Y.R2), uy = p(Y.cy + Math.sin(sektor.ort) * Y.R2);
    svg += `<line class="ag-eksen" x1="${sektor.hub.x}" y1="${sektor.hub.y}" x2="${ux}" y2="${uy}"/>`;
    svg += `<path class="ag-yay${aktif ? ' aktif' : ''}${sektor.n ? '' : ' bos'}" d="${yayYolu(Y.cx, Y.cy, Y.R2, sektor.bas, sektor.span)}" fill="none"/>`;
    const hubSag = Math.cos(sektor.ort) >= 0, hubAd = B(katAd(sektor.kategori)) + ' · ' + sektor.n;
    svg += `<g class="ag-hub-g"><circle class="ag-hub-tik" cx="${sektor.hub.x}" cy="${sektor.hub.y}" r="12"/><rect class="ag-hub" x="${p(sektor.hub.x - 5)}" y="${p(sektor.hub.y - 5)}" width="10" height="10"/><rect class="ag-hub-i" x="${p(sektor.hub.x - 1.5)}" y="${p(sektor.hub.y - 1.5)}" width="3" height="3"/><text class="ag-hub-et" x="${p(sektor.hub.x + (hubSag ? 10 : -10))}" y="${p(sektor.hub.y + 3)}" text-anchor="${hubSag ? 'start' : 'end'}">${esc(hubAd)}</text></g>`;

    const secD = sec ? sektor.dugumler.find(d => d.s.id === sec.id) : null;
    if (secD) svg += `<line class="ag-sec-cizgi" x1="${sektor.hub.x}" y1="${sektor.hub.y}" x2="${secD.x}" y2="${secD.y}" style="stroke:${r}"/>`;

    for (const d of sektor.dugumler) {
      const s = d.s, sag = Math.cos(d.a) >= 0, seciliD = !!sec && sec.id === s.id;
      svg += `<g class="ag-dugum${seciliD ? ' sec' : ''}" data-id="${esc(s.id)}" transform="translate(${d.x} ${d.y})"><circle class="ag-tik" r="5"/><rect class="ag-nokta" x="-1.8" y="-1.8" width="3.6" height="3.6" style="fill:${renk(s)}"/>`;
      if (seciliD) svg += `<path class="ag-kose" d="M-10,-10h5M-10,-10v5M10,-10h-5M10,-10v5M-10,10h5M-10,10v-5M10,10h-5M10,10v-5" style="stroke:${renk(s)}"/>`;
      svg += `<g class="ag-et" transform="translate(${sag ? 9 : -9} 0)" text-anchor="${sag ? 'start' : 'end'}"><text class="ag-et-ad" y="-2">${esc(s.ad)}</text><text class="ag-et-alt" y="9">${s.kod} · ${esc(s.ulke)}</text></g></g>`;
    }

    if (!Y.dar) {
      const e = sektor.etiket, tx = e.yan === 'sag' ? e.x0 + 6 : e.x0 - 6, ex = e.yan === 'sag' ? tx - 3 : tx + 3;
      svg += `<g class="ag-rim${aktif ? ' aktif' : ''}"><path class="ag-kilavuz" d="M${e.capaX},${e.capaY}L${e.x0},${e.y}L${ex},${e.y}" fill="none"/><text x="${tx}" y="${p(e.y + 3)}" text-anchor="${e.yan === 'sag' ? 'start' : 'end'}">${esc(B(katAd(sektor.kategori)))}<tspan class="ag-rim-sayi" dx="6">${sektor.n}</tspan></text></g>`;
    }
    svg += `</g>`;
  }
  el.innerHTML = svg + '</svg>' + merkezHtml(Y, sec);
  el.classList.toggle('ag-secim', !!sec);
  el.classList.toggle('dar', Y.dar);
  el.classList.toggle('sik', Y.sik);
}

export function gorunumAdCiz() {
  const el = $('#gorunumAd');
  if (el) el.textContent = t(gorunum === 'kure' ? 'gorunumKure' : 'gorunumAg');
}

export function gorunumSec(g) {
  gorunum = g;
  const ag = g === 'ag';
  document.querySelectorAll('.sekme[data-gorunum]').forEach(x => x.setAttribute('aria-selected', x.dataset.gorunum === g));
  $('#kure').style.display = ag ? 'none' : 'block';
  $('#ag').style.display = ag ? 'block' : 'none';
  document.querySelectorAll('.k-sag-ust,.k-sag-alt,.koor').forEach(x => x.style.visibility = ag ? 'hidden' : 'visible');
  const kat = $('.katmanlar'); if (kat) kat.style.display = ag ? 'none' : '';
  const hud = $('#hudSol'); if (hud) hud.textContent = t(ag ? 'yardimAg' : (D.haritaDurumu && D.haritaDurumu() ? 'haritaHata' : 'yardim'));
  gorunumAdCiz(); agCiz(); D.hudSayCiz && D.hudSayCiz();
}

export function panellerBagla(deps) {
  D = deps;
  KATEGORI = [...new Set(D.SIRKETLER.map(s => s.kategori))]
    .sort((a, b) => D.SIRKETLER.filter(s => s.kategori === b).length - D.SIRKETLER.filter(s => s.kategori === a).length || a.localeCompare(b, 'tr'));
  Object.keys(DURUM).forEach(k => durumF.add(k));
  KATEGORI.forEach(k => katF.add(k));
  LISTELER.forEach(l => listeF.add(l));

  ciplerCiz();
  cipBagla($('#durumlar'), durumF, 'd');
  cipBagla($('#kategoriler'), katF, 'c');
  cipBagla($('#listeler'), listeF, 'l');
  $('#filtreSifirla').onclick = () => {
    Object.keys(DURUM).forEach(k => durumF.add(k));
    KATEGORI.forEach(k => katF.add(k));
    LISTELER.forEach(l => listeF.add(l));
    sorgu = ''; const ara = $('#ara'); if (ara) ara.value = '';
    ciplerCiz(); tabloCiz();
  };
  $('#ara').addEventListener('input', e => { sorgu = e.target.value.trim(); tabloCiz(); });
  addEventListener('keydown', e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#ara').focus(); } });

  $('#liste').addEventListener('click', e => { const r = e.target.closest('[data-id]'); if (r) D.sec(r.dataset.id); });
  $('#liste').addEventListener('keydown', e => {
    const l = filtrele(); if (!l.length) return;
    const secili = D.getSecili(), i = l.findIndex(s => secili && s.id === secili.id);
    if (e.key === 'ArrowDown') { e.preventDefault(); D.sec(l[Math.min(l.length - 1, i + 1)].id); }
    if (e.key === 'ArrowUp') { e.preventDefault(); D.sec(l[Math.max(0, i - 1)].id); }
    if (e.key === 'Enter' && e.target.dataset.id) D.sec(e.target.dataset.id);
  });

  $('#ag').addEventListener('click', e => { const g = e.target.closest('.ag-dugum'); if (g) D.sec(g.dataset.id); });
  let agBeklet = 0;
  addEventListener('resize', () => { clearTimeout(agBeklet); agBeklet = setTimeout(agCiz, 140); });
  document.querySelectorAll('.sekme[data-gorunum]').forEach(b => b.onclick = () => gorunumSec(b.dataset.gorunum));

  Object.assign(D, { filtrele, tabloCiz, ciplerCiz, agCiz, gorunumAdCiz, gorunumSec, getGorunum: () => gorunum, kategoriListesi: () => KATEGORI });
  gorunumAdCiz();
}
