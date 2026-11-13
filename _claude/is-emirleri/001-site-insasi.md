Suggested model: deepseek-v4.1-flash (max) (çok dosyalı inşa, web kaynak doğrulama, test ve ekran görüntüsü döngüsü; görsel kanıt gerektiği için görsel okuyan model)

/goal npm test yeşil; tasarim/index.html (v0.6) ile site yan yana 1440x900 koyu, 390x844 ekran görüntüsünde aynı görünüyor; konsol hatası 0; her şirkette açılmış gerçek https kaynak; haber çekme betiği yerelde çalışıp data/haberler.json üretiyor.

# İŞ 001 · Boykot sitesini v0.6 tasarımının üzerine kur

## Hedef
D:\Projelerim\boykot deposunda statik, derlemesiz, GitHub Pages'te yayınlanan bir site kur. Görsel ve etkileşim kaynağı TEK dosyadır: `tasarim/index.html` (v0.6, güncel hali). Önce onu baştan sona oku ve tarayıcıda aç. Site o prototipin birebir görünümünü ve davranışını korur; yalnız kodu modüllere böler ve örnek veriyi gerçek veriyle değiştirir. Tasarımı "iyileştirme", sadeleştirme ya da yeniden yorumlama yapma.

## Korunacaklar (prototipte hepsi çalışıyor)
- Tam ekran küre, köşe işaretli yarı saydam paneller, numaralı mono başlıklar, gizlilik şeridi, tarama çizgisi.
- Seçimde yere bağlı iki istihbarat penceresi (beyaz başlık levhası, nişangâh, çift çerçeve) ve küreye kılavuz çizgiler; küre pencereler arasına kayar.
- Açılır istihbarat kayıtları (details, aynı grupta tek açık), zaman penceresi seçici (TÜMÜ/5Y/3Y/1Y), katman menüsü.
- Brifing modu, ses motoru (Web Audio, varsayılan açık; tarayıcı kuralı gereği ilk kullanıcı etkileşiminde başlar), 4 dil (tr/en/es/zh), barkod ve yöntem pencereleri, görünür künye (Yusuf GÜNAY), 1024 px altı istif düzen. Site yalnız koyu temadır (açık tema kaldırıldı).
- Renk yalnız veri durumunda; köşe 0-2 px; hap düğme, yumuşak gölge, glow, emoji yok.

## Yapı
`index.html` (tek sayfa), `css/tokens.css`, `css/site.css`, `js/` ES modülleri: `veri.js`, `i18n.js`, `kure.js`, `paneller.js`, `intel.js`, `zaman.js`, `brifing.js`, `ses.js`, `barkod.js` (saf), `filtre.js` (saf), `ana.js`. Veri: `data/sirketler.json`, `data/haberler.json`, arayüz metinleri `data/metinler.json`. Kök `index.html` bugün `tasarim/`'a yönlendiriyor; site hazır olunca kök sayfa sitenin kendisi olur, `tasarim/` referans olarak kalır. Yayın adresi köktür: `https://yusufgunay-esq.github.io/boykot/` (canlı adreste `/tasarim` geçmez). `yasal.html`: bilgilendirme amaçlıdır, kaynaklar üçüncü taraflara aittir, hukuki sorumluluk kabul edilmez, düzeltme için GitHub issue yolu (4 dil).

## Veri (hukuki risk; uydurma yasak)
- Şema prototipteki `SIRKETLER` ile aynı (id, ad, ulke, sehir, lat, lng, kategori, durum: bds|baski|halk|sonuc, markalar, neden[4 dil], zaman[[tarih,[4 dil]]], bag[{lat,lng,e[4 dil]}], kaynak[[baslik[4 dil],url,yil]]).
- Kapsam güncellemesi (2026-11-13, Yusuf): 20-30 sınırı kalktı — BDS hareketinin boykot listesinin TAMAMI veriye girer (bdsmovement.net boykot/hedef sayfalarındaki tüm şirket ve kurumlar; doğrulanamayan hariç, her biri en az 1 açılmış https kaynak). Künye değişmez. Açılış ekranı animasyonlu: boot satırları + kısa glitch + tarama/radar, ENTER ile yumuşak açılış, ≤2,5 sn, reduced-motion statik.
- 20-30 şirket. Birincil kaynak bdsmovement.net boykot sayfaları; ikincil Reuters, AP, BBC, Al Jazeera, Anadolu Ajansı. Her kayıtta EN AZ 1 gerçekten açtığın https kaynak; açamadığını yazma, doğrulayamadığın şirketi koyma. Neden metni kaynağın söylediğini aşmaz, tarafsız dil ("BDS'ye göre ..."). Faaliyeti sona erenler `sonuc`.
- Çeviriler: tr asıl metin; en/es/zh çevirisi senin; özel adlar çevrilmez.

