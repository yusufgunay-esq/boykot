/* kure.js — three.js küresi, işaretler, faaliyet yayları, nişan ve HUD.
   Görsel dil prototipten birebir korunur; veri data/sirketler.json'dan gelir. */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { t, B, L, sayiTR, yerAdi } from './i18n.js';
import { DURUM } from './veri.js';

let D = null;
const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const $ = s => document.querySelector(s);

const R = 1, MESAFE = 3.45;
let sahne, kamera, ciz, kontrol, dunya, K, okyanus;
let izMat, izMat2, taramaGrp, menzil;
let karaMat, sinirMat, haritaHata = false;
const isaretler = [], tiklanabilir = [], yaylar = [];
let ucus = null, beklet = null, gorKay = 0, ustunde = null, bas0 = null;
let nisan, nisanEt, kEl, koorLEl, koorREl, ipucu;
const gv = new THREE.Vector3(), dv = new THREE.Vector3();
const isin = new THREE.Raycaster(), fare = new THREE.Vector2();

const KATMANLAR = () => [['merkez', 'k_merkez', D.SIRKETLER.length], ['yay', 'k_yay', yaylar.length], ['sinir', 'k_sinir', '177'], ['kara', 'k_kara', '64K'], ['izgara', 'k_izgara', '15°']];

const v3 = (lat, lng, r = R) => { const f = (90 - lat) * Math.PI / 180, q = (lng + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(f) * Math.cos(q), r * Math.cos(f), r * Math.sin(f) * Math.sin(q)); };
const kolay = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const durumRengi = s => css(DURUM[s.durum][1]);
const km = (a, b) => { const r = Math.PI / 180, d = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2; return Math.round(12742 * Math.asin(Math.sqrt(d))); };

/* ================= SAHNE ================= */
function sahneKur() {
  const kap = document.getElementById('kure');
  sahne = new THREE.Scene();
  kamera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  kamera.position.set(.9, .75, 3.2).setLength(MESAFE);
  ciz = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  ciz.setPixelRatio(Math.min(devicePixelRatio, 2));
  kap.appendChild(ciz.domElement);
  kontrol = new OrbitControls(kamera, ciz.domElement);
  Object.assign(kontrol, { enableDamping: true, dampingFactor: .06, enablePan: false, minDistance: 1.6, maxDistance: 5.5, rotateSpeed: .45, zoomSpeed: .6, autoRotate: !azHareket, autoRotateSpeed: .28 });
  dunya = new THREE.Group(); sahne.add(dunya);
  okyanus = new THREE.Mesh(new THREE.SphereGeometry(R * .995, 72, 72), new THREE.MeshBasicMaterial({ color: css('--zemin') })); dunya.add(okyanus);

  K = { izgara: new THREE.Group(), kara: new THREE.Group(), sinir: new THREE.Group(), merkez: new THREE.Group(), yay: new THREE.Group() };
  Object.values(K).forEach(g => dunya.add(g));
  izMat = new THREE.LineBasicMaterial({ color: css('--kara'), transparent: true, opacity: .14 });
  izMat2 = new THREE.LineBasicMaterial({ color: css('--kara'), transparent: true, opacity: .32 });
  for (let lat = -75; lat <= 75; lat += 15) { const p = []; for (let l = -180; l <= 180; l += 3) p.push(v3(lat, l, R * 1.001)); K.izgara.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lat === 0 ? izMat2 : izMat)); }
  for (let lng = -180; lng < 180; lng += 15) { const p = []; for (let a = -90; a <= 90; a += 3) p.push(v3(a, lng, R * 1.001)); K.izgara.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lng === 0 ? izMat2 : izMat)); }

  /* Radar taraması: dönen meridyen yelpazesi (prefers-reduced-motion'da durur) */
  taramaGrp = new THREE.Group(); K.izgara.add(taramaGrp);
  for (let k = 0; k < 9; k++) {
    const p = []; for (let a = -88; a <= 88; a += 4) p.push(v3(a, -k * 2.4, R * 1.004));
    taramaGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: css('--metin'), transparent: true, opacity: .085 * (1 - k / 9) })));
  }

  menzil = new THREE.Group(); menzil.visible = false; dunya.add(menzil);

  nisan = $('#nisan'); nisanEt = $('#nisanEtiket'); kEl = $('#koordinat'); koorLEl = $('#koorL'); koorREl = $('#koorR'); ipucu = $('#ipucu');

  kontrol.addEventListener('start', () => { ucus = null; kontrol.autoRotate = false; clearTimeout(beklet); });
  kontrol.addEventListener('end', () => { clearTimeout(beklet); if (!D.getSecili() && !azHareket) beklet = setTimeout(() => kontrol.autoRotate = true, 6000); });

  ciz.domElement.addEventListener('pointermove', e => {
    const r = ciz.domElement.getBoundingClientRect(); fare.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    isin.setFromCamera(fare, kamera); const h = K.merkez.visible ? isin.intersectObjects(tiklanabilir)[0] : null;
    ustunde = h && h.object.parent.visible ? h.object.userData.s : null;
    ciz.domElement.style.cursor = ustunde ? 'pointer' : 'crosshair';
    if (ustunde) { ipucu.textContent = ustunde.kod + '  ' + ustunde.ad; ipucu.style.left = e.clientX + 'px'; ipucu.style.top = e.clientY + 'px'; ipucu.style.opacity = 1; } else ipucu.style.opacity = 0;
  });
  ciz.domElement.addEventListener('pointerdown', e => bas0 = [e.clientX, e.clientY]);
  ciz.domElement.addEventListener('pointerup', e => { if (bas0 && Math.hypot(e.clientX - bas0[0], e.clientY - bas0[1]) < 5 && ustunde) D.sec(ustunde.id); });
  ciz.domElement.addEventListener('pointerleave', () => { ipucu.style.opacity = 0; ustunde = null; });

  new ResizeObserver(boyutla).observe(kap);
  D.kureKontrol = kontrol;
}

