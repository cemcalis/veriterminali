# Veri Terminali

Telegram Mini App için gerçek zamanlı(a yakın), profesyonel bir finans
terminali. Kripto, forex, emtia, BIST, ABD hisseleri, ETF'ler ve küresel
endeksler için ücretsiz kaynaklardan canlı veri sağlar — **1149 enstrüman**
tek kataloğ altında.

## Piyasa kapsamı

| Kategori | Sembol sayısı | Kaynak |
|---|---|---|
| Kripto | 400 | Binance `exchangeInfo`/24hr'den canlı çekilen en yüksek hacimli USDT paritleri |
| ABD Hisseleri | 381 | S&P 500 bileşenleri (curated) |
| BIST | 199 | Türk hisseleri + BIST sektör/ana endeksleri (curated) |
| ETF | 67 | SPY, QQQ, VOO, GLD, SLV, TLT ve diğer popüler ABD ETF'leri (curated) |
| Forex | 56 | Majör, minör ve egzotik pariteler (curated) |
| Emtia | 23 | Metaller, enerji, tarım ürünleri (curated) |
| Küresel Endeksler | 23 | S&P 500, Nasdaq 100, DXY, DAX, Nikkei, Hang Seng vb. (curated) |
| **Toplam** | **1149** | |

Kripto listesi `npm run generate:symbols` her çalıştırıldığında Binance'den
yeniden çekilir (gerçek, o anki işlem hacmine göre sıralı). Diğer kategoriler
statik ama gerçek enstrüman kataloğlarıdır — fiyatlar hiçbir zaman
sabit/sahte değildir, her zaman canlı sağlayıcılardan gelir.

## Neden bu mimari?

Bu proje, hiçbir sahte/sabit veri kullanmadan, gerçekten çalışan ücretsiz veri
kaynaklarını test ederek inşa edildi. Test sonuçları [`provider-test-report.md`](./provider-test-report.md)
(hand-picked sembollerle detaylı sağlayıcı testi) ve
[`provider-coverage-report.md`](./provider-coverage-report.md) (tüm 1149
sembollük katalog için kapsam özeti — `npm run generate:coverage` ile
yeniden üretilir) dosyalarında. Özet:

| Kaynak | Durum | Kapsam |
|---|---|---|
| **Binance WebSocket** | ✅ Çalışıyor, resmi, ücretsiz, anahtar gerektirmiyor | Kripto |
| **TradingView unofficial WS** (`tradingview-twc` vb.) | ✅ Çalışıyor, **deneysel/resmi olmayan** | Kripto, Forex, Emtia, BIST, ABD hisseleri, Endeksler |
| **Yahoo Finance unofficial** | ✅ Çalışıyor, gecikmeli fallback | Hepsi (BIST hariç sınırlı) |
| **Finnhub free tier** | ⚠️ Anahtar gerekli (ücretsiz) | ABD hisseleri, Forex, Kripto |
| **Twelve Data free tier** | ⚠️ Anahtar gerekli (ücretsiz) | Hepsi |
| **StockerAPI (Kun Data)** | ❌ Ücretsiz katmanı yok, repo yalnızca pazarlama sayfası | BIST (paid) |

`ch99q/twc`, `dovudo/tradingview-websocket`, `iiiyu/tradingview-ws-client`
repoları TradingView'in aynı belgelenmemiş WebSocket protokolünü sarmalıyor.
Bu protokol test edilip doğrulandı ve üç ayrı adapter (`tradingview-twc`,
`tradingview-microservice`, `tradingview-ws-client`) olarak native TypeScript
ile uygulandı — hepsi **deneysel** olarak işaretli çünkü TradingView bu API'yi
resmi olarak desteklemiyor.

## Proje yapısı

