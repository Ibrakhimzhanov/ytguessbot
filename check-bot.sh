#!/bin/bash

echo "🔍 Проверка состояния бота..."
echo ""

echo "1️⃣ Статус PM2:"
pm2 status

echo ""
echo "2️⃣ Процессы Node.js:"
ps aux | grep node | grep -v grep

echo ""
echo "3️⃣ Проверка .env файла:"
if [ -f .env ]; then
    echo "✅ Файл .env существует"
    echo "Первые строки:"
    head -n 5 .env
else
    echo "❌ Файл .env НЕ НАЙДЕН!"
fi

echo ""
echo "4️⃣ Последние 30 строк логов PM2:"
pm2 logs ytguessbot --lines 30 --nostream

echo ""
echo "5️⃣ Проверка порта 3000:"
netstat -tulpn | grep 3000 || echo "❌ Порт 3000 не слушает"

echo ""
echo "6️⃣ Ошибки в логах PM2:"
pm2 logs ytguessbot --err --lines 20 --nostream
