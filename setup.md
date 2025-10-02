# Настройка окружения для Telegram Course Bot

## 1. Установка зависимостей

```bash
npm install
```

## 2. Настройка переменных окружения

1. Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```

2. Заполните необходимые переменные в `.env`:

### 🤖 Telegram Bot
- Создайте бота через [@BotFather](https://t.me/BotFather)
- Получите токен и вставьте в `BOT_TOKEN`

### 👨‍💼 Админы
- Получите свой Telegram ID через [@userinfobot](https://t.me/userinfobot)
- Вставьте ID в `ADMIN_IDS` (через запятую)

### 🗄️ База данных
- Установите PostgreSQL
- Создайте базу данных `telegram_course_bot`
- Обновите `DATABASE_URL`

### 💳 Payme (на потом)
- Зарегистрируйтесь в Payme Business
- Получите тестовые ключи

## 3. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций
npm run db:push
```

## 4. Запуск проекта

### Development режим (бот + веб):
```bash
npm run dev
```

### Только бот (long polling):
```bash
npm run bot
```

## 5. Проверка работоспособности

1. Откройте браузер: http://localhost:3000/api/bot
2. Должны увидеть: `{"status": "Bot is running", "database": "Connected"}`
3. Напишите боту `/start` в Telegram

## Команды для тестирования:
- `/start` - начало работы
- `/buy` - покупка курса  
- `/status` - проверка статуса
- `/admin_stats` - статистика (только для админов)