function haritaKur() {
  $('#hudSol').textContent = t('haritaYuk');
  return Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json').then(r => r.json()),
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json').then(r => r.json()),
    import('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm')
  ]).then(([kara, ulkeler, tj]) => {
    const W = 2048, H = 1024, tv = document.createElement('canvas'); tv.width = W; tv.height = H;
    const c = tv.getContext('2d', { willReadFrequently: true }); c.fillStyle = '#fff';
    for (const ft of tj.feature(kara, kara.objects.land).features) {
      const polis = ft.geometry.type === 'Polygon' ? [ft.geometry.coordinates] : ft.geometry.coordinates;
      for (const poli of polis) { c.beginPath(); for (const h of poli) { h.forEach(([x, y], i) => { const px = (x + 180) / 360 * W, py = (90 - y) / 180 * H; i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.closePath(); } c.fill('evenodd'); }
    }
    const veri = c.getImageData(0, 0, W, H).data, N = 64000, poz = [], altin = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, lat = Math.asin(y) * 180 / Math.PI, lng = ((i * altin) % (2 * Math.PI)) * 180 / Math.PI - 180;
      const px = Math.floor((lng + 180) / 360 * W) % W, py = Math.min(H - 1, Math.floor((90 - lat) / 180 * H));
      if (veri[(py * W + px) * 4] > 128) { const v = v3(lat, lng, R * 1.002); poz.push(v.x, v.y, v.z); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3));
    karaMat = new THREE.PointsMaterial({ color: css('--kara'), size: .0065, transparent: true, opacity: .78 }); K.kara.add(new THREE.Points(g, karaMat));
    sinirMat = new THREE.LineBasicMaterial({ color: css('--sinir'), transparent: true, opacity: .3 });
    for (const hat of tj.mesh(ulkeler, ulkeler.objects.countries).coordinates) {
      K.sinir.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hat.map(([x, y]) => v3(y, x, R * 1.003))), sinirMat));
    }
    if (!(D.getGorunum && D.getGorunum() === 'ag')) $('#hudSol').textContent = t('yardim');
  }).catch(() => {
    haritaHata = true;
    if (!(D.getGorunum && D.getGorunum() === 'ag')) $('#hudSol').textContent = t('haritaHata');
  });
}

