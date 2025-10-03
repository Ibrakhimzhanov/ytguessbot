# 🔗 Информация для интеграции с Payme

## 📍 Endpoint URL

```
https://ytacademy.uz/api/payme/billing
```

**Назначение:** Merchant API endpoint для обработки запросов от Payme Billing

---

## 🔑 Account параметр

```json
{
  "account": {
    "order_id": "1001"
  }
}
```

**Тип:** `order_id` (номер заказа)  
**Формат:** Целое число (integer)  
**Пример:** `1001`, `1002`, `1003` и т.д.

**Описание:** Уникальный номер заказа, который автоматически генерируется при создании платежа

---

## 🔒 Авторизация

**Метод:** Basic Authentication

**Формат заголовка:**
```
Authorization: Basic <base64(Paycom:password)>
```

Где `password` - это вторая часть из `PAYME_X_AUTH` переменной окружения.

**Пример из .env:**
```env
PAYME_X_AUTH=merchant_id:secret_key
```

Payme будет использовать `secret_key` для авторизации.

---

## 📋 Реализованные методы Merchant API

### 1. CheckPerformTransaction
**Проверка возможности создания транзакции**

**Request:**
```json
{
  "method": "CheckPerformTransaction",
  "params": {
    "account": {
      "order_id": "1001"
    },
    "amount": 1100000
  }
}
```

**Response (Success):**
```json
{
  "result": {
    "allow": true
  }
}
```

---

### 2. CreateTransaction
**Создание транзакции**

**Request:**
```json
{
  "method": "CreateTransaction",
  "params": {
    "id": "payme_transaction_id_12345",
    "time": 1704297600000,
    "account": {
      "order_id": "1001"
    },
    "amount": 1100000
  }
}
```

**Response:**
```json
{
  "result": {
    "create_time": 1704297600000,
    "transaction": "1001",
    "state": 1
  }
}
```

---

### 3. PerformTransaction
**Проведение транзакции (подтверждение оплаты)**

**Request:**
```json
{
  "method": "PerformTransaction",
  "params": {
    "id": "payme_transaction_id_12345"
  }
}
```

**Response:**
```json
{
  "result": {
    "perform_time": 1704297660000,
    "transaction": "1001",
    "state": 2
  }
}
```

---

### 4. CancelTransaction
**Отмена транзакции**

**Request:**
```json
{
  "method": "CancelTransaction",
  "params": {
    "id": "payme_transaction_id_12345",
    "reason": 1
  }
}
```

**Response:**
```json
{
  "result": {
    "cancel_time": 1704297720000,
    "transaction": "1001",
    "state": -2
  }
}
```

---

### 5. CheckTransaction
**Проверка состояния транзакции**

**Request:**
```json
{
  "method": "CheckTransaction",
  "params": {
    "id": "payme_transaction_id_12345"
  }
}
```

**Response:**
```json
{
  "result": {
    "create_time": 1704297600000,
    "perform_time": 1704297660000,
    "cancel_time": 0,
    "transaction": "1001",
    "state": 2,
    "reason": null
  }
}
```

---

### 6. GetStatement
**Получение выписки по транзакциям**

**Request:**
```json
{
  "method": "GetStatement",
  "params": {
    "from": 1704211200000,
    "to": 1704297600000
  }
}
```

**Response:**
```json
{
  "result": {
    "transactions": [
      {
        "id": "payme_transaction_id_12345",
        "time": 1704297600000,
        "amount": 1100000,
        "account": {
          "order_id": "1001",
          "user_id": "a1b2c3d4-..."
        },
        "create_time": 1704297600000,
        "perform_time": 1704297660000,
        "cancel_time": 0,
        "transaction": "1001",
        "state": 2,
        "reason": null
      }
    ]
  }
}
```

---

## 🎯 Состояния транзакции (state)

| State | Описание |
|-------|----------|
| `0` | Создана |
| `1` | Ожидает подтверждения (PENDING) |
| `2` | Успешно завершена (PAID) |
| `-1` | Отменена (ожидает отмены) |
| `-2` | Отменена (CANCELLED) |

---

## ⚠️ Коды ошибок

| Code | Message | Описание |
|------|---------|----------|
| `-31001` | Invalid amount | Неверная сумма платежа |
| `-31050` | Order not found | Заказ не найден |
| `-31051` | Order already paid | Заказ уже оплачен |
| `-31052` | Order cancelled | Заказ отменен |
| `-32400` | Invalid request | Неверный запрос |
| `-32504` | Authorization required | Требуется авторизация |
| `-32601` | Method not found | Метод не найден |

---

## 🔧 Настройка в Payme

### Шаг 1: Регистрация кассы

1. Войдите в личный кабинет Payme (merchant.payme.uz)
2. Перейдите в раздел "Кассы"
3. Нажмите "Создать кассу"

### Шаг 2: Заполните форму

