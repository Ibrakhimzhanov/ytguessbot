# 🧪 Создание тестовых заказов для Payme

## 📋 Что нужно сделать:

1. Создать 2 тестовых заказа в базе данных
2. Отправить их данные Игорю из Payme для тестирования

---

## 🚀 Создание заказов на сервере:

### Вариант 1: Через SQL (быстро)

```bash
# 1. Подключись к серверу
ssh root@91.184.247.219

# 2. Подключись к базе данных
cd /srv/postgres/ytguessbot
psql "$DATABASE_URL"
```

Выполни SQL команды:

```sql
-- Заказ 1
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
  2001,
  1100000,
  'UZS',
  'PENDING',
  NOW()
);

-- Заказ 2
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
  2002,
  1100000,
  'UZS',
  'PENDING',
  NOW()
);

-- Проверь что создались
SELECT "orderNumber", amount, currency, status, "createdAt" 
FROM payments 
WHERE "orderNumber" IN (2001, 2002);
```

Должно показать:
```
 orderNumber | amount  | currency | status  |         createdAt          
-------------+---------+----------+---------+---------------------------
        2001 | 1100000 | UZS      | PENDING | 2025-01-10 15:30:45+05
        2002 | 1100000 | UZS      | PENDING | 2025-01-10 15:30:45+05
```

**Готово!** Выйди из psql: `\q`

---

### Вариант 2: Через бота (если нет доступа к БД)

```bash
# 1. Запусти бота
# 2. Отправь /start
# 3. Нажми "📚 Купить курс"
# 4. Поделись номером
# 5. Нажми "💳 Оплатить через Payme"
# 6. Запомни номер заказа
# 7. Повтори для второго заказа
```

---

## 📧 Что отправить Игорю:

### После создания заказов через SQL:

```
Привет Игорь!

Тестовые заказы созданы:

Заказ 1:
order_id: 2001
amount: 1100000 (в тийинах)

Заказ 2:
order_id: 2002
amount: 1100000 (в тийинах)

Endpoint: https://ytacademy.uz/api/payme/billing
Account параметр: order_id (integer)

Тестовый ключ прописан в заголовках авторизации.
Готовы к тестированию!
```

---

### Если создавал через бота:

Узнай номера заказов:

```bash
psql "$DATABASE_URL"
```

```sql
SELECT "orderNumber", amount 
FROM payments 
ORDER BY "createdAt" DESC 
LIMIT 2;
```

Потом отправь данные Игорю (см. выше).

---

## 🧪 Проверка перед отправкой Игорю:

### 1. Убедись что credentials добавлены:

```bash
cat .env | grep PAYME_X_AUTH
```

Должно быть:
```
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
```

### 2. Убедись что бот запущен:

```bash
pm2 status ytguessbot
```

Должно быть `online`.

### 3. Проверь endpoint:

```bash
curl -i https://ytacademy.uz/api/payme/billing
```

Должен вернуть `401` (это нормально - требуется авторизация от Payme).

### 4. Проверь что заказы существуют:

```bash
psql "$DATABASE_URL" -c "SELECT \"orderNumber\", amount, status FROM payments WHERE \"orderNumber\" IN (2001, 2002);"
```

Должно показать оба заказа.

---

## ✅ Чек-лист:

- [ ] Credentials добавлены в `.env`
- [ ] Бот перезапущен и работает
- [ ] Endpoint доступен (возвращает 401)
- [ ] Создано 2 тестовых заказа (2001, 2002)
- [ ] Проверены order_id и amount
- [ ] Данные отправлены Игорю

---

## 🔄 Что будет дальше:

1. **Игорь получит данные**
2. **Payme отправит запросы:**
   - `CheckPerformTransaction` для заказа 2001
   - `CheckPerformTransaction` для заказа 2002
3. **Ваш сервер ответит:** `{"result": {"allow": true}}`
4. **Игорь протестирует:**
   - Создание транзакции
   - Подтверждение оплаты
   - Отмену транзакции
5. **Результат:** Интеграция работает! ✅

---

## 📊 Что смотреть в логах:

```bash
pm2 logs ytguessbot --lines 50
```

Должны появиться:
```
🔵 Payme Billing Request received
📋 Payme Request: {
  "method": "CheckPerformTransaction",
  "params": {
    "account": { "order_id": "2001" },
    "amount": 1100000
  }
}
🟢 Payme Response: {
  "result": { "allow": true }
}
```

---

## 🚨 Если что-то не так:

### Ошибка: "Order not found"
```bash
# Проверь что заказы существуют
psql "$DATABASE_URL" -c "SELECT * FROM payments WHERE \"orderNumber\" IN (2001, 2002);"
```

### Ошибка: "Invalid authorization"
```bash
# Проверь PAYME_X_AUTH
cat .env | grep PAYME_X_AUTH

# Должно быть без кавычек:
PAYME_X_AUTH=68dfaed6eb0789cb092fb03e:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM
```

### Ошибка: "Cannot connect to database"
```bash
# Проверь DATABASE_URL
cat .env | grep DATABASE_URL

# Тест подключения
psql "$DATABASE_URL" -c "SELECT 1;"
```

---

**Создавай заказы и отправляй данные Игорю!** 🚀
