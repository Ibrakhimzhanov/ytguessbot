import dotenv from 'dotenv'
dotenv.config()

import { bot, BotContext } from './telegram'
import { prisma } from './prisma'
import { Markup } from 'telegraf'
import { generatePaymeCheckoutUrl } from './payme/payme-utils'
import { hasAdminAccess, getRoleText } from './admin/roles'
import { showAdminPanel, handleExportXLSX, } from './admin/admin-handlers'

const COURSE_PRICE = parseInt(process.env.COURSE_PRICE || '250000000') // tiyin hisobida narx (2,500,000 so'm)
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || '68dfaed6eb0789cb092fb03e'
const IS_TEST_MODE = process.env.NODE_ENV !== 'production'

// Debug logging
console.log('💰 COURSE_PRICE:', COURSE_PRICE, 'tiyin =', (COURSE_PRICE / 100).toLocaleString(), 'so\'m')
console.log('🏪 PAYME_MERCHANT_ID:', PAYME_MERCHANT_ID)
console.log('🧪 IS_TEST_MODE:', IS_TEST_MODE)

// Buyruqlar va xabarlar handlerlari
bot.command('buy', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    // Kurs  to'langanligini tekshirish
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    if (user?.isPaid) {
      await ctx.reply(
        '✅ Siz kursni 100% to\'ladingiz!\n\n' +
        `🎫 Sizning lotereya raqamingiz: ${user.loteryId}\n\n` +
        'Materiallarga kirish uchun /mycourse buyrug\'idan foydalaning.'
      )
      return
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Payme orqali to\'lash', 'pay_payme')],
      [Markup.button.callback('📞 Admin bilan bog\'lanish', 'contact_admin')]
    ])

    await ctx.reply(
      `💰 Kurs narxi: ${(COURSE_PRICE / 100).toLocaleString()} so'm\n\n` +
      `📚 Kursga kiradi:\n` +
      `• Barcha video darslar\n` +
      `• Amaliy topshiriqlar\n` +
      `• Kurator yordami\n` +
      `• Tugatish sertifikati\n\n` +
      `To'lov usulini tanlang:`,
      keyboard
    )
  } catch (error) {
    console.error('Error in /buy command:', error)
    await ctx.reply('❌ Xatolik yuz berdi. Keyinroq urinib ko\'ring.')
  }
})

bot.command('status', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { 
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      await ctx.reply('Siz hali tizimda ro\'yxatdan o\'tmagansiz. Ro\'yxatdan o\'tish uchun /start dan foydalaning.')
      return
    }

    const statusIcon = user.isPaid ? '✅' : '❌'
    const statusText = user.isPaid ? 'To\'langan' : 'To\'lanmagan'
    
    const lastPayment = user.payments[0]
    let paymentInfo = ''
    
    if (lastPayment) {
      const date = lastPayment.createdAt.toLocaleDateString('uz-UZ')
      paymentInfo = `\n📋 Oxirgi to\'lov: #${lastPayment.orderNumber}\n` +
                   `📅 Sana: ${date}\n` +
                   `💰 Summa: ${(lastPayment.amount / 100).toLocaleString()} so\'m\n` +
                   `🔖 Holat: ${lastPayment.status === 'PAID' ? '✅ To\'langan' : lastPayment.status === 'PENDING' ? '⏳ Kutilmoqda' : '❌ Bekor qilingan'}`
    }

    const loteryInfo = user.isPaid && user.loteryId ? `\n🎫 Lotereya raqamingiz: ${user.loteryId}` : ''

    await ctx.reply(
      `📊 Sizning holatingiz\n\n` +
      `👤 Ism: ${user.fullName || user.firstName}\n` +
      `📱 Telefon: ${user.phoneNumber || 'Ko\'rsatilmagan'}\n` +
      `${statusIcon} Kursga kirish: ${statusText}${loteryInfo}${paymentInfo}\n\n` +
      (user.isPaid ? '📚 Materiallarga kirish uchun /mycourse dan foydalaning' : '💳 Kursni sotib olish uchun /buy dan foydalaning')
    )
  } catch (error) {
    console.error('Error checking status:', error)
    await ctx.reply('Holatni tekshirishda xatolik yuz berdi.')
  }
})