/* ================= İŞARETLER VE YAYLAR ================= */
function isaretKur() {
  for (const s of D.SIRKETLER) {
    const renk = new THREE.Color(durumRengi(s)), taban = v3(s.lat, s.lng, R), yon = taban.clone().normalize();
    const g = new THREE.Group(); g.position.copy(taban); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), yon);
    const boy = .075 + s.kaynak.length * .01 + s.zaman.length * .01;
    const cubuk = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, boy, 6), new THREE.MeshBasicMaterial({ color: renk })); cubuk.position.y = boy / 2; g.add(cubuk);
    const bas = new THREE.Mesh(new THREE.OctahedronGeometry(.011), new THREE.MeshBasicMaterial({ color: renk })); bas.position.y = boy; g.add(bas);
    const ayak = new THREE.Mesh(new THREE.RingGeometry(.006, .009, 4), new THREE.MeshBasicMaterial({ color: renk, side: THREE.DoubleSide })); ayak.rotation.x = -Math.PI / 2; ayak.rotation.z = Math.PI / 4; ayak.position.y = .001; g.add(ayak);
    const halka = new THREE.Mesh(new THREE.RingGeometry(.013, .0155, 48), new THREE.MeshBasicMaterial({ color: renk, transparent: true, side: THREE.DoubleSide, depthWrite: false })); halka.rotation.x = -Math.PI / 2; halka.position.y = .002; g.add(halka);
    const vur = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 8), new THREE.MeshBasicMaterial({ visible: false })); vur.position.y = boy * .6; vur.userData.s = s; g.add(vur);
    K.merkez.add(g); tiklanabilir.push(vur); isaretler.push({ s, g, halka, bas, faz: Math.random() });
  }
  for (const s of D.SIRKETLER) for (const b of (s.bag || [])) {
    const a = v3(s.lat, s.lng, R), bv = v3(b.lat, b.lng, R), aci = a.angleTo(bv), orta = a.clone().add(bv).normalize().multiplyScalar(R + .08 + aci * .32);
    const egri = new THREE.QuadraticBezierCurve3(a, orta, bv);
    const cizgi = new THREE.Line(new THREE.BufferGeometry().setFromPoints(egri.getPoints(100)), new THREE.LineDashedMaterial({ color: durumRengi(s), transparent: true, opacity: .22, dashSize: .012, gapSize: .008 }));
    cizgi.computeLineDistances(); K.yay.add(cizgi);
    const isik = new THREE.Mesh(new THREE.SphereGeometry(.0065, 10, 10), new THREE.MeshBasicMaterial({ color: durumRengi(s) })); isik.visible = false; K.yay.add(isik);
    const uc = new THREE.Mesh(new THREE.RingGeometry(.008, .011, 4), new THREE.MeshBasicMaterial({ color: durumRengi(s), side: THREE.DoubleSide, transparent: true, opacity: .5 }));
    uc.position.copy(v3(b.lat, b.lng, R * 1.003)); uc.lookAt(0, 0, 0); K.yay.add(uc);
    yaylar.push({ s, b, egri, cizgi, isik, uc, t0: 0 });
  }
}

/* ================= MENZİL, UÇUŞ, HUD ================= */
function menzilTemizle() { menzil.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); menzil.clear(); }
export function menzilCiz(s) {
  menzilTemizle();
  const konum = v3(s.lat, s.lng, R * 1.004);
  menzil.position.copy(konum); menzil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), konum.clone().normalize());
  const anaMat = new THREE.LineBasicMaterial({ color: css('--metin'), transparent: true, opacity: .5 });
  const inceMat = new THREE.LineBasicMaterial({ color: css('--metin'), transparent: true, opacity: .26 });
  [.055, .105, .155].forEach((r, i) => {
    const p = []; for (let a = 0; a <= 96; a++) { const tt = a / 96 * Math.PI * 2; p.push(new THREE.Vector3(Math.cos(tt) * r, Math.sin(tt) * r, 0)); }
    menzil.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), i === 2 ? anaMat : inceMat));
  });
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, uzun = i % 6 === 0 ? .024 : .012;
    const p = [new THREE.Vector3(Math.cos(a) * .166, Math.sin(a) * .166, 0), new THREE.Vector3(Math.cos(a) * (.166 + uzun), Math.sin(a) * (.166 + uzun), 0)];
    menzil.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), anaMat));
  }
  menzil.visible = true;
}
export function menzilGizle() { menzil.visible = false; menzilTemizle(); }

export function ucur(lat, lng, uzak = 2.7) { ucus = { bas: kamera.position.clone(), hedef: v3(lat, lng, 1).normalize().multiplyScalar(uzak), t0: performance.now(), sure: azHareket ? 1 : 1300 }; kontrol.autoRotate = false; }
export function kureSifirla() { ucus = { bas: kamera.position.clone(), hedef: new THREE.Vector3(.9, .75, 3.2).setLength(MESAFE), t0: performance.now(), sure: azHareket ? 1 : 1200 }; }

export function nisanCiz(s) {
  if (!nisanEt) return;
  const yer = yerAdi(s);
  const bag = s.bag && s.bag[0];
  nisanEt.innerHTML = `<b>${B(s.ad)}</b><br>${s.kod} · ${yer}<br>${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}${bag ? `<br><span style="color:var(--aksan)">→ ${B(L(bag.e))} · ${sayiTR(km(s, bag))} km</span>` : `<br><span style="color:var(--sonuk)">${t('ulkeKonum')}</span>`}`;
}
export function nisanGizle() { if (nisan) nisan.style.display = 'none'; }

