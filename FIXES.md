# Исправления проблем с админкой и Payme

## Что было исправлено:

### 1. Проблема с PAYME_IS_TEST
**Проблема:** Код игнорировал переменную `PAYME_IS_TEST` и полагался только на `NODE_ENV`, из-за чего даже с `PAYME_IS_TEST=false` использовался тестовый endpoint.

**Исправление:** 
- Обновлена функция `createPaymeService()` в `src/lib/payme/payme-service.ts`
- Теперь `PAYME_IS_TEST` имеет приоритет над `NODE_ENV`
- Добавлено логирование для отладки режима Payme

### 2. Несоответствие текстов кнопок админки
**Проблема:** В разных местах использовались разные тексты для одних и тех же кнопок (русские/узбекские).

**Исправление:**
- Унифицированы тексты кнопок в `src/lib/admin/admin-handlers.ts` (теперь на узбекском)
- Исправлены обработчики в `src/lib/bot-handlers.ts`
- Добавлена поддержка альтернативных названий кнопок

### 3. Обновлён .env.example
**Изменения:**
- Удалены устаревшие переменные (`PAYME_ENDPOINT_TEST`, `PAYME_ENDPOINT_PROD`, `PAYME_WEBHOOK_SECRET`, `PAYME_RETURN_URL`)
- Добавлены новые необходимые переменные:
  - `PAYME_MERCHANT_ID`
  - `PAYME_IS_TEST`
  - `LOTTERY_ADMIN`
- Добавлены подробные комментарии

## Для деплоя на production сервер:

### Используйте файл `.env.production`:

```bash
# Bot Configuration
BOT_TOKEN=8318599414:AAFbh3aKd1NxY8cLpLONosP9p0suBXTPo0s

# Admin Configuration
ADMIN_IDS=657967394,211056631
LOTTERY_ADMIN=ibrakhimzhanovit
OWNER_IDS=657967394

# Base URL
APP_BASE_URL=https://ytacademy.uz

# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/telegram_course_bot?schema=public

# Payment Configuration (Payme)
PAYME_MERCHANT_ID=68dfaed6eb0789cb092fb03e
PAYME_X_AUTH='Paycom:34Gsv3pFKZsGXYe2oyAyuzq%b0dxz?UGsg&e'
PAYME_IS_TEST=false

# Course Configuration
COURSE_PRICE=250000000

# Environment
NODE_ENV=production
```

### Важно:

1. **PAYME_IS_TEST=false** - для production режима
2. **NODE_ENV=production** - для production сборки Next.js
3. **PAYME_X_AUTH** - формат всегда `Paycom:YOUR_KEY` (логин всегда "Paycom")

## Проверка работы:

### Локально (development):
```bash
# В .env установите:
NODE_ENV=development
PAYME_IS_TEST=true  # для тестового режима Payme
```

### На сервере (production):
```bash
# Скопируйте .env.production в .env:
cp .env.production .env

# Или создайте симлинк:
ln -sf .env.production .env
```

### Тестирование админки:

1. Запустите бота: `npm run bot`
2. Отправьте команду `/start` от админа (ID в OWNER_IDS или ADMIN_IDS)
3. Должна появиться кнопка "🔧 Admin panel"
4. Нажмите на неё - должна открыться админ-панель с кнопками:
   - 🗂 Ishtirokchilarni eksport qilish
   - 📊 Statistika
   - 🔙 Asosiy menyuga qaytish

### Тестирование Payme:

1. В логах должно быть: `🔧 Payme Service режим: PRODUCTION`
2. При создании платежа URL должен вести на `checkout.paycom.uz` (не `checkout.test.paycom.uz`)

## Если что-то не работает:

1. Проверьте логи при запуске:
   - `🔧 Payme Service режим: ...`
   - `PAYME_IS_TEST: ...`
   - `NODE_ENV: ...`

2. Убедитесь что переменные загружены:
   ```bash
   node -e "require('dotenv').config(); console.log('PAYME_IS_TEST:', process.env.PAYME_IS_TEST); console.log('NODE_ENV:', process.env.NODE_ENV)"
   ```

3. Проверьте что админские ID правильно парсятся:
   - В логах должно быть: `🔐 Админы загружены:` с количеством owners и admins
