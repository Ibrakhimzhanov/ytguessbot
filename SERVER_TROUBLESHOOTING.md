# 🔧 Устранение проблем на сервере после git pull

## 🔴 Проблема: Бот не отвечает после git pull

**Причина:** Скорее всего файл `.env` не попал на сервер, потому что он в `.gitignore`!

---

## ✅ Пошаговое решение:

### 1️⃣ Подключитесь к серверу:

```bash
ssh root@91.184.247.219
cd /srv/postgres/ytguessbot
```

---

### 2️⃣ Проверьте статус PM2:

```bash
pm2 status
```

**Ожидаемый вывод:**
```
┌─────┬────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name       │ status  │ restart │ uptime  │ cpu      │
├─────┼────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ ytguessbot │ online  │ 0       │ 5m      │ 0.1%     │
└─────┴────────────┴─────────┴─────────┴─────────┴──────────┘
```

**Если status = "errored"** - переходите к шагу 3!

---

### 3️⃣ Посмотрите логи ошибок:

```bash
pm2 logs ytguessbot --lines 50
```

**Типичные ошибки:**

#### ❌ Ошибка 1: "PAYME_X_AUTH is undefined"
```
💰 COURSE_PRICE: NaN
🏪 PAYME_MERCHANT_ID: 
```
**Причина:** Нет файла `.env`!

#### ❌ Ошибка 2: "Cannot find module"
```
Error: Cannot find module './payme/payme-utils'
```
**Причина:** Не установлены зависимости или не собран проект!

---

### 4️⃣ Проверьте наличие файла .env:

```bash
ls -la .env
```

**Если выдает "No such file"** - файл `.env` отсутствует!

---

### 5️⃣ СОЗДАЙТЕ файл .env на сервере:

```bash
nano .env
```

**Вставьте следующее содержимое:**

```env
# Bot Configuration
BOT_TOKEN=8379068284:AAGm8CkiU7PqcHrURr5-MKpg-XiMfRvur1s

# Admin Configuration
ADMIN_IDS=657967394, 211056631
LOTTERY_ADMIN=ibrakhimzhanovit
OWNER_IDS=657967394

# Base URL
APP_BASE_URL=https://ytacademy.uz

# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/telegram_course_bot?schema=public

# Payment Configuration (Payme)
# TEST режим:
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM

# PRODUCTION режим (когда протестируете, раскомментируйте):
# PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:34Gsv3pFKZsGXYe2oyAyuzq%b0dxz?UGsg&e

# Course Configuration
COURSE_PRICE=250000000

# Environment
NODE_ENV=production
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 6️⃣ Установите зависимости (если нужно):

```bash
npm install
```

---

### 7️⃣ Сгенерируйте Prisma клиент:

```bash
npm run db:generate
```

---

### 8️⃣ Соберите проект:

```bash
npm run build
```

**В логах должно появиться:**
```
💰 COURSE_PRICE: 250000000 тийинов = 2 500 000 сум
🏪 PAYME_MERCHANT_ID: 68dfaed6eb0789cb092fb03e
```

---

### 9️⃣ Перезапустите PM2:

```bash
pm2 restart ytguessbot
```

---

### 🔟 Проверьте логи:

```bash
pm2 logs ytguessbot --lines 20
```

**Должно появиться:**
```
🔐 Админы загружены:
👑 Owners: 1
🔧 Admins: 2
💰 COURSE_PRICE: 250000000 тийинов = 2 500 000 сум
🏪 PAYME_MERCHANT_ID: 68dfaed6eb0789cb092fb03e
🧪 IS_TEST_MODE: false
🤖 Запуск Telegram бота...
✅ Подключение установлено!
📋 Бот: YT Academy Quiz
🚀 Запуск режима polling...
```

**✅ Бот работает!**

---

## 🔍 Альтернативная проверка:

### Проверьте URL генерацию:

```bash
curl http://localhost:3000/api/test-payme-url
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "config": {
    "PAYME_MERCHANT_ID": "68dfaed6eb0789cb092fb03e",
    "COURSE_PRICE": 250000000
  }
}
```

---

## 🚨 Если всё ещё не работает:

### 1. Проверьте порты:

```bash
netstat -tulpn | grep node
```

### 2. Проверьте ошибки в логах:

```bash
pm2 logs ytguessbot --err --lines 100
```

### 3. Остановите и запустите заново:

```bash
pm2 delete ytguessbot
pm2 start npm --name ytguessbot -- run bot
pm2 save
```

---

## 📋 Быстрый чек-лист:

- [ ] Файл `.env` существует и содержит правильные данные
- [ ] `npm install` выполнен
- [ ] `npm run db:generate` выполнен
- [ ] `npm run build` успешен
- [ ] В логах видно `PAYME_MERCHANT_ID: 68dfaed6eb0789cb092fb03e`
- [ ] В логах видно `COURSE_PRICE: 250000000`
- [ ] PM2 статус = "online"
- [ ] Логи не содержат ошибок

---

## 🎯 Основная причина проблемы:

**`.env` файл НЕ ПОПАДАЕТ в git!**

Когда вы делаете `git pull`, файл `.env` не обновляется, потому что он в `.gitignore`.

**Решение:** Создать `.env` вручную на сервере (шаг 5 выше).

---

## ✅ После исправления:

Бот должен:
1. ✅ Отвечать на команды в Telegram
2. ✅ Генерировать правильные Payme URL
3. ✅ Показывать цену 2,500,000 сум
4. ✅ Сохранять контакты без ошибок

**Готово!** 🚀