**Основные параметры:**
- **Название:** IT Course Academy (или ваше)
- **Endpoint URL:** `https://ytacademy.uz/api/payme/billing`
- **Account параметр:** `order_id`
- **Тип параметра:** `integer` (целое число)
- **Обязательный:** Да

### Шаг 3: Настройте авторизацию

- **Метод:** Basic Authentication
- **Login:** Paycom
- **Password:** (будет сгенерирован Payme)

### Шаг 4: Получите credentials

После создания кассы Payme предоставит:
1. **Merchant ID** (например: `64a3f7c0e4b0d5b8a9c1234d`)
2. **Secret Key** (например: `Abc123Def456Ghi789`)

### Шаг 5: Добавьте в .env

```env
PAYME_X_AUTH=64a3f7c0e4b0d5b8a9c1234d:Abc123Def456Ghi789
PAYME_ENDPOINT_PROD=https://checkout.paycom.uz/api
```

### Шаг 6: Перезапустите бота

```bash
pm2 restart ytguessbot
```

---

## 🧪 Тестирование интеграции

### 1. Проверка endpoint

```bash
curl -i https://ytacademy.uz/api/payme/billing
```

Должно вернуть 401 (требуется авторизация)

### 2. Тест с авторизацией

```bash
curl -X POST https://ytacademy.uz/api/payme/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'Paycom:your_secret_key' | base64)" \
  -d '{
    "method": "CheckPerformTransaction",
    "params": {
      "account": {
        "order_id": "1001"
      },
      "amount": 1100000
    },
    "id": 1
  }'
```

### 3. Проверка через Payme Test Environment

Payme предоставит тестовую среду для проверки интеграции.

---

## 🎯 Что происходит при оплате

### Сценарий успешной оплаты:

```
1. Пользователь → Нажимает "Оплатить"
2. Бот → Создает Payment (status: PENDING, orderNumber: 1001)
3. Бот → Отправляет пользователя на Payme форму
4. Payme → CheckPerformTransaction (проверка заказа)
5. Бот → Возвращает { allow: true }
6. Пользователь → Вводит данные карты
7. Payme → CreateTransaction (создание транзакции)
8. Бот → Сохраняет paymeId, статус PENDING
9. Payme → PerformTransaction (подтверждение)
10. Бот → Обновляет status: PAID, isPaid: true
11. Пользователь → Получает доступ к курсу ✅
```

### Сценарий отмены:

```
1. Пользователь → Отменяет оплату
2. Payme → CancelTransaction
3. Бот → Обновляет status: CANCELLED
4. Пользователь → Может попробовать снова
```

---

## 📊 Логирование

Все запросы от Payme логируются:

```bash
# Смотреть логи
pm2 logs ytguessbot

# Пример лога
🔵 Payme Billing Request received
📋 Payme Request: {
  "method": "CheckPerformTransaction",
  "params": {
    "account": { "order_id": "1001" },
    "amount": 1100000
  }
}
🟢 Payme Response: {
  "result": { "allow": true }
}
```

---

## ✅ Чек-лист для Payme Support

Отправьте разработчикам Payme:

- ✅ **Endpoint URL:** `https://ytacademy.uz/api/payme/billing`
- ✅ **Account параметр:** `order_id` (integer)
- ✅ **Метод авторизации:** Basic Authentication
- ✅ **Протокол:** Merchant API v2
- ✅ **Все методы реализованы:** CheckPerform, Create, Perform, Cancel, Check, GetStatement
- ✅ **Тестовая среда:** Готовы к тестированию
- ✅ **HTTPS:** SSL сертификат установлен
- ✅ **Endpoint доступен:** 24/7

---

## 📧 Для отправки в Payme Support

```
Здравствуйте!

Мы готовы к интеграции Merchant API.

Endpoint URL: https://ytacademy.uz/api/payme/billing
Account параметр: order_id (integer, обязательный)

Все методы протокола реализованы:
- CheckPerformTransaction
- CreateTransaction
- PerformTransaction
- CancelTransaction
- CheckTransaction
- GetStatement

Endpoint доступен и готов к тестированию.
Ожидаем Merchant ID и Secret Key для настройки авторизации.

С уважением,
IT Course Academy
```

---

## 🔄 После получения credentials

1. Добавьте в `.env`:
```env
PAYME_X_AUTH=merchant_id:secret_key
PAYME_ENDPOINT_PROD=https://checkout.paycom.uz/api
```

2. Переключите с mock на реальный Payme в коде

3. Перезапустите бота:
```bash
pm2 restart ytguessbot
```

4. Проведите тестовую оплату

5. Проверьте что платеж прошел

---

**Готово к интеграции!** ✅

---

**Контакты:**
- 🌐 Сайт: ytacademy.uz
- 📧 Email: (ваш email)
- 💬 Telegram: @ibrakhimzhanovit
- 🖥️ Сервер: 91.184.247.219
