/* intel.js — sağ istihbarat panelleri, varlık dosyası, genel özet, kılavuz çizgileri ve seçim. */

import { t, L, B, sayiTR, durumAd, katAd, listeAd, ulkeAd, yerAdi } from './i18n.js';
import { DURUM, renk, alanAdi, km, tarihYil, simdiYil, utcDamga, esc } from './veri.js';
import { olaylar, olayHtml } from './zaman.js';
import { Ses } from './ses.js';

let D = null;
const $ = s => document.querySelector(s);
const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;

const ok = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
const xIk = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const nis = '<svg class="nis" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path d="M2 10V2h8M24 2h8v8M32 24v8h-8M10 32H2v-8M17 9v6M17 19v6M9 17h6M19 17h6" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

const yillar = []; for (let y = 2016; y <= 2026; y++) yillar.push(y);
const ilkYil = s => Math.floor(Math.min(...s.zaman.map(z => tarihYil(z[0]))));
const ikiHarf = s => s.ad.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
const konumMetni = s => s.sehir ? s.sehir + ', ' + s.ulke : yerAdi(s);

function cizgiSvg(d, r = 'var(--ikincil)') {
  const W = 140, H = 22, mx = Math.max(...d, 1), st = W / (d.length - 1);
  const p = d.map((v, i) => `${(i * st).toFixed(1)},${(H - 2 - (v / mx) * (H - 5)).toFixed(1)}`);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="M0,${H} L${p.join(' L')} L${W},${H} Z" fill="${r}" opacity=".1"/><polyline points="${p.join(' ')}" fill="none" stroke="${r}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}

function isiCiz() {
  const say = {}, ekle = z => { const k = z.slice(0, 4) + '-' + Math.floor((+z.slice(5, 7) - 1) / 3); say[k] = (say[k] || 0) + 1; };
  D.SIRKETLER.forEach(s => s.zaman.forEach(z => ekle(z[0])));
  D.HABERLER.forEach(h => ekle(String(h.tarih)));
  const mx = Math.max(1, ...Object.values(say)); let h = '';
  for (let q = 0; q < 4; q++) {
    h += `<span>${t('ceyrek')}${q + 1}</span>`;
    for (const y of yillar) { const n = say[y + '-' + q] || 0; h += `<i${n ? ` style="background:color-mix(in srgb,var(--metin) ${Math.round(25 + 60 * n / mx)}%,var(--cizgi))"` : ''} title="${y} ${t('ceyrek')}${q + 1} · ${n}"></i>`; }
  }
  h += '<span></span>' + yillar.map(y => `<span class="yl">${String(y).slice(2)}</span>`).join('');
  return `<div class="isi" role="img" aria-label="${t('etkinlik')}">${h}</div>`;
}

export function genelCiz() {
  const top = D.SIRKETLER.length, sn = D.SIRKETLER.filter(s => s.durum === 'sonuc').length;
  const olayT = D.SIRKETLER.reduce((a, s) => a + s.zaman.length, 0);
  const kaynakT = D.SIRKETLER.reduce((a, s) => a + s.kaynak.length, 0);
  const kpi = [
    [t('varliklar'), top, yillar.map(y => D.SIRKETLER.filter(s => ilkYil(s) <= y).length)],
    [t('marka'), D.SIRKETLER.reduce((a, s) => a + s.markalar.length, 0), yillar.map(y => D.SIRKETLER.filter(s => ilkYil(s) <= y).reduce((a, s) => a + s.markalar.length, 0))],
    [t('kaynak'), kaynakT, yillar.map(y => D.SIRKETLER.reduce((a, s) => a + s.kaynak.filter(k => +k[2] <= y).length, 0))],
    [t('olaySay'), olayT, yillar.map(y => D.SIRKETLER.reduce((a, s) => a + s.zaman.filter(z => +z[0].slice(0, 4) <= y).length, 0))]
  ];
  const kats = D.kategoriListesi().map(k => [k, D.SIRKETLER.filter(s => s.kategori === k)]).sort((a, b) => b[1].length - a[1].length);
  const enc = Math.max(...kats.map(x => x[1].length), 1);
  const yol = (l, mx) => `<span class="yol">${Object.keys(DURUM).map(d => { const n = l.filter(s => s.durum === d).length; return n ? `<span style="flex:${n};background:var(--ikincil)"></span>` : ''; }).join('')}${mx > l.length ? `<span style="flex:${mx - l.length}"></span>` : ''}</span>`;
  const ulke = {}; D.SIRKETLER.forEach(s => (ulke[s.ulke] = ulke[s.ulke] || []).push(s));
  const ul = Object.entries(ulke).sort((a, b) => b[1].length - a[1].length), umx = ul[0][1].length;
  const panel = document.getElementById('panel');
  if (!panel) return;
  panel.innerHTML = `
   <div class="sinif"><span><b>●</b> ${t('acikKaynak')}</span><span>${t('kaynak')} ${sayiTR(kaynakT)}</span></div>
   <div class="p-bas yalin"><div><h2>${t('kureselOzet')}</h2><div class="alt-b">${t('genelDurum')} · 2016–2026</div></div></div>
   <div class="kpi">${kpi.map(([a, n, d]) => `<div><span class="e">${a}</span><b>${sayiTR(n)}</b>${cizgiSvg(d)}</div>`).join('')}</div>
   <div class="bolum"><div class="blok-bas"><span class="bas">${t('etki')}</span><span class="say">${top}</span></div>
     <p class="etki-c">${t('sonucCumle', { n: `<b>${sn}</b>`, t: top })}</p><table class="oran"><tbody>${Object.keys(DURUM).map(k => { const n = D.SIRKETLER.filter(s => s.durum === k).length; return `<tr><td><span class="etiket ${DURUM[k][0]}"><span class="nokta"></span></span> ${durumAd(k)}</td><td class="cb"><i><span style="width:${n / top * 100}%"></span></i></td><td class="m">${sayiTR(n)}</td><td class="m s">${Math.round(n / top * 100)}%</td></tr>`; }).join('')}</tbody></table></div>
   <div class="bolum"><div class="blok-bas"><span class="bas">${t('etkinlik')}</span><span class="say">${sayiTR(olayT + D.HABERLER.length)}</span></div>${isiCiz()}</div>
   <div class="bolum"><div class="blok-bas"><span class="bas">${t('kategori')}</span><span class="say">${kats.length}</span></div><div class="cubuklar">${kats.map(([k, l]) => `<div class="cubuk"><span>${katAd(k)}</span>${yol(l, enc)}<span class="m">${l.length}</span></div>`).join('')}</div></div>
   <div class="bolum"><div class="blok-bas"><span class="bas">${t('merkezUlke')}</span><span class="say">${ul.length}</span></div><div class="cubuklar">${ul.map(([k, l]) => `<div class="cubuk"><span class="m" style="text-align:left;color:var(--ikincil)">${esc(k)}</span>${yol(l, umx)}<span class="m">${l.length}</span></div>`).join('')}</div></div>
   <div class="bolum"><div class="blok-bas"><span class="bas">${t('sonIstihbarat')}</span><span class="canli e">${t('canli')}</span></div><ol class="istih">${olaylar().slice(0, 4).map(o => olayHtml(o, 'p')).join('')}</ol></div>
   <div class="dipnot">${t('genelIpucu')}</div>`;
}

export function grafikSvg(s) {
  const W = 340, H = 176, cx = W / 2, cy = H / 2;
  const dug = [...s.markalar.map(m => ['m', m]), ...s.bag.map(b => ['b', L(b.e)]), ...s.kaynak.map(k => ['k', alanAdi(k[1])])];
  const p = dug.map((d, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / dug.length; return [cx + Math.cos(a) * W * .24, cy + Math.sin(a) * H * .36, d]; });
  const sekil = (x, y, q) => q === 'm' ? `<circle cx="${x}" cy="${y}" r="4" fill="var(--yuzey)" stroke="var(--ikincil)" stroke-width="1.5"/>` : q === 'b' ? `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" rx="1.5" transform="rotate(45 ${x} ${y})" fill="var(--yuzey)" stroke="var(--aksan)" stroke-width="1.5"/>` : `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="2" fill="var(--yuzey)" stroke="var(--sonuk)" stroke-width="1.5"/>`;
  /* Etiket, düğümden kutunun kenarına kalan boşluğa sığacak kadar kısaltılır; sabit 20 karakter
     sınırı sağdaki düğümlerde metni SVG dışına taşırıp kırpıyordu (bkz. "Jerusalem Light Rail"). */
  const ETIKET_HARF = 6.7;
  const etiket = (a, x) => {
    const yer = x < cx - 1 ? x - 9 : W - x - 9;
    const azami = Math.max(3, Math.floor(yer / ETIKET_HARF));
    const t2 = String(a);
    return t2.length > azami ? t2.slice(0, azami - 1) + '…' : t2;
  };
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="display:block">
    ${p.map(([x, y, [q]]) => `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${q === 'b' ? 'var(--aksan)' : 'var(--cizgi2)'}" stroke-opacity="${q === 'b' ? .6 : 1}" ${q === 'b' ? 'stroke-dasharray="3 3"' : ''}/>`).join('')}
    ${p.map(([x, y, [q, a]]) => `${sekil(x, y, q)}<text x="${x + (x < cx - 1 ? -9 : 9)}" y="${y + 4}" text-anchor="${x < cx - 1 ? 'end' : 'start'}" style="font-size:11.5px;fill:var(--ikincil)">${esc(etiket(a, x))}</text>`).join('')}
    <circle cx="${cx}" cy="${cy}" r="14" fill="color-mix(in srgb,${renk(s)} 14%,var(--yuzey))" stroke="${renk(s)}" stroke-width="1.5"/>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" style="font-family:var(--mono);font-size:11px;font-weight:500;fill:var(--metin)">${ikiHarf(s)}</text></svg>
    <div style="display:flex;gap:16px;margin-top:8px" class="e"><span>${t('lMarka')}</span><span style="color:var(--aksan)">${t('lFaaliyet')}</span><span>${t('lKaynak')}</span></div>`;
}

function kaynakHtml(s) {
  return s.kaynak.map(([b, u, z]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener"><span class="fav">${esc(alanAdi(u).slice(0, 2).toUpperCase())}</span><span style="min-width:0">${esc(L(b))}<br><span class="m">${esc(alanAdi(u))} · ${esc(z)}</span></span>${ok}</a></li>`).join('');
}