function hudGuncelle() {
  gv.copy(kamera.position).normalize(); const Y = t('yonler');
  const lat = Math.asin(gv.y) * 180 / Math.PI; let lng = Math.atan2(gv.z, -gv.x) * 180 / Math.PI - 180; lng = ((lng + 540) % 360) - 180;
  const d = kamera.position.length(), gor = Math.round(2 * (d - R) * Math.tan(kamera.fov * Math.PI / 360) * 6371);
  kEl.innerHTML = `<b>${t('merkez')}</b> ${lat >= 0 ? Y[0] : Y[1]} ${Math.abs(lat).toFixed(4)}° · ${lng >= 0 ? Y[2] : Y[3]} ${Math.abs(lng).toFixed(4)}°<br>${t('irtifa')} ${sayiTR(Math.round((d - R) * 6371))} km · ${t('gorus')} ${sayiTR(gor)} km`;
  $('#olcekYazi').textContent = sayiTR(Math.round(gor * 80 / document.getElementById('kure').clientWidth / 100) * 100 || 100) + ' km';
  const yar = Math.acos(Math.min(1, R / d)) * 180 / Math.PI, adim = Math.max(5, Math.round(yar / 3 / 5) * 5), buk = v => ((v + 180) % 360 + 360) % 360 - 180;
  const nk = v => `${v >= 0 ? Y[0] : Y[1]} ${String(Math.abs(Math.round(v))).padStart(2, '0')}°`, ek = v => `${v >= 0 ? Y[2] : Y[3]} ${String(Math.abs(Math.round(v))).padStart(3, '0')}°`;
  const kl = [2, 1, 0, -1, -2].map(k => nk(Math.max(-90, Math.min(90, lat + adim * k / 2)))).join('<br>');
  const kr = [2, 1, 0, -1, -2].map(k => ek(buk(lng + adim * k / 2))).join('<br>');
  if (koorLEl.innerHTML !== kl) koorLEl.innerHTML = kl;
  if (koorREl.innerHTML !== kr) koorREl.innerHTML = kr;
  const secili = D.getSecili();
  if (secili && K.merkez.visible && !(D.getGorunum && D.getGorunum() === 'ag')) {
    const m = isaretler.find(x => x.s.id === secili.id);
    if (m) {
      m.bas.getWorldPosition(dv); const arka = dv.clone().normalize().dot(kamera.position.clone().normalize()) < .15;
      dv.project(kamera); nisan.style.display = arka ? 'none' : 'block';
      nisan.style.left = (dv.x + 1) / 2 * document.getElementById('kure').clientWidth + 'px';
      nisan.style.top = (1 - dv.y) / 2 * document.getElementById('kure').clientHeight + 'px';
      return;
    }
  }
  nisan.style.display = 'none';
}
function gorKayHedef() {
  const secili = D.getSecili();
  if (!secili || innerWidth < 1024) return 0;
  const W = document.getElementById('kure').clientWidth, sol = parseFloat(css('--sol')) || 290;
  return -((sol + 24 + 400) + (W - 24 - 350) - W) / 2;
}

let duraklat = false;
export function renderDuraklat(v) { duraklat = !!v; }

function dongu(z) {
  if (duraklat) { requestAnimationFrame(dongu); return; }
  if (ucus) {
    const k = Math.min(1, (z - ucus.t0) / ucus.sure), e = kolay(k), l = THREE.MathUtils.lerp(ucus.bas.length(), ucus.hedef.length(), e);
    kamera.position.copy(ucus.bas).normalize().lerp(ucus.hedef.clone().normalize(), e).normalize().multiplyScalar(l); if (k >= 1) ucus = null;
  }
  kontrol.update();
  { const h = gorKayHedef(); if (Math.abs(h - gorKay) > .3) { gorKay += (h - gorKay) * (azHareket ? 1 : .07); const w = document.getElementById('kure').clientWidth, hh = document.getElementById('kure').clientHeight; if (Math.abs(gorKay) > .3) kamera.setViewOffset(w, hh, gorKay, 0, w, hh); else kamera.clearViewOffset(); } }
  taramaGrp.rotation.y = azHareket ? .7 : z / 1000 * .42;
  const secili = D.getSecili();
  for (const m of isaretler) {
    const p = azHareket ? .5 : ((z / 1000 * .55 + m.faz) % 1), sk = 1 + p * 3;
    m.halka.scale.set(sk, sk, sk); m.halka.material.opacity = (1 - p) * .7;
    m.bas.rotation.y = z / 900; m.bas.scale.setScalar(secili && secili.id === m.s.id ? 1.6 : 1);
  }
  for (const y of yaylar) {
    const ak = secili && secili.id === y.s.id;
    y.cizgi.material.opacity = ak ? .95 : (secili ? .08 : .22); y.cizgi.material.dashSize = ak ? 1 : .012;
    if (ak) {
      const k = Math.min(1, (z - y.t0) / 900); y.cizgi.geometry.setDrawRange(0, Math.floor(kolay(k) * 101)); y.isik.visible = k >= 1;
      if (k >= 1) y.isik.position.copy(y.egri.getPoint(((z - y.t0) / 1700) % 1)); y.uc.material.opacity = 1;
    } else { y.cizgi.geometry.setDrawRange(0, 101); y.isik.visible = false; y.uc.material.opacity = secili ? .15 : .5; }
  }
  hudGuncelle(); D.onderCiz && D.onderCiz(); ciz.render(sahne, kamera); requestAnimationFrame(dongu);
}

