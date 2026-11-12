Suggested model: deepseek-v4.1-flash (max) (görsel okur; ekran görüntüsüyle kendi çıktısını denetleyecek)

/goal tasarim/index.html askeri istihbarat brifingi diline taşınmış, açık tema tamamen kaldırılmış; 1440x900 koyu genel+seçili, brifing ve 390x844 mobil ekran görüntüleri üretilmiş; konsol hatası 0, yatay taşma 0, ui_lint ERR 0 WARN 0.

# İŞ 002 · Tasarım v0.6: saha istihbarat konsolu yönü

## Hedef
`tasarim/index.html` (v0.5, 1164 satır, tek dosya prototip). Yusuf v0.5 estetiğini yeterince istihbarat/askeri bulmadı: "daha istihbarat ve askeri durmalı, havalı olmalı". Dosyayı askeri istihbarat / operasyon brifingi diline taşı. İşlev kaybı olmaz; yalnız görsel dil ve brifing sekansı değişir. Dosya tek dosya prototip kalır.

## Yön (Şef kararı — uygula, yeniden yorumlama)
1. **Koyu tema birincil.** Zemin neredeyse siyah, hafif yeşilimsi-sıcak kara (#070908 çevresi); paneller %88 opak koyu, 1px kıl payı çerçeve. Süs rengi yok: arayüz nötr kemik/fosfor-gri metin; renk YALNIZ veri durumunda (BDS kırmızı, baskı amber, halk sarı, sonuç yeşil) — mevcut kural sürer.
2. **Beyaz kâğıt levhaları kaldır.** "CARREFOUR / BATI ŞERİA" beyaz levhaları yerine askeri atama etiketi: köşe ayraçlı (bracket) koyu plaka, üstte `[VR-0001]` dosya kodu mono, altında kalın mono büyük harf ad, altta 2px veri-durumu şeridi; küreye kılavuz çizgi korunur.
3. **Yoğunluk ve ölçü dili.** Panel kenarlarında küçük cetvel çentikleri (CSS gradient, süs değil ölçü hissi), ince hairline kutular, 11px mono büyük harf mikro etiketler, veri satırlarında hizalı sayı sütunları, daha sıkı satır aralığı. Ferah dergi yerleşimi değil, operasyon konsolu yoğunluğu.
4. **Tipografi.** Veri ve etiketler mono; başlıklar kalın mono büyük harf geniş harf aralıklı; serif yok; dev dekoratif tipografi yok. Hiyerarşi boşlukla değil ağırlık, ölçek ve çizgiyle.
5. **Açık tema tamamen kaldırılır (Yusuf kararı, 2026-11-12).** Tema düğmesi, `data-tema` mekanizması ve açık temaya ait CSS değişkenleri/blokları silinir; site yalnız koyu temadır. Açık tema için ölü kod bırakma.
6. **Küre taktik görünüm.** Koyu okyanus; görünür enlem/boylam grid çizgileri ve kenarda koordinat etiketleri; seçili hedefte menzil halkaları (range rings) + kerteriz çentikleri; yavaş radar tarama yayı (prefers-reduced-motion'da durur); hedef işaretleri askeri sembol dilinde (dörtgen/elmas + durum rengi). Nokta deseni kalabilir ama daha ince ve teknik.
7. **Dosya dili (paneller).** Her intel penceresinin üstünde sınıflandırma şeridi: `AÇIK KAYNAK · OSINT` + dosya no + UTC damga; kaynaklar bloğunda `KAYNAK DOĞRULANDI` kaşesi (1px çift çerçeve, -2° dönük, soluk mürekkep); durum etiketleri kaşe gibi. Metin uydurma yok; yalnız görsel katman.
8. **Brifing modu askeri brifing sekansı.** Tam ekran koyu perde, çok hafif tarama çizgisi/vinyet (opaklık ≤.05). Akış: (a) `GÖREV DOSYASI` kapak — dosya no, tarih, sınıflandırma şeridi, büyük harf başlık, ENTER ile başla; (b) daktilo satırlar (blok imleç), arada kısa redaksiyon barlı meta satır; (c) hedef kartı kaşeleriyle; (d) küre üzerinde vurgu, odak vinyeti; (e) kapanış sonuç şeridi. Mevcut ses olayları (daktilo/kilit/vin/darbe/zafer) bu adımlara bağlanır. Ses varsayılan AÇIK başlar (Yusuf kararı): tarayıcılar otomatik sesi engellediği için AudioContext ilk kullanıcı etkileşiminde (tıklama/tuş) açılır ve o andan itibaren dron/ped duyulur; ses düğmesiyle kapatılabilir.
10. **Künye.** Görünür künye: alt şeritte ve Yöntem penceresinde `KÜNYE · YUSUF GÜNAY` (4 dilde etiket). Marka adı yasağı sürer; künyede yalnız sahibin adı geçer.
11. **Dil geçişi yumuşak olsun (Yusuf, yan iş).** Dil düğmesine basınca içerik "tak diye" değişmez: metin katmanı (üst çubuk, paneller, intel pencereleri, liste, alt şerit) ~120ms soluklaşır, yeni dil metniyle ~160ms geri gelir; küre, seçim ve kaydırma konumu yerinde kalır. Kısa "sinyal değişti" hissi; ağır animasyon yok. `prefers-reduced-motion` açıksa anında değişir.
12. **Açılış ekranı (Yusuf, yan iş).** İlk ziyarette oturumda bir kez (sessionStorage) tam ekran giriş perdesi: koyu zemin, sınıflandırma şeridi `AÇIK KAYNAK · OSINT`, başlık `BOYKOT · KÜRESEL GÖZLEM`, `GÖREV DOSYASI` mono satırlar (dosya no, UTC damga), kısa boot/daktilo dizisi (toplam ≤2 sn) ve `GİRİŞ · ENTER` çerçeveli düğmesi; küçük `Atla`. Giriş dokunuşu AudioContext'i açar (ses varsayılan açık, dron/ped o anda başlar) ve perde yumuşak kapanır. Metinler 4 dilde; `prefers-reduced-motion` açıksa animasyonsuz statik perde. Perde içeriği gerçek veriye dokunmaz, uydurma dosya no/damga kullanılabilir (dekoratif olduğu yazılı olmasa da sayaç gerçek UTC'den gelir).
9. **Mikro detay.** Koyu temada çok hafif kum/tarama dokusu; kürede crosshair imleç; panel başlıklarında numaralı mono düzen korunur; hap düğme, glow, yumuşak gölge, emoji, yuvarlak köşe >2px yasak.

## Korunacaklar (hepsi çalışmaya devam eder)
4 dil (tr/en/es/zh) ve dil düğmeleri; KÜRE/AĞ/BRİFİNG modları; zaman penceresi (TÜMÜ/5Y/3Y/1Y); katman menüsü; durum filtresi; arama; varlık listesi; seçimde iki intel penceresi ve kürenin araya kayması; açılır kayıtlar (details, tek açık); barkod ve yöntem pencereleri; ses düğmesi (varsayılan açık, ilk etkileşimde ses); 1024px altı istif düzen (mobilde brifing yalnız küre + altyazı); klavye kısayolları. Tema düğmesi bilinçli olarak kaldırılıyor, bu istisnadır. `SIRKETLER` örnek verisi ve metinleri DEĞİŞMEZ.

## Yasaklar
- Başka ürün/marka adı hiçbir dosyada geçmez (yorum dahil); estetik yalnız ölçüyle tarif edilir.
- Commit/push yok. Secret yok. LICENSE, kök index.html, veri dosyaları ve kapsam dışı dosyalar dokunulmaz.
- Kaldırılan ya da gizlenen işlev olmayacak; işlev bozulursa geri al.

## Kanıt
- Önce mevcut halin görüntüsü: `_claude/kanit/v06-once-koyu-secili.png` (1440x900), `_claude/kanit/v06-once-mobil.png` (390x844).
- Sonra: `_claude/kanit/v06-koyu-genel.png`, `v06-koyu-secili.png` (1440x900), `v06-brifing.png` (1440x900), `v06-mobil.png` (390x844).
- Playwright konsol hatası 0; 390x844 yatay taşma 0. Ekran görüntüsü aracı: `araclar/ekran-cek.mjs` (küçük, kalıcı; Playwright 1.65 kurulu).
- `python "C:\Users\yusuf_eqta17n\.claude\plugins\cache\gunay-studio\gunay-studio\1.32.0\skills\son-kullanici\scripts\ui_lint.py" tasarim/index.html` → ERR 0 WARN 0 (kullanım için önce `--help`).
- Rapor (kısa): ne değişti (madde madde), korunan işlev kontrol listesi ✓/✗, kanıt yolları, konsol/taşma/ui_lint sonuçları, açık sorular.