// Обработчик кнопки "💰 To'lovni tekshirish"
bot.hears('💰 To\'lovni tekshirish', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { 
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      await ctx.reply('Siz hali tizimda ro\'yxatdan o\'tmagansiz. Ro\'yxatdan o\'tish uchun /start dan foydalaning.')
      return
    }

    const statusIcon = user.isPaid ? '✅' : '❌'
    const statusText = user.isPaid ? 'To\'langan' : 'To\'lanmagan'
    
    const lastPayment = user.payments[0]
    let paymentInfo = ''
    
    if (lastPayment) {
      const date = lastPayment.createdAt.toLocaleDateString('uz-UZ')
      paymentInfo = `\n📋 Oxirgi to\'lov: #${lastPayment.orderNumber}\n` +
                   `📅 Sana: ${date}\n` +
                   `💰 Summa: ${(lastPayment.amount / 100).toLocaleString()} so\'m\n` +
                   `🔖 Holat: ${lastPayment.status === 'PAID' ? '✅ To\'langan' : lastPayment.status === 'PENDING' ? '⏳ Kutilmoqda' : '❌ Bekor qilingan'}`
    }

    const loteryInfo = user.isPaid && user.loteryId ? `\n🎫 Lotereya raqamingiz: ${user.loteryId}` : ''

    await ctx.reply(
      `📊 Sizning holatingiz\n\n` +
      `👤 Ism: ${user.fullName || user.firstName}\n` +
      `📱 Telefon: ${user.phoneNumber || 'Ko\'rsatilmagan'}\n` +
      `${statusIcon} Kursga kirish: ${statusText}${loteryInfo}${paymentInfo}\n\n` +
      (user.isPaid ? '📚 Materiallarga kirish uchun /mycourse dan foydalaning' : '💳 Kursni sotib olish uchun /buy dan foydalaning')
    )
  } catch (error) {
    console.error('Error checking status:', error)
    await ctx.reply('Holatni tekshirishda xatolik yuz berdi.')
  }
})

// Kursga kirish buyrug'i
bot.command('mycourse', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    if (!user) {
      await ctx.reply('Siz hali ro\'yxatdan o\'tmagansiz. Boshlash uchun /start dan foydalaning.')
      return
    }

    if (!user.isPaid) {
      await ctx.reply(
        '❌ Kursga kirish faollashtirilmagan\n\n' +
        'Kurs materiallariga kirish uchun obunani to\'lash kerak.\n\n' +
        '💳 Kursni sotib olish uchun /buy dan foydalaning'
      )
      return
    }

    // Kurs materiallarini yuborish
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📄 Kurs', 'https://t.me/+lUQ9hk-_rzw3YzMy')],
      [Markup.button.url('💬 Yopiq guruhga qo\'shilish', 'https://t.me/+LfbVBp8V17djMzNi')],
    ])

    await ctx.reply(
`🎓 Kursga xush kelibsiz!\n\n` +
      `✅ Sizning kirishingiz faollashtirildi\n\n` +
      `📚 Mavjud materiallar:\n` +
      `✅ Barcha video darslar\n` +
      `✅ Amaliy topshiriqlar\n` +
      `✅ Kurator yordami\n` +
      `✅ Kurator va boshqa talabalar bilan chat\n` +
      `✅ Tugatish sertifikati\n\n` +
      `🎁 Bonus: siz Malibu avtomobili o'yinida ishtirokchi bo'ldingiz\n\n` +
      `Bo\'limni tanlang:`,
      keyboard
    )
  } catch (error) {
    console.error('Error in /mycourse:', error)
    await ctx.reply('Kurs materiallarini olishda xatolik yuz berdi.')
  }
})

// Telefon raqamini so'rash handleri
bot.hears('📚 Kursni sotib olish', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    // Kurs allaqachon to'langanligini tekshirish
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    if (user?.isPaid) {
      await ctx.reply(
        '✅ Siz kursni 100% to\'ladingiz!\n\n' +
        `🎫 Sizning lotereya raqamingiz: ${user.loteryId}\n\n` +
        'Materiallarga kirish uchun /mycourse buyrug\'idan foydalaning.'
      )
      return
    }

    const keyboard = Markup.keyboard([
      [Markup.button.contactRequest('📱 Telefon raqamini ulashish')]
    ]).resize()

    await ctx.reply(
      'Kursni sotib olish uchun telefon raqamingiz kerak.\n' +
      'Kontaktni ulashish uchun quyidagi tugmani bosing:',
      keyboard
    )
  } catch (error) {
    console.error('Error in buy course handler:', error)
    await ctx.reply('❌ Xatolik yuz berdi. Keyinroq urinib ko\'ring.')
  }
})