function boyutla() {
  const kap = document.getElementById('kure'); if (!kap) return;
  const w = kap.clientWidth, h = kap.clientHeight; if (!w || !h) return;
  ciz.setSize(w, h); kamera.aspect = w / h;
  const yarim = Math.tan(Math.asin(R / MESAFE)), oran = Math.min(.8, .8 * w / h);
  kamera.fov = 2 * Math.atan(yarim / oran) * 180 / Math.PI; kamera.updateProjectionMatrix();
  if (Math.abs(gorKay) > .3) kamera.setViewOffset(w, h, gorKay, 0, w, h);
  D.agCiz && D.agCiz(); D.zcCiz && D.zcCiz();
}

/* ================= KATMANLAR ================= */
export function katmanCiz() {
  const el = document.getElementById('katmanlar'); if (!el) return;
  el.innerHTML = KATMANLAR().map(([k, a, n]) => `<button class="katman" aria-pressed="${K[k].visible}" data-k="${k}">${t(a)}<span class="m">${n}</span></button>`).join('');
}
export function hudSayCiz() {
  const el = document.getElementById('katSay'); if (!el) return;
  const acik = Object.values(K).filter(g => g.visible).length;
  el.textContent = acik + '/' + KATMANLAR().length;
  const h = document.getElementById('hudSay'), v = D.filtrele ? D.filtrele().length : D.SIRKETLER.length;
  if (h) h.textContent = D.getGorunum && D.getGorunum() === 'ag'
    ? t('hudSayAg', { v, s: D.kategoriListesi ? D.kategoriListesi().length : '' })
    : t('hudSay', { k: acik, v });
}

/* ================= DIŞA AÇILAN DURUM ================= */
/* Verilen konumu ekran pikseline çevirir; kürenin arkasındaysa null döner. */
export function kureProjeksiyon(lat, lng) {
  if (!kamera) return null;
  const p = v3(lat, lng, R * 1.01), ileri = kamera.position.clone().normalize();
  if (p.clone().normalize().dot(ileri) < .15) return null;
  p.project(kamera);
  const kap = document.getElementById('kure'), kr = kap.getBoundingClientRect();
  return { x: (p.x + 1) / 2 * kr.width, y: (1 - p.y) / 2 * kr.height, sol: kr.left, ust: kr.top };
}

export function isaretFiltrele(liste) {
  const g = new Set(liste.map(s => s.id));
  isaretler.forEach(m => m.g.visible = g.has(m.s.id));
  yaylar.forEach(y => { const v = g.has(y.s.id); y.cizgi.visible = v; y.uc.visible = v; });
}
export function yayVurgula(id) { yaylar.forEach(y => { if (y.s.id === id) y.t0 = performance.now(); }); }
export const yaySayisi = () => yaylar.length;
export const haritaDurumu = () => haritaHata;

/* ================= BAĞLA ================= */
export function kureBagla(deps) {
  D = deps;
  sahneKur();
  isaretKur();
  katmanCiz();
  hudSayCiz();
  document.getElementById('katmanlar').addEventListener('click', e => {
    const b = e.target.closest('.katman'); if (!b) return;
    const g = K[b.dataset.k]; g.visible = !g.visible; b.setAttribute('aria-pressed', g.visible); hudSayCiz();
  });
  haritaKur();
  requestAnimationFrame(dongu);
  boyutla();
  Object.assign(D, { ucur, nisanCiz, nisanGizle, menzilCiz, menzilGizle, isaretFiltrele, yayVurgula, yaySayisi, kureSifirla, katmanCiz, hudSayCiz, kureBoyutla: boyutla, haritaDurumu, kureProjeksiyon, renderDuraklat });
}
