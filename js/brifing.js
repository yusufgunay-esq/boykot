/* brifing.js — açılış perdesi (boot + glitch + tarama + ENTER), daktilo ve brifing akışı. */

import { t, L, B, sayiTR, durumAd } from './i18n.js';
import { km, utcParcala } from './veri.js';
import { Ses, sesTercih } from './ses.js';

let D = null;
const $ = s => document.querySelector(s);
const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
const bekle = ms => new Promise(r => setTimeout(r, ms));

/* ================= DAKTİLO ================= */
const yazJeton = new WeakMap();
export function yaz(el, metin, hiz = 22, sesli = false) {
  return new Promise(res => {
    if (!el) return res();
    if (azHareket) { el.textContent = metin; return res(); }
    const j = {}; yazJeton.set(el, j); el.textContent = ''; el.classList.add('imlec');
    let i = 0;
    const adim = () => {
      if (yazJeton.get(el) !== j) { el.classList.remove('imlec'); return res(); }
      i += metin[i] === ' ' ? 2 : 1; el.textContent = metin.slice(0, i);
      if (sesli && i % 2 === 0 && metin[i - 1] !== ' ') Ses.cal('tik');
      if (i < metin.length) setTimeout(adim, hiz); else { el.classList.remove('imlec'); res(); }
    };
    adim();
  });
}

/* ================= AÇILIŞ PERDESİ ================= */
let acilisAcik = false, acilisJeton = 0;

/* Açılışta üç sayı: varlık · ülke · kaynak. "Bağlantı" sayısı (27) burada yanıltıcıydı;
   kaynak sayısı sitenin kendi KPI satırıyla (SOURCE) ve "her iddia kaynağıyla" satırıyla uyumlu. */
function acilisSayilari() {
  return {
    n: D.SIRKETLER.length,
    u: new Set(D.SIRKETLER.map(s => s.ulke)).size,
    b: D.SIRKETLER.reduce((a, s) => a + s.kaynak.length, 0)
  };
}

function acilisDoldur() {
  const u = utcParcala();
  $('#aDosya').textContent = u.dosya; $('#aTarih').textContent = u.tarih; $('#aDamga').textContent = u.damga;
  $('#a1').textContent = t('a1');
  $('#a2').textContent = t('a2', acilisSayilari());
  $('#a3').textContent = t('a3');
}

function acilisTus(e) {
  if (!acilisAcik) return;
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); acilisKapat(); }
}

let bitisCoz = null, kapatFadeIstek = false;

function acilisFade() {
  kapatFadeIstek = false;
  const el = $('#acilis'); el.style.opacity = 0;
  if (sesTercih()) Ses.ac().then(() => Ses.cal('darbe')).catch(() => {});
  setTimeout(() => {
    el.classList.remove('acik', 'coz', 'tara'); el.removeAttribute('style'); el.setAttribute('aria-hidden', 'true');
    if (D && D.renderDuraklat) D.renderDuraklat(false);
  }, 480);
}

export function acilisKapat() {
  if (!acilisAcik) return;
  acilisAcik = false; acilisJeton++;
  try { sessionStorage.setItem('acilis', '1'); } catch (e) { /* yok */ }
  removeEventListener('keydown', acilisTus, true);
  if (bitisCoz) { bitisCoz(); bitisCoz = null; }
  /* Modüller henüz kurulmadıysa perde, içerik hazır olana kadar açılmaz. */
  if (D && D.hazir) acilisFade(); else kapatFadeIstek = true;
}

/* Ana akış modülleri kurduktan sonra çağırır: erken kapatma isteği varsa perdeyi açar. */
export function acilisHazir() { if (kapatFadeIstek) acilisFade(); }
export const acilisAcikMi = () => acilisAcik;

/* Açılış animasyonu zamana bağlıdır (kare hızı düşse de toplam süre ≤2,5 sn):
   0,14–1,29 sn boot satırları · 1,29–1,55 sn başlık glitch · 1,35–2,35 sn tarama. */
