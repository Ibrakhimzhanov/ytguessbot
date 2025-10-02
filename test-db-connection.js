// Тест подключения к базе данных
require('dotenv').config()

async function testDatabaseConnection() {
  console.log('🗄️ Тестирование подключения к базе данных...\n')
  
  try {
    // Попытка импорта Prisma
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    console.log('✅ Prisma Client загружен')
    
    // Тест подключения
    console.log('🔍 Проверка подключения к базе...')
    await prisma.$connect()
    console.log('✅ Подключение к базе данных установлено!')
    
    // Проверка существования таблиц
    console.log('📋 Проверка структуры базы данных...')
    
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Таблица 'users' доступна. Записей: ${userCount}`)
    } catch (tableError) {
      console.log('❌ Таблица users не найдена. Требуется миграция.')
    }
    
    try {
      const paymentCount = await prisma.payment.count()
      console.log(`✅ Таблица 'payments' доступна. Записей: ${paymentCount}`)
    } catch (tableError) {
      console.log('❌ Таблица payments не найдена. Требуется миграция.')
    }
    
    try {
      const lotteryCount = await prisma.lottery.count()
      console.log(`✅ Таблица 'lottery' доступна. Записей: ${lotteryCount}`)
    } catch (tableError) {
      console.log('❌ Таблица lottery не найдена. Требуется миграция.')
    }
    
    await prisma.$disconnect()
    
    console.log('\n🎉 База данных готова к работе!')
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:')
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 PostgreSQL сервер не запущен или недоступен')
      console.error('📋 Проверьте, что PostgreSQL работает на указанном порту')
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 Хост базы данных не найден')
      console.error('📋 Проверьте DATABASE_URL в .env файле')
    } else if (error.message.includes('password authentication failed')) {
      console.error('🔑 Неверные учетные данные базы данных')
      console.error('📋 Проверьте логин и пароль в DATABASE_URL')
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('🗄️ База данных не существует')
      console.error('📋 Создайте базу данных: CREATE DATABASE telegram_course_bot;')
    } else {
      console.error('📄 Детали ошибки:', error.message)
    }
    
    console.log('\n📝 Рекомендации:')
    console.log('1. Убедитесь, что PostgreSQL запущен')
    console.log('2. Проверьте DATABASE_URL в .env')
    console.log('3. Создайте базу данных если её нет')
    console.log('4. Запустите миграции: npm run db:push')
  }
}

testDatabaseConnection()