```
veriterminali/
├── src/
│   ├── providers/            # Sağlayıcı katmanı (paylaşılan)
│   │   ├── market-provider.interface.ts
│   │   ├── provider-registry.ts
│   │   ├── binance.provider.ts
│   │   ├── tradingview-twc.provider.ts
│   │   ├── tradingview-microservice.provider.ts
│   │   ├── tradingview-ws-client.provider.ts
│   │   ├── stockerapi.provider.ts
│   │   ├── finnhub.provider.ts
│   │   ├── twelvedata.provider.ts
│   │   ├── yahoo.provider.ts
│   │   └── lib/tradingview-socket.ts
│   └── symbols.ts            # Desteklenen sembol kataloğu (auto-generated, 1149 sembol)
├── scripts/
│   ├── generate-symbols.mjs        # npm run generate:symbols — Binance'den canlı kripto listesi + curated diğer kategoriler
│   ├── generate-coverage-report.ts # npm run generate:coverage — provider-coverage-report.md üretir
│   ├── test-providers.ts           # npm run test:providers
│   └── tv-*-probe.mjs              # ham protokol testleri (geliştirme sırasında kullanıldı)
├── backend/                  # Express + WebSocket relay
│   └── src/
│       ├── index.ts          # WS subscribe/unsubscribe protokolü
│       ├── market-hub.ts     # sağlayıcıları sembol kataloğuna bağlar, akıllı batching + ref-counted dinamik abonelik
│       ├── cache.ts          # Redis / bellek içi önbellek
│       ├── telegram.ts       # alarm bildirimleri
│       └── routes/
├── frontend/                 # Next.js 16 + Telegram Mini App
│   ├── app/{page,piyasalar,grafik,portfoy,alarm,ayarlar}
│   ├── components/           # market-table.tsx (sanallaştırılmış tablo), status-badge.tsx, lucide-react ikonları
│   └── lib/
├── provider-test-report.md      # El ile seçilmiş semboller için detaylı sağlayıcı testi
├── provider-coverage-report.md  # Tüm katalog için kapsam özeti (auto-generated)
├── .env.example
└── docs/
```

## Hızlı başlangıç (yerel geliştirme)

### 1. Sağlayıcı testlerini çalıştır (opsiyonel, doğrulama için)

```bash
npm install
npm run test:providers       # el ile seçilmiş semboller, detaylı test -> provider-test-report.md
npm run generate:coverage    # tüm 1149 sembol için kapsam özeti -> provider-coverage-report.md
npm run generate:symbols     # kripto listesini Binance'den yeniden çek (opsiyonel, veri güncelleme)
```

### 2. Backend'i başlat

```bash
cd backend
npm install
cp ../.env.example .env   # veya kendi .env dosyanızı oluşturun
npm run dev
```

Backend `http://localhost:4000` üzerinde REST API ve `/ws` üzerinde
WebSocket relay sunar. Redis yoksa otomatik olarak bellek içi önbelleğe
düşer — hiçbir ek kurulum gerekmez.

### 3. Frontend'i başlat

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

`http://localhost:3000` adresinde terminal açılır.

## Ortam değişkenleri

`.env.example` dosyasına bakın. Hiçbir anahtar zorunlu değildir — Binance ve
TradingView (deneysel) sağlayıcıları anahtarsız çalışır. Finnhub/Twelve Data
anahtarları eklerseniz ek fallback kaynakları devreye girer.

**Önemli:** API anahtarları ve çerezler yalnızca backend `.env` dosyasında
tutulur, hiçbir zaman frontend'e veya tarayıcıya gönderilmez.

## Sayfalar

- **Anasayfa** — piyasa durumu, kategori başına ilk 5 enstrümanlık önizleme + "Tümünü gör"
- **Piyasalar** — arama, kategori sekmeleri, izleme listesi, sanallaştırılmış (react-window) canlı fiyat tablosu, kompakt/detaylı görünüm, sembol/durum/sağlayıcı/son güncelleme bilgisi
- **Grafik** — sembol arama (1149 sembol), Lightweight Charts mum grafiği, 1m/5m/15m/1h/4h/1d, canlı durum rozeti
- **Portföy** — manuel pozisyon girişi, canlı fiyatlardan K/Z hesaplama
- **Alarm** — fiyat alarmı oluşturma, backend'de 15sn'de bir kontrol, Telegram bildirim altyapısı
- **Ayarlar** — aktif sağlayıcı durumu, sağlayıcı health check, API anahtarı durumu (değer gizli)

