/* paneller.js — sol panel: durum, kategori ve kaynak liste süzgeçleri, arama, varlık listesi,
   ağ görünümü ve görünüm sekmeleri. */

import { t, B, sayiTR, durumAd, katAd, listeAd, kategoriAdlari, ulkeAd, yerAdi } from './i18n.js';
import { DURUM, renk, tarihYil, simdiYil, esc } from './veri.js';
import { filtrele as safFiltrele, kucuk } from './filtre.js';

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

export function agCiz() {
  if (gorunum !== 'ag') return;
  const el = $('#ag'), W = el.clientWidth, H = el.clientHeight; if (!W) return;
  const l = filtrele(), cx = W / 2, cy = H / 2, R1 = Math.min(W, H) * .17, R2 = Math.min(W, H) * .36;
  const kats = KATEGORI.filter(k => l.some(s => s.kategori === k)), kp = {}, sp = {};
  kats.forEach((k, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / kats.length; kp[k] = [cx + Math.cos(a) * R1, cy + Math.sin(a) * R1]; });
  l.forEach((s, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / l.length; sp[s.id] = [cx + Math.cos(a) * R2, cy + Math.sin(a) * R2, a]; });
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img"><circle cx="${cx}" cy="${cy}" r="${R1}" fill="none" stroke="var(--cizgi)" stroke-dasharray="2 4"/><circle cx="${cx}" cy="${cy}" r="${R2}" fill="none" stroke="var(--cizgi)" stroke-dasharray="2 4"/>`;
  const secili = D.getSecili();
  for (const s of l) {
    const [x, y] = sp[s.id], [kx, ky] = kp[s.kategori], ak = secili && secili.id === s.id;
    svg += `<path d="M${kx},${ky} Q${cx},${cy} ${x},${y}" fill="none" stroke="${ak ? css(DURUM[s.durum][1]) : 'var(--cizgi2)'}" stroke-width="${ak ? 1.5 : 1}" opacity="${secili && !ak ? .4 : 1}"/>`;
  }
  for (const k of kats) {
    const [x, y] = kp[k];
    svg += `<g><rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="var(--zemin)" stroke="var(--ikincil)"/><text x="${x}" y="${y - 12}" text-anchor="middle" style="font-family:var(--mono);font-size:11px;fill:var(--ikincil);letter-spacing:1px">${B(katAd(k))}</text></g>`;
  }
  for (const s of l) {
    const [x, y, a] = sp[s.id], sag = Math.cos(a) >= 0, ak = secili && secili.id === s.id, r = css(DURUM[s.durum][1]);
    svg += `<g class="ag-dugum" data-id="${esc(s.id)}"><circle cx="${x}" cy="${y}" r="${ak ? 9 : 6}" fill="var(--zemin)" stroke="${r}" stroke-width="${ak ? 2 : 1.2}"/><circle cx="${x}" cy="${y}" r="2.5" fill="${r}"/>
      <text x="${x + (sag ? 14 : -14)}" y="${y - 2}" text-anchor="${sag ? 'start' : 'end'}" style="font-family:var(--sans);font-size:12.5px;fill:var(--metin)">${esc(s.ad)}</text><text x="${x + (sag ? 14 : -14)}" y="${y + 12}" text-anchor="${sag ? 'start' : 'end'}">${s.kod} · ${esc(s.ulke)}</text></g>`;
  }
  el.innerHTML = svg + '</svg>';
}

export function gorunumAdCiz() {
  const el = $('#gorunumAd');
  if (el) el.textContent = t(gorunum === 'kure' ? 'gorunumKure' : 'gorunumAg');
}

export function gorunumSec(g) {
  gorunum = g;
  document.querySelectorAll('.sekme[data-gorunum]').forEach(x => x.setAttribute('aria-selected', x.dataset.gorunum === g));
  $('#kure').style.display = g === 'kure' ? 'block' : 'none';
  $('#ag').style.display = g === 'ag' ? 'block' : 'none';
  document.querySelectorAll('.k-sag-ust,.k-sag-alt').forEach(x => x.style.visibility = g === 'kure' ? 'visible' : 'hidden');
  gorunumAdCiz(); agCiz();
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
  document.querySelectorAll('.sekme[data-gorunum]').forEach(b => b.onclick = () => gorunumSec(b.dataset.gorunum));

  Object.assign(D, { filtrele, tabloCiz, ciplerCiz, agCiz, gorunumAdCiz, gorunumSec, getGorunum: () => gorunum, kategoriListesi: () => KATEGORI });
  gorunumAdCiz();
}
