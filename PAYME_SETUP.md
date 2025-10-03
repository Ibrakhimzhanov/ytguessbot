# 🔐 Настройка Payme - Credentials от Игоря

## 📋 Полученные данные от Payme:

```
ID (Merchant ID): 68dfaed6eb0789cb092fb03e
Test KEY: GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
Production KEY: 34Gsv3pFKZsGXYe2oyAyuzq%b0dxz?UGsg&e
Логин: Paycom
```

---

## 🔧 Шаг 1: Добавить в .env на сервере

### Для ТЕСТОВОГО режима:

```bash
# На сервере
ssh root@91.184.247.219
cd /srv/postgres/ytguessbot
nano .env
```

Добавь/измени эти строки:

```env
# Payme Integration (TEST MODE)
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
PAYME_MERCHANT_ID=68dfaed6eb0789cb092fb03e
PAYME_ENDPOINT=https://checkout.test.paycom.uz/api
```

**Сохрани:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

### Для PRODUCTION режима (когда протестируете):

```env
# Payme Integration (PRODUCTION MODE)
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:34Gsv3pFKZsGXYe2oyAyuzq%b0dxz?UGsg&e
PAYME_MERCHANT_ID=68dfaed6eb0789cb092fb03e
PAYME_ENDPOINT=https://checkout.paycom.uz/api
```

---

## 🔒 Как работает авторизация:

### Формат PAYME_X_AUTH:

```
MERCHANT_ID:SECRET_KEY
```

Пример:
```
68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
```

### Как Payme будет авторизоваться:

Payme отправит HTTP заголовок:
```
Authorization: Basic <base64(Paycom:SECRET_KEY)>
```

Где:
- **Login:** `Paycom` (всегда)
- **Password:** `GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM` (ваш SECRET_KEY)

---

## ✅ Шаг 2: Проверить код авторизации

Код **УЖЕ ГОТОВ** в `src/app/api/payme/billing/route.ts`:

```typescript
// Проверяем базовую авторизацию от Payme
const expectedAuth = Buffer.from(
  `Paycom:${process.env.PAYME_X_AUTH?.split(':')[1] || ''}`
).toString('base64')

if (authHeader !== `Basic ${expectedAuth}`) {
  return NextResponse.json({
    error: {
      code: -32504,
      message: 'Invalid authorization'
    }
  }, { status: 401 })
}
```

**Это правильно!** ✅

---

## 🧪 Шаг 3: Тестирование

### 1. Добавь credentials в .env:

```bash
nano .env
# Добавь PAYME_X_AUTH (см. выше)
# Сохрани
```

### 2. Перезапусти бота:

```bash
pm2 restart ytguessbot
```

### 3. Проверь что бот запустился:

```bash
pm2 logs ytguessbot --lines 20
```

### 4. Тест авторизации от Payme:

```bash
# Создай test credentials
SECRET_KEY="GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM"
AUTH_HEADER=$(echo -n "Paycom:$SECRET_KEY" | base64)

# Проверь endpoint
curl -X POST https://ytacademy.uz/api/payme/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $AUTH_HEADER" \
  -d '{
    "id": 1,
    "method": "CheckPerformTransaction",
    "params": {
      "account": { "order_id": "1001" },
      "amount": 1100000
    }
  }'
```

**Ожидаемый результат:**
```json
{
  "id": 1,
  "result": {
    "allow": true
  }
}
```

Или (если заказа нет):
```json
{
  "id": 1,
  "error": {
    "code": -31050,
    "message": "Order not found"
  }
}
```

**Оба варианта OK!** Главное что авторизация прошла.

---

## 🎯 Шаг 4: Создай тестовый заказ

### Через бота:

1. Отправь `/start` боту
2. Нажми "📚 Купить курс"
3. Поделись номером
4. Нажми "💳 Оплатить через Payme"
5. Запомни номер заказа (например: `#1001`)

### Или через базу данных:

```bash
psql "$DATABASE_URL"
```

