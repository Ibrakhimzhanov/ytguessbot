/**
 * Скрипт для установки webhook для Telegram бота
 * 
 * Использование:
 * node set-webhook.js <webhook_url>
 * 
 * Пример:
 * node set-webhook.js https://ytacademy.uz/api/bot
 */

const https = require('https')
const dotenv = require('dotenv')

// Загружаем переменные окружения
dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN
const WEBHOOK_URL = process.argv[2]

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в .env файле')
  process.exit(1)
}

if (!WEBHOOK_URL) {
  console.error('❌ Укажите URL для webhook')
  console.log('📝 Использование: node set-webhook.js <webhook_url>')
  console.log('📝 Пример: node set-webhook.js https://ytacademy.uz/api/bot')
  process.exit(1)
}

console.log('🔧 Настройка webhook...')
console.log(`📍 URL: ${WEBHOOK_URL}`)

// Функция для API запроса к Telegram
function telegramRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`
    const data = JSON.stringify(params)
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }
    
    const req = https.request(url, options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          resolve(response)
        } catch (error) {
          reject(error)
        }
      })
    })
    
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

// Основная функция
async function main() {
  try {
    // 1. Удаляем старый webhook (если есть)
    console.log('\n📤 Удаление старого webhook...')
    const deleteResult = await telegramRequest('deleteWebhook')
    
    if (deleteResult.ok) {
      console.log('✅ Старый webhook удален')
    } else {
      console.log('⚠️ Не удалось удалить webhook:', deleteResult.description)
    }
    
    // 2. Устанавливаем новый webhook
    console.log('\n📤 Установка нового webhook...')
    const setResult = await telegramRequest('setWebhook', {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query', 'inline_query']
    })
    
    if (setResult.ok) {
      console.log('✅ Webhook успешно установлен!')
    } else {
      console.error('❌ Ошибка установки webhook:', setResult.description)
      process.exit(1)
    }
    
    // 3. Проверяем информацию о webhook
    console.log('\n📤 Получение информации о webhook...')
    const infoResult = await telegramRequest('getWebhookInfo')
    
    if (infoResult.ok) {
      const info = infoResult.result
      console.log('\n📊 Информация о webhook:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`URL: ${info.url}`)
      console.log(`Ожидающих обновлений: ${info.pending_update_count}`)
      console.log(`Максимум соединений: ${info.max_connections || 40}`)
      
      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000)
        console.log(`\n⚠️ Последняя ошибка: ${errorDate.toLocaleString()}`)
        console.log(`Сообщение: ${info.last_error_message}`)
      } else {
        console.log(`\n✅ Ошибок не обнаружено`)
      }
      
      if (info.allowed_updates) {
        console.log(`\nРазрешенные обновления: ${info.allowed_updates.join(', ')}`)
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
    
    console.log('\n✅ Готово!')
    console.log('\n💡 Теперь можете отправить сообщение боту для проверки')
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message)
    process.exit(1)
  }
}

// Запуск
main()
