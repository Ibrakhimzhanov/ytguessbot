import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Узбекские имена
const uzbekNames = {
  male: [
    'Алишер', 'Азиз', 'Бобур', 'Давлат', 'Жасур', 'Зафар', 'Искандар',
    'Камол', 'Отабек', 'Рустам', 'Санжар', 'Улугбек', 'Фаррух', 'Шерзод',
    'Акбар', 'Бахром', 'Досто', 'Жахонгир', 'Икром', 'Комил', 'Мухаммад',
    'Нодир', 'Равшан', 'Собир', 'Темур', 'Фарход', 'Элдор', 'Ботир'
  ],
  female: [
    'Азиза', 'Гулнора', 'Динара', 'Камила', 'Малика', 'Нилуфар', 'Сабина',
    'Умида', 'Феруза', 'Шахноза', 'Дилбар', 'Зулфия', 'Латофат', 'Мохира',
    'Нигора', 'Озода', 'Ситора', 'Фарида', 'Ёзгул', 'Дилдора', 'Зарина'
  ]
}

// Узбекские фамилии
const uzbekSurnames = [
  'Каримов', 'Рахимов', 'Усманов', 'Набиев', 'Алиев', 'Азимов', 'Исмаилов',
  'Юсупов', 'Салимов', 'Холматов', 'Абдуллаев', 'Эргашев', 'Давлатов',
  'Махмудов', 'Ахмедов', 'Содиков', 'Мирзаев', 'Хасанов', 'Жураев',
  'Саидов', 'Турсунов', 'Шарипов', 'Тешабаев', 'Раджабов', 'Касымов',
  'Файзуллаев', 'Нуриддинов', 'Бобоев', 'Акрамов', 'Исломов'
]

// Операторы Узбекистана
const operators = ['94', '93', '55', '90', '91', '88', '78']

/**
 * Генерация случайного элемента из массива
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Генерация номера телефона
 */
function generatePhone(): string {
  const operator = randomItem(operators)
  const number = Math.floor(1000000 + Math.random() * 9000000) // 7 цифр
  return `+998${operator}${number}`
}

/**
 * Генерация username
 */
function generateUsername(firstName: string, surname: string): string {
  const random = Math.floor(100 + Math.random() * 900)
  const cleanFirst = firstName.toLowerCase()
    .replace(/ё/g, 'yo')
    .replace(/ў/g, 'u')
    .replace(/қ/g, 'q')
    .replace(/ғ/g, 'g')
    .replace(/ҳ/g, 'h')
    .replace(/[^a-z]/g, '')
  
  const cleanSurname = surname.toLowerCase()
    .replace(/ё/g, 'yo')
    .replace(/ў/g, 'u')
    .replace(/қ/g, 'q')
    .replace(/ғ/g, 'g')
    .replace(/ҳ/g, 'h')
    .replace(/[^a-z]/g, '')
  
  return `${cleanFirst}_${cleanSurname}${random}`
}

/**
 * Генерация Telegram ID
 */
function generateTelegramId(): bigint {
  // Telegram ID обычно 9-10 цифр
  const id = Math.floor(100000000 + Math.random() * 900000000)
  return BigInt(id)
}

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...\n')

  // Очистка существующих данных
  console.log('🗑️  Очистка старых данных...')
  await prisma.payment.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('✅ Данные очищены\n')

  const users = []
  const payments = []

  // Генерируем 50 пользователей
  for (let i = 0; i < 50; i++) {
    const isMale = Math.random() > 0.5
    const firstName = isMale 
      ? randomItem(uzbekNames.male)
      : randomItem(uzbekNames.female)
    
    const surname = randomItem(uzbekSurnames)
    const fullName = `${firstName} ${surname}`
    const phoneNumber = generatePhone()
    const username = generateUsername(firstName, surname)
    const telegramId = generateTelegramId()
    
    // 60% пользователей оплатили, 40% не оплатили
    const isPaid = Math.random() < 0.6
    
    const user = await prisma.user.create({
      data: {
        telegramId,
        firstName,
        fullName,
        phoneNumber,
        username,
        isPaid
      }
    })
    
    users.push(user)
    
    console.log(`${i + 1}. ${isPaid ? '✅' : '❌'} ${fullName} (@${username}) - ${phoneNumber}`)
    
    // Если пользователь оплатил, создаем платеж
    if (isPaid) {
      const daysAgo = Math.floor(Math.random() * 30) // За последние 30 дней
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)
      
      const completedAt = new Date(createdAt)
      completedAt.setMinutes(completedAt.getMinutes() + Math.floor(Math.random() * 30)) // Оплачен через 0-30 минут
      
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          amount: 2500000, // 25,000 сум
          currency: 'UZS',
          status: 'PAID',
          paymeId: `mock_receipt_${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt,
          completedAt
        }
      })
      
      payments.push(payment)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 СТАТИСТИКА:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`👥 Всего пользователей: ${users.length}`)
  console.log(`✅ Оплативших (участвуют в розыгрыше): ${users.filter(u => u.isPaid).length}`)
  console.log(`❌ Не оплативших: ${users.filter(u => !u.isPaid).length}`)
  console.log(`💳 Платежей создано: ${payments.length}`)
  console.log(`💰 Общая сумма: ${(payments.length * 11000).toLocaleString()} сум`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  console.log('\n🎰 Участники розыгрыша:')
  const participants = users.filter(u => u.isPaid)
  participants.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.fullName} (@${user.username})`)
  })
  
  console.log('\n✅ База данных успешно заполнена!')
  console.log('\n💡 Теперь можете:')
  console.log('   1. Запустить бота')
  console.log('   2. Войти в админ-панель')
  console.log('   3. Экспортировать XLSX')
  console.log('   4. Провести розыгрыш среди оплативших пользователей')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
