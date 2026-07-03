# Veri Terminali

Telegram Mini App için gerçek zamanlı(a yakın) finans terminali. Kripto, forex,
emtia, BIST ve ABD hisseleri için ücretsiz kaynaklardan canlı veri sağlar.

## Neden bu mimari?

Bu proje, hiçbir sahte/sabit veri kullanmadan, gerçekten çalışan ücretsiz veri
kaynaklarını test ederek inşa edildi. Test sonuçları [`provider-test-report.md`](./provider-test-report.md)
dosyasında. Özet:

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
│   └── symbols.ts            # Desteklenen sembol kataloğu
├── scripts/
│   ├── test-providers.ts     # npm run test:providers
│   └── tv-*-probe.mjs        # ham protokol testleri (geliştirme sırasında kullanıldı)
├── backend/                  # Express + WebSocket relay
│   └── src/
│       ├── index.ts
│       ├── market-hub.ts     # sağlayıcıları sembol kataloğuna bağlar
│       ├── cache.ts          # Redis / bellek içi önbellek
│       ├── telegram.ts       # alarm bildirimleri
│       └── routes/
├── frontend/                 # Next.js 15 + Telegram Mini App
│   ├── app/{page,piyasalar,grafik,portfoy,alarm,ayarlar}
│   ├── components/
│   └── lib/
├── provider-test-report.md   # Otomatik üretilen test raporu
├── .env.example
└── docs/
```

## Hızlı başlangıç (yerel geliştirme)

### 1. Sağlayıcı testlerini çalıştır (opsiyonel, doğrulama için)

```bash
npm install
npm run test:providers
```

Bu, tüm sağlayıcıları gerçek sembollerle test eder ve `provider-test-report.md`
dosyasını yeniden üretir.

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

- **Anasayfa** — piyasa durumu, tüm kategori kartları
- **Piyasalar** — arama, kategori filtreleri, izleme listesi, canlı fiyat tablosu
- **Grafik** — sembol seçici, Lightweight Charts mum grafiği, 1m/5m/15m/1h/4h/1d
- **Portföy** — manuel pozisyon girişi, canlı fiyatlardan K/Z hesaplama
- **Alarm** — fiyat alarmı oluşturma, backend'de 15sn'de bir kontrol, Telegram bildirim altyapısı
- **Ayarlar** — aktif sağlayıcı durumu, sağlayıcı health check, API anahtarı durumu (değer gizli)

## Telegram Mini App kurulumu

Bkz. [`docs/telegram-setup.md`](./docs/telegram-setup.md)

## Deployment

Bkz. [`docs/deployment.md`](./docs/deployment.md)

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