// "Aloqa" tugmasi handleri
bot.hears('📞 Aloqa', async (ctx: BotContext) => {
  await ctx.reply(
    '📞 Call Center:\n\n' +
    '☎️ +998781136012\n' +
    '☎️ +998781136013\n\n' +
    '⏰ Ish vaqti: Dush-Jum, 9:00 - 18:00\n\n'
  )
})

// "Kurs haqida" tugmasi handleri
bot.hears('📋 Kurs haqida', async (ctx: BotContext) => {
  await ctx.reply(
'📚 Kurs haqida:\n\n' +
'💰 Narxi: 2,500,000 so\'m\n\n' +
'📝 Kursda:\n' +
'• 📹 Barcha video darslarliklar\n' +
'• ✍️ Amaliy topshiriqlar\n' +
'• 👨‍🏫 Kuratorlar yordami\n' +
'• 🎓 Kurs tugaganligi haqida sertifikat\n' +
'• 💬 Yopiq chatga kirish\n' +
'• ⏱️ Kursda doimiy qolish\n' +
'• 🚗 Malibu avtomobilini yutib olish imkoniyati\n\n' +
'🚀 Sotib olish uchun "Kursni sotib olish" tugmasini bosing'
  )
})

// Kontaktni qabul qilish handleri
bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact
  const telegramId = ctx.from?.id

  if (!contact || !telegramId) return

  try {
    // Foydalanuvchini yaratish yoki yangilash
    await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      create: {
        telegramId: BigInt(telegramId),
        username: ctx.from?.username || null,
        firstName: ctx.from?.first_name || null,
        phoneNumber: contact.phone_number,
        fullName: `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim(),
        isPaid: false
      },
      update: {
        phoneNumber: contact.phone_number,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        fullName: `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim()
      }
    })

    console.log(`✅ Contact saved for user ${telegramId}: ${contact.phone_number}`)

    // Kontakt saqlanganidan so'ng asosiy menyuga qaytish
    const mainKeyboard = Markup.keyboard([
      ['📚 Kursni sotib olish', '💰 To\'lovni tekshirish'],
      ['📞 Kontaktlar', '📋 Kurs haqida']
    ]).resize()

    await ctx.reply(
      `✅ Rahmat! Kontaktingiz saqlandi.\n\n` +
      `💰 Kurs narxi: ${(COURSE_PRICE / 100).toLocaleString()} so'm\n\n` +
      `📚 Kursda:\n` +
      `• Barcha video darslar\n` +
      `• Amaliy topshiriqlar\n` +
      `• Kuratorlar yordami\n` +
      `• Kurs tugaganligi haqida sertifikat\n\n` +
      `Endi kursni sotib olishingiz mumkin:`,
      mainKeyboard
    )

    // Tezkor to'lov uchun inline tugmani ko'rsatish
    const paymentKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Payme orqali to\'lash', 'pay_payme')]
    ])

    await ctx.reply(
      `🚀 O'qishni boshlashga tayyormisiz?`,
      paymentKeyboard
    )
  } catch (error) {
    console.error('Error saving contact:', error)
    await ctx.reply('Kontaktni saqlashda xatolik yuz berdi.')
  }
})

