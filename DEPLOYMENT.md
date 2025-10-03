# 🚀 Развертывание бота на сервере

## 📋 Содержание
- [Подготовка](#подготовка)
- [Установка на сервер](#установка-на-сервер)
- [Настройка Webhook](#настройка-webhook)
- [Проверка работы](#проверка-работы)
- [Решение проблем](#решение-проблем)

---

## ⚙️ Подготовка

### 1. Соберите проект локально

```bash
npm run build
```

Убедитесь что нет ошибок компиляции.

### 2. Подготовьте `.env` файл

```env
BOT_TOKEN=your_bot_token_here
DATABASE_URL=postgresql://user:password@localhost:5432/db_name

# Admin IDs (только числовые ID!)
OWNER_IDS=123456789
ADMIN_IDS=987654321,111111111

# Настройки курса
COURSE_PRICE=1100000
COURSE_NAME=Telegram Bot Development Course
```

---

## 📦 Установка на сервер

### 1. Загрузите проект на сервер

```bash
# Через git
git clone <your-repo-url>
cd telegram-course-bot-nextjs

# Или через scp/sftp
```

### 2. Установите зависимости

```bash
npm install
```

### 3. Настройте БД

```bash
# Примените миграции
npx prisma migrate deploy

# Опционально: заполните тестовыми данными
npx prisma db seed
```

### 4. Соберите проект

```bash
npm run build
```

### 5. Запустите сервер

```bash
# Production
npm start

# Или с PM2
pm2 start npm --name "telegram-bot" -- start
pm2 save
```

---

## 🔗 Настройка Webhook

### Вариант 1: Через скрипт (рекомендуется)

```bash
# Установить webhook
node set-webhook.js https://your-domain.com/api/bot

# Проверить webhook
node check-webhook.js
```

### Вариант 2: Через curl

```bash
# Установить webhook
curl -F "url=https://your-domain.com/api/bot" \
     https://api.telegram.org/bot$BOT_TOKEN/setWebhook

# Проверить webhook
curl https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo
```

### Вариант 3: Через браузер

Откройте в браузере:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/bot
```

---

## ✅ Проверка работы

### 1. Проверьте статус webhook

```bash
node check-webhook.js
```

Должно быть:
```
✅ Webhook установлен
📍 URL: https://your-domain.com/api/bot
📦 Ожидающих обновлений: 0
✅ Ошибок не обнаружено
```

### 2. Проверьте endpoint

```bash
curl https://your-domain.com/api/bot
```

Должен вернуть:
```json
{
  "status": "ok",
  "message": "Telegram Bot Webhook Endpoint",
  "timestamp": "2025-01-10T..."
}
```

### 3. Отправьте сообщение боту

1. Откройте бота в Telegram
2. Отправьте `/start`
3. Должно прийти приветственное сообщение

### 4. Проверьте логи сервера

```bash
# Если используете PM2
pm2 logs telegram-bot

# Или стандартный вывод
tail -f logs/app.log
```

Должны появиться логи:
```
📨 Webhook received: {...}
```

---

## 🐛 Решение проблем

### Ошибка: 405 Method Not Allowed

**Причина:** Endpoint не обрабатывает POST запросы

**Решение:**
```bash
# Проверьте файл src/app/api/bot/route.ts
# Убедитесь что есть функция POST

cat src/app/api/bot/route.ts
```

Должно быть:
```typescript
export async function POST(req: NextRequest) {
  // ...
}
```

---

### Ошибка: 500 Internal Server Error

**Причина:** Ошибка в коде или неправильные переменные окружения

**Решение:**

1. Проверьте логи:
```bash
pm2 logs telegram-bot --lines 100
```

2. Проверьте `.env`:
```bash
cat .env
```

3. Проверьте подключение к БД:
```bash
npx prisma db pull
```

4. Пересоберите проект:
```bash
npm run build
pm2 restart telegram-bot
```

---

### Ошибка: Wrong response from the webhook

**Причина:** Сервер вернул некорректный ответ

**Решение:**

1. Проверьте что сервер возвращает JSON:
```bash
curl -X POST https://your-domain.com/api/bot \
  -H "Content-Type: application/json" \
  -d '{"update_id": 123}'
```

Должно вернуть:
```json
{"ok": true}
```

2. Проверьте Content-Type в ответе

---

### Webhook не устанавливается

**Причина:** Неправильный URL или недоступен сервер

**Проверка:**

1. URL должен быть HTTPS (не HTTP)
2. Домен должен быть доступен из интернета
3. SSL сертификат должен быть валидным

```bash
# Проверка доступности
curl -I https://your-domain.com/api/bot

# Проверка SSL
openssl s_client -connect your-domain.com:443
```

---

### Pending updates (необработанные обновления)

**Причина:** Бот не обработал старые сообщения

**Решение:**

Удалите необработанные обновления:
```bash
curl https://api.telegram.org/bot$BOT_TOKEN/getUpdates?offset=-1
```

Или перезапустите webhook:
```bash
node set-webhook.js https://your-domain.com/api/bot
```

---

## 🔧 Дополнительные команды

### Удалить webhook

```bash
curl https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook
```

### Получить информацию о боте

```bash
curl https://api.telegram.org/bot$BOT_TOKEN/getMe
```

### Проверить обновления (для отладки)

```bash
curl https://api.telegram.org/bot$BOT_TOKEN/getUpdates
```

---

## 📊 Мониторинг

### PM2 Dashboard

```bash
pm2 monit
```

### Логи в реальном времени

```bash
pm2 logs telegram-bot --lines 50 --raw
```

### Статус процесса

```bash
pm2 status
```

---

## 🔐 Безопасность

### 1. Защита .env файла

```bash
chmod 600 .env
```

### 2. Ограничение доступа к webhook

В `src/app/api/bot/route.ts` можно добавить проверку IP:

```typescript
export async function POST(req: NextRequest) {
  // Проверка что запрос от Telegram
  const ip = req.headers.get('x-forwarded-for') || req.ip
  
  // Telegram IP ranges: 149.154.160.0/20, 91.108.4.0/22
  // Для production добавьте проверку IP
  
  // ...
}
```

### 3. Rate limiting

Добавьте rate limiting в nginx:

```nginx
limit_req_zone $binary_remote_addr zone=webhook:10m rate=10r/s;

location /api/bot {
    limit_req zone=webhook burst=20;
    proxy_pass http://localhost:3000;
}
```

---

## 📞 Поддержка

Если проблемы остались:

1. Проверьте логи: `pm2 logs telegram-bot`
2. Проверьте webhook: `node check-webhook.js`
3. Проверьте endpoint: `curl https://your-domain.com/api/bot`
4. Посмотрите документацию Telegram: https://core.telegram.org/bots/api#setwebhook

---

**Версия:** 1.0.0  
**Дата:** 2025-01-10