export function acilisGoster() {
  let goruldu = false; try { goruldu = sessionStorage.getItem('acilis') === '1'; } catch (e) { /* yok */ }
  if (goruldu) return Promise.resolve();
  const bitis = new Promise(r => { bitisCoz = r; });
  acilisAcik = true; const j = ++acilisJeton, el = $('#acilis');
  el.classList.add('acik'); el.setAttribute('aria-hidden', 'false');
  el.dataset.bas = String(Math.round(performance.now()));
  if (D && D.renderDuraklat) D.renderDuraklat(true);
  const u = utcParcala();
  $('#aDosya').textContent = u.dosya; $('#aTarih').textContent = u.tarih; $('#aDamga').textContent = u.damga;
  ['a1', 'a2', 'a3'].forEach(x => $('#' + x).textContent = '');
  /* Başlık glitch'i prototipteki büyük başlığın kendisinde oynar; ikinci bir "BOYKOT"
     satırı eklenmez (görsel tekrar). Metin dile göre değiştiği için önce yakalanır. */
  const bas = $('#acilis .g-ust'), basMetin = bas ? bas.textContent : '';
  delete el.dataset.hazir; delete el.dataset.bitis;
  $('#aBasla').onclick = acilisKapat; $('#aAtla').onclick = acilisKapat;
  addEventListener('keydown', acilisTus, true);
  setTimeout(() => { if (acilisAcik) $('#aBasla').focus(); }, 60);

  if (azHareket) { acilisDoldur(); el.classList.add('coz'); el.dataset.hazir = '1'; el.dataset.bitis = String(Math.round(performance.now())); if (bitisCoz) { bitisCoz(); bitisCoz = null; } return bitis; }

  const satirlar = [
    { el: $('#a1'), metin: t('a1') },
    { el: $('#a2'), metin: t('a2', acilisSayilari()) },
    { el: $('#a3'), metin: t('a3') }
  ];
  const toplamKar = satirlar.reduce((a, s) => a + s.metin.length, 0);
  const t0 = performance.now(), YAZ_BAS = 140, YAZ_SURE = 1150, BASLIK_GEC = 1290, GLITCH_SURE = 260;
  const glif = '#%&@$0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let taramaBasladi = false, cozBasladi = false;

  const kare = now => {
    if (j !== acilisJeton) return;
    const gecen = now - t0;
    const oran = Math.min(1, Math.max(0, (gecen - YAZ_BAS) / YAZ_SURE));
    let kalan = Math.round(oran * toplamKar);
    for (const s of satirlar) {
      if (!s.el) continue;
      const n = Math.max(0, Math.min(s.metin.length, kalan));
      s.el.textContent = s.metin.slice(0, n); kalan -= s.metin.length;
    }
    if (!cozBasladi && gecen >= BASLIK_GEC) {
      cozBasladi = true; el.classList.add('coz');
      if (!taramaBasladi) { taramaBasladi = true; el.classList.add('tara'); setTimeout(() => el.classList.remove('tara'), 1050); }
    }
    if (cozBasladi && bas) {
      const n = Math.min(basMetin.length, Math.floor((gecen - BASLIK_GEC) / 14));
      bas.textContent = [...basMetin].map((c, i) => i < n || c === ' ' ? c : glif[Math.floor(Math.random() * glif.length)]).join('');
    }
    if (gecen < BASLIK_GEC + GLITCH_SURE + 40) requestAnimationFrame(kare);
    else {
      for (const s of satirlar) if (s.el) s.el.textContent = s.metin;
      if (bas) bas.textContent = basMetin;
      el.dataset.hazir = '1';
      el.dataset.bitis = String(Math.round(performance.now()));
      if (bitisCoz) { bitisCoz(); bitisCoz = null; }
    }
  };
  requestAnimationFrame(kare);
  return bitis;
}

/* ================= BRİFİNG ================= */
const IK = {
  dur: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2v8M8.5 2v8" stroke="currentColor" stroke-width="1.6"/></svg>',
  oyna: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8l7-4z" fill="currentColor"/></svg>'
};
const br = { acik: false, i: 0, dur: false, zaman: null, jeton: 0, liste: [] };

/* 243 kaydın tamamını 3,4 sn/adım oynatmak yarım saat sürer; brifing temsili bir küme gezER:
   tüm "sonuç alındı" kayıtları + kanıt yoğunluğu en yüksek kayıtlar (en çok 12). */
function brifingListe() {
  const sonuc = D.SIRKETLER.filter(s => s.durum === 'sonuc');
  const diger = D.SIRKETLER.filter(s => s.durum !== 'sonuc')
    .sort((a, b) => (b.kaynak.length + b.zaman.length) - (a.kaynak.length + a.zaman.length) || a.ad.localeCompare(b.ad, 'tr'));
  return sonuc.concat(diger).slice(0, 12);
}