// Callback tugmalarni qayta ishlash
bot.action('pay_payme', async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  const telegramId = ctx.from?.id
  if (!telegramId) {
    console.error('❌ pay_payme: telegramId topilmadi')
    return
  }

  try {
    console.log(`🔵 pay_payme: ${telegramId} uchun qayta ishlash boshlandi`)
    
    // Foydalanuvchi ma'lumotlarini olish
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    console.log(`🔵 pay_payme: Foydalanuvchi topildi:`, user ? `ID ${user.id}` : 'YO\'Q')

    if (!user) {
      await ctx.reply('❌ Xatolik: foydalanuvchi topilmadi. Iltimos, /start dan qaytadan boshlang')
      return
    }

    if (!user.phoneNumber) {
      await ctx.reply('❌ To\'lov uchun telefon raqamingiz kerak. Iltimos, "📚 Kursni sotib olish" tugmasi orqali kontaktni ulashing')
      return
    }

    if (user.isPaid) {
      await ctx.reply(
        '✅ Siz kursni 100% to\'ladingiz!\n\n' +
        `🎫 Sizning lotereya raqamingiz: ${user.loteryId}\n\n` +
        'Materiallarga kirish uchun /mycourse buyrug\'idan foydalaning.'
      )
      return
    }

    console.log(`🔵 pay_payme: To\'lov yaratilmoqda, COURSE_PRICE = ${COURSE_PRICE}`)

    // To'lov yozuvi yaratish
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: COURSE_PRICE,
        currency: 'UZS',
        status: 'PENDING'
      }
    })

    console.log(`🔵 pay_payme: To\'lov yaratildi #${payment.orderNumber}`)

    // Payme Checkout orqali to'lov uchun URL yaratish
    const paymentUrl = generatePaymeCheckoutUrl(
      PAYME_MERCHANT_ID,
      {
        order_id: payment.orderNumber.toString()
      },
      COURSE_PRICE,
      IS_TEST_MODE
    )
    
    console.log(`🔵 pay_payme: Payme checkout URL yaratildi`)
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💳 To\'lovga o\'tish', paymentUrl)],
      [Markup.button.callback('✅ Men to\'ladim', `check_payment_${payment.id}`)]
    ])

    await ctx.reply(
      `💳 Payme orqali kurs to\'lovi\n\n` +
      `💰 Narx: ${(payment.amount / 100).toLocaleString()} so\'m\n` +
      `📱 Telefon: ${user.phoneNumber}\n` +
      `📋 Buyurtma raqami: #${payment.orderNumber}\n\n` +
      `🔒 Payme orqali xavfsiz to\'lov\n\n` +
      `Payme orqali to\'lov uchun "💳 To\'lovga o\'tish" tugmasini bosing.\n\n` +
      `Muvaffaqiyatli to\'lovdan so\'ng sizga xabar yuboriladi va kursga kirish avtomatik faollashtiriladi.`,
      keyboard
    )

    console.log('✅ Payment created:', payment.orderNumber)
  } catch (error) {
    console.error('❌ Error creating payment:', error)
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    await ctx.reply('❌ To\'lovni yaratishda xatolik yuz berdi. Keyinroq urinib ko\'ring.')
  }
})

bot.action('contact_admin', async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  await ctx.reply(
    '📞 Administrator bilan bog\'lanish:\n\n' +
    '• Telegram: @ibrakhimzhanovit\n' +
    '• Email: support@example.com'
  )
})

// To'lovni tekshirish handleri
bot.action(/check_payment_(.+)/, async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  const paymentId = ctx.match![1]
  const telegramId = ctx.from?.id
  
  if (!telegramId) return

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    })

    if (!payment || payment.user.telegramId !== BigInt(telegramId)) {
      await ctx.reply('❌ To\'lov topilmadi.')
      return
    }

    if (payment.status === 'PAID') {
      await ctx.reply(
        '✅ To\'lovingiz allaqachon tasdiqlangan! Kursga kirish faol.\n\n' +
        `🎫 Sizning lotereya raqamingiz: ${payment.user.loteryId}\n\n` +
        '📚 Kurs materiallariga kirish uchun /mycourse dan foydalaning.'
      )
      return
    }

    if (payment.status === 'CANCELLED') {
      await ctx.reply(
        '❌ Bu to\'lov bekor qilingan.\n\n' +
        '/buy buyrug\'i yordamida yangi buyurtma yaratib ko\'ring'
      )
      return
    }

    // Mock rejimida faqat holatni ko'rsatish
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Yana tekshirish', `check_payment_${paymentId}`)]
    ])

    const timeElapsed = Math.floor((Date.now() - payment.createdAt.getTime()) / 1000 / 60)

    await ctx.reply(
      `⏳ To\'lovingiz qayta ishlanmoqda\n\n` +
      `📋 Buyurtma raqami: #${payment.orderNumber}\n` +
      `💰 Summa: ${(payment.amount / 100).toLocaleString()} so\'m\n` +
      `⏱️ Yaratilgan: ${timeElapsed} daqiqa oldin\n\n` +
      `🔍 Agar to\'lovni allaqachon amalga oshirgan bo\'lsangiz, bir necha soniya kuting va "Yana tekshirish" tugmasini bosing.\n\n` +
      `📞 Agar muammolar yuzaga kelsa, qo\'llab-quvvatlash bilan bog\'laning: @ibrakhimzhanovit`,
      keyboard
    )

  } catch (error) {
    console.error('Error checking payment:', error)
    await ctx.reply('❌ To\'lovni tekshirishda xatolik.')
  }
})

