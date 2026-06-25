# TBH Helper

> **Task Bar Hero** için gelişmiş bir yardımcı uygulama — envanterinizi görüntüleyin, item değerlerini takip edin ve Steam Pazarı fiyatlarını anlık olarak izleyin.

---

## Özellikler

- 🗂️ **Envanter Görüntüleyici** — Envanter, Depo, Pazar listeleri ve Kuşanılmış eşyalarınızı görün
- 💰 **Steam Pazarı Fiyatları** — Steam Community Market'ten anlık fiyatları otomatik çeker
- 📊 **Analitik Paneli** — Nadir seviyesine göre varlık dağılımı, en değerli itemler ve portföy özeti
- 🛒 **Pazar Gezgini** — Tüm satılabilir itemleri ve güncel piyasa değerlerini arayın
- 🔴 **Gerçek Zamanlı Senkronizasyon** — Save dosyanızdaki değişiklikleri izler ve görünümü anında günceller
- 🔐 **Steam Hesap Entegrasyonu** — Uygulama içinden Steam'e giriş yaparak hız sınırı sorunlarını aşın
- 🧮 **Toplam Envanter Değeri** — Üst navigasyon çubuğunda tek bakışta görüntülenir
- 🔍 **Arama ve Filtreleme** — Nadirlik derecesine göre filtrele, isme göre ara, değer / isim / derece bazlı sırala

---

## Teknoloji Altyapısı

| Katman | Teknoloji |
|---|---|
| Masaüstü kabuğu | [Tauri](https://tauri.app/) (Rust) |
| Arayüz | React + TypeScript |
| Paketleyici | Vite |
| Stil | Vanilla CSS |
| Yazı Tipi | Outfit (Google Fonts) |

---

## Gereksinimler

- **Windows** (save dosyası yolu Windows'a özgüdür)
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (kararlı araç zinciri)
- [Tauri önkoşulları](https://tauri.app/v1/guides/getting-started/prerequisites)

---

## Başlarken

### 1. Repoyu klonlayın

```bash
git clone https://github.com/yourname/tbhhelper.git
cd tbhhelper
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Geliştirme modunda çalıştırın

```bash
npm run tauri dev
```

### 4. Üretim için derleyin

```bash
npm run tauri build
```

---

## Nasıl Çalışır?

### Save Dosyası

Uygulama, oyunun şifreli save dosyasını otomatik olarak şu konumdan okur:

```
%USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3
```

Dosya; AES-128-CBC şifrelemesi ve PBKDF2-SHA1 anahtar türetimi kullanılarak Rust backend tarafında çözülür, ardından karakter verileri, envanter, depo ve kuşanılmış eşyalar ayrıştırılır.

"Kayıt Dosyası Seç" butonu ile **özel bir save dosyası** da yükleyebilirsiniz.

### Fiyat Çekme

Fiyatlar, oyunun Steam uygulama ID'si üzerinden [Steam Community Market](https://steamcommunity.com/market/)'ten çekilir.

İki mod mevcuttur:

| Mod | Nasıl Çalışır |
|---|---|
| **Misafir** (giriş yapılmamış) | Rust backend üzerinden doğrudan HTTP isteği. Steam'in 429 hız sınırlarına tabi. |
| **Steam Bağlı** | Tauri webview penceresi açar, Steam'e giriş yaparsınız, ardından oturum çerezlerinizle pazar sayfaları arasında gezinir — çok daha güvenilir. |

Çekilen fiyatlar `localStorage`'da önbelleğe alınır ve 1 saat sonra sona erer.

### Item Veritabanı

Tüm item meta verileri (isimler, dereceler, tipler, seviyeler, ikonlar) `tbh_data.json` dosyasında yerel olarak paketlenmiştir. Bu dosya oyunun assetlerinden çıkarılmıştır. Oyun yeni itemler içeren bir güncelleme alırsa bu dosyanın yeniden oluşturulması gerekebilir.

---

## Proje Yapısı

```
tbhhelper/
├── src/
│   ├── components/              # React UI bileşenleri
│   │   ├── Header.tsx           # Üst navigasyon çubuğu
│   │   ├── ItemsGrid.tsx        # Item kart ızgarası
│   │   ├── ItemDetailModal.tsx  # Item detay popup'ı
│   │   ├── MarketExplorer.tsx   # Pazar arama görünümü
│   │   ├── AnalyticsPanel.tsx   # Portföy analitiği
│   │   └── EquippedPanel.tsx    # Kahraman ekipman görünümü
│   ├── hooks/
│   │   └── useSaveData.ts       # Ana durum ve veri mantığı
│   ├── services/price/
│   │   └── SteamMarketProvider.ts  # Steam Pazarı fiyat çekici
│   ├── utils/                   # Yardımcılar (fetch, stat biçimlendirme vb.)
│   ├── types/                   # TypeScript arayüzleri
│   ├── constants/               # Derece haritaları, sınıf isimleri, renkler
│   └── tbh_data.json            # Paketlenmiş item veritabanı (~1.1 MB)
├── src-tauri/
│   ├── src/lib.rs               # Rust backend (dosya şifre çözme, fetch, Steam penceresi)
│   └── capabilities/            # Tauri izin yapılandırması
└── index.html
```

---

## Steam Entegrasyonu

1. Üst çubukta **Connect Steam** butonuna tıklayın
2. Steam giriş penceresi açılır — normalde yaptığınız gibi giriş yapın
3. Giriş yapıldıktan sonra uygulama oturum çerezlerinizi algılar ve pencereyi gizler
4. Bundan sonraki tüm fiyat çekme işlemleri Steam oturumunuzu kullanır — artık 429 hatası yok

Bağlantıyı kesmek için **Disconnect Steam** butonuna tıklayın.

---

## Dış Bağımlılıklar

| Servis | Amaç | Ne Zaman |
|---|---|---|
| `steamcommunity.com/market/` | Canlı item fiyatları | Fiyat yenilemede |
| `steamcommunity.com/login/` | Steam giriş sayfası (webview) | Steam'e bağlanırken |
| `fonts.googleapis.com` | Outfit yazı tipi | Uygulama başlangıcında |

---

## Lisans

MIT — Özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz.

---

## Sorumluluk Reddi

Bu uygulama **resmi olmayan** bir üçüncü taraf araçtır. TesseractStudio veya Valve Corporation ile hiçbir bağlantısı yoktur ve bunlar tarafından onaylanmamıştır. Kullanım riski size aittir.
