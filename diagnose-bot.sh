#!/bin/bash

echo "🔍 ДИАГНОСТИКА БОТА"
echo "===================="
echo ""

echo "1️⃣ PM2 Статус:"
pm2 status ytguessbot
echo ""

echo "2️⃣ Последние 50 строк логов:"
pm2 logs ytguessbot --lines 50 --nostream
echo ""

echo "3️⃣ Только ошибки:"
pm2 logs ytguessbot --err --lines 30 --nostream
echo ""

echo "4️⃣ Проверка .env:"
if [ -f .env ]; then
    echo "✅ .env существует"
    grep -E "^(BOT_TOKEN|PAYME_X_AUTH|COURSE_PRICE|DATABASE_URL)" .env | sed 's/=.*/=***/'
else
    echo "❌ .env НЕ НАЙДЕН!"
fi
echo ""

echo "5️⃣ Проверка базы данных:"
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";" 2>&1 | grep -q "COUNT"; then
    echo "✅ База данных доступна"
else
    echo "❌ Проблема с базой данных!"
fi
echo ""

echo "6️⃣ Проверка Telegram API:"
BOT_TOKEN=$(grep BOT_TOKEN .env | cut -d'=' -f2)
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | head -c 200
echo ""
echo ""

echo "7️⃣ Проверка webhook (должен быть пустой для polling):"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | grep -o '"url":"[^"]*"'
echo ""
echo ""

echo "8️⃣ Проверка процессов Node.js:"
ps aux | grep node | grep -v grep | head -5
echo ""

echo "✅ ДИАГНОСТИКА ЗАВЕРШЕНА"
