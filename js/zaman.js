/* zaman.js — olay günlüğü, zaman çizelgesi ve olay kayıtlarının ortak üretimi. */

import { t, L, durumAd } from './i18n.js';
import { DURUM, alanAdi, tarihYil, simdiYil, esc } from './veri.js';

let D = null;
export function zamanBagla(deps) { D = deps; }

const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const ok = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
const okSag = '<svg class="ok-a" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m4.5 2.5 3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

/* Şirket olayları + haberler; en yeniden eskiye. */
export function olaylar() {
  const kayit = D.SIRKETLER.flatMap(s => s.zaman.map(([z, o]) => ({
    z: z.length === 4 ? z + '-01-01T00:00' : z.length === 7 ? z + '-01T00:00' : z,
    zGoster: z,
    tur: 'kayit',
    id: s.id,
    bas: L(o),
    kaynak: alanAdi(s.kaynak[0][1]),
    url: s.kaynak[0][1]
  })));
  const haber = D.HABERLER.map(h => ({
    z: h.tarih,
    zGoster: String(h.tarih || '').slice(0, 10),
    tur: 'haber',
    id: h.sirketId,
    bas: h.baslik,
    kaynak: h.kaynakAd || alanAdi(h.url),
    url: h.url
  }));
  return [...haber, ...kayit].sort((a, b) => String(b.z).localeCompare(String(a.z)));
}

