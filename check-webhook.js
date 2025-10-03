/**
 * Скрипт для проверки webhook Telegram бота
 * 
 * Использование:
 * node check-webhook.js
 */

const https = require('https')
const dotenv = require('dotenv')

// Загружаем переменные окружения
dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в .env файле')
  process.exit(1)
}

function telegramRequest(method) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`
    
    https.get(url, (res) => {
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
    }).on('error', reject)
  })
}

async function main() {
  try {
    console.log('🔍 Проверка webhook...\n')
    
    const result = await telegramRequest('getWebhookInfo')
    
    if (!result.ok) {
      console.error('❌ Ошибка:', result.description)
      process.exit(1)
    }
    
    const info = result.result
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 ИНФОРМАЦИЯ О WEBHOOK')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (info.url) {
      console.log(`\n✅ Webhook установлен`)
      console.log(`📍 URL: ${info.url}`)
    } else {
      console.log(`\n⚠️ Webhook НЕ установлен`)
      console.log(`💡 Используйте: node set-webhook.js <url>`)
    }
    
    console.log(`\n📦 Ожидающих обновлений: ${info.pending_update_count}`)
    
    if (info.pending_update_count > 0) {
      console.log(`⚠️ Есть необработанные обновления!`)
    }
    
    console.log(`\n🔌 Максимум соединений: ${info.max_connections || 40}`)
    
    if (info.ip_address) {
      console.log(`🌐 IP адрес: ${info.ip_address}`)
    }
    
    if (info.last_error_date) {
      const errorDate = new Date(info.last_error_date * 1000)
      console.log(`\n❌ ПОСЛЕДНЯЯ ОШИБКА:`)
      console.log(`   Время: ${errorDate.toLocaleString('ru-RU')}`)
      console.log(`   Сообщение: ${info.last_error_message}`)
      
      // Анализ ошибки
      if (info.last_error_message.includes('405')) {
        console.log(`\n💡 Решение:`)
        console.log(`   - Проверьте, что endpoint поддерживает POST запросы`)
        console.log(`   - Проверьте файл: src/app/api/bot/route.ts`)
      } else if (info.last_error_message.includes('500')) {
        console.log(`\n💡 Решение:`)
        console.log(`   - Проверьте логи сервера`)
        console.log(`   - Убедитесь что все зависимости установлены`)
        console.log(`   - Проверьте переменные окружения`)
      } else if (info.last_error_message.includes('Connection')) {
        console.log(`\n💡 Решение:`)
        console.log(`   - Проверьте что сервер доступен`)
        console.log(`   - Проверьте SSL сертификат`)
      }
    } else {
      console.log(`\n✅ Ошибок не обнаружено`)
    }
    
    if (info.allowed_updates && info.allowed_updates.length > 0) {
      console.log(`\n📋 Разрешенные обновления:`)
      info.allowed_updates.forEach(update => {
        console.log(`   • ${update}`)
      })
    }
    
    if (info.last_synchronization_error_date) {
      const syncErrorDate = new Date(info.last_synchronization_error_date * 1000)
      console.log(`\n⚠️ Ошибка синхронизации: ${syncErrorDate.toLocaleString('ru-RU')}`)
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message)
    process.exit(1)
  }
}

main()
