# BOYKOT · Küresel Gözlem

Bilinçli tüketim için açık kaynaklı boykot rehberi. Küre üzerindeki şirket dosyaları BDS boykot hedefi, baskı kampanyası, halk boykotu ya da sonuç alınmış durumunu gösterir; her kaydın yanında kaynağı vardır.

**Site:** https://yusufgunay-esq.github.io/boykot/

## Nedir

- Statik site: derleme yok, sunucu yok, çerez yok, izleme yok. GitHub Pages'te yayınlanır.
- Tek sayfa: tam ekran küre, şirket dosyaları, olay çizelgesi, durum filtresi, arama ve zaman penceresi.
- Askeri istihbarat brifingi dilinde bir "brifing" modu. Ses varsayılan açık; tarayıcı kuralı gereği ilk dokunuşta başlar.
- Dört dil: Türkçe, İngilizce, İspanyolca, Çince. Asıl metin Türkçe.
- Yalnız koyu tema.

## Veri

- 20-30 şirket. Her kayıtta durum, neden, tarihçe, markalar, bağlantılı faaliyet yerleri ve kaynaklar bulunur.
- Birincil kaynak BDS hareketinin yayımladığı listelerdir; ikincil kaynak Reuters, AP, BBC, Al Jazeera ve Anadolu Ajansı.
- Her kayıtta en az bir açılmış https kaynak vardır. Açılamayan kaynak ve doğrulanamayan şirket siteye girmez.
- Neden metinleri kaynağın söylediğini aşmaz; "BDS'ye göre ..." gibi tarafsız dille yazılır.
- Liste değişiklikleri insan onayıyla yapılır. `araclar/liste-denetle.mjs` fark görürse issue açar, dosyayı kendisi değiştirmez.

## Güncellik

- `araclar/haber-cek.mjs` açık kaynaklardan (GDELT, yayıncı RSS'leri) son haberleri çeker; tekrarları ayıklar ve en çok 40 kaydı `data/haberler.json` dosyasına yazar.
- GitHub Actions altı saatte bir çalışır; değişiklik varsa açıklayıcı bir commit atar.
- `araclar/kaynak-denetle.mjs` sitedeki tüm bağlantıları doğrular; ölü kaynak yayına girmez.

## Yerelde çalıştırma

Derleme adımı yok. Tarayıcı `fetch` kullandığı için basit bir sunucu gerekir:

```
python -m http.server 8080        # ya da: npx serve .
```

Testler yalnız geliştirme içindir: `npm test`

## Yapı

```
index.html          tek sayfa
css/                tokens.css, site.css
js/                 ES modülleri (küre, paneller, i18n, brifing, ses)
data/               sirketler.json, haberler.json, metinler.json
araclar/            haber-cek.mjs, liste-denetle.mjs, kaynak-denetle.mjs
.github/workflows/  guncelle.yml, pages.yml
tasarim/            tek dosya tasarım prototipi (yayına girmez)
yasal.html          bilgilendirme ve sorumluluk reddi
```

## İlkeler

- Tarafsız dil, doğrulanmış kaynak, insan onaylı liste.
- Renk yalnız veri durumunda; dekoratif renk, reklam ve izleme yok.
- Klavye kısayolları, görünür odak halkası ve azaltılmış hareket desteği.

## Yasal

Bilgilendirme amaçlıdır. Kaynaklar üçüncü taraflara aittir; hukuki sorumluluk kabul edilmez. Hatalı kayıt için GitHub issue açın. Resmî BDS hareketiyle bağlantılı değildir.

## Lisans

Tüm hakları saklıdır; ayrıntılar [LICENSE](LICENSE) dosyasında. İzinle kullanımda "Yusuf Günay" adının görünür yerde anılması gerekir.

## Künye

Yusuf GÜNAY · https://github.com/yusufgunay-esq