## Kaynak çekme (mükemmel olsun — Yusuf talebi)
Ortak HTTP katmanı `araclar/http.mjs`: 15 sn zaman aşımı, 2 deneme + üstel geri çekilme, eşzamanlılık ≤4, host başına ≥1 sn nazik aralık, dürüst User-Agent, yalnız https, yanıt boyutu ≤2 MB. Tek kaynağın hatası turu düşürmez; tur sonunda kaynak başına durum/süre/kayıt raporu yazılır.

- `araclar/haber-cek.mjs`:
  - Kaynaklar (anahtarsız): GDELT DOC 2.0 API, Google News RSS sorguları, Reuters/AP/BBC/Al Jazeera/AA RSS başlıkları; her şirket için ad + marka takma adlarıyla arama; yalnız https.
  - Relevans: başlık/özet içinde tam kelime eşleşmesi; Türkçe büyük/küçük harf ve aksan katlama (İ/ı, ş/s, ğ/g, ü/u, ö/o, ç/c). Alakasız kayıt yazılmaz.
  - Tekrar ayıklama: URL kanonikleştirme (utm_*, fbclid, ref gibi izleme parametreleri, AMP yolu), başlık benzerliği ≥%85 ve (şirket+kanonik URL) anahtarı; yayıncının asıl adresi tercih edilir, toplayıcı öz bağlantıları atılır.
  - Tarih: son 90 gün, ISO 8601; tarihi okunamayan kayıt atılır. Yeniden eskiye sıralı; toplam ≤40, şirket başına ≤4, tek kaynak toplamın yarısını aşmaz.
  - Şema: `{id, sirketId, baslik, url, kaynakAd, kaynakDil, tarih, ozet?, cekimZamani, surum}`; id = kanonik URL + şirket id'sinden sabit hash. https olmayan, boş başlıklı, geçersiz şirket id'li kayıt yazılmaz.
  - Yazma atomik (tmp + rename); tur başarısızsa eski `haberler.json` korunur. `--kuru` bayrağı ağa çıkmadan fixture'larla çalışır.
- `araclar/liste-denetle.mjs`: bdsmovement.net hedef sayfalarını çeker, `sirketler.json` ile karşılaştırır. Sayfa yapısı değişmiş görünüyorsa "ayrıştırma şüphesi" der, yanlış fark üretmez. Dosyayı DEĞİŞTİRMEZ; rapor + issue gövdesi üretir. Aynı fark için mükerrer issue açılmaz (fark özeti hash'i).
- `araclar/kaynak-denetle.mjs`: `sirketler.json` ve `haberler.json` içindeki tüm URL'leri doğrular: https mi, 2xx/3xx mi, park/ölü alan adı mı, içerik tipi HTML/XML mi. Rapor üretir, dosyaları değiştirmez. Ölü ya da doğrulanamayan kaynak siteye giremez.
- `.github/workflows/guncelle.yml`: 6 saatte bir haber-cek → değişiklik varsa açıklayıcı commit; liste-denetle fark → tek issue; eşzamanlı çalışma kilidi; başarısız turda issue açmaz, log yazar. `.github/workflows/pages.yml`: main'e push'ta actions/deploy-pages; yayın paketine yalnız site dosyaları girer (`index.html`, `css/`, `js/`, `data/`, `yasal.html`), `tasarim/`, `_claude/`, `araclar/`, `test/` yayına girmez. Böylece canlı adreste yalnız kök site olur.
- Arayüzdeki "son güncelleme" ve canlı akış `haberler.json` zaman damgasından gelir.

## Test ve kanıt
- `package.json` yalnız geliştirme: `npm test` → `node --test test/`. Testler: şema (zorunlu alanlar, 4 dil dolu, https kaynak, lat/lng aralığı, durum enum, benzersiz id, haberlerdeki şirket id'si mevcut), EAN-13 ve 729 ön eki, filtre/arama, haber ayrıştırıcı (örnek RSS fikstürüyle, ağsız), URL kanonikleştirme, tekrar + relevans eşleşmesi (Türkçe aksan katlama dahil), atomik yazma, kaynak-denetle rapor ayrıştırıcısı.
- Playwright ile `_claude/kanit/`: prototip ve site yan yana, 1440x900 koyu genel + seçili + brifing, 390x844, ayrıca açılış animasyonundan 2 kare. Konsol hatası 0, yatay taşma 0. `gunay-studio` `ui_lint.py` temiz.

## Yasaklar
Commit/push yok (orkestratör yapar). LICENSE'a dokunma. Secret yok. Arayüzde ve belgelerde başka ürün/marka adı tasarım ölçüsü olarak geçmez. Kapsam dışı dosya yok.

## Rapor (kısa)
Değişen dosyalar; kaç şirket/haber, hangi kaynaklar; dışarıda bıraktığın şirketler ve nedeni; npm test çıktısı; ekran görüntüsü yolları; her kabul ölçütü ✓/✗; açık sorular.