export function olayHtml(o, grup, yeni = false) {
  const s = D.SIRKETLER.find(x => x.id === o.id);
  if (!s) return '';
  const haber = o.tur === 'haber';
  const secili = D.getSecili();
  const saat = haber && String(o.z).length >= 16 ? ' · ' + String(o.z).slice(11, 16) + ' UTC' : '';
  const bas = haber ? esc(o.kaynak) + ' · ' + esc(o.bas) : esc(s.ad) + ': ' + esc(o.bas);
  const url = o.url && /^https:\/\//.test(o.url) ? esc(o.url) : '';
  return `<li><details class="olay${yeni ? ' yeni' : ''}" name="${esc(grup)}" style="--r:var(${haber ? '--aksan' : '--ikincil'})"><summary><time>${esc(o.zGoster || String(o.z).slice(0, 10))}</time><span class="tur">${t(o.tur)}</span><span class="metin-s">${bas}</span>${okSag}</summary>
    <div class="ac"><p>${esc(o.bas)}</p><dl><dt>${t('varlik')}</dt><dd>${esc(s.ad)} · ${esc(s.kod)}</dd><dt>${t('kaynak')}</dt><dd>${esc(o.kaynak)}</dd><dt>${t('tarih')}</dt><dd>${esc(o.zGoster || String(o.z).slice(0, 10))}${saat}</dd></dl>
    <div class="eylem">${secili && secili.id === s.id ? '' : `<button class="dugme birincil" data-ac="${esc(s.id)}">${t('dosyaAc')}</button>`}${url ? `<a class="dugme" href="${url}" target="_blank" rel="noopener">${t('kaynagaGit')} ${ok}</a>` : ''}</div></div></details></li>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ac]');
  if (b) { e.preventDefault(); D.sec(b.dataset.ac); }
});

export function gunlukCiz(ilk = false) {
  const el = document.getElementById('gunluk');
  if (el) el.innerHTML = olaylar().map((o, i) => olayHtml(o, 'g', ilk && i < 2)).join('');
}

let zcY0 = 2016;

export function zcCiz() {
  const el = document.getElementById('zc');
  if (!el) return;
  const W = el.clientWidth, H = el.clientHeight;
  if (!W || !H) return;
  const l = D.filtrele(), y0 = zcY0, y1 = 2027, pad = 16, sol = 52;
  const x = y => sol + (y - y0) / (y1 - y0) * (W - sol - pad);
  const satir = (H - 26) / Math.max(1, l.length), simdi = simdiYil();
  const secili = D.getSecili();
  let s = '<g class="eksen">';
  for (let y = y0; y < y1; y++) s += `<line x1="${x(y)}" y1="0" x2="${x(y)}" y2="${H - 18}" stroke="var(--cizgi)"/><text x="${x(y) + 4}" y="${H - 5}">${y}</text>`;
  s += '</g>';
  s += `<line x1="${x(simdi)}" y1="0" x2="${x(simdi)}" y2="${H - 18}" stroke="var(--aksan)" stroke-dasharray="2 3"/><text x="${x(simdi) - 4}" y="${H - 5}" text-anchor="end" style="font-family:var(--mono);font-size:11px;fill:var(--aksan)">${t('simdi')}</text>`;
  let say = 0;

  /* 60'tan fazla kayıtta satırlar 4 px'in altına iner: satır başına süre çizgileri üst üste
     binip okunmaz bir blok oluşturur. O durumda yıl başına olay yoğunluğu sütunları çizilir;
     "sonuç alındı" olayları sütunun altında yeşil segment olarak ayrılır. */
  if (l.length > 60 || satir < 4) {
    const yil = new Map();
    for (let y = y0; y < y1; y++) yil.set(y, { t: 0, s: 0 });
    const ekle = (z, sonuc) => {
      const y = Math.floor(tarihYil(z));
      if (y < y0 || y >= y1) return;
      const b = yil.get(y); b.t++; say++;
      if (sonuc) b.s++;
    };
    for (const sr of l) {
      sr.zaman.forEach(([z]) => ekle(z, sr.durum === 'sonuc'));
      for (const h of D.HABERLER) if (h.sirketId === sr.id) ekle(String(h.tarih).slice(0, 7), false);
    }
    const adim = (W - sol - pad) / (y1 - y0), mx = Math.max(1, ...[...yil.values()].map(b => b.t));
    const taban = H - 20, yuk = H - 36, aralik = Math.min(10, Math.max(4, adim * .1));
    /* Prototipin işaret dili korunur: dolu blok yok — yıl başına iki ince iğne (toplam + sonuç)
       ve uçlarında küçük baklava. Yoğunluk yükseklikten okunur, alan dolgusu kullanılmaz. */
    const igne = (bx, h, renk, op) => h > 0 ? `<line x1="${bx}" y1="${taban}" x2="${bx}" y2="${taban - h}" stroke="${renk}" stroke-opacity="${op}" stroke-width="1.5"/><rect x="${bx - 2.5}" y="${taban - h - 2.5}" width="5" height="5" transform="rotate(45 ${bx} ${taban - h})" fill="none" stroke="${renk}" stroke-opacity="${op}" stroke-width="1"/>` : '';
    s += `<clipPath id="zcKes"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath><g clip-path="url(#zcKes)">`;
    for (const [y, b] of yil) {
      if (!b.t) continue;
      const hT = Math.max(1, b.t / mx * yuk), hS = b.s ? Math.max(1, b.s / mx * yuk) : 0;
      const bx = x(y) + Math.max(6, adim * .2);
      s += `<g class="yil-igne"><title>${y} · ${b.t} ${t('olay')}${b.s ? ' · ' + b.s + ' ' + durumAd('sonuc') : ''}</title>${igne(bx, hT, 'var(--ikincil)', .6)}${igne(bx + aralik, hS, 'var(--sonuc)', .8)}`;
      if (hT > 22) s += `<text x="${bx}" y="${taban - hT - 7}" text-anchor="middle" style="font-family:var(--mono);font-size:10px;fill:var(--sonuk)">${b.t}</text>`;
      s += '</g>';
    }
    s += '</g>';
    el.setAttribute('viewBox', `0 0 ${W} ${H}`);
    el.innerHTML = s;
    const sayEl = document.getElementById('zcSay');
    if (sayEl) sayEl.textContent = say + ' ' + t('olay');
    return;
  }

  s += `<clipPath id="zcKes"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath><g clip-path="url(#zcKes)">`;
  l.forEach((sr, i) => {
    const yy = 6 + i * satir + satir / 2, ak = secili && secili.id === sr.id, r = css(DURUM[sr.durum][1]);
    const yillar = sr.zaman.map(z => tarihYil(z[0]));
    if ((sr.durum === 'sonuc' ? Math.max(...yillar) : simdi) >= y0) {
      s += `<line x1="${Math.max(sol - 4, x(Math.min(...yillar)))}" y1="${yy}" x2="${sr.durum === 'sonuc' ? x(Math.max(...yillar)) : x(simdi)}" y2="${yy}" stroke="${r}" stroke-opacity="${ak ? .9 : .3}" stroke-width="${ak ? 2 : 1}"/>`;
    }
    s += `<text x="${pad - 4}" y="${yy + 3}" style="font-family:var(--mono);font-size:11px;fill:${ak ? 'var(--metin)' : 'var(--sonuk)'}">${esc(sr.kod.slice(4))}</text>`;
    for (const [z, o] of sr.zaman) {
      if (tarihYil(z) < y0) continue;
      const xx = x(tarihYil(z)); say++;
      s += `<g class="tik" data-id="${esc(sr.id)}"><title>${esc(z)} · ${esc(sr.ad)}: ${esc(L(o))}</title><rect x="${xx - 4}" y="${yy - 4}" width="8" height="8" transform="rotate(45 ${xx} ${yy})" fill="${ak ? r : 'var(--zemin)'}" stroke="${r}"/></g>`;
    }
    for (const h of D.HABERLER.filter(h => h.sirketId === sr.id && tarihYil(String(h.tarih).slice(0, 7)) >= y0)) {
      const xx = x(tarihYil(String(h.tarih).slice(0, 7)));
      s += `<line x1="${xx}" y1="${yy - 6}" x2="${xx}" y2="${yy + 6}" stroke="${r}"/>`;
    }
  });
  s += '</g>';
  el.setAttribute('viewBox', `0 0 ${W} ${H}`);
  el.innerHTML = s;
  const sayEl = document.getElementById('zcSay');
  if (sayEl) sayEl.textContent = say + ' ' + t('olay');
}

export function pencereKur() {
  const p = document.getElementById('pencere');
  if (p) p.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    zcY0 = +b.dataset.y;
    p.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    zcCiz();
  });
  const zc = document.getElementById('zc');
  if (zc) zc.addEventListener('click', e => {
    const g = e.target.closest('.tik');
    if (g) D.sec(g.dataset.id);
  });
}