function kapakDoldur() {
  const u = utcParcala();
  $('#gDosya').textContent = u.dosya; $('#gTarih').textContent = u.tarih; $('#gDamga').textContent = u.damga;
  $('#gBaslik').textContent = 'BOYKOT';
  ['g1', 'g2', 'g3'].forEach(x => $('#' + x).textContent = '');
}
let kapakTus = null;
function kapakTemizle() { $('#gBasla').onclick = null; $('#gAtla').onclick = null; if (kapakTus) { removeEventListener('keydown', kapakTus, true); kapakTus = null; } }

export async function brifingBaslat() {
  if (br.acik) return;
  scrollTo(0, 0);
  br.acik = true; br.i = 0; br.dur = false; br.liste = brifingListe();
  $('#brDur').innerHTML = IK.dur; const j = ++br.jeton;
  if (D.renderDuraklat) D.renderDuraklat(true);
  if (D.getGorunum && D.getGorunum() !== 'kure') D.gorunumSec('kure');
  const g = $('#giris'); kapakDoldur(); g.classList.remove('akis', 'final'); g.style.opacity = 1; g.classList.add('acik'); g.setAttribute('aria-hidden', 'false');
  $('#gBasla').onclick = () => { kapakTemizle(); kapakAkis(j); };
  $('#gAtla').onclick = () => { kapakTemizle(); kapakAtla(j); };
  kapakTus = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kapakTemizle(); kapakAkis(j); } };
  addEventListener('keydown', kapakTus, true);
  setTimeout(() => { if (br.acik && j === br.jeton && g.classList.contains('acik') && !g.classList.contains('akis')) $('#gBasla').focus(); }, 80);
}

async function kapakAkis(j) {
  if (j !== br.jeton) return;
  const g = $('#giris'); g.classList.add('akis'); g.style.opacity = 1;
  await bekle(140); if (j !== br.jeton) return;
  await yaz($('#g1'), t('g1', { d: new Date().toISOString().slice(0, 10) }), 22, true); if (j !== br.jeton) return;
  await yaz($('#g2'), t('g2', { n: D.SIRKETLER.length, u: new Set(D.SIRKETLER.map(s => s.ulke)).size, b: D.yaySayisi ? D.yaySayisi() : 0 }), 22, true); if (j !== br.jeton) return;
  await yaz($('#g3'), t('g3'), 22, true); if (j !== br.jeton) return;
  Ses.cal('darbe'); Ses.yogunluk(true); await bekle(950); if (j !== br.jeton) return;
  await kapakKapan(j);
}

async function kapakAtla(j) {
  if (j !== br.jeton) return;
  const g = $('#giris'); Ses.yogunluk(true); g.style.opacity = 0;
  document.body.classList.add('brifing'); if (D.kureKontrol) D.kureKontrol.autoRotate = false;
  await bekle(620); if (j !== br.jeton) return;
  g.classList.remove('acik', 'akis', 'final'); g.setAttribute('aria-hidden', 'true');
  if (D.renderDuraklat) D.renderDuraklat(false);
  brAdim();
}

async function kapakKapan(j) {
  const g = $('#giris'); g.style.opacity = 0; document.body.classList.add('brifing'); if (D.kureKontrol) D.kureKontrol.autoRotate = false;
  await bekle(760); if (j !== br.jeton) return;
  g.classList.remove('acik', 'akis', 'final'); g.setAttribute('aria-hidden', 'true');
  if (D.renderDuraklat) D.renderDuraklat(false);
  brAdim();
}

function brUstCiz() {
  const s = br.liste[br.i], n = br.liste.length;
  $('#brUst').innerHTML = `<b>${t('brifingNo')} ${String(br.i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</b><br>${s.kod} · ${B(s.ad)} · ${s.sehir || s.ulke}<div class="br-ilerleme">${br.liste.map((_, k) => `<span class="${k < br.i ? 'tamam' : k === br.i ? 'simdi' : ''}"></span>`).join('')}</div>`;
}

async function brAdim() {
  clearTimeout(br.zaman); const j = ++br.jeton, s = br.liste[br.i];
  if (!s) return brifingFinal();
  D.sec(s.id); brUstCiz();
  $('#brKim').textContent = `${s.kod} · ${B(durumAd(s.durum))}`; $('#brMetin').textContent = '';
  const b = s.bag && s.bag[0];
  const metin = b
    ? t('adimMetin', { ad: s.ad, sehir: s.sehir || s.ulke, neden: L(s.neden), yer: L(b.e), km: sayiTR(km(s, b)) })
    : t('adimMetinTek', { ad: s.ad, sehir: s.sehir || s.ulke, neden: L(s.neden) });
  await bekle(1100); if (j !== br.jeton) return;
  await yaz($('#brMetin'), metin, D.dil() === 'zh' ? 60 : 24, true); if (j !== br.jeton) return;
  if (s.durum === 'sonuc') { Ses.cal('zafer'); $('#brKim').innerHTML = `<span style="color:var(--basari)">${s.kod} · ${t('basarili')}</span>`; }
  br.zaman = setTimeout(() => { if (!br.dur && j === br.jeton) brSonraki(); }, s.durum === 'sonuc' ? 4600 : 3400);
}

