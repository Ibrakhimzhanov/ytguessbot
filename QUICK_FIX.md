# 🆘 БЫСТРОЕ РЕШЕНИЕ - БОТ НЕ ОТВЕЧАЕТ

## 🚨 Что делать ПРЯМО СЕЙЧАС

### На сервере (91.184.247.219):

```bash
# 1. Подключитесь к серверу
ssh root@91.184.247.219

# 2. Перейдите в директорию проекта
cd /srv/postgres/ytguessbot
# или где у вас проект

# 3. Запустите диагностику
chmod +x diagnose.sh
./diagnose.sh
```

---

## 🔍 РУЧНАЯ ПРОВЕРКА (если нет diagnose.sh)

### Шаг 1: Проверьте что приложение запущено

```bash
ps aux | grep node
```

**Если не запущено:**
```bash
pm2 start npm --name ytguessbot -- start
pm2 save
```

Или без PM2:
```bash
npm start &
```

---

### Шаг 2: Проверьте порт

```bash
netstat -tuln | grep 3000
# или
ss -tuln | grep 3000
```

**Если порт не слушается** - приложение не запущено, вернитесь к Шагу 1.

---

### Шаг 3: Проверьте локальный endpoint

```bash
curl http://127.0.0.1:3000/api/bot
```

**Должно вернуть:**
```json
{
  "status": "ok",
  "message": "Telegram Bot Webhook Endpoint",
  "timestamp": "..."
}
```

**Если возвращает ошибку:**
```bash
# Посмотрите логи
pm2 logs ytguessbot --lines 50
# или
tail -f logs/app.log
```

---

### Шаг 4: Проверьте .env файл

```bash
cat .env
```

**Обязательно должно быть:**
```env
BOT_TOKEN=ваш_реальный_токен  # НЕ "your_telegram_bot_token_here"!
DATABASE_URL=postgresql://...
APP_BASE_URL=https://ytacademy.uz
```

**Если чего-то нет:**
```bash
nano .env
# Добавьте недостающие переменные
# Ctrl+O для сохранения, Ctrl+X для выхода

# Перезапустите
pm2 restart ytguessbot
```

---

### Шаг 5: Проверьте внешний доступ

```bash
curl https://ytacademy.uz/api/bot
```

**Если возвращает ошибку:**

#### А) Проверьте Nginx

```bash
nginx -t
systemctl status nginx
```

**Если Nginx не настроен, создайте конфиг:**
```bash
nano /etc/nginx/sites-available/ytacademy
```