```sql
-- Создай тестовый заказ
INSERT INTO payments (
  id, 
  "userId", 
  "orderNumber", 
  amount, 
  currency, 
  status, 
  "createdAt"
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  1001,
  1100000,
  'UZS',
  'PENDING',
  NOW()
);

-- Проверь
SELECT "orderNumber", amount, status FROM payments WHERE "orderNumber" = 1001;
```

---

## 🔄 Шаг 5: Попроси Payme протестировать

### Отправь Игорю:

```
Привет Игорь!

Credentials добавлены в .env, бот перезапущен.

Endpoint готов к тестированию:
https://ytacademy.uz/api/payme/billing

Account параметр: order_id (целое число)

Тестовые номера заказов: 1001, 1002, 1003
Сумма: 1100000 тийинов

Можете начинать тестирование.
```

---

## 📊 Логи для отладки

### Смотреть логи в реальном времени:

```bash
pm2 logs ytguessbot
```

Должны появиться:
```
🔵 Payme Billing Request received
📋 Payme Request: { "method": "CheckPerformTransaction", ... }
🟢 Payme Response: { "result": { "allow": true } }
```

---

## ⚠️ Важные моменты:

### 1. Test KEY vs Production KEY

**Test KEY** - для тестирования:
```
GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
```
- Используй на этапе разработки
- Реальные деньги не списываются
- Endpoint: `https://checkout.test.paycom.uz`

**Production KEY** - для боевого режима:
```
34Gsv3pFKZsGXYe2oyAyuzq%b0dxz?UGsg&e
```
- Используй после успешного тестирования
- Списываются реальные деньги
- Endpoint: `https://checkout.paycom.uz`

### 2. Специальные символы в ключах

Ключи содержат спецсимволы (`#`, `%`, `?`, `&`, `!`).

В `.env` файле это **безопасно**, НЕ НУЖНО экранировать!

**Правильно:**
```env
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
```

**Неправильно:**
```env
PAYME_X_AUTH="68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM"
```

### 3. Безопасность

- ✅ НЕ коммить `.env` в git
- ✅ НЕ показывать ключи в логах
- ✅ НЕ делиться ключами публично
- ✅ Использовать `chmod 600 .env`

---

## 🚀 Быстрый старт (копируй на сервер)

```bash
# 1. Добавь credentials
cd /srv/postgres/ytguessbot
cat >> .env << 'EOF'

# Payme Integration (TEST MODE)
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
PAYME_MERCHANT_ID=68dfaed6eb0789cb092fb03e
PAYME_ENDPOINT=https://checkout.test.paycom.uz/api
EOF

# 2. Перезапусти
pm2 restart ytguessbot

# 3. Проверь логи
pm2 logs ytguessbot --lines 20

# 4. Тест (опционально)
SECRET_KEY="GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM"
AUTH_HEADER=$(echo -n "Paycom:$SECRET_KEY" | base64)

curl -X POST https://ytacademy.uz/api/payme/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $AUTH_HEADER" \
  -d '{"id":1,"method":"CheckPerformTransaction","params":{"account":{"order_id":"1001"},"amount":1100000}}'

echo ""
echo "✅ Если видишь JSON ответ - всё работает!"
```

---

## 📚 Документация Payme:

https://developer.help.paycom.uz/

Разделы:
- **Merchant API** - как работает ваш endpoint
- **Checkout API** - как создавать платежи
- **Testing** - как тестировать интеграцию

---

## ✅ Чек-лист готовности:

- [ ] `PAYME_X_AUTH` добавлен в `.env`
- [ ] Бот перезапущен (`pm2 restart ytguessbot`)
- [ ] Логи показывают что бот работает
- [ ] Endpoint отвечает на запросы
- [ ] Payme уведомлен что можно тестировать
- [ ] Создан хотя бы 1 тестовый заказ

---

**Готово к интеграции!** 🎉

После успешного тестирования с Test KEY - переключайтесь на Production KEY!
