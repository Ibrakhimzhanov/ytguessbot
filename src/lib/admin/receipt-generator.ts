/**
 * Генерация случайных данных для чека
 */
function generateReceiptData() {
  // Список имен для отправителя
  const names = [
    'Алишер Каримов', 'Азиза Усманова', 'Бобур Рахимов', 'Динара Исмоилова',
    'Фарход Набиев', 'Гулнора Азизова', 'Жасур Холматов', 'Камила Салимова',
    'Отабек Юсупов', 'Нилуфар Абдуллаева', 'Рустам Давлатов', 'Сабина Эргашева'
  ]
  
  // Генерация случайного номера карты
  const generateCardNumber = () => {
    const prefixes = ['8600', '9860', '5614', '4278']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const middle = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const last = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix} **** **** ${last}`
  }
  
  // Генерация случайного ID транзакции
  const generateTransactionId = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString()
  }
  
  // Текущая дата и время
  const now = new Date()
  const dateStr = now.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
  const timeStr = now.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
  
  return {
    senderName: names[Math.floor(Math.random() * names.length)],
    senderCard: generateCardNumber(),
    receiverCard: generateCardNumber(),
    amount: 1100000, // 11,000 сум
    serviceFee: 0,
    date: dateStr,
    time: timeStr,
    transactionId: generateTransactionId(),
    receiptNumber: Math.floor(100000 + Math.random() * 900000).toString()
  }
}

/**
 * Генерация текстового чека (простой вариант)
 */
export function generateTextReceipt(): string {
  const data = generateReceiptData()
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        💳 PAYME ЧЕКА
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Номер чека: ${data.receiptNumber}
🆔 ID транзакции: ${data.transactionId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 ОТПРАВИТЕЛЬ:
👤 ${data.senderName}
💳 ${data.senderCard}

📥 ПОЛУЧАТЕЛЬ:
💳 ${data.receiverCard}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 СУММА ПЕРЕВОДА:
   ${(data.amount / 100).toLocaleString('ru-RU')} сум

💼 Стоимость услуги:
   ${(data.serviceFee / 100).toLocaleString('ru-RU')} сум

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Дата: ${data.date}
⏰ Время: ${data.time}

✅ Платеж выполнен успешно

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       Спасибо за доверие!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Это тестовый чек для демонстрации
  `
}

/**
 * Форматирование чека с более красивым оформлением
 */
export function generateStyledReceipt(): string {
  const data = generateReceiptData()
  
  return `
╔═══════════════════════════════╗
║        💳 PAYME ЧЕКА          ║
╚═══════════════════════════════╝

┌─────────────────────────────┐
│ 📋 Чек № ${data.receiptNumber}           │
│ 🆔 ID ${data.transactionId}  │
└─────────────────────────────┘

┌─ 📤 ОТПРАВИТЕЛЬ ─────────────┐
│ 👤 ${data.senderName.padEnd(24)} │
│ 💳 ${data.senderCard}    │
└─────────────────────────────┘

┌─ 📥 ПОЛУЧАТЕЛЬ ──────────────┐
│ 💳 ${data.receiverCard}    │
└─────────────────────────────┘

╔═══════════════════════════════╗
║  💰 Сумма перевода           ║
║  ${((data.amount / 100).toLocaleString('ru-RU') + ' сум').padStart(28)} ║
║                               ║
║  💼 Стоимость услуги          ║
║  ${((data.serviceFee / 100).toLocaleString('ru-RU') + ' сум').padStart(28)} ║
╚═══════════════════════════════╝

┌─────────────────────────────┐
│ 📅 ${data.date}       ⏰ ${data.time} │
│                             │
│  ✅ Платеж выполнен успешно │
└─────────────────────────────┘

       Powered by Payme

⚠️ Это тестовый чек
  `
}

/**
 * Генерация подробного чека с дополнительной информацией
 */
export function generateDetailedReceipt(userName?: string, coursePrice?: number): string {
  const data = generateReceiptData()
  
  // Используем переданные данные если есть
  if (userName) data.senderName = userName
  if (coursePrice) data.amount = coursePrice
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          💳 ЭЛЕКТРОННЫЙ ЧЕК PAYME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Информация о платеже:
   • Номер чека: ${data.receiptNumber}
   • ID транзакции: ${data.transactionId}
   • Статус: ✅ Успешно выполнен

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 ОТПРАВИТЕЛЬ (Плательщик):
   👤 ФИО: ${data.senderName}
   💳 Карта: ${data.senderCard}
   🏦 Банк: Не указан

📥 ПОЛУЧАТЕЛЬ:
   🏢 Организация: IT Course Academy
   💳 Карта: ${data.receiverCard}
   🏦 Банк: Не указан

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ДЕТАЛИ ПЛАТЕЖА:

   Сумма перевода:     ${(data.amount / 100).toLocaleString('ru-RU')} сум
   Комиссия Payme:     ${(data.serviceFee / 100).toLocaleString('ru-RU')} сум
   ──────────────────────────────────
   ИТОГО К ОПЛАТЕ:     ${(data.amount / 100).toLocaleString('ru-RU')} сум

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Дата и время:
   • Дата: ${data.date}
   • Время: ${data.time}
   • Часовой пояс: GMT+5 (Ташкент)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Назначение платежа:
   "Оплата за онлайн курс по программированию"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ СТАТУС: Платеж успешно выполнен

📞 Служба поддержки:
   • Телефон: +998 78 150 00 00
   • Email: support@payme.uz
   • Сайт: payme.uz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

           🛡️ Powered by Payme
        Безопасные платежи в Узбекистане

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ВНИМАНИЕ: Это тестовый чек для демонстрации.
   Реальные деньги не были переведены.
   
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `
}

/**
 * Генерация чека для конкретного пользователя
 */
export async function generateUserReceipt(userId: string): Promise<string> {
  // Здесь можно подключить prisma и получить реальные данные
  // Но для mock версии просто генерируем случайные данные
  return generateDetailedReceipt()
}
