/* ana.js — çekirdek: veriyi yükler, modülleri bağlar, dili, saati, modalları ve barkodu yönetir. */

import { veriYukle } from './veri.js';
import { metinleriAl, dilBaslat, dilSec, dil, DILLER, t } from './i18n.js';
import { Ses, sesBagla, sesKilidiKur } from './ses.js';
/* küre modülü three.js'i CDN'den çeker; statik import açılış perdesini geciktirmesin diye
   dinamik yüklenir ve veri isteğiyle paralel başlatılır. */
const kureYukle = import('./kure.js');
import { panellerBagla } from './paneller.js';
import { intelBagla } from './intel.js';
import { zamanBagla, gunlukCiz, pencereKur, zcCiz } from './zaman.js';
import { brifingBagla, acilisGoster, acilisHazir, acilisAcikMi, brifingBitir } from './brifing.js';
import { barkodDegerlendir } from './barkod.js';

let D = null;
const $ = s => document.querySelector(s);
const kok = document.documentElement;
const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= SAAT ================= */
function saat() {
  const el = $('#saat'); if (el) el.textContent = new Date().toISOString().slice(11, 19) + ' UTC';
}
saat(); setInterval(saat, 1000);

/* ================= SES DÜĞMESİ ================= */
function sesDugmeCiz() {
  const b = $('#sesDugme'); if (!b) return;
  const a = Ses.acik, et = t(a ? 'sesKapat' : 'sesAc');
  b.setAttribute('aria-pressed', a); b.setAttribute('aria-label', et); b.title = et;
  const dalga = b.querySelector('.dalga'), sessiz = b.querySelector('.sessiz');
  if (dalga) dalga.style.display = a ? '' : 'none';
  if (sessiz) sessiz.style.display = a ? 'none' : '';
  b.style.color = a ? 'var(--metin)' : '';
}

/* ================= BARKOD ================= */
function barkodSor() {
  const k = $('#barkod').value.replace(/\D/g, ''), o = $('#barkodSonuc');
  o.className = 'sonuc goster';
  const d = barkodDegerlendir(k);
  if (d.tur === 'uzunluk') { o.textContent = t('bk13'); return; }
  if (d.tur === 'hane') { o.textContent = t('bkHane'); return; }
  if (d.tur === 'bds') { o.classList.add('uyari'); o.innerHTML = t('bk729'); Ses.cal('kilit'); return; }
  o.innerHTML = t('bkTemiz', { p: `<span class="m">${d.onek}</span>` });
}

