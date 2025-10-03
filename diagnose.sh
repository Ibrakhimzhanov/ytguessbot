#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 ДИАГНОСТИКА TELEGRAM БОТА"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Проверка процесса
echo "1️⃣ Проверка процесса Node.js..."
if pgrep -f "node.*3000" > /dev/null; then
    echo -e "${GREEN}✅ Процесс Node.js запущен${NC}"
    ps aux | grep -E "node.*3000|next" | grep -v grep
else
    echo -e "${RED}❌ Процесс Node.js НЕ запущен!${NC}"
    echo "Запустите: npm start или pm2 start"
fi
echo ""

# 2. Проверка порта
echo "2️⃣ Проверка порта 3000..."
if netstat -tuln | grep -q ":3000"; then
    echo -e "${GREEN}✅ Порт 3000 слушается${NC}"
    netstat -tuln | grep ":3000"
else
    echo -e "${RED}❌ Порт 3000 НЕ открыт!${NC}"
fi
echo ""

# 3. Проверка локального endpoint
echo "3️⃣ Проверка локального endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/bot 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Endpoint отвечает (HTTP $HTTP_CODE)${NC}"
    curl -s http://127.0.0.1:3000/api/bot | jq . 2>/dev/null || curl -s http://127.0.0.1:3000/api/bot
else
    echo -e "${RED}❌ Endpoint НЕ отвечает (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# 4. Проверка POST запроса
echo "4️⃣ Проверка POST запроса..."
POST_RESPONSE=$(curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d '{"update_id":1,"message":{"message_id":1,"date":1704297600,"chat":{"id":123456,"type":"private"},"from":{"id":123456,"first_name":"Test"},"text":"/start"}}' \
  http://127.0.0.1:3000/api/bot 2>/dev/null)

if echo "$POST_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ POST запрос работает${NC}"
    echo "$POST_RESPONSE"
else
    echo -e "${RED}❌ POST запрос НЕ работает${NC}"
    echo "$POST_RESPONSE"
fi
echo ""

# 5. Проверка .env файла
echo "5️⃣ Проверка .env файла..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ Файл .env существует${NC}"
    
    if grep -q "BOT_TOKEN=" .env && ! grep -q "BOT_TOKEN=your_" .env; then
        echo -e "${GREEN}  ✓ BOT_TOKEN установлен${NC}"
    else
        echo -e "${RED}  ✗ BOT_TOKEN не установлен или пустой${NC}"
    fi
    
    if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=postgresql://user:password" .env; then
        echo -e "${GREEN}  ✓ DATABASE_URL установлен${NC}"
    else
        echo -e "${RED}  ✗ DATABASE_URL не установлен или пустой${NC}"
    fi
    
    if grep -q "APP_BASE_URL=" .env; then
        BASE_URL=$(grep "APP_BASE_URL=" .env | cut -d'=' -f2)
        echo -e "${GREEN}  ✓ APP_BASE_URL: $BASE_URL${NC}"
    else
        echo -e "${RED}  ✗ APP_BASE_URL не установлен${NC}"
    fi
else
    echo -e "${RED}❌ Файл .env НЕ найден!${NC}"
    echo "Создайте файл .env из .env.example"
fi
echo ""

# 6. Проверка DNS
echo "6️⃣ Проверка DNS для ytacademy.uz..."
DNS_IP=$(dig +short ytacademy.uz | tail -n1)
if [ ! -z "$DNS_IP" ]; then
    echo -e "${GREEN}✅ DNS резолвится: $DNS_IP${NC}"
    
    # Проверка соответствия IP
    SERVER_IP="91.184.247.219"
    if [ "$DNS_IP" = "$SERVER_IP" ]; then
        echo -e "${GREEN}  ✓ DNS указывает на правильный IP${NC}"
    else
        echo -e "${YELLOW}  ⚠ DNS указывает на $DNS_IP, но сервер на $SERVER_IP${NC}"
    fi
else
    echo -e "${RED}❌ DNS НЕ резолвится${NC}"
fi
echo ""

# 7. Проверка внешнего endpoint
echo "7️⃣ Проверка внешнего endpoint..."
EXTERNAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ytacademy.uz/api/bot 2>/dev/null)
if [ "$EXTERNAL_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Внешний endpoint доступен (HTTP $EXTERNAL_CODE)${NC}"
else
    echo -e "${RED}❌ Внешний endpoint НЕ доступен (HTTP $EXTERNAL_CODE)${NC}"
    echo "Возможные причины:"
    echo "  - Nginx не настроен"
    echo "  - Порт не проброшен"
    echo "  - SSL сертификат не настроен"
fi
echo ""

# 8. Проверка webhook
echo "8️⃣ Проверка Telegram webhook..."
if [ -f .env ]; then
    BOT_TOKEN=$(grep "BOT_TOKEN=" .env | cut -d'=' -f2)
    if [ ! -z "$BOT_TOKEN" ] && [ "$BOT_TOKEN" != "your_telegram_bot_token_here" ]; then
        WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
        
        WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | jq -r '.result.url' 2>/dev/null)
        PENDING=$(echo "$WEBHOOK_INFO" | jq -r '.result.pending_update_count' 2>/dev/null)
        LAST_ERROR=$(echo "$WEBHOOK_INFO" | jq -r '.result.last_error_message' 2>/dev/null)
        
        if [ ! -z "$WEBHOOK_URL" ] && [ "$WEBHOOK_URL" != "null" ]; then
            echo -e "${GREEN}✅ Webhook установлен: $WEBHOOK_URL${NC}"
            
            if [ "$PENDING" != "0" ] && [ "$PENDING" != "null" ]; then
                echo -e "${YELLOW}  ⚠ Ожидающих обновлений: $PENDING${NC}"
            fi
            
            if [ ! -z "$LAST_ERROR" ] && [ "$LAST_ERROR" != "null" ]; then
                echo -e "${RED}  ✗ Последняя ошибка: $LAST_ERROR${NC}"
            fi
        else
            echo -e "${RED}❌ Webhook НЕ установлен!${NC}"
            echo "Выполните: node set-webhook.js https://ytacademy.uz/api/bot"
        fi
    else
        echo -e "${YELLOW}⚠ Не могу проверить webhook: BOT_TOKEN не найден${NC}"
    fi
