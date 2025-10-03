#!/bin/bash

# Быстрый фикс для сервера после git pull

echo "🔧 Исправление бота на сервере..."
echo ""

# Проверяем .env
if [ ! -f .env ]; then
  echo "❌ Файл .env не найден! Создаём..."
  cat > .env << 'EOF'
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
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM

# Course Configuration
COURSE_PRICE=250000000

# Environment
NODE_ENV=production
EOF
  echo "✅ Файл .env создан!"
else
  echo "✅ Файл .env существует"
fi

echo ""
echo "📦 Установка зависимостей..."
npm install

echo ""
echo "🔨 Генерация Prisma клиента..."
npm run db:generate

echo ""
echo "🏗️ Сборка проекта..."
npm run build

echo ""
echo "🔄 Перезапуск PM2..."
pm2 restart ytguessbot

echo ""
echo "📋 Логи бота:"
pm2 logs ytguessbot --lines 20 --nostream

echo ""
echo "✅ Готово! Проверьте бота в Telegram"
