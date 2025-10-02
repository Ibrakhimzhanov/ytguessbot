import dotenv from 'dotenv'
dotenv.config()

import { bot } from './telegram'
import './bot-handlers' // Подключаем обработчики

async function startBot() {
  try {
    // Проверяем подключение к боту
    console.log('🤖 Запуск Telegram бота...')
    console.log('🔍 Проверка подключения к API...')
    
    const botInfo = await bot.telegram.getMe()
    console.log(`✅ Подключение установлено!`)
    console.log(`📋 Бот: ${botInfo.first_name} (@${botInfo.username})`)
    
    // Запуск бота в режиме long polling
    console.log('🚀 Запуск режима polling...')
    await bot.launch()
    
    console.log('✅ Бот успешно запущен!')
    console.log('📱 Можете тестировать бота: @YTCodeGuessbot')
    console.log('💬 Команды: /start, /buy, /status')
    console.log('🛑 Нажмите Ctrl+C для остановки')
    
    // Graceful stop
    process.once('SIGINT', () => {
      console.log('🛑 Получен сигнал остановки...')
      bot.stop('SIGINT')
    })
    process.once('SIGTERM', () => {
      console.log('🛑 Получен сигнал завершения...')
      bot.stop('SIGTERM')
    })
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error)
    if (error instanceof Error) {
      console.error('Детали:', error.message)
    }
    process.exit(1)
  }
}

// Запускаем бота, если файл выполняется напрямую
if (require.main === module) {
  startBot()
}

export { startBot }