export function dosyaCiz(s, animasyon = true) {
  const issue = `https://github.com/yusufgunay-esq/boykot/issues/new?title=${encodeURIComponent(t('duzeltme') + ': ' + s.ad + ' (' + s.kod + ')')}`;
  const san = (x, g) => animasyon ? `<span class="sansur" style="--g:${g}s">${x}</span>` : x;
  const b0 = s.bag && s.bag[0];
  const hb = olaylar().filter(o => o.id === s.id && o.tur === 'haber');
  const veri = [[t('kaynak'), s.kaynak.length], [t('olaySay'), s.zaman.length], [t('marka'), s.markalar.length]];
  if (b0) veri.unshift([t('mesafe'), sayiTR(km(s, b0)) + ' km']);
  const rozet = (s.liste || []).map(l => `<span class="etk">${listeAd(l)}</span>`).join('');
  document.body.classList.add('secim');
  const intel = document.getElementById('intel');
  intel.innerHTML = `
  <section class="iw a${animasyon ? ' acil' : ''}" style="--r:${renk(s)}" aria-label="${esc(s.ad)}">
    <div class="iw-sinif"><span>${t('osint')}</span><span>${s.kod}/A · ${utcDamga()}</span></div>
    <div class="plaka-s">${nis}<div class="plaka"><span class="plaka-kod">[${s.kod}]</span><h2 class="plaka-ad">${B(esc(s.ad))}</h2><span class="plaka-serit"></span></div><button class="kapat" id="kapat" aria-label="${t('kapat')}">${xIk}</button></div>
    <div class="iw-c">
      <div class="iw-ust"><span class="etk">${san(B(esc(konumMetni(s))), .15)}</span><span class="etk">${B(katAd(s.kategori))}</span><span class="etk durum ${DURUM[s.durum][0]}"><span class="nokta"></span>${B(durumAd(s.durum))}</span>${rozet}<span class="m kod">${s.kod}</span></div>
      <div class="iw-g">
        <div class="hucre gen"><div class="hb">${t('gerekce')} <span>${t('kaynagaGore')} · ${esc(alanAdi(s.kaynak[0][1]))}</span></div><p class="neden" id="neden">${animasyon ? '' : esc(L(s.neden))}</p></div>
        <div class="hucre"><div class="hb">${t('olaySirasi')}</div><ol class="adimlar">${s.zaman.map(([z, o]) => `<li><i></i><div><time>${esc(z)}</time><span>${esc(L(o))}</span></div></li>`).join('')}</ol></div>
        <div class="hucre"><div class="hb">${t('kanit')}</div><dl class="veri">${veri.map(([a, n], i) => `<dt>${a}</dt><dd>${san(n, .25 + i * .12)}</dd>`).join('')}</dl></div>
        <div class="hucre gen"><div class="hb">${t('kaynaklar')}</div><div class="kase-satir"><span class="kase">${t('kase')}</span></div><ul class="kaynaklar">${kaynakHtml(s)}</ul></div>
        <div class="hucre gen"><div class="hb">${t('markalarUrun')}</div><div class="markalar">${s.markalar.map(m => `<span>${esc(m)}</span>`).join('')}</div></div>
      </div>
      <div class="iw-alt"><span>${t('acikKaynak')} · ${s.kod}</span><a href="${esc(issue)}" target="_blank" rel="noopener">${t('hataBildir')}</a></div>
    </div>
  </section>
  ${b0 ? `<section class="iw b${animasyon ? ' acil' : ''}" style="--r:${renk(s)}" aria-label="${esc(L(b0.e))}">
    <div class="iw-sinif"><span>${t('osint')}</span><span>${s.kod}/B · ${utcDamga()}</span></div>
    <div class="plaka-s">${nis}<div class="plaka"><span class="plaka-kod">[${s.kod}/B]</span><h3 class="plaka-ad">${B(esc(L(b0.e)))}</h3><span class="plaka-serit"></span></div></div>
    <div class="iw-c">
      <div class="iw-ust"><span class="etk">${B(t('faaliyetYeri'))}</span><span class="m kod">${b0.lat.toFixed(2)}, ${b0.lng.toFixed(2)}</span></div>
      <div class="iw-g">
        <div class="hucre"><div class="hb">${t('mesafe')}</div><b class="buyuk">${san(sayiTR(km(s, b0)), .4)}<small>km</small></b></div>
        <div class="hucre"><div class="hb">${t('merkezEt')}</div><b class="orta">${esc(konumMetni(s))}</b><span class="m kod">${s.lat.toFixed(2)}, ${s.lng.toFixed(2)}</span></div>
        <div class="hucre gen"><div class="hb">${t('grafik')} <span>${s.markalar.length + s.bag.length + s.kaynak.length} ${t('dugum')}</span></div>${grafikSvg(s)}</div>
        ${hb.length ? `<div class="hucre gen"><div class="hb">${t('ilgiliHaber')}</div><ol class="istih">${hb.map(o => olayHtml(o, 'd')).join('')}</ol></div>` : ''}
      </div>
    </div>
  </section>` : ''}`;
  const kapat = document.getElementById('kapat');
  if (kapat) kapat.onclick = () => D.brifingAcik && D.brifingAcik() ? D.brifingBitir() : birak();
  if (animasyon) {
    const n = document.getElementById('neden');
    if (D.yaz) D.yaz(n, L(s.neden), 10); else if (n) n.textContent = L(s.neden);
  }
}

