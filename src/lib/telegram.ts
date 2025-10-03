import { Telegraf, Context, Markup } from 'telegraf'
import { Update } from 'telegraf/types'
import dotenv from 'dotenv'
import { hasAdminAccess, getRoleText } from './admin/roles'

// Загружаем переменные окружения
dotenv.config()

export interface BotContext extends Context {
  match?: RegExpExecArray | null
}

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN не найден в переменных окружения. Проверьте файл .env')
}

const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN)

// Настройка бота
bot.start((ctx) => {
  const telegramId = ctx.from?.id
  
  // Проверяем является ли пользователь админом
  const isAdmin = telegramId ? hasAdminAccess(telegramId) : false
  
  if (isAdmin) {
    const role = getRoleText(telegramId!)
    const keyboard = Markup.keyboard([
      ['🔧 Админ-панель'],
      ['📚 Купить курс', '💰 Проверить оплату'],
      ['📞 Контакты', '📋 О курсе']
    ]).resize()
    
    ctx.reply(
      `Добро пожаловать, ${role}! 🎓\n\n` +
      `У вас есть доступ к админ-панели.\n\n` +
      `Выберите действие:`,
      keyboard
    )
  } else {
    const keyboard = Markup.keyboard([
      ['📚 Купить курс', '💰 Проверить оплату'],
      ['📞 Контакты', '📋 О курсе']
    ]).resize()
    
    ctx.reply(
      `Добро пожаловать в бот курса! 🎓\n\n` +
      `Здесь вы можете приобрести доступ к обучающему курсу.\n\n` +
      `Выберите действие:`,
      keyboard
    )
  }
})

bot.help((ctx) => {
  ctx.reply(
    `📋 **Доступные команды:**\n\n` +
    `/start - Начать работу с ботом\n` +
    `/help - Показать это сообщение\n` +
    `/buy - Купить курс\n` +
    `/status - Проверить статус оплаты\n` +
    `/mycourse - Доступ к материалам курса\n\n` +
    `💡 **Для администраторов:**\n` +
    `/admin_stats - Статистика бота`
  )
})

export { bot }
