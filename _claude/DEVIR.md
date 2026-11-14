# Devir Notları

## 2026-11-14 · AĞ yeniden tasarımı + liste dedektörü
Yapıldı: AĞ görünümü sektör halkasına çevrildi — 18 kategori yayı, 243 varlık uç yayda durum sıralı, çakışmasız çevre etiketleri, seçim odağı, merkez plaka, dar/kompakt kip. Liste dedektörü yanlış farkı kesildi: BDS rehber sayfası elle:true, tabloda yalnız ad sütunu, gezinme/cümle satırları ayıklanır, bot koruması ayrı not; fark sıfırken workflow açık issue'yu kapatır.
Doğrulama: npm test 85/85; canlı kök 200, js/ag.js 200, veri 243; AĞ ekran kanıtları `_claude/kanit/t5-ag-*.png`; canlı liste koşusu fark 0 (BDS elle, OHCHR bot korumalı, ülke elle).
Sıradaki: OHCHR için bot korumasını aşan resmî indirme/API yolu ya da elle liste; bağımsız denetim (sef.mjs denetle) hâlâ koşulmadı.
Commit: ad13826 (AĞ), e2c0577 (liste dedektörü).

## 2026-11-13 · İŞ 001 yayın
Yapıldı: is001-site main'e fast-forward birleşti; GitHub Pages kaynağı Actions'a çevrildi; pages.yml yayını başarılı.
Doğrulama: canlı kök 200, başlık Boykot · Küresel gözlem, js/ana.js 200, data 243 kayıt, yasal.html 200; npm test 75/75.
Sıradaki: guncelle.yml ilk koşusu (haber akışı) ve sonucun kontrolü.
Commit: a3c25d3 (main birleşme) + a990e64 (yayın notu).

## 2026-11-13 · İŞ 001 site inşası (is001-site dalı)
Yapıldı: kök index.html v0.6 prototipinin modüler hali; 243 gerçek kaynaklı kayıt (BDS/UN OHCHR/ülke listeleri), 4 dil, animasyonlu açılış, künye; kaynak hattı + 6 saatlik güncelleme ve Pages workflow'ları; yasal.html.
Doğrulama: npm test 75/75; konsol 0, yatay taşma 0; ui_lint ERR0 WARN0; yan yana t4 kanıt görüntüleri.
Sıradaki: yayın tamam; 6 saatlik veri güncellemesinin ilk koşusunu izle.
Açık: bağımsız denetim bellek kesintisi nedeniyle koşulamadı; kaynak-denetle 14/14 canlı; haber akışı ilk turda boş.
Commit: e593ece (is001-site dalı).

## 2026-11-12 · İŞ 002 tasarım v0.6
Yapıldı: tasarim/index.html askeri istihbarat konsolu diline taşındı; açık tema tamamen söküldü, açılış perdesi + ENTER kapak + yumuşak dil geçişi + görünür künye eklendi; kürenin yeşil halesi ve KAYNAK DOĞRULANDI damga çakışması düzeltildi; README ve GitHub About yazıldı.
Doğrulama: 5 görüntüde konsol hatası 0, yatay taşma 0; ui_lint ERR 0 WARN 0 (4 INFO); damga aralığı 4,6px → 9,6px ölçüldü.
Sıradaki: İŞ 001 site inşası — v0.6 prototipi modüllere böl, gerçek veri + kaynak çekme hattı.
Açık: ui_lint 4 INFO (2 uzun arayüz metni, 2 toUpperCase tr notu); İŞ 001'de metinler data/metinler.json'a taşınırken bakılacak.
Commit: e684bd5 — tasarim v0.6; devir notu aynı push içinde işlendi.