// Administrativ buyruqlar
bot.command('admin_check', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  const hasAccess = hasAdminAccess(telegramId)
  const roleText = getRoleText(telegramId)
  
  await ctx.reply(
    `🔐 Admin status check:\n\n` +
    `👤 Your ID: ${telegramId}\n` +
    `🎭 Role: ${roleText}\n` +
    `✅ Admin Access: ${hasAccess ? 'Yes' : 'No'}`
  )
})

bot.command('admin_stats', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  console.log('📊 admin_stats called by:', telegramId)
  
  if (!telegramId) {
    console.log('❌ No telegramId')
    return
  }
  
  const hasAccess = hasAdminAccess(telegramId)
  console.log('🔐 hasAdminAccess:', hasAccess)
  
  if (!hasAccess) {
    console.log('❌ Access denied for:', telegramId)
    return
  }

  try {
    const totalUsers = await prisma.user.count()
    const paidUsers = await prisma.user.count({ where: { isPaid: true } })
    const totalPayments = await prisma.payment.count()
    const paidPayments = await prisma.payment.count({ where: { status: 'PAID' } })
    const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } })
    
    // Daromadni hisoblash
    const paidPaymentsData = await prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { amount: true }
    })
    const totalRevenue = paidPaymentsData.reduce((sum, p) => sum + p.amount, 0)
    
    await ctx.reply(
      `📊 Bot statistikasi\n\n` +
      `👥 Foydalanuvchilar:\n` +
      `• Jami: ${totalUsers}\n` +
      `• To\'laganlar: ${paidUsers} (${Math.round(paidUsers / totalUsers * 100)}%)\n` +
      `• To\'lamaganlar: ${totalUsers - paidUsers}\n\n` +
      `💳 To\'lovlar:\n` +
      `• Jami: ${totalPayments}\n` +
      `• To\'langan: ${paidPayments}\n` +
      `• Kutilmoqda: ${pendingPayments}\n\n` +
      `💰 Daromad:\n` +
      `• Umumiy: ${(totalRevenue / 100).toLocaleString()} so\'m`
    )
  } catch (error) {
    console.error('Error getting stats:', error)
    await ctx.reply('Statistikani olishda xatolik.')
  }
})

// To'lovni tasdiqlash uchun admin handlerlari
bot.action(/admin_confirm_(.+)/, async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  const paymentId = ctx.match![1]
  const adminUsername = ctx.from?.username
  const adminUsernames = process.env.ADMIN_IDS?.split(',') || []
  
  if (!adminUsername || !adminUsernames.includes(adminUsername)) {
    await ctx.reply('❌ Sizda bu harakat uchun huquq yo\'q.')
    return
  }

  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status: 'PAID',
        completedAt: new Date()
      },
      include: { user: true }
    })

    // Foydalanuvchi holatini yangilash
    await prisma.user.update({
      where: { id: payment.userId },
      data: { isPaid: true }
    })

    await ctx.reply(`✅ To\'lov tasdiqlandi! Buyurtma #${payment.orderNumber}`)
    
    // Foydalanuvchiga xabar yuborish
    try {
      await ctx.telegram.sendMessage(
        payment.user.telegramId.toString(),
        `🎉 Tabriklaymiz! To\'lovingiz tasdiqlandi!\n\n` +
        `✅ Kursga kirish faollashtirildi\n` +
        `👤 Foydalanuvchi ID: ${payment.user.id}\n` +
        `📋 Buyurtma raqami: ${payment.orderNumber}\n\n` +
        `📚 Kursga xush kelibsiz! Hoziroq o\'qishni boshlang.`
      )
    } catch (error) {
      console.error('Failed to notify user:', error)
    }
  } catch (error) {
    console.error('Error confirming payment:', error)
    await ctx.reply('❌ To\'lovni tasdiqlashda xatolik.')
  }
})