/* Pencereleri küredeki noktalara bağlayan kılavuz çizgiler (her karede) */
export function onderCiz() {
  const ondEl = document.getElementById('onder');
  if (!ondEl) return;
  const secili = D.getSecili();
  if (!secili || !document.getElementById('intel').firstElementChild || innerWidth < 1024) { if (ondEl.firstChild) ondEl.innerHTML = ''; return; }
  const bag = (sec, lat, lng, hedef) => {
    const w = $(sec); if (!w || !D.kureProjeksiyon) return '';
    const pk = D.kureProjeksiyon(lat, lng); if (!pk) return '';
    const wr = w.getBoundingClientRect(), pr = w.querySelector('.plaka-s').getBoundingClientRect();
    const sag = pk.x > wr.right - pk.sol, ax = (sag ? wr.right : wr.left) - pk.sol, ay = pr.top - pk.ust + pr.height / 2, ex = ax + (sag ? 28 : -28);
    const k = hedef ? `<path d="M${pk.x - 14},${pk.y - 8}v-6h6M${pk.x + 14},${pk.y - 8}v-6h-6M${pk.x - 14},${pk.y + 8}v6h6M${pk.x + 14},${pk.y + 8}v6h-6" fill="none" stroke="var(--metin)"/>` : '';
    return `<path d="M${ax},${ay}H${ex}L${pk.x},${pk.y}" fill="none" stroke="var(--ikincil)" stroke-opacity=".75" stroke-dasharray="${hedef ? '3 3' : 'none'}"/><circle cx="${pk.x}" cy="${pk.y}" r="2.5" fill="var(--metin)"/>${k}`;
  };
  ondEl.innerHTML = bag('.iw.a', secili.lat, secili.lng, false) + (secili.bag && secili.bag[0] ? bag('.iw.b', secili.bag[0].lat, secili.bag[0].lng, true) : '');
}

