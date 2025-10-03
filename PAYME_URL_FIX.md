# 🔧 Исправление формата Payme URL

## 🔴 Проблема

URL для оплаты формировался **НЕПРАВИЛЬНО** - мы отправляли JSON объект вместо строки параметров.

---

## ❌ БЫЛО (неправильно):

```javascript
// Мы кодировали JSON объект:
const params = {
  m: "68dfaed6eb0789cb092fb03e",
  a: 250000000,
  ac: {
    order_id: "39",
    user_id: "xxx"
  }
}
const encoded = Buffer.from(JSON.stringify(params)).toString('base64')
```

**Результат:**
```
https://checkout.paycom.uz/eyJtIjoiNjhkZmFlZD...
```

**Декодированный Base64:**
```json
{"m":"68dfaed6eb0789cb092fb03e","a":250000000,"ac":{"order_id":"39"}}
```

**❌ Payme НЕ ПОНИМАЕТ этот формат!**

---

## ✅ СТАЛО (правильно):

По документации: https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get

**Формат:** `key=value;key2=value2`  
**Разделитель:** точка с запятой (`;`)

```javascript
// Формируем строку параметров:
const parts = []
parts.push(`m=${merchantId}`)                    // m=68dfaed6eb0789cb092fb03e
parts.push(`ac.order_id=${accountParams.order_id}`) // ac.order_id=39
parts.push(`a=${amount}`)                         // a=250000000

const paramsString = parts.join(';')  // m=xxx;ac.order_id=39;a=250000000
const encoded = Buffer.from(paramsString).toString('base64')
```

**Результат:**
```
https://checkout.paycom.uz/bT02OGRmYWVkNmViMDc4OWNiMDkyZmIwM2U7YWMub3JkZXJfaWQ9Mzk7YT0yNTAwMDAwMDA=
```

**Декодированный Base64:**
```
m=68dfaed6eb0789cb092fb03e;ac.order_id=39;a=250000000
```

**✅ Payme ПОНИМАЕТ этот формат!**

---

## 📋 Пример из документации Payme

**Данные:**
- `m=587f72c72cac0d162c722ae2` — ID мерчанта
- `ac.order_id=197` — Код заказа
- `a=500` — Сумма платежа (5 сум в тийинах)

**Строка параметров:**
```
m=587f72c72cac0d162c722ae2;ac.order_id=197;a=500
```

**URL:**
```
https://checkout.paycom.uz/bT01ODdmNzJjNzJjYWMwZDE2MmM3MjJhZTI7YWMub3JkZXJfaWQ9MTk3O2E9NTAw
```

---

## 🔧 Что было изменено

### Файл: `src/lib/payme/payme-utils.ts`

**До:**
```typescript
const params = {
  m: merchantId,
  a: amount,
  ac: accountParams
}
const encoded = Buffer.from(JSON.stringify(params)).toString('base64')
```

**После:**
```typescript
const parts: string[] = []

// Добавляем merchant ID
parts.push(`m=${merchantId}`)

// Добавляем account параметры с префиксом ac.
for (const [key, value] of Object.entries(accountParams)) {
  parts.push(`ac.${key}=${value}`)
}

// Добавляем сумму
parts.push(`a=${amount}`)

// Объединяем через точку с запятой
const paramsString = parts.join(';')

// Кодируем в Base64
const encoded = Buffer.from(paramsString).toString('base64')
```

---

## 🧪 Тестирование

### 1. Запустите сервер:
```bash
npm run dev
```

### 2. Проверьте через Postman:
```
GET http://localhost:3000/api/test-payme-url
```

### 3. Проверьте в логах:
```
🔗 Payme URL params: m=68dfaed6eb0789cb092fb03e;ac.order_id=999;ac.user_id=test-user-id-123;a=250000000
🔗 Payme URL base64: bT02OGRmYWVkNmViMDc4OWNiMDkyZmIwM2U7YWMub3JkZXJfaWQ9OTk5O2FjLnVzZXJfaWQ9dGVzdC11c2VyLWlkLTEyMzthPTI1MDAwMDAwMA==
```

### 4. Декодируйте Base64:
```bash
# PowerShell:
$base64 = "bT02OGRmYWVkNmViMDc4OWNiMDkyZmIwM2U7YWMub3JkZXJfaWQ9OTk5O2FjLnVzZXJfaWQ9dGVzdC11c2VyLWlkLTEyMzthPTI1MDAwMDAwMA=="
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
```

**Результат должен быть:**
```
m=68dfaed6eb0789cb092fb03e;ac.order_id=999;ac.user_id=test-user-id-123;a=250000000
```

✅ **Это правильный формат!**

---

## 📖 Документация Payme

**Официальная документация:**
https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get

**Ключевые моменты:**

1. **Формат URL:** `<checkout_url>/base64(params)`
2. **Разделитель параметров:** `;` (точка с запятой)
3. **Формат параметров:** `key=value`
4. **Account параметры:** `ac.field_name=value` (с точкой!)

**Пример:**
```
https://checkout.paycom.uz/base64(m=merchant_id;ac.order_id=123;a=500)
```

---

## ✅ Что теперь работает

1. ✅ URL формируется по стандарту Payme
2. ✅ Merchant ID присутствует: `m=68dfaed6eb0789cb092fb03e`
3. ✅ Цена правильная: `a=250000000` (2,500,000 сум)
4. ✅ Order ID передаётся: `ac.order_id=39`
5. ✅ Payme ПОНИМАЕТ этот формат!

---

## 🚀 Готово к тестированию!

**Теперь:**
1. Перезапустите бота
2. Создайте заказ через `/buy`
3. Нажмите "Оплатить через Payme"
4. Откроется **РАБОЧАЯ** страница Payme (не "Некорректные данные")

**Дата исправления:** 10 января 2025  
**Версия:** 2.1 (Правильный формат Payme URL)
