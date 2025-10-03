# 🔧 Настройка переменных окружения

## 📋 Обязательные переменные

### 1. Telegram Bot Token
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Как получить:**
1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot` или `/token` для существующего бота
3. Скопируйте токен

---

### 2. База данных
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

**Формат:**
- `username` - имя пользователя PostgreSQL
- `password` - пароль
- `host` - адрес сервера (localhost или IP)
- `5432` - порт PostgreSQL (по умолчанию)
- `database_name` - имя базы данных

**Примеры:**

Локально:
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/telegram_course_bot
```

На сервере:
```env
DATABASE_URL=postgresql://dbuser:securepass123@192.168.1.100:5432/coursebot_db
```

---

### 3. Base URL приложения

```env
APP_BASE_URL=https://ytacademy.uz
```

⚠️ **ВАЖНО:**
- Без слэша `/` в конце!
- Только HTTPS для production
- Для локальной разработки: `http://localhost:3000`

**Используется для:**
- Генерации ссылок на mock оплату
- Webhook URL
- Обратных ссылок после оплаты

**Примеры:**

Production:
```env
APP_BASE_URL=https://ytacademy.uz
```

Development:
```env
APP_BASE_URL=http://localhost:3000
```

---

### 4. Администраторы

```env
OWNER_IDS=123456789
ADMIN_IDS=987654321,111222333
```

**Формат:**
- Только **числовые** Telegram ID (не username!)
- Через запятую без пробелов
- `OWNER_IDS` - полный доступ
- `ADMIN_IDS` - доступ к админ-панели

**Как получить свой ID:**
1. Напишите [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте любое сообщение
3. Скопируйте `Id` из ответа

**Пример:**
```
Your user ID: 123456789
First name: John
Username: @john_doe
```

Используйте `123456789` (только цифры!)

---

### 5. Стоимость курса

```env
COURSE_PRICE=1100000
```

**Формат:** в тийинах (центах)
- 1 сум = 100 тийинов
- 11,000 сум = 1,100,000 тийинов

**Примеры:**
- 10,000 сум = `COURSE_PRICE=1000000`
- 50,000 сум = `COURSE_PRICE=5000000`
- 100,000 сум = `COURSE_PRICE=10000000`

---

## 🔐 Опциональные переменные

### Payme Integration (для production)

```env
PAYME_X_AUTH=your_payme_merchant_id:your_payme_secret
PAYME_RETURN_URL=https://ytacademy.uz/payme/return
PAYME_WEBHOOK_SECRET=your_webhook_secret
PAYME_ENDPOINT_PROD=https://checkout.paycom.uz/api
```

⚠️ Пока используется **mock режим**, эти переменные не нужны.

---

### Окружение

```env
NODE_ENV=production
```

**Значения:**
- `development` - локальная разработка
- `production` - боевой сервер

---

### Порт

```env
PORT=3000
```

По умолчанию `3000`. Измените если порт занят.

---

## 📝 Полный пример .env файла

### Production (сервер)

```env
# Telegram Bot
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Database
DATABASE_URL=postgresql://coursebot:MySecurePass123@localhost:5432/telegram_course_bot

# Application
APP_BASE_URL=https://ytacademy.uz
NODE_ENV=production

# Admins (получите ID у @userinfobot)
OWNER_IDS=123456789
ADMIN_IDS=987654321,111222333,444555666

# Course
COURSE_PRICE=1100000

# Port
PORT=3000
```

### Development (локально)

```env
# Telegram Bot
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_course_bot

# Application
APP_BASE_URL=http://localhost:3000
NODE_ENV=development

# Admins
OWNER_IDS=123456789
ADMIN_IDS=987654321

# Course
COURSE_PRICE=1100000

# Port
PORT=3000
```

---

## ✅ Проверка настроек

### 1. Проверьте формат

```bash
# Должны быть без пробелов вокруг =
BOT_TOKEN=token123     # ✅ Правильно
BOT_TOKEN = token123   # ❌ Неправильно

# Без кавычек
APP_BASE_URL=https://example.com    # ✅ Правильно
APP_BASE_URL="https://example.com"  # ❌ Неправильно
```

### 2. Проверьте что файл называется `.env`

```bash
ls -la .env
```

Не `.env.example`, не `env`, а именно `.env`!

### 3. Загрузите переменные

```bash
# Проверка загрузки
node -e "require('dotenv').config(); console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? '✅ Загружен' : '❌ Не найден')"
```

### 4. Проверьте права доступа

```bash
# Только владелец должен читать файл
chmod 600 .env
```

---

## 🔍 Решение проблем

### "BOT_TOKEN не найден"

**Причина:** Файл `.env` не найден или не загружен

**Решение:**
1. Проверьте что файл называется `.env` (не `.env.txt`)
2. Файл должен быть в корне проекта
3. Перезапустите приложение

```bash
ls -la .env
cat .env | grep BOT_TOKEN
```

---

### "Cannot connect to database"

**Причина:** Неправильный DATABASE_URL

**Решение:**
1. Проверьте формат URL
2. Убедитесь что PostgreSQL запущен
3. Проверьте логин/пароль

```bash
# Проверка подключения
psql "postgresql://username:password@localhost:5432/database_name"
```

---

### "Admin panel not showing"

**Причина:** Неправильные OWNER_IDS или ADMIN_IDS

**Решение:**
1. Используйте **только цифры** (не @username)
2. Без пробелов между ID
3. Получите ID у @userinfobot

```env
# ❌ Неправильно
OWNER_IDS=@john_doe
ADMIN_IDS=john, mary

# ✅ Правильно
OWNER_IDS=123456789
ADMIN_IDS=987654321,111222333
```

---

### "Mock payment link doesn't work"

**Причина:** Неправильный APP_BASE_URL

**Решение:**

Production:
```env
APP_BASE_URL=https://ytacademy.uz  # без / в конце
```

Development:
```env
APP_BASE_URL=http://localhost:3000  # без / в конце
```

Проверьте генерируемую ссылку:
```
https://ytacademy.uz/payment/mock?receipt_id=...  # ✅ Правильно
https://ytacademy.uz//payment/mock?receipt_id=... # ❌ Двойной слэш
```

---

## 🔒 Безопасность

### 1. Не коммитьте .env в git

Добавьте в `.gitignore`:
```
.env
.env.local
.env.production
```

### 2. Защитите файл

```bash
chmod 600 .env
```

### 3. Используйте разные токены

- Development - тестовый бот
- Production - боевой бот

### 4. Регулярно меняйте пароли

Особенно:
- DATABASE_URL пароль
- PAYME_WEBHOOK_SECRET

---

**Версия:** 1.0.0  
**Дата:** 2025-01-10
