/* http.test.mjs — ağ kurallarının ağsız doğrulanabilen kısmı.
   Gerçek istek atılmaz: http:// adresi kural gereği ağa çıkmadan reddedilir. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { httpAl, esZamanli, UA, AZAMI_BAYT, ZAMAN_ASIMI, DENEME, ES_ZAMANLI, HOST_ARALIK } from '../araclar/http.mjs';

test('sabitler kuralları yansıtır', () => {
  assert.equal(ZAMAN_ASIMI, 15000);
  assert.equal(DENEME, 2);
  assert.equal(ES_ZAMANLI, 4);
  assert.equal(HOST_ARALIK, 1000);
  assert.equal(AZAMI_BAYT, 2 * 1024 * 1024);
});

test('User-Agent dürüst: bot adı ve proje adresi var', () => {
  assert.match(UA, /BoykotVeriBot/);
  assert.match(UA, /github\.com\/yusufgunay-esq\/boykot/);
});

test('https dışı adres ağa çıkmadan reddedilir', async () => {
  await assert.rejects(() => httpAl('http://ornek.test/a'), /yalnız https/);
  await assert.rejects(() => httpAl('ftp://ornek.test/a'), /yalnız https/);
  await assert.rejects(() => httpAl('bozuk'), /yalnız https/);
});

test('esZamanli eşzamanlılığı sınırlar ve sırayı korur', async () => {
  let aktif = 0, enCok = 0;
  const isler = Array.from({ length: 12 }, (_, i) => async () => {
    aktif++; enCok = Math.max(enCok, aktif);
    await new Promise(r => setTimeout(r, 10));
    aktif--;
    return i;
  });
  const sonuc = await esZamanli(isler, { es: 4 });
  assert.deepEqual(sonuc, Array.from({ length: 12 }, (_, i) => i));
  assert.ok(enCok <= 4, 'en çok eşzamanlı: ' + enCok);
});

test('esZamanli boş ve tek işle çalışır', async () => {
  assert.deepEqual(await esZamanli([]), []);
  assert.deepEqual(await esZamanli([async () => 7]), [7]);
});
