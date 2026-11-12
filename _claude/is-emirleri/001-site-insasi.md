Suggested model: deepseek-v4.1-flash (max) (çok dosyalı inşa, web kaynak doğrulama, test ve ekran görüntüsü döngüsü; görsel kanıt gerektiği için görsel okuyan model)

/goal npm test yeşil; tasarim/index.html v0.5 ile site yan yana 1440x900 koyu ve açık, 390x844 ekran görüntüsünde aynı görünüyor; konsol hatası 0; her şirkette açılmış gerçek https kaynak; haber çekme betiği yerelde çalışıp data/haberler.json üretiyor.

# İŞ 001 · Boykot sitesini v0.5 tasarımının üzerine kur

## Hedef
D:\Projelerim\boykot deposunda statik, derlemesiz, GitHub Pages'te yayınlanan bir site kur. Görsel ve etkileşim kaynağı TEK dosyadır: `tasarim/index.html` (v0.5, commit a6b23f1). Önce onu baştan sona oku ve tarayıcıda aç. Site o prototipin birebir görünümünü ve davranışını korur; yalnız kodu modüllere böler ve örnek veriyi gerçek veriyle değiştirir. Tasarımı "iyileştirme", sadeleştirme ya da yeniden yorumlama yapma.

## Korunacaklar (prototipte hepsi çalışıyor)
- Tam ekran küre, köşe işaretli yarı saydam paneller, numaralı mono başlıklar, gizlilik şeridi, tarama çizgisi.
- Seçimde yere bağlı iki istihbarat penceresi (beyaz başlık levhası, nişangâh, çift çerçeve) ve küreye kılavuz çizgiler; küre pencereler arasına kayar.
- Açılır istihbarat kayıtları (details, aynı grupta tek açık), zaman penceresi seçici (TÜMÜ/5Y/3Y/1Y), katman menüsü.
- Brifing modu, ses motoru (Web Audio, varsayılan kapalı), 4 dil (tr/en/es/zh), açık/koyu tema, barkod ve yöntem pencereleri, 1024 px altı istif düzen.
- Renk yalnız veri durumunda; köşe 0-2 px; hap düğme, yumuşak gölge, glow, emoji yok.

## Yapı
`index.html` (tek sayfa), `css/tokens.css`, `css/site.css`, `js/` ES modülleri: `veri.js`, `i18n.js`, `kure.js`, `paneller.js`, `intel.js`, `zaman.js`, `brifing.js`, `ses.js`, `barkod.js` (saf), `filtre.js` (saf), `ana.js`. Veri: `data/sirketler.json`, `data/haberler.json`, arayüz metinleri `data/metinler.json`. Kök `index.html` bugün `tasarim/`'a yönlendiriyor; site hazır olunca kök sayfa sitenin kendisi olur, `tasarim/` referans olarak kalır. `yasal.html`: bilgilendirme amaçlıdır, kaynaklar üçüncü taraflara aittir, hukuki sorumluluk kabul edilmez, düzeltme için GitHub issue yolu (4 dil).

## Veri (hukuki risk; uydurma yasak)
- Şema prototipteki `SIRKETLER` ile aynı (id, ad, ulke, sehir, lat, lng, kategori, durum: bds|baski|halk|sonuc, markalar, neden[4 dil], zaman[[tarih,[4 dil]]], bag[{lat,lng,e[4 dil]}], kaynak[[baslik[4 dil],url,yil]]).
- 20-30 şirket. Birincil kaynak bdsmovement.net boykot sayfaları; ikincil Reuters, AP, BBC, Al Jazeera, Anadolu Ajansı. Her kayıtta EN AZ 1 gerçekten açtığın https kaynak; açamadığını yazma, doğrulayamadığın şirketi koyma. Neden metni kaynağın söylediğini aşmaz, tarafsız dil ("BDS'ye göre ..."). Faaliyeti sona erenler `sonuc`.
- Çeviriler: tr asıl metin; en/es/zh çevirisi senin; özel adlar çevrilmez.

## Hep güncel kalma
- `araclar/haber-cek.mjs`: her şirket için açık haber kaynaklarından (RSS / GDELT DOC API gibi anahtarsız uç noktalar) son haberleri çeker, başlığı kaynağın dilinde bırakır, tekrarları ayıklar, en çok 40 kayıt `data/haberler.json`. Kaynaksız ya da https olmayan kayıt yazmaz.
- `araclar/liste-denetle.mjs`: BDS sayfalarını çekip `sirketler.json` ile karşılaştırır; fark varsa dosyayı DEĞİŞTİRMEZ, rapor üretir (durum değişikliği insan onayıyla yapılır).
- `.github/workflows/guncelle.yml`: 6 saatte bir haber-cek çalışır, değişiklik varsa commit eder; liste-denetle fark bulursa issue açar. `.github/workflows/pages.yml`: main'e push'ta actions/deploy-pages.
- Arayüzdeki "son güncelleme" ve canlı akış `haberler.json` zaman damgasından gelir.

## Test ve kanıt
- `package.json` yalnız geliştirme: `npm test` → `node --test test/`. Testler: şema (zorunlu alanlar, 4 dil dolu, https kaynak, lat/lng aralığı, durum enum, benzersiz id, haberlerdeki şirket id'si mevcut), EAN-13 ve 729 ön eki, filtre/arama, haber-cek ayrıştırıcısı (örnek RSS fikstürüyle, ağsız).
- Playwright ile `_claude/kanit/`: prototip ve site yan yana, 1440x900 koyu/açık genel + seçili, 390x844. Konsol hatası 0, yatay taşma 0. `gunay-studio` `ui_lint.py` temiz.

## Yasaklar
Commit/push yok (orkestratör yapar). LICENSE'a dokunma. Secret yok. Arayüzde ve belgelerde başka ürün/marka adı tasarım ölçüsü olarak geçmez. Kapsam dışı dosya yok.

## Rapor (kısa)
Değişen dosyalar; kaç şirket/haber, hangi kaynaklar; dışarıda bıraktığın şirketler ve nedeni; npm test çıktısı; ekran görüntüsü yolları; her kabul ölçütü ✓/✗; açık sorular.
