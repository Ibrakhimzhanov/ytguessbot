-- Удаление дублей по orderNumber (оставляем самую свежую запись)
DELETE FROM payments p
USING (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY order_number ORDER BY created_at DESC) AS rn
  FROM payments
) d
WHERE p.id = d.id AND d.rn > 1;

-- Удаление дублей по paymeId (оставляем самую свежую запись)
DELETE FROM payments p
USING (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY payme_id ORDER BY created_at DESC) AS rn
  FROM payments
  WHERE payme_id IS NOT NULL
) d
WHERE p.id = d.id AND d.rn > 1;