bot.action(/admin_reject_(.+)/, async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  const paymentId = ctx.match![1]
  const adminUsername = ctx.from?.username
  const adminUsernames = process.env.ADMIN_IDS?.split(',') || []
  
  if (!adminUsername || !adminUsernames.includes(adminUsername)) {
    await ctx.reply('❌ Sizda bu harakat uchun huquq yo\'q.')
    return
  }

  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
      include: { user: true }
    })

    await ctx.reply(`❌ To\'lov rad etildi. Buyurtma #${payment.orderNumber}`)
    
    // Foydalanuvchiga xabar yuborish
    try {
      await ctx.telegram.sendMessage(
        payment.user.telegramId.toString(),
        `❌ Afsuski, to\'lovingiz tasdiqlanmadi.\n\n` +
        `👤 Foydalanuvchi ID: ${payment.user.id}\n` +
        `📋 Buyurtma raqami: ${payment.orderNumber}\n\n` +
        `📞 Agar savollaringiz bo\'lsa, qo\'llab-quvvatlash bilan bog\'laning: @ibrakhimzhanovit`
      )
    } catch (error) {
      console.error('Failed to notify user:', error)
    }
  } catch (error) {
    console.error('Error rejecting payment:', error)
    await ctx.reply('❌ To\'lovni rad etishda xatolik.')
  }
})

// ============ ADMIN HANDLERLAR ============

// "🔧 Admin panel" tugmasi
bot.hears('🔧 Admin panel', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) {
    await ctx.reply('❌ Sizda admin panelga kirish huquqi yo\'q.')
    return
  }
  
  await showAdminPanel(ctx)
})

// "🔙 Asosiy menyuga qaytish" tugmasi
bot.hears('🔙 Asosiy menyuga qaytish', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  const isAdmin = telegramId ? hasAdminAccess(telegramId) : false
  
  if (isAdmin) {
    const role = getRoleText(telegramId!)
    const keyboard = Markup.keyboard([
      ['🔧 Admin panel'],
      ['📚 Kursni sotib olish', '💰 To\'lovni tekshirish'],
      ['📞 Aloqa', '📋 Kurs haqida']
    ]).resize()
    
    await ctx.reply(
      `${role}, harakatni tanlang:`,
      keyboard
    )
  } else {
    const keyboard = Markup.keyboard([
      ['📚 Kursni sotib olish', '💰 To\'lovni tekshirish'],
      ['📞 Aloqa', '📋 Kurs haqida']
    ]).resize()
    
    await ctx.reply(
      'Harakatni tanlang:',
      keyboard
    )
  }
})

// "🗂 Ishtirokchilarni eksport qilish" tugmasi
bot.hears('🗂 Ishtirokchilarni eksport qilish', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return
  
  await handleExportXLSX(ctx)
})



// "📊 Statistika" tugmasi
bot.hears('📊 Statistika', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return

  try {
    const totalUsers = await prisma.user.count()
    const paidUsers = await prisma.user.count({ where: { isPaid: true } })
    const totalPayments = await prisma.payment.count()
    const paidPayments = await prisma.payment.count({ where: { status: 'PAID' } })
    const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } })
    
    // Daromadni hisoblash
    const paidPaymentsData = await prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { amount: true }
    })
    const totalRevenue = paidPaymentsData.reduce((sum, p) => sum + p.amount, 0)
    
    await ctx.reply(
      `📊 Bot statistikasi\n\n` +
      `👥 Foydalanuvchilar:\n` +
      `• Jami: ${totalUsers}\n` +
      `• To'laganlar: ${paidUsers} (${totalUsers > 0 ? Math.round(paidUsers / totalUsers * 100) : 0}%)\n` +
      `• To'lamaganlar: ${totalUsers - paidUsers}\n\n` +
      `💳 To'lovlar:\n` +
      `• Jami: ${totalPayments}\n` +
      `• To'langan: ${paidPayments}\n` +
      `• Kutilmoqda: ${pendingPayments}\n\n` +
      `💰 Daromad:\n` +
      `• Umumiy: ${(totalRevenue / 100).toLocaleString()} so'm`
    )
  } catch (error) {
    console.error('Error getting stats:', error)
    await ctx.reply('❌ Statistikani olishda xatolik.')
  }
})

export { bot }
