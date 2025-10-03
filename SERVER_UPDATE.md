# 🚀 Инструкция по обновлению на сервере

## ⚠️ Проблема
Бот не отвечает, POST запрос возвращает **405 Method Not Allowed**

## 🔍 Причина
Старый файл `/api/webhook/route.ts` не загружал обработчики из `bot-handlers.ts`

## ✅ Решение

### На сервере выполните:

#### 1. Остановите бота
```bash
pm2 stop ytguessbot
# или
pkill -f "node.*3000"
```

#### 2. Перейдите в директорию проекта
```bash
cd /srv/postgres/ytguessbot
# или ваш путь
```

#### 3. Сохраните резервную копию (опционально)
```bash
cp -r .next .next.backup
```

#### 4. Загрузите новые файлы
```bash
# Через git
git pull origin main

# Или загрузите файлы вручную через scp/sftp
```

#### 5. Удалите старый build
```bash
rm -rf .next
rm -rf node_modules/.cache
```

#### 6. Установите зависимости (если package.json изменился)
```bash
npm install
```

#### 7. Соберите проект заново
```bash
npm run build
```

Должно появиться:
```
✓ Compiled successfully
...
Route (app)                              Size     First Load JS
├ ƒ /api/bot                             147 B           106 kB
```

#### 8. Проверьте .env файл
```bash
cat .env
```

Убедитесь что есть:
```env
APP_BASE_URL=https://ytacademy.uz
BOT_TOKEN=your_token
DATABASE_URL=your_db_url
OWNER_IDS=your_id
COURSE_PRICE=1100000
NODE_ENV=production
```

#### 9. Запустите бота
```bash
# Через PM2
pm2 start npm --name "ytguessbot" -- start
pm2 save

# Или напрямую
npm start
```

#### 10. Проверьте что бот запустился
```bash
pm2 logs ytguessbot --lines 20
```

Должны появиться логи запуска.

#### 11. Проверьте endpoint
```bash
curl -i http://127.0.0.1:3000/api/bot
```

Должно вернуть:
```json
HTTP/1.1 200 OK
...
{
  "status": "ok",
  "message": "Telegram Bot Webhook Endpoint",
  "timestamp": "..."
}
```

#### 12. Проверьте POST запрос
```bash
curl -i -X POST \
  -H 'Content-Type: application/json' \
  -d '{"update_id":1,"message":{"message_id":1,"date":1704297600,"chat":{"id":123456,"type":"private"},"from":{"id":123456,"first_name":"Test"},"text":"/start"}}' \
  http://127.0.0.1:3000/api/bot
```

Должно вернуть:
```json
HTTP/1.1 200 OK
...
{"ok":true}
```

#### 13. Переустановите webhook (ВАЖНО!)
```bash
node set-webhook.js https://ytacademy.uz/api/bot
```

Должно показать:
```
✅ Webhook успешно установлен!
📊 Информация о webhook:
URL: https://ytacademy.uz/api/bot
Ожидающих обновлений: 0
✅ Ошибок не обнаружено
```

#### 14. Проверьте webhook
```bash
node check-webhook.js
```

#### 15. Проверьте работу бота
Отправьте `/start` боту в Telegram.

Должно прийти приветственное сообщение.

---

## 🔍 Проверка логов

### Логи в реальном времени
```bash
pm2 logs ytguessbot --lines 50
```

### Последние ошибки
```bash
pm2 logs ytguessbot --err --lines 20
```

### Все логи
```bash
pm2 logs ytguessbot
```

---

## 🐛 Если всё ещё не работает

### Проблема 1: 405 Method Not Allowed

**Проверьте:**
```bash
# Убедитесь что файл src/app/api/bot/route.ts существует
ls -la src/app/api/bot/route.ts

# Проверьте содержимое
cat src/app/api/bot/route.ts
```

Должно быть:
```typescript
import { bot } from '@/lib/bot-handlers'  // ВАЖНО: bot-handlers, НЕ telegram!

export async function POST(req: NextRequest) {
  // ...
}
```

**Решение:**
```bash
# Удалите .next и пересоберите
rm -rf .next
npm run build
pm2 restart ytguessbot
```

---

### Проблема 2: Bot doesn't respond

**Проверьте логи:**
```bash
pm2 logs ytguessbot --lines 100
```

**Проверьте webhook:**
```bash
node check-webhook.js
```

Если есть ошибки, переустановите:
```bash
node set-webhook.js https://ytacademy.uz/api/bot
```

---

### Проблема 3: Cannot connect to database

**Проверьте подключение:**
```bash
psql "$DATABASE_URL"
```

**Проверьте переменную:**
```bash
echo $DATABASE_URL
grep DATABASE_URL .env
```

---

### Проблема 4: Module not found

**Переустановите зависимости:**
```bash
rm -rf node_modules
npm install
npm run build
pm2 restart ytguessbot
```

---

## 📊 Мониторинг

### Статус процессов
```bash
pm2 status
```

### Использование ресурсов
```bash
pm2 monit
```

### Информация о процессе
```bash
pm2 info ytguessbot
```

---

## 🔄 Быстрый перезапуск

Если нужно быстро перезапустить после изменений:

```bash
pm2 restart ytguessbot
```

Или с очисткой логов:

```bash
pm2 restart ytguessbot --update-env
pm2 flush ytguessbot
```

---

## ✅ Контрольный список

- [ ] Остановили старый процесс
- [ ] Загрузили новые файлы
- [ ] Удалили .next
- [ ] Пересобрали проект (`npm run build`)
- [ ] Проверили .env файл
- [ ] Запустили бота (`pm2 start`)
- [ ] Проверили endpoint GET
- [ ] Проверили endpoint POST
- [ ] Переустановили webhook
- [ ] Проверили webhook статус
- [ ] Отправили /start боту
- [ ] Получили ответ от бота

---

## 📞 Если ничего не помогло

1. Покажите логи:
```bash
pm2 logs ytguessbot --lines 100 --nostream > logs.txt
cat logs.txt
```

2. Проверьте порт:
```bash
netstat -tulpn | grep 3000
```

3. Проверьте файлы:
```bash
ls -la src/app/api/bot/
cat src/app/api/bot/route.ts
```

4. Проверьте build:
```bash
ls -la .next/server/app/api/bot/
```

---

**Удачи с деплоем!** 🚀
