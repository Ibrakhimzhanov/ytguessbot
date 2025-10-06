import { Telegraf, Context, Markup } from 'telegraf'
import dotenv from 'dotenv'
import { hasAdminAccess, getRoleText } from './admin/roles'
import { prisma } from './prisma'

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
bot.start(async (ctx) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    // Создаем или обновляем пользователя в базе данных
    await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      create: {
        telegramId: BigInt(telegramId),
        username: ctx.from?.username || null,
        firstName: ctx.from?.first_name || null,
        phoneNumber: '',
        fullName: `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim(),
        isPaid: false
      },
      update: {
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        fullName: `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim()
      }
    })

    console.log(`✅ User ${telegramId} created/updated in database`)
  } catch (error) {
    console.error('Error creating user:', error)
  }
  
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
      `https://www.youtube.com/watch?v=6BaVB8pU3Lw\n\n` +
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
      `https://www.youtube.com/watch?v=6BaVB8pU3Lw\n\n` +
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