else
    echo -e "${RED}❌ Файл .env не найден${NC}"
fi
echo ""

# 9. Проверка базы данных
echo "9️⃣ Проверка подключения к базе данных..."
if command -v psql &> /dev/null; then
    if [ -f .env ]; then
        DATABASE_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2)
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✅ Подключение к базе данных работает${NC}"
        else
            echo -e "${RED}❌ Не удается подключиться к базе данных${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ psql не установлен, пропускаем проверку БД${NC}"
fi
echo ""

# 10. Последние логи
echo "🔟 Последние логи (если PM2)..."
if command -v pm2 &> /dev/null; then
    pm2 logs --lines 10 --nostream 2>/dev/null || echo "PM2 не запущен или нет логов"
else
    echo -e "${YELLOW}⚠ PM2 не установлен${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ДИАГНОСТИКА ЗАВЕРШЕНА"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Рекомендации
echo "💡 РЕКОМЕНДАЦИИ:"
echo ""

if ! pgrep -f "node.*3000" > /dev/null; then
    echo "1. Запустите приложение:"
    echo "   pm2 start npm --name ytguessbot -- start"
    echo "   pm2 save"
    echo ""
fi

if [ "$HTTP_CODE" != "200" ]; then
    echo "2. Проверьте логи запуска:"
    echo "   pm2 logs ytguessbot"
    echo "   или"
    echo "   npm start"
    echo ""
fi

if [ "$EXTERNAL_CODE" != "200" ]; then
    echo "3. Настройте Nginx reverse proxy:"
    echo "   sudo nano /etc/nginx/sites-available/ytacademy"
    echo ""
fi

if [ -z "$WEBHOOK_URL" ] || [ "$WEBHOOK_URL" = "null" ]; then
    echo "4. Установите webhook:"
    echo "   node set-webhook.js https://ytacademy.uz/api/bot"
    echo ""
fi

echo "5. Проверьте файлы:"
echo "   ls -la src/app/api/bot/"
echo "   cat src/app/api/bot/route.ts"
echo ""
