import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Списки для генерации данных
const firstNames = [
  'Ali', 'Aziz', 'Bobur', 'Dilshod', 'Eldor', 'Farruh', 'Jahongir', 'Kamol',
  'Mansur', 'Nodir', 'Otabek', 'Rustam', 'Sardor', 'Temur', 'Umid', 'Vali',
  'Zafar', 'Alisher', 'Bekzod', 'Davron', 'Eldorbek', 'Farkhod', 'Gulom',
  'Hamza', 'Ikrom', 'Jasur', 'Karim', 'Laziz', 'Murod', 'Nuriddin',
  'Dinara', 'Elena', 'Fatima', 'Gulnora', 'Iroda', 'Kamila', 'Madina',
  'Nilufar', 'Ozoda', 'Safiya', 'Shoira', 'Umida', 'Yulduz', 'Zarina',
  'Aziza', 'Barno', 'Dilfuza', 'Feruza', 'Guli', 'Husnora'
]

const lastNames = [
  'Aliyev', 'Azimov', 'Boboyev', 'Davlatov', 'Ergashev', 'Fayzullayev',
  'Gulomov', 'Hamidov', 'Ismoilov', 'Jalolov', 'Karimov', 'Mahmudov',
  'Nabiyev', 'Orziyev', 'Rasulov', 'Salimov', 'Toshmatov', 'Umarov',
  'Vohidov', 'Yusupov', 'Zokirov', 'Akbarov', 'Boboev', 'Choriyev',
  'Dustov', 'Eshonov', 'Fazilov', 'Ganiyev', 'Hasanov', 'Ibragimov',
  'Aliyeva', 'Azimova', 'Boboeva', 'Davlatova', 'Ergasheva', 'Fayzullayeva',
  'Gulomova', 'Hamidova', 'Ismoilova', 'Jalolova', 'Karimova', 'Mahmudova',
  'Nabiyeva', 'Orziyeva', 'Rasulova', 'Salimova', 'Toshmatova', 'Umarova',
  'Vohidova', 'Yusupova'
]

// Префиксы для телефонов
const phonesPrefixes = ['99894', '99891', '998978', '99850']

// Функция для генерации случайного номера телефона
function generatePhone(): string {
  const prefix = phonesPrefixes[Math.floor(Math.random() * phonesPrefixes.length)]
  const suffix = Math.floor(1000000 + Math.random() * 9000000) // 7 цифр
  return `+${prefix}${suffix}`
}

// Функция для генерации username
function generateUsername(firstName: string, lastName: string): string {
  const random = Math.floor(Math.random() * 1000)
  return `${firstName.toLowerCase()}_${lastName.toLowerCase()}${random}`
}

// Функция для генерации случайного telegram ID (большое число)
function generateTelegramId(): bigint {
  // Генерируем ID от 100000000 до 999999999
  return BigInt(Math.floor(100000000 + Math.random() * 900000000))
}

async function main() {
  console.log('🌱 Начинаем заполнение базы тестовыми данными...')

  // Очищаем существующие данные (опционально)
  // await prisma.payment.deleteMany({})
  // await prisma.user.deleteMany({})
  // console.log('🗑️  Старые данные удалены')

  const users = []

  // Создаём 50 пользователей
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const fullName = `${firstName} ${lastName}`
    const phoneNumber = generatePhone()
    const username = generateUsername(firstName, lastName)
    const telegramId = generateTelegramId()
    
    // 30% пользователей будут с оплаченным курсом
    const isPaid = Math.random() < 0.3

    try {
      const user = await prisma.user.create({
        data: {
          telegramId,
          username,
          firstName,
          fullName,
          phoneNumber,
          isPaid
        }
      })

      users.push(user)

      console.log(`✅ [${i + 1}/50] Создан: ${fullName} (${phoneNumber}) - ${isPaid ? '💰 Оплачен' : '⏳ Не оплачен'}`)

      // Если пользователь оплатил, создаём для него платёж
      if (isPaid) {
        const amount = 1000000 // 10,000 сум в тийинах
        
        await prisma.payment.create({
          data: {
            userId: user.id,
            amount,
            currency: 'UZS',
            status: 'PAID',
            paymeId: `mock_payment_${user.id}_${Date.now()}`,
            completedAt: new Date()
          }
        })
      }
    } catch (error) {
      console.error(`❌ Ошибка создания пользователя ${fullName}:`, error)
    }
  }

  // Статистика
  const totalUsers = await prisma.user.count()
  const paidUsers = await prisma.user.count({ where: { isPaid: true } })
  const totalPayments = await prisma.payment.count()

  console.log('\n📊 Статистика:')
  console.log(`👥 Всего пользователей: ${totalUsers}`)
  console.log(`✅ Оплативших: ${paidUsers}`)
  console.log(`❌ Не оплативших: ${totalUsers - paidUsers}`)
  console.log(`💳 Всего платежей: ${totalPayments}`)

  console.log('\n🎉 Готово!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
