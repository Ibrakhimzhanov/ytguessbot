import { Telegraf, Context, Markup } from 'telegraf'
import { Update } from 'telegraf/types'

export interface BotContext extends Context {
  // Дополнительные свойства контекста, если нужны
}

const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!)

// Настройка бота
bot.start((ctx) => {
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
})

bot.help((ctx) => {
  ctx.reply(
    `Доступные команды:\n\n` +
    `/start - Начать работу с ботом\n` +
    `/help - Показать это сообщение\n` +
    `/buy - Купить курс\n` +
    `/status - Проверить статус оплаты`
  )
})

export { bot }