/* ================= SEÇİM ================= */
export function sec(id) {
  const s = D.SIRKETLER.find(x => x.id === id); if (!s) return;
  const onceki = D.getSecili(), yeni = !onceki || onceki.id !== id;
  D.secili = s;
  D.tabloCiz(); dosyaCiz(s);
  if (matchMedia('(max-width:1023px)').matches) document.getElementById('sahne').scrollIntoView({ behavior: azHareket ? 'auto' : 'smooth' });
  else { const row = document.querySelector(`#liste [data-id="${CSS.escape(id)}"]`); if (row) row.scrollIntoView({ block: 'nearest' }); }
  const b = s.bag && s.bag[0];
  if (b) D.ucur((s.lat + b.lat) / 2, (s.lng + b.lng) / 2, 2.25 + Math.min(1.1, km(s, b) / 6000));
  else D.ucur(s.lat, s.lng, 2.4);
  D.yayVurgula && D.yayVurgula(id);
  D.nisanCiz(s);
  if (yeni) { D.menzilCiz(s); Ses.cal('vin'); setTimeout(() => Ses.cal('kilit'), 650); }
}

export function birak() {
  D.secili = null;
  document.body.classList.remove('secim');
  D.menzilGizle(); D.nisanGizle && D.nisanGizle();
  document.getElementById('intel').innerHTML = '';
  const ond = document.getElementById('onder'); if (ond) ond.innerHTML = '';
  D.tabloCiz(); genelCiz();
  if (!azHareket && D.kureKontrol) D.kureKontrol.autoRotate = true;
}

export function intelBagla(deps) {
  D = deps;
  Object.assign(D, { genelCiz, dosyaCiz, sec, birak, onderCiz });
  genelCiz();
}
