/* ses.js — Web Audio ile üretilen ses motoru. Ses dosyası yoktur; her şey matematikle üretilir.
   Tarayıcı kuralı gereği ilk kullanıcı etkileşiminde açılır; tercih localStorage'da tutulur. */

let dugmeCiz = () => {};
export function sesBagla(fn) { dugmeCiz = fn; }

export const sesTercih = () => { try { return localStorage.getItem('ses') !== '0'; } catch (e) { return true; } };

export const Ses = (() => {
  let ctx = null, ana, muzikBus, efektBus, yanki, dronSuz, acik = false, zamanlayici = null, adim = 0, sonraki = 0, yogun = false, akor = 0;
  const ON6 = 60 / 92 / 4;
  const KARANLIK = [[38, 41, 45, 48], [34, 38, 41, 45], [31, 34, 38, 41], [33, 37, 40, 43]];      /* Re min · Si♭ · Sol min · La */
  const KAHRAMAN = [[38, 45, 50, 53], [34, 46, 50, 53], [29, 45, 48, 53], [36, 43, 48, 52]];      /* Re min → Si♭ → Fa → Do */
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function kur() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sik = ctx.createDynamicsCompressor(); sik.threshold.value = -18; sik.ratio.value = 4; sik.connect(ctx.destination);
    ana = ctx.createGain(); ana.gain.value = 0; ana.connect(sik);
    muzikBus = ctx.createGain(); muzikBus.gain.value = .32; muzikBus.connect(ana);
    efektBus = ctx.createGain(); efektBus.gain.value = .55; efektBus.connect(ana);
    yanki = ctx.createConvolver(); const uz = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, uz, ctx.sampleRate);
    for (let k = 0; k < 2; k++) { const d = ir.getChannelData(k); for (let i = 0; i < uz; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / uz, 3.2); }
    yanki.buffer = ir; const yG = ctx.createGain(); yG.gain.value = .35; yanki.connect(yG); yG.connect(ana);
    dronSuz = ctx.createBiquadFilter(); dronSuz.type = 'lowpass'; dronSuz.frequency.value = 180; dronSuz.Q.value = 6;
    const dg = ctx.createGain(); dg.gain.value = .22; dronSuz.connect(dg); dg.connect(muzikBus);
    [[26, -6], [26, 7], [33, 0]].forEach(([m, d]) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = d; o.connect(dronSuz); o.start(); });
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = 90; lfo.connect(lg); lg.connect(dronSuz.frequency); lfo.start();
  }
  const gurultu = sure => { const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * sure), ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(); s.buffer = b; return s; };
  const zarf = (g, z, a, tepe, b) => { g.gain.setValueAtTime(0, z); g.gain.linearRampToValueAtTime(tepe, z + a); g.gain.exponentialRampToValueAtTime(.0001, z + a + b); };
  function ped(z, notalar) {
    const sure = ON6 * 32, suz = ctx.createBiquadFilter(), g = ctx.createGain(); suz.type = 'lowpass'; suz.frequency.setValueAtTime(400, z); suz.frequency.linearRampToValueAtTime(1100, z + 4); suz.frequency.linearRampToValueAtTime(500, z + sure);
    g.gain.setValueAtTime(0, z); g.gain.linearRampToValueAtTime(.05, z + 2.2); g.gain.setValueAtTime(.05, z + sure - 1.2); g.gain.linearRampToValueAtTime(0, z + sure);
    suz.connect(g); g.connect(muzikBus); g.connect(yanki);
    notalar.forEach(m => [-8, 8].forEach(d => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m + 12); o.detune.value = d; o.connect(suz); o.start(z); o.stop(z + sure + .1); }));
  }
  /* Bakır nefesli benzeri ses: testere yığını, süzgeç yavaşça açılır (şişme) */
  function boru(z, notalar, sure, tepe = .07) {
    const suz = ctx.createBiquadFilter(), g = ctx.createGain(); suz.type = 'lowpass'; suz.Q.value = 2;
    suz.frequency.setValueAtTime(350, z); suz.frequency.linearRampToValueAtTime(1800, z + sure * .45); suz.frequency.linearRampToValueAtTime(700, z + sure);
    g.gain.setValueAtTime(0, z); g.gain.linearRampToValueAtTime(tepe, z + sure * .35); g.gain.linearRampToValueAtTime(tepe * .6, z + sure * .9); g.gain.linearRampToValueAtTime(0, z + sure + .05);
    suz.connect(g); g.connect(muzikBus); g.connect(yanki);
    notalar.forEach((m, i) => [-6, 0, 6].forEach(d => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m + (i ? 12 : 0)); o.detune.value = d; o.connect(suz); o.start(z); o.stop(z + sure + .1); }));
  }
  function bas(z, m, v) {
    const o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.createBiquadFilter(); o.type = 'square'; o.frequency.value = hz(m); s.type = 'lowpass'; s.frequency.setValueAtTime(600, z); s.frequency.exponentialRampToValueAtTime(90, z + .18);
    o.connect(s); s.connect(g); g.connect(muzikBus); zarf(g, z, .004, v, .2); o.start(z); o.stop(z + .25);
  }
  function tikirti(z, v) { const n = gurultu(.04), s = ctx.createBiquadFilter(), g = ctx.createGain(); s.type = 'highpass'; s.frequency.value = 7000; n.connect(s); s.connect(g); g.connect(muzikBus); zarf(g, z, .001, v, .035); n.start(z); }
  function davul(z, v = .5) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, z); o.frequency.exponentialRampToValueAtTime(38, z + .35); o.connect(g); g.connect(muzikBus); g.connect(yanki); zarf(g, z, .003, v, .45); o.start(z); o.stop(z + .5); }
  function sonar(z) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz(81); o.connect(g); g.connect(yanki); g.connect(muzikBus); zarf(g, z, .005, .06, 1.4); o.start(z); o.stop(z + 1.5); }
  function planla() {
    while (sonraki < ctx.currentTime + .12) {
      const z = sonraki, olcu = Math.floor(adim / 16), ici = adim % 16;
      if (!yogun) { if (adim % 128 === 0) { akor = (olcu / 8) % KARANLIK.length; ped(z, KARANLIK[akor]); } }
      else {
        const k = KAHRAMAN[Math.floor(olcu / 2) % KAHRAMAN.length];
        if (adim % 32 === 0) boru(z, k, ON6 * 32);
        if (ici % 2 === 0) bas(z, k[0] - 12 + (ici === 6 || ici === 14 ? 12 : 0), ici % 4 === 0 ? .15 : .08);
        tikirti(z, ici % 4 === 2 ? .05 : .018);
        if (ici === 0 || ici === 8) davul(z);
        if (olcu % 4 === 3 && ici >= 12) davul(z, .22);
      }
      if (ici === 0 && olcu % 4 === 3) sonar(z + ON6 * 8);
      adim++; sonraki += ON6;
    }
  }
  const E = {
    tik() { const z = ctx.currentTime, n = gurultu(.012), s = ctx.createBiquadFilter(), g = ctx.createGain(); s.type = 'bandpass'; s.frequency.value = 2600 + Math.random() * 1800; s.Q.value = 3; n.connect(s); s.connect(g); g.connect(efektBus); zarf(g, z, .001, .12, .01); n.start(z); },
    blip(f = 1300) { const z = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f, z); o.frequency.exponentialRampToValueAtTime(f * .7, z + .06); o.connect(g); g.connect(efektBus); zarf(g, z, .002, .12, .07); o.start(z); o.stop(z + .1); },
    kilit() { const z = ctx.currentTime; [[1400, 0], [1400, .09], [2100, .18]].forEach(([f, d]) => { const o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.createBiquadFilter(); o.type = 'square'; o.frequency.value = f; s.type = 'lowpass'; s.frequency.value = 3000; o.connect(s); s.connect(g); g.connect(efektBus); zarf(g, z + d, .002, .05, .05); o.start(z + d); o.stop(z + d + .08); }); },
    vin() { const z = ctx.currentTime, n = gurultu(1.4), s = ctx.createBiquadFilter(), g = ctx.createGain(); s.type = 'bandpass'; s.Q.value = 1.4; s.frequency.setValueAtTime(300, z); s.frequency.exponentialRampToValueAtTime(2400, z + .7); s.frequency.exponentialRampToValueAtTime(500, z + 1.3); n.connect(s); s.connect(g); g.connect(efektBus); g.gain.setValueAtTime(0, z); g.gain.linearRampToValueAtTime(.16, z + .6); g.gain.linearRampToValueAtTime(0, z + 1.35); n.start(z); },
    darbe() {
      const z = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(90, z); o.frequency.exponentialRampToValueAtTime(28, z + 1.2); o.connect(g); g.connect(efektBus); g.connect(yanki); zarf(g, z, .005, .9, 1.6); o.start(z); o.stop(z + 1.8);
      const n = gurultu(.5), s = ctx.createBiquadFilter(), g2 = ctx.createGain(); s.type = 'lowpass'; s.frequency.value = 900; n.connect(s); s.connect(g2); g2.connect(yanki); g2.connect(efektBus); zarf(g2, z, .002, .35, .4); n.start(z);
    },
    ust() { const z = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 2400; o.connect(g); g.connect(efektBus); zarf(g, z, .001, .025, .02); o.start(z); o.stop(z + .03); },
    /* Zafer vurgusu: Fa majörden Do majöre yükselen bakır + davul gümbürtüsü */
    zafer() { const z = ctx.currentTime + .05; boru(z, [41, 53, 57, 60], 1.1, .11); boru(z + 1.0, [36, 52, 55, 60], 2.6, .13); [0, .12, .24, .36, .5].forEach((d, i) => davul(z + .6 + d, .18 + i * .06)); davul(z + 1.0, .7); },
    final() { const z = ctx.currentTime + .05; boru(z, [34, 50, 53, 58], 1.4, .1); boru(z + 1.3, [36, 52, 55, 60], 1.4, .12); boru(z + 2.6, [29, 53, 57, 60], 4.5, .15); [0, .1, .2, .3, .4, .5, .6].forEach((d, i) => davul(z + 2.0 + d, .15 + i * .05)); davul(z + 2.6, .8); }
  };
  return {
    get acik() { return acik; },
    async ac(tercih) {
      if (!ctx) kur(); await ctx.resume(); acik = true;
      ana.gain.cancelScheduledValues(ctx.currentTime); ana.gain.setValueAtTime(ana.gain.value, ctx.currentTime); ana.gain.linearRampToValueAtTime(.9, ctx.currentTime + 1.2);
      if (!zamanlayici) { sonraki = ctx.currentTime + .05; zamanlayici = setInterval(planla, 25); }
      dugmeCiz(); if (tercih) { try { localStorage.setItem('ses', '1'); } catch (e) { /* yok */ } }
    },
    kapat() {
      acik = false; dugmeCiz(); try { localStorage.setItem('ses', '0'); } catch (e) { /* yok */ }
      if (!ctx) return;
      ana.gain.cancelScheduledValues(ctx.currentTime); ana.gain.setValueAtTime(ana.gain.value, ctx.currentTime); ana.gain.linearRampToValueAtTime(0, ctx.currentTime + .4);
      setTimeout(() => { if (!acik) { clearInterval(zamanlayici); zamanlayici = null; ctx.suspend(); } }, 500);
    },
    yogunluk(v) { if (yogun !== v) { yogun = v; adim = Math.ceil(adim / 32) * 32; } if (ctx) dronSuz.Q.setTargetAtTime(v ? 10 : 6, ctx.currentTime, .5); },
    cal(ad, ...a) { if (acik && ctx && E[ad]) E[ad](...a); }
  };
})();

/* Ses varsayılan açık: tarayıcı otomatik sesi engellediği için ilk etkileşimde açılır */
export function sesKilidiKur() {
  let alindi = false;
  function kilit(e) {
    if (alindi) return;
    if (e && e.target && e.target.closest && e.target.closest('#sesDugme')) return;
    alindi = true;
    removeEventListener('pointerdown', kilit, true); removeEventListener('keydown', kilit, true);
    if (sesTercih()) Ses.ac();
  }
  addEventListener('pointerdown', kilit, true); addEventListener('keydown', kilit, true);
}