Вставьте:
```nginx
server {
    listen 80;
    server_name ytacademy.uz www.ytacademy.uz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте:
```bash
ln -s /etc/nginx/sites-available/ytacademy /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Б) Установите SSL (Certbot)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ytacademy.uz -d www.ytacademy.uz
```

---

### Шаг 6: Проверьте DNS

```bash
dig ytacademy.uz +short
# или
nslookup ytacademy.uz
```

**Должно вернуть:**
```
91.184.247.219
```

**Если нет** - подождите пока DNS обновится (до 48 часов, обычно 1-2 часа).

---

### Шаг 7: Проверьте webhook

```bash
# Замените YOUR_TOKEN на ваш BOT_TOKEN из .env
curl https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo
```

**Должно быть:**
```json
{
  "ok": true,
  "result": {
    "url": "https://ytacademy.uz/api/bot",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

**Если webhook не установлен или неправильный URL:**
```bash
node set-webhook.js https://ytacademy.uz/api/bot
```

---

### Шаг 8: Проверьте файлы

```bash
# Проверьте что файл существует
ls -la src/app/api/bot/route.ts

# Посмотрите содержимое
cat src/app/api/bot/route.ts
```

**Должно быть:**
```typescript
import { bot } from '@/lib/bot-handlers'  // ВАЖНО: bot-handlers!
```

**Если написано `from '@/lib/telegram'`:**
```bash
# Исправьте вручную
nano src/app/api/bot/route.ts
# Измените на: import { bot } from '@/lib/bot-handlers'

# Пересоберите
rm -rf .next
npm run build
pm2 restart ytguessbot
```

---

### Шаг 9: Проверьте базу данных

```bash
# Из .env возьмите DATABASE_URL
psql "postgresql://username:password@host:5432/dbname" -c "SELECT 1;"
```

**Если ошибка подключения:**
```bash
# Проверьте что PostgreSQL запущен
systemctl status postgresql

# Запустите если не запущен
systemctl start postgresql
```

---

### Шаг 10: Проверьте логи

```bash
# PM2 логи
pm2 logs ytguessbot --lines 100

# Системные логи
journalctl -u nginx -n 50
journalctl -xe
```

---

## ✅ КОНТРОЛЬНЫЙ СПИСОК

Проверьте каждый пункт:

- [ ] Node.js процесс запущен (`ps aux | grep node`)
- [ ] Порт 3000 слушается (`netstat -tuln | grep 3000`)
- [ ] Локальный endpoint работает (`curl http://127.0.0.1:3000/api/bot`)
- [ ] .env файл заполнен правильно (`cat .env`)
- [ ] DNS указывает на сервер (`dig ytacademy.uz +short` = `91.184.247.219`)
- [ ] Nginx работает (`systemctl status nginx`)
- [ ] SSL сертификат установлен (`curl https://ytacademy.uz`)
- [ ] Внешний endpoint доступен (`curl https://ytacademy.uz/api/bot`)
- [ ] Webhook установлен (`node check-webhook.js`)
- [ ] База данных доступна (`psql ...`)
- [ ] Логи не показывают ошибок (`pm2 logs`)

---

## 🆘 ЕСЛИ ВСЁ ЕЩЁ НЕ РАБОТАЕТ

### Полный перезапуск:

```bash
# 1. Остановите всё
pm2 stop all
pm2 delete all

# 2. Очистите кеши
rm -rf .next
rm -rf node_modules/.cache

# 3. Переустановите зависимости (если нужно)
npm install

# 4. Пересоберите
npm run build

# 5. Проверьте .env
cat .env

# 6. Запустите заново
pm2 start npm --name ytguessbot -- start
pm2 save

# 7. Проверьте логи
pm2 logs ytguessbot --lines 50

# 8. Проверьте endpoint
curl http://127.0.0.1:3000/api/bot

# 9. Установите webhook
node set-webhook.js https://ytacademy.uz/api/bot

# 10. Проверьте webhook
node check-webhook.js

# 11. Отправьте /start боту
```

---

## 📞 ЧАСТЫЕ ОШИБКИ

### "Cannot find module '@/lib/bot-handlers'"

**Решение:**
```bash
npm install
npm run build
pm2 restart ytguessbot
```

---

### "ECONNREFUSED 127.0.0.1:5432"

**Решение:**
```bash
systemctl start postgresql
systemctl enable postgresql
```

---

### "502 Bad Gateway"

**Решение:**
```bash
# Проверьте что приложение запущено
pm2 status

# Перезапустите nginx
systemctl restart nginx
```

---

### "Webhook was deleted"

**Решение:**
```bash
node set-webhook.js https://ytacademy.uz/api/bot
```

---

### "Wrong response from the webhook: 405"

**Решение:**
```bash
# Проверьте что файл правильный
cat src/app/api/bot/route.ts | grep "bot-handlers"

# Если нет, исправьте и пересоберите
rm -rf .next
npm run build
pm2 restart ytguessbot
```

---

## 💬 ОТПРАВЬТЕ МНЕ

Если ничего не помогло, отправьте результаты:

```bash
# Соберите информацию
echo "=== PS ===" > debug.txt
ps aux | grep node >> debug.txt
echo "=== NETSTAT ===" >> debug.txt
netstat -tuln | grep 3000 >> debug.txt
echo "=== CURL LOCAL ===" >> debug.txt
curl http://127.0.0.1:3000/api/bot >> debug.txt 2>&1
echo "=== CURL EXTERNAL ===" >> debug.txt
curl https://ytacademy.uz/api/bot >> debug.txt 2>&1
echo "=== PM2 LOGS ===" >> debug.txt
pm2 logs ytguessbot --lines 50 --nostream >> debug.txt 2>&1
echo "=== ENV ===" >> debug.txt
cat .env | grep -v "BOT_TOKEN\|DATABASE_URL" >> debug.txt

cat debug.txt
```

И скопируйте вывод.

---

**Удачи!** 🍀
