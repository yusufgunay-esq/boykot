# Boykot

Hangi şirket neden boykot ediliyor, bunu kim söylüyor ve en son ne oldu? Bu site bu üç soruya kaynağıyla cevap vermek için yapılıyor.

Ekranda bir dünya küresi var. Şirketin merkezi ve faaliyet gösterdiği yerler küre üzerinde işaretli. Bir şirkete tıklayınca boykotun gerekçesini, olayların tarih sırasını, hangi markaların o şirkete ait olduğunu ve bilginin nereden geldiğini görüyorsunuz.

Site: https://yusufgunay-esq.github.io/boykot/

Yayındaki sayfa şimdilik tasarım prototipi; içindeki şirket kayıtları örnek amaçlı.

## Kayıtlar nasıl seçiliyor

Bir şirketin listeye girmesi için açılabilen en az bir kaynak gerekiyor. Ana kaynak BDS hareketinin kendi yayımladığı listeler. Haberler için Reuters, AP, BBC, Al Jazeera ve Anadolu Ajansı'na bakılıyor.

Gerekçe yazılırken kaynağın söylediğinin ötesine geçilmiyor. "Şu şirket şunu yaptı" yerine "BDS'ye göre şu şirket şunu yaptı" gibi yazılıyor. Kaynağı açılmayan ya da doğrulanamayan kayıt siteye konmuyor.

Listeyi otomatik araçlar değiştirmiyor. Bir araç fark görürse issue açıyor, kararı bir insan veriyor.

## Bilgisayarda açmak

Derleme yok. Tarayıcı veri dosyalarını `fetch` ile okuduğu için dosyayı çift tıklayarak açmak yetmiyor, küçük bir sunucu gerekiyor:

```bash
python -m http.server 8080
```

Sonra tarayıcıda `http://localhost:8080` adresine gidin.

## Klasörler

```
index.html   site
css/         renkler ve sayfa stili
data/        site metinleri
tasarim/     tek dosyalık tasarım prototipi
araclar/     yardımcı betikler
```

## Yanlış bir kayıt görürseniz

Issue açın, mümkünse kaynağını da ekleyin. Hatalı bilgi en kısa sürede düzeltilir ya da kaldırılır.

## Not

Site bilgi vermek için var. Alıntılanan haber ve listeler sahiplerine ait. Bu proje BDS hareketinin resmî bir parçası değil ve onunla bir bağı yok.

## Lisans

Tüm hakları saklıdır, ayrıntı [LICENSE](LICENSE) dosyasında. İzin alınarak kullanıldığında "Yusuf Günay" adının görünür bir yerde yazılması gerekiyor.

Yusuf Günay · https://github.com/yusufgunay-esq