/* ================= DİL ================= */
function dilUygula() {
  kok.lang = dil === 'zh' ? 'zh-CN' : dil;
  document.title = 'Boykot · ' + t('altBaslik');
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
  document.querySelectorAll('[data-t-placeholder]').forEach(el => el.placeholder = t(el.dataset.tPlaceholder));
  document.querySelectorAll('[data-t-aria-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.tAriaLabel)));
  document.querySelectorAll('[data-t-title]').forEach(el => el.title = t(el.dataset.tTitle));
  document.querySelectorAll('.dil').forEach(b => b.setAttribute('aria-pressed', b.dataset.dil === dil));
  if (!D) return;
  const hud = $('#hudSol');
  const ag = D.getGorunum && D.getGorunum() === 'ag';
  if (hud) hud.textContent = ag ? t('yardimAg') : t(D.haritaDurumu && D.haritaDurumu() ? 'haritaHata' : 'yardim');
  D.katmanCiz && D.katmanCiz();
  D.ciplerCiz && D.ciplerCiz();
  D.gorunumAdCiz && D.gorunumAdCiz();
  sesDugmeCiz();
  D.tabloCiz && D.tabloCiz();
  gunlukCiz();
  const secili = D.getSecili();
  if (secili) { D.dosyaCiz(secili, false); D.nisanCiz(secili); } else D.genelCiz && D.genelCiz();
  D.brifingDilYenile && D.brifingDilYenile();
  const bs = $('#barkodSonuc');
  if (bs && bs.classList.contains('goster')) barkodSor();
}

function dilDugmeleri() {
  document.querySelectorAll('.dil').forEach(b => b.onclick = () => {
    const yeni = b.dataset.dil; if (yeni === dil || !DILLER.includes(yeni)) return;
    const kaydir = [$('.sol'), $('.sag'), $('#gunluk')].filter(Boolean).map(el => [el, el.scrollTop]);
    const uygula = () => { dilSec(yeni); try { localStorage.setItem('dil', yeni); } catch (e) { /* yok */ } dilUygula(); kaydir.forEach(([el, y]) => el.scrollTop = y); };
    if (azHareket) { uygula(); return; }
    document.body.classList.add('dil-gecis');
    setTimeout(() => {
      uygula();
      document.body.classList.remove('dil-gecis'); document.body.classList.add('dil-gel');
      setTimeout(() => document.body.classList.remove('dil-gel'), 190);
    }, 120);
  });
}

/* ================= MODALLAR ================= */
const ac = id => { const m = $(id); if (!m) return; m.classList.add('acik'); const f = m.querySelector('input,button'); if (f) f.focus(); };

function modalKur() {
  $('#barkodAc').onclick = () => ac('#barkodModal');
  $('#yontemAc').onclick = () => ac('#yontemModal');
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => {
    if (e.target === m || e.target.closest('[data-kapat]')) m.classList.remove('acik');
  }));
  $('#barkodSor').onclick = barkodSor;
  $('#barkod').addEventListener('keydown', e => { if (e.key === 'Enter') barkodSor(); });
  $('#sesDugme').onclick = () => Ses.acik ? Ses.kapat() : Ses.ac(true);
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const m = document.querySelector('.modal.acik');
    if (m) { m.classList.remove('acik'); return; }
    if (D && D.brifingAcik && D.brifingAcik()) brifingBitir();
    else if (D && D.getSecili && D.getSecili()) D.birak();
  });
}

/* ================= BAŞLAT ================= */
async function baslat() {
  let paket;
  try { paket = await veriYukle(); }
  catch (e) {
    const l = $('#liste'); if (l) l.innerHTML = `<li class="bos">Veri yüklenemedi. Sayfayı yenile.</li>`;
    return;
  }
  metinleriAl(paket.METINLER);
  dilBaslat();

  D = {
    SIRKETLER: paket.SIRKETLER,
    HABERLER: paket.HABERLER,
    GUNCELLEME: paket.GUNCELLEME,
    KAYNAKLAR: paket.KAYNAKLAR,
    secili: null,
    hazir: false,
    getSecili: () => D.secili,
    dil: () => dil,
    yaySayisi: () => paket.SIRKETLER.reduce((a, s) => a + (s.bag ? s.bag.length : 0), 0)
  };

  /* Açılış perdesi ağır kurulumdan önce gelir; animasyon (≤2,5 sn) tek başına akar.
     Bitince ya da ENTER'a basılınca modüller kurulur, perde ancak içerik hazırken açılır. */
  brifingBagla(D);
  await acilisGoster();

  /* Modül sırası: küre ve paneller önce, seçim ve brifing sonra. */
  const { kureBagla } = await kureYukle;
  kureBagla(D);
  panellerBagla(D);
  zamanBagla(D); pencereKur();
  intelBagla(D);
  sesBagla(sesDugmeCiz);
  sesKilidiKur();
  document.addEventListener('click', e => {
    if (e.target.closest('.sekme[data-gorunum],.cip,.dk,.katman,summary,.dil,#barkodAc,#yontemAc,.br-kontrol button,.kapat')) Ses.cal('blip');
  }, true);

  modalKur();
  dilDugmeleri();
  dilUygula();
  zcCiz();
  gunlukCiz(true);
  sesDugmeCiz();

  D.hazir = true;
  if (acilisAcikMi()) D.renderDuraklat && D.renderDuraklat(true);
  acilisHazir();
}

baslat();