## Performans: 1149 sembolle akıcı çalışma

- **Sanallaştırma:** Piyasalar tablosu `react-window` ile sanallaştırılmış — DOM'da her zaman yalnızca görünen satırlar var, 1149 satır render edilmiyor.
- **Akıllı batching:** Backend başlangıçta kripto için tüm 400 sembolü Binance'e (gerçek WebSocket, ucuz), diğer kategoriler için yalnızca kategori başına ilk 30 "öncelikli" sembolü TradingView'e abone eder. Geri kalan ~550 sembol REST fallback üzerinden sorgulanabilir durumda kalır.
- **Ref-counted dinamik abonelik:** İstemci bir kategoriye/sembole baktığında (`/api/market` WS üzerinden `subscribe`/`unsubscribe` mesajlarıyla) backend o sembolleri anlık olarak TradingView'e abone eder; kimse izlemiyorsa (ve izleme listesinde değilse) abonelikten çıkarır.
- **İzleme listesi önceliği:** Kullanıcının favori sembolleri, aktif sekmeden bağımsız olarak her zaman canlı akışa dahil edilir.
- **Kategori bazlı görünüm cap'i:** Piyasalar sayfası bir seferde en fazla 80 görünür sembolü canlı akışa alır — 400 sembollük kripto sekmesine geçmek 400 eşzamanlı dinamik abonelik tetiklemez.

## Telegram Mini App kurulumu

Bkz. [`docs/telegram-setup.md`](./docs/telegram-setup.md)

## Deployment

Bkz. [`docs/deployment.md`](./docs/deployment.md)

## Veri durumu (status) etiketleri

Her sembol için arayüzde şu durumlardan biri gösterilir:

- **Canlı (live)** — resmi, gerçek zamanlı push feed (yalnızca Binance/kripto)
- **Yakın-canlı (near-live)** — deneysel/resmi olmayan gerçek zamanlı feed (TradingView), SLA yok
- **Gecikmeli (delayed)** — REST polling / gecikmeli veri (Yahoo Finance, Finnhub/TwelveData free tier)
- **Yedek (fallback)** — veri var ama tazelik penceresinin dışında (stale tick)
- **Yok (unavailable)** — şu an hiçbir sağlayıcı bu sembol için veri döndürmüyor

## Bilinen sınırlamalar

- TradingView tabanlı sağlayıcılar resmi olmayan, belgesiz bir WebSocket
  protokolüne dayanır. TradingView bunu herhangi bir zamanda değiştirebilir
  veya engelleyebilir. Bu yüzden tüm arayüzde "deneysel" etiketi gösterilir.
- Yahoo Finance fallback'i de resmi olmayan bir endpoint kullanır ve
  hız sınırlamasına (rate limit) takılabilir.
- StockerAPI/Kun Data reposu incelendi: gerçek bir açık kaynak istemci veya
  ücretsiz katman içermiyor, yalnızca ücretli "Kun Data" ürününün
  pazarlama/dokümantasyon kabuğu. Bu yüzden varsayılan olarak devre dışı.
- Portföy ve alarm verileri şu an backend'de basit JSON dosyalarında
  tutuluyor (`backend/data/`). Postgres/Prisma'ya geçiş için `JsonStore`
  sınıfının arayüzünü koruyarak `backend/src/store/` altında yeni bir
  implementasyon eklemeniz yeterli.
- BIST ve US stock listeleri curated statik kataloglardır (canlı bir
  exchange-listing API'sinden değil) — büyük ölçüde güncel ama şirket
  birleşme/çıkarma/yeni halka arz gibi değişiklikleri otomatik yakalamaz.
  Kripto listesi ise her `npm run generate:symbols` çalıştırmasında
  Binance'in o anki gerçek `exchangeInfo`/24hr verisinden yeniden üretilir.
- `provider-coverage-report.md`'deki kripto-dışı satırlar, ~750 sembolün
  tamamını değil, kategori başına ilk 10 sembollük canlı bir örneklemi
  test eder (tam tarama, resmi olmayan TradingView protokolüyle sembol
  başına çok yavaş olurdu); oranlar örneklemden ekstrapole edilir.