export function brSonraki() { if (!br.acik) return; if (br.i < br.liste.length - 1) { br.i++; brAdim(); } else brifingFinal(); }
export function brOnceki() { if (br.acik && br.i > 0) { br.i--; brAdim(); } }

async function brifingFinal() {
  const j = ++br.jeton; clearTimeout(br.zaman);
  const g = $('#giris'); g.classList.remove('akis'); g.classList.add('acik', 'final'); g.setAttribute('aria-hidden', 'false'); g.style.opacity = 0; await bekle(30); g.style.opacity = 1;
  ['gBaslik', 'g1', 'g2', 'g3'].forEach(x => $('#' + x).textContent = '');
  const sonuc = D.SIRKETLER.filter(s => s.durum === 'sonuc');
  Ses.yogunluk(false); Ses.cal('final');
  await bekle(700); await yaz($('#gBaslik'), t('bitti'), 40, true); if (j !== br.jeton) return;
  await yaz($('#g1'), t('f1', { n: D.SIRKETLER.length, s: sonuc.length }), 22, true); if (j !== br.jeton) return;
  if (sonuc.length) { await yaz($('#g2'), t('f2', { l: sonuc.map(s => B(s.ad)).join(t('ve')) }), 22, true); if (j !== br.jeton) return; }
  await yaz($('#g3'), t('f3'), 30, true); await bekle(3200); if (j !== br.jeton) return;
  brifingBitir();
}

export function brifingBitir() {
  if (!br.acik) return;
  br.acik = false; br.jeton++; clearTimeout(br.zaman); kapakTemizle();
  Ses.yogunluk(false); document.body.classList.remove('brifing');
  const g = $('#giris'); g.style.opacity = 0;
  setTimeout(() => { if (!br.acik) g.classList.remove('acik', 'akis', 'final'); g.setAttribute('aria-hidden', 'true'); }, 900);
  $('#brMetin').textContent = '';
  if (D.renderDuraklat) D.renderDuraklat(false);
  D.birak();
  D.kureSifirla && D.kureSifirla();
}

export function brifingDilYenile() {
  if (!br.acik || $('#giris').classList.contains('acik')) return;
  brUstCiz();
  const s = br.liste[br.i]; if (!s) return;
  $('#brKim').textContent = `${s.kod} · ${B(durumAd(s.durum))}`;
  const b = s.bag && s.bag[0];
  $('#brMetin').textContent = b
    ? t('adimMetin', { ad: s.ad, sehir: s.sehir || s.ulke, neden: L(s.neden), yer: L(b.e), km: sayiTR(km(s, b)) })
    : t('adimMetinTek', { ad: s.ad, sehir: s.sehir || s.ulke, neden: L(s.neden) });
}

export function brifingBagla(deps) {
  D = deps;
  $('#brifingAc').onclick = brifingBaslat;
  $('#brIleri').onclick = brSonraki;
  $('#brGeri').onclick = brOnceki;
  $('#brCik').onclick = brifingBitir;
  $('#brDur').onclick = () => {
    br.dur = !br.dur;
    $('#brDur').innerHTML = br.dur ? IK.oyna : IK.dur;
    $('#brDur').setAttribute('aria-label', t(br.dur ? 'brOyna' : 'brDur'));
    if (!br.dur) { clearTimeout(br.zaman); br.zaman = setTimeout(brSonraki, 1200); }
  };
  addEventListener('keydown', e => {
    if (!br.acik || $('#giris').classList.contains('acik')) return;
    if (e.key === 'ArrowRight') brSonraki();
    if (e.key === 'ArrowLeft') brOnceki();
    if (e.key === ' ') { e.preventDefault(); $('#brDur').click(); }
  }, true);
  Object.assign(D, { yaz, acilisGoster, brifingBaslat, brifingBitir, brifingDilYenile, brifingAcik: () => br.acik });
}
