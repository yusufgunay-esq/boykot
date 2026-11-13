/* rapor.test.mjs — kaynak-denetle raporunun ayrıştırılması. Fikstür; ağ yok. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { raporuCoz, raporOzet, raporMetni } from '../araclar/lib/rapor.mjs';

const oku = async () => readFile(new URL('./fikstur/kaynak-rapor.json', import.meta.url), 'utf8');

test('rapor ayrıştırılır', async () => {
  const r = raporuCoz(await oku());
  assert.equal(r.surum, 1);
  assert.equal(r.tarih, '2026-11-13T06:00:00.000Z');
  assert.equal(r.denetim.length, 4);
  assert.deepEqual(r.denetim[2], {
    url: 'https://ornek.test/kayip', durum: 'olu', kod: 404, tip: 'text/html', boyut: 812
  });
  assert.equal(r.denetim[3].kod, null);
});

test('özet canlı/ölü/hata sayar', async () => {
  const o = raporOzet(raporuCoz(await oku()));
  assert.deepEqual(o, { toplam: 4, canli: 2, olu: 1, hata: 1 });
});

test('bot günlüğü JSON\'un etrafındaysa da çözülür', async () => {
  const s = 'uyarı: 2 kaynak yanıt vermedi\n' + (await oku()) + '\nbitti\n';
  assert.equal(raporuCoz(s).denetim.length, 4);
});

test('bozuk rapor açık hata verir', () => {
  assert.throws(() => raporuCoz(''), /JSON bulunamadı/);
  assert.throws(() => raporuCoz('{"denetim": "dizi değil"}'), /denetim/);
  assert.throws(() => raporuCoz('{"denetim":[{"url":"x","durum":"canli"}]}'), /URL/);
  assert.throws(() => raporuCoz('{"denetim":[{"url":"https://a.test","durum":"belirsiz"}]}'), /durum/);
  assert.throws(() => raporuCoz('{bozuk json}'), /geçersiz JSON/);
});

test('raporMetni yalnız sorunlu satırları listeler', async () => {
  const m = raporMetni(raporuCoz(await oku()));
  assert.match(m, /toplam 4 · canlı 2 · ölü 1 · hata 1/);
  assert.match(m, /olu 404/);
  assert.match(m, /hata —/);
  assert.equal(m.includes('bdsmovement.net'), false);
});
