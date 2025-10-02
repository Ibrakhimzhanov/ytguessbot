# Telegram Course Bot - Next.js

Telegram бот для продажи курсов, переписанный с Python на Next.js.

## Технологии

- **Next.js 14** - веб-фреймворк
- **TypeScript** - типизация
- **Prisma** - ORM для работы с базой данных
- **PostgreSQL** - база данных (запущена через Docker)
- **Telegraf** - библиотека для работы с Telegram Bot API

## Настройка

1. **База данных уже запущена через Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения**
   Обновите `.env` файл с вашими данными:
   ```env
   BOT_TOKEN=ваш_токен_бота
   PAYME_ID=ваш_payme_id
   PAYME_KEY=ваш_payme_key
   ```

4. **Примените миграции базы данных**
   ```bash
   npm run db:push
   ```

5. **Запустите проект**
   ```bash
   npm run dev
   ```

## Структура проекта

- `src/lib/prisma.ts` - настройка Prisma клиента
- `src/lib/telegram.ts` - настройка Telegram бота
- `src/lib/bot-handlers.ts` - обработчики команд бота
- `src/app/api/webhook/route.ts` - webhook для получения обновлений от Telegram
- `src/app/api/bot/route.ts` - API для проверки статуса бота
- `prisma/schema.prisma` - схема базы данных

## Возможности бота

- ✅ Регистрация пользователей
- ✅ Сбор контактной информации
- ✅ Интеграция с платежной системой Payme
- ✅ Административные команды
- ✅ Система статистики
- ✅ Поддержка лотереи (структура готова)

## API Endpoints

- `GET /api/bot` - статус бота и подключения к БД
- `POST /api/webhook` - webhook для получения обновлений от Telegram
- `GET /api/webhook` - запуск бота в режиме разработки

## Запуск в production

1. Настройте webhook в Telegram:
   ```bash
   curl -F "url=https://yourdomain.com/api/webhook" \
        https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
   ```

2. Запустите проект:
   ```bash
   npm run build
   npm run start
   ```
