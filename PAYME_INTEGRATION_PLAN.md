# План интеграции Payme Business для курс-бота

## 📋 Этапы интеграции

### 1. Подготовительный этап
- [ ] Изучить документацию Subscribe API
- [ ] Зарегистрировать бизнес в Payme Business
- [ ] Получить ID кассы и ключ-пароль
- [ ] Настроить тестовую среду

### 2. Техническая интеграция

#### 🔹 Endpoints для интеграции:
- **Тест:** https://checkout.test.paycom.uz/api
- **Продакшн:** https://checkout.paycom.uz/api

#### 🔹 Авторизация:
```
X-Auth: {id}:{password}
```

### 3. Необходимые методы Subscribe API

#### 🔸 cards.create - создание токена карты
```json
{
  "method": "cards.create", 
  "params": {
    "card": {
      "number": "8600069195406311",
      "expire": "0399"
    },
    "save": true
  }
}
```

#### 🔸 cards.get_verify_code - получение SMS кода
```json
{
  "method": "cards.get_verify_code",
  "params": {
    "token": "card_token_here"
  }
}
```

#### 🔸 cards.verify - подтверждение карты
```json
{
  "method": "cards.verify",
  "params": {
    "token": "card_token_here", 
    "code": "666666"
  }
}
```

#### 🔸 receipts.create - создание чека
```json
{
  "method": "receipts.create",
  "params": {
    "amount": 110000000, // в тийинах (1,100,000 сум)
    "account": {
      "order_id": 1, // номер заказа из БД
      "user_id": "user_uuid_here"
    }
  }
}
```

#### 🔸 receipts.pay - оплата чека
```json
{
  "method": "receipts.pay", 
  "params": {
    "id": "receipt_id_here",
    "token": "card_token_here"
  }
}
```

#### 🔸 receipts.check - проверка статуса
```json
{
  "method": "receipts.check",
  "params": {
    "id": "receipt_id_here"
  }
}
```

### 4. Интеграция с текущим ботом

#### 🔹 Обновить обработчик pay_payme:
1. Создать чек через `receipts.create`
2. Отправить пользователю ссылку для привязки карты
3. После оплаты проверить статус через `receipts.check`
4. Обновить статус в БД

#### 🔹 Добавить webhook для уведомлений:
- Payme будет отправлять уведомления о статусе платежа
- Обновлять статус пользователя автоматически

### 5. Тестирование

#### 🔸 Тестовые данные:
- **Кабинет:** https://merchant.test.paycom.uz/
- **Логин:** ваш номер телефона
- **Пароль:** qwerty  
- **SMS-код:** 666666

#### 🔸 Тестовая карта:
- **Номер:** 8600 0691 9540 6311
- **Срок:** 03/99
- **SMS-код:** 666666

### 6. Требования к безопасности
- ✅ Никогда не хранить данные карт в открытом виде
- ✅ Работать только с токенами
- ✅ Использовать HTTPS для всех запросов
- ✅ Добавить лейбл "Powered by Payme"

### 7. Готовые файлы для реализации

#### 📁 `/src/lib/payme.ts` - основной класс для работы с API
#### 📁 `/src/app/api/payme-webhook/route.ts` - webhook для уведомлений  
#### 📁 Обновить `bot-handlers.ts` - новая логика оплаты

## 🚀 Следующие шаги:
1. Создать аккаунт в Payme Business
2. Получить тестовые ключи
3. Реализовать PaymeService класс
4. Обновить логику бота
5. Протестировать в песочнице
6. Перенести на продакшн
