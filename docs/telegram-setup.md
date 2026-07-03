# Telegram Mini App Kurulumu

## 1. Bot oluştur

1. Telegram'da [@BotFather](https://t.me/BotFather) ile konuş.
2. `/newbot` komutunu çalıştır, bot adı ve kullanıcı adı belirle.
3. Sana verilen **bot token**'ı `backend/.env` içindeki `TELEGRAM_BOT_TOKEN`
   değerine yaz (alarm bildirimleri için gerekli, Mini App'in kendisi için
   zorunlu değil).

## 2. Mini App'i kaydet

1. BotFather'da `/mybots` → botunu seç → **Bot Settings** → **Menu Button**
   veya **Configure Mini App**.
2. Web App URL'i olarak frontend'inizin deploy edilmiş adresini girin
   (örn. `https://veri-terminali.vercel.app`). Yerel geliştirmede test
   etmek isterseniz `ngrok http 3000` gibi bir tünel kullanıp o adresi girin
   (Telegram, `http://localhost` adreslerini kabul etmez, HTTPS gerekir).

## 3. Frontend tarafında gerekli entegrasyon

`frontend/app/layout.tsx` dosyası `telegram-web-app.js` script'ini otomatik
yükler ve `lib/telegram.ts` içindeki `initTelegram()` fonksiyonu Mini App
açıldığında:

- `Telegram.WebApp.ready()` ve `expand()` çağırır
- Header/arkaplan rengini terminal temasıyla eşleştirir

Bu, Telegram dışında (normal tarayıcıda) çalıştırıldığında sessizce no-op
olur, yani geliştirme sırasında Telegram gerekmez.

## 4. Kullanıcı bilgisi ve chat ID

Alarm bildirimlerinin bir kullanıcıya Telegram üzerinden gitmesi için, o
kullanıcının chat ID'sini alman gerekir. En basit yol:

1. Kullanıcı botunuza `/start` yazsın.
2. `https://api.telegram.org/bot<TOKEN>/getUpdates` adresinden
   `message.chat.id` değerini oku.
3. Bu ID'yi alarm oluştururken `telegramChatId` alanına ekleyin (backend
   `POST /api/alerts` gövdesi bu alanı zaten destekliyor — frontend Alarm
   sayfasına bir "Telegram'a bağla" adımı eklemek isterseniz
   `frontend/app/alarm/page.tsx` içindeki formu genişletin).

## 5. Menü butonu / komutlar (opsiyonel)

BotFather'da `/setcommands` ile örnek komutlar tanımlayabilirsiniz:

```
terminal - Veri Terminali'ni aç
```

## Test

Mini App'i gerçek Telegram istemcisinde test etmek için:

1. Backend'i ve frontend'i deploy edin (bkz. `docs/deployment.md`).
2. BotFather'da Mini App URL'ini güncelleyin.
3. Botunuzla sohbeti açın, menü butonuna basın.
