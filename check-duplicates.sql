-- Проверка дублей по orderNumber
SELECT order_number, COUNT(*) as cnt 
FROM payments 
GROUP BY order_number 
HAVING COUNT(*) > 1;

-- Проверка дублей по paymeId
SELECT payme_id, COUNT(*) as cnt 
FROM payments 
WHERE payme_id IS NOT NULL 
GROUP BY payme_id 
HAVING COUNT(*) > 1;
