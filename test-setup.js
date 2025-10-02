// Тест настройки окружения
console.log('🔍 Проверка настроек окружения...\n')

// Проверка Node.js
console.log('📋 Node.js версия:', process.version)

// Загрузка переменных окружения
require('dotenv').config()

// Проверка основных переменных
const requiredVars = [
  'BOT_TOKEN',
  'ADMIN_IDS', 
  'DATABASE_URL',
  'COURSE_PRICE_TIYN'
]

console.log('🔧 Переменные окружения:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  const displayValue = value 
    ? (varName === 'BOT_TOKEN' ? '*'.repeat(10) + value.slice(-10) : value)
    : 'НЕ ЗАДАНА'
  
  console.log(`${status} ${varName}: ${displayValue}`)
})

// Проверка подключения к базе данных
console.log('\n🗄️ Проверка подключения к базе данных...')
try {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL)
    console.log(`✅ URL базы корректный: ${url.protocol}//${url.hostname}:${url.port}${url.pathname}`)
  } else {
    console.log('❌ DATABASE_URL не задан')
  }
} catch (error) {
  console.log('❌ Некорректный DATABASE_URL:', error.message)
}

console.log('\n📝 Следующие шаги:')
console.log('1. Заполните отсутствующие переменные в .env файле')
console.log('2. Создайте PostgreSQL базу данных')  
console.log('3. Получите BOT_TOKEN от @BotFather')
console.log('4. Получите свой ADMIN_ID от @userinfobot')
