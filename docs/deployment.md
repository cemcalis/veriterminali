# Deployment Rehberi

Bu proje iki ayrı deploy edilebilir birimden oluşur: **backend** (Express +
WebSocket relay) ve **frontend** (Next.js). `src/providers` ve `src/symbols.ts`
backend tarafından relative import ile kullanılır, bu yüzden backend'i
deploy ederken repo kökünün tamamını (yalnızca `backend/` klasörünü değil)
build context'ine dahil etmeniz gerekir.

## Backend → Railway veya Render

### Railway

1. Yeni proje oluşturun, GitHub reposunu bağlayın.
2. **Root Directory**: repo kökü (`/`) — `backend/` değil, çünkü
   `backend/src/market-hub.ts` gibi dosyalar `../../src/providers/...`
   şeklinde repo kökündeki paylaşılan kodu import ediyor.
3. **Build Command**: `cd backend && npm install`
4. **Start Command**: `cd backend && npm run start`
5. Ortam değişkenlerini (`.env.example`'a bakın) Railway Variables kısmına
   ekleyin: `FINNHUB_API_KEY`, `TWELVEDATA_API_KEY`, `TELEGRAM_BOT_TOKEN`,
   `REDIS_URL` (Railway'in kendi Redis eklentisini kullanabilirsiniz).
6. Railway otomatik bir `PORT` değişkeni sağlar; `backend/src/index.ts` bunu
   zaten okuyor.

### Render

1. **New Web Service** → repoyu bağlayın.
2. **Root Directory**: `.` (repo kökü)
3. **Build Command**: `cd backend && npm install`
4. **Start Command**: `cd backend && npm run start`
5. **Environment**: Node
6. Redis için Render'ın "Redis" add-on'unu ekleyip `REDIS_URL`'i otomatik
   bağlayabilirsiniz, ya da boş bırakıp bellek içi önbelleğe düşmesine izin
   verebilirsiniz (tek instance'lık MVP için yeterli).

> **Not:** WebSocket desteği için Render/Railway'de "sticky sessions" veya
> özel WS ayarı gerekmez; her iki platform da standart HTTP upgrade
> mekanizmasını destekler.

## Frontend → Vercel

1. Vercel'de yeni proje oluşturun, **Root Directory** olarak `frontend/`
   seçin.
2. Framework preset: Next.js (otomatik algılanır).
3. Ortam değişkenleri:
   - `NEXT_PUBLIC_BACKEND_HTTP_URL=https://<backend-domain>`
   - `NEXT_PUBLIC_BACKEND_WS_URL=wss://<backend-domain>`
     (backend HTTPS ise WebSocket de otomatik olarak `wss://` olmalı)
4. Deploy edin. Vercel önizleme URL'i alırsınız; bunu Telegram BotFather'da
   Mini App URL'i olarak kullanabilirsiniz.

## CORS

Backend `cors()` middleware'i ile tüm origin'lere açık (`*`). Prodüksiyonda
`backend/src/index.ts` içindeki `app.use(cors())` çağrısını
`cors({ origin: 'https://<frontend-domain>' })` şeklinde kısıtlamanız
önerilir.

## Sağlık kontrolü

Deploy sonrası doğrulama:

```bash
curl https://<backend-domain>/api/status
curl https://<backend-domain>/api/market/health
curl https://<backend-domain>/api/market/quote/BINANCE:BTCUSDT
```

Frontend'de **Ayarlar** sayfası aynı health endpoint'ini kullanıcıya gösterir.

## Ölçeklendirme notları

- Şu anki mimari tek instance için tasarlandı (WebSocket bağlantı listesi
  process içi `Set` olarak tutuluyor). Yatay ölçeklendirme için Redis
  pub/sub tabanlı bir relay katmanına geçmek gerekir.
- Portföy/alarm verileri JSON dosyası olarak diskte tutuluyor
  (`backend/data/`). Railway/Render gibi platformlarda dosya sistemi
  genellikle ephemeral'dır — kalıcılık için bir volume bağlayın veya
  Postgres/Prisma'ya geçin.
