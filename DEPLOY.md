# Деплой на Linux сервер

## Предварительные требования

На сервере должны быть установлены:
- Node.js 18+ (рекомендуется LTS версия)
- npm или yarn
- Git
- PM2 (для управления процессом)
- PostgreSQL (или использовать Docker)

## 1. Подключение к серверу

```bash
ssh user@your-server-ip
# или
ssh user@ytacademy.uz
```

## 2. Установка необходимых пакетов (если не установлены)

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверить версии
node --version
npm --version

# Установить PM2 глобально
sudo npm install -g pm2

# Установить PostgreSQL (если нужно)
sudo apt install -y postgresql postgresql-contrib
```

## 3. Клонирование репозитория

```bash
# Перейти в директорию для проектов
cd ~
# или
cd /var/www

# Клонировать репозиторий
git clone https://github.com/Ibrakhimzhanov/ytguessbot.git
cd ytguessbot

# Или если уже склонирован, обновить
git pull origin main
```

## 4. Установка зависимостей

```bash
# Установить зависимости
npm install

# Или с yarn
# yarn install
```

## 5. Настройка переменных окружения

```bash
# Создать .env файл из примера
cp .env.example .env

# Отредактировать .env файл
nano .env
```

Обязательные переменные в `.env`:
```env
# Bot Configuration
BOT_TOKEN=your_bot_token_here

# Admin Configuration
ADMIN_IDS=657967394,211056631
OWNER_IDS=657967394

# Base URL
APP_BASE_URL=https://ytacademy.uz

# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/telegram_course_bot?schema=public

# Payment Configuration (Payme)
PAYME_MERCHANT_ID=your_merchant_id
PAYME_X_AUTH='Paycom:your_key_here'
PAYME_IS_TEST=false

# Course Configuration
COURSE_PRICE=250000000

# Environment
NODE_ENV=production
```

Сохранить: `Ctrl+O`, `Enter`, выйти: `Ctrl+X`

## 6. Настройка PostgreSQL

```bash
# Войти в PostgreSQL
sudo -u postgres psql

# В консоли PostgreSQL выполнить:
```
```sql
-- Создать базу данных
CREATE DATABASE telegram_course_bot;

-- Создать пользователя (если нужно)
CREATE USER youruser WITH ENCRYPTED PASSWORD 'yourpassword';

-- Дать права
GRANT ALL PRIVILEGES ON DATABASE telegram_course_bot TO youruser;

-- Выйти
\q
```

## 7. Применение миграций Prisma

```bash
# Сгенерировать Prisma Client
npx prisma generate

# Применить миграции
npx prisma migrate deploy

# Проверить подключение
npx prisma db push
```

## 8. Сборка приложения

```bash
# Собрать Next.js приложение
npm run build
```

## 9. Запуск с помощью PM2

### Вариант 1: Простой запуск

```bash
# Запустить приложение
pm2 start npm --name "ytacademy-bot" -- start

# Или с указанием порта
pm2 start npm --name "ytacademy-bot" -- start -- -p 3000
```

### Вариант 2: С конфигурацией (рекомендуется)

Создать файл `ecosystem.config.js` в корне проекта:

```javascript
module.exports = {
  apps: [{
    name: 'ytacademy-bot',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/ytguessbot',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

Затем запустить:
```bash
# Создать директорию для логов
mkdir -p logs

# Запустить с конфигурацией
pm2 start ecosystem.config.js

# Сохранить конфигурацию PM2
pm2 save

# Настроить автозапуск при перезагрузке сервера
pm2 startup
# Выполнить команду, которую покажет PM2
```

## 10. Управление процессом

```bash
# Посмотреть статус
pm2 status

# Посмотреть логи
pm2 logs ytacademy-bot

# Перезапустить
pm2 restart ytacademy-bot

# Остановить
pm2 stop ytacademy-bot

# Удалить из PM2
pm2 delete ytacademy-bot

# Мониторинг в реальном времени
pm2 monit
```

## 11. Настройка Nginx (если нужен reverse proxy)

```bash
# Установить Nginx
sudo apt install -y nginx

# Создать конфигурацию
sudo nano /etc/nginx/sites-available/ytacademy
```

Содержимое конфигурации:
```nginx
server {
    listen 80;
    server_name ytacademy.uz www.ytacademy.uz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Включить конфигурацию
sudo ln -s /etc/nginx/sites-available/ytacademy /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

## 12. Настройка SSL с Let's Encrypt (для HTTPS)

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d ytacademy.uz -d www.ytacademy.uz

# Автообновление сертификата (уже настроено автоматически)
sudo certbot renew --dry-run
```

## 13. Обновление приложения

Когда есть новые изменения:

```bash
# Перейти в директорию проекта
cd /path/to/ytguessbot

# Получить изменения
git pull origin main

# Установить новые зависимости (если есть)
npm install

# Применить миграции (если есть)
npx prisma migrate deploy
npx prisma generate

# Пересобрать приложение
npm run build

# Перезапустить PM2
pm2 restart ytacademy-bot
```

Или создать скрипт для автоматического обновления:

```bash
# Создать скрипт
nano deploy.sh
```

Содержимое `deploy.sh`:
```bash
#!/bin/bash
echo "🚀 Deploying ytacademy-bot..."

# Переход в директорию
cd /path/to/ytguessbot

# Получение изменений
echo "📥 Pulling latest changes..."
git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm install

# Применение миграций
echo "🗄️ Running migrations..."
npx prisma migrate deploy
npx prisma generate

# Сборка
echo "🔨 Building application..."
npm run build

# Перезапуск
echo "🔄 Restarting application..."
pm2 restart ytacademy-bot

echo "✅ Deployment complete!"
pm2 status
```

```bash
# Сделать скрипт исполняемым
chmod +x deploy.sh

# Использовать
./deploy.sh
```

## 14. Мониторинг и отладка

```bash
# Посмотреть логи в реальном времени
pm2 logs ytacademy-bot --lines 100

# Только ошибки
pm2 logs ytacademy-bot --err

# Проверить использование ресурсов
pm2 monit

# Информация о процессе
pm2 show ytacademy-bot

# Проверить что приложение работает
curl http://localhost:3000

# Проверить webhook Payme
curl -X POST http://localhost:3000/api/payme/billing \
  -H "Content-Type: application/json" \
  -d '{"id":1,"method":"CheckPerformTransaction","params":{}}'
```

## 15. Настройка Firewall

```bash
# Установить UFW
sudo apt install -y ufw

# Разрешить SSH
sudo ufw allow OpenSSH

# Разрешить HTTP и HTTPS
sudo ufw allow 'Nginx Full'

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status
```

## Проблемы и решения

### Если порт 3000 занят:
```bash
# Найти процесс на порту 3000
sudo lsof -i :3000

# Убить процесс
sudo kill -9 <PID>
```

### Если база данных не подключается:
```bash
# Проверить что PostgreSQL запущен
sudo systemctl status postgresql

# Запустить PostgreSQL
sudo systemctl start postgresql

# Проверить подключение
psql -U youruser -d telegram_course_bot -h localhost
```

### Просмотр логов Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Полезные команды для проверки

```bash
# Проверить что все запущено
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Проверить порты
sudo netstat -tlnp | grep -E '3000|80|443|5432'

# Проверить диск
df -h

# Проверить память
free -h
```

---

После выполнения всех шагов ваш бот будет доступен по адресу `https://ytacademy.uz` и будет автоматически перезапускаться при падении или перезагрузке сервера.
