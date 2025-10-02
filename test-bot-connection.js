// Тест подключения к Telegram боту
require('dotenv').config()

const { Telegraf } = require('telegraf')

async function testBotConnection() {
  console.log('🤖 Тестирование подключения к Telegram боту...\n')
  
  const bot = new Telegraf(process.env.BOT_TOKEN)
  
  try {
    // Получаем информацию о боте
    const botInfo = await bot.telegram.getMe()
    
    console.log('✅ Подключение к боту успешно!')
    console.log(`📋 Имя бота: ${botInfo.first_name}`)
    console.log(`🔗 Username: @${botInfo.username}`) 
    console.log(`🆔 Bot ID: ${botInfo.id}`)
    console.log(`🤖 Это бот: ${botInfo.is_bot ? 'Да' : 'Нет'}`)
    
    // Проверим webhook статус
    try {
      const webhookInfo = await bot.telegram.getWebhookInfo()
      console.log(`\n🌐 Webhook URL: ${webhookInfo.url || 'Не установлен'}`)
      console.log(`📊 Pending updates: ${webhookInfo.pending_update_count}`)
    } catch (webhookError) {
      console.log('\n⚠️ Не удалось получить информацию о webhook:', webhookError.message)
    }
    
    console.log('\n🎉 Бот готов к работе!')
    console.log(`💬 Отправьте боту сообщение: https://t.me/${botInfo.username}`)
    
  } catch (error) {
    console.error('❌ Ошибка подключения к боту:')
    if (error.response && error.response.error_code === 401) {
      console.error('🔑 Неверный BOT_TOKEN. Проверьте токен в .env файле.')
      console.error('📋 Получить токен: https://t.me/BotFather')
    } else {
      console.error('📄 Детали ошибки:', error.message)
    }
  }
}

testBotConnection()
