-- Создание 2 тестовых заказов для проверки Payme

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

-- Проверка созданных заказов
SELECT "orderNumber", amount, currency, status, "createdAt" 
FROM payments 
WHERE "orderNumber" IN (2001, 2002);
