import { Telegraf, Context, Markup } from 'telegraf'
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
      ['🔧 Admin panel'],
      ['📚 Kursni sotib olish', '💰 To\'lovni tekshirish'],
      ['📞 Kontaktlar', '📋 Kurs haqida']
    ]).resize()
    
    ctx.reply(
      `🎬 Xush kelibsiz, ${role}! Bu YouTube Academiyasi ning rasmiy boti. Ekspert Elnur Alimov ning mualliflik kursi 🎬\n\n` +
      `Bu yerda siz YouTubeni noldan professional darajagacha o'rganish va  monetizatsiyaga chiqishga yordam beradigan kursga to'liq kirish huquqini sotib olishingiz mumkin.\n\n` +
      `Bizning maqsadimiz eng qulay narxda sizga kanal rivojlantirish va YouTube'da daromadni oshirish uchun barcha vositalar va bilimlarni berish 🚀\n\n` +
      `📺 Bizning kurs haqida to'liq videomizni tomosha qiling:\n` +
      `https://youtu.be/w7WciDsnhNQ?si=x-FbeouP0R3IrwLC\n\n` +
      `Sizda admin panelga kirish huquqi bor.\n\n` +
      `Kerakli bo'limni tanlang:`,
      keyboard
    )
  } else {
    const keyboard = Markup.keyboard([
      ['📚 Kursni sotib olish', '💰 To\'lovni tekshirish'],
      ['📞 Kontaktlar', '📋 Kurs haqida']
    ]).resize()
    
    ctx.reply(
      `🎬 Xush kelibsiz, aziz do'stim! Bu YouTube Academiyasi ning rasmiy boti. Ekspert Elnur Alimov ning mualliflik kursi 🎬\n\n` +
      `Bu yerda siz YouTubeni noldan professional darajagacha o'rganish va barqaror monetizatsiyaga chiqishga yordam beradigan kursga to'liq kirish huquqini sotib olishingiz mumkin.\n\n` +
      `Bizning maqsadimiz — eng qulay narxda sizga kanal rivojlantirish va YouTube'da daromadni oshirish uchun barcha vositalar va bilimlarni berish 🚀\n\n` +
      `📺 Bizning kurs haqida to'liq videomizni tomosha qiling:\n` +
      `https://youtu.be/w7WciDsnhNQ?si=x-FbeouP0R3IrwLC\n\n` +
      `Kerakli bo'limni tanlang:`,
      keyboard
    )
  }
})

bot.help((ctx) => {
  ctx.reply(
    `📋 Mavjud buyruqlar:\n\n` +
    `/start - Bot bilan ishlashni boshlash\n` +
    `/help - Ushbu xabarni ko'rsatish\n` +
    `/buy - Kursni sotib olish\n` +
    `/status - To'lov holatini tekshirish\n` +
    `/mycourse - Kurs materiallariga kirish\n\n` +
    `💡 Administratorlar uchun:\n` +
    `/admin_stats - Bot statistikasi`
  )
})

export { bot }
