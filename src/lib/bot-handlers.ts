import dotenv from 'dotenv'
dotenv.config()

import { bot, BotContext } from './telegram'
import { prisma } from './prisma'
import { Markup } from 'telegraf'
import { generatePaymeCheckoutUrl } from './payme/payme-utils'
import { hasAdminAccess, getRoleText } from './admin/roles'
import {
  showAdminPanel,
  handleExportXLSX,
  handleLotteryControl,
  handleLotteryStart,
  handleLotteryStop,
  handleSelectWinner,
  handleLotteryHistory,
  handleCheckUserId,
  handleGenerateRandomReceipt
} from './admin/admin-handlers'

const COURSE_PRICE = parseInt(process.env.COURSE_PRICE || '250000000') // цена в тийинах (2,500,000 сум)
const PAYME_MERCHANT_ID = process.env.PAYME_X_AUTH?.split(':')[0] || ''
const IS_TEST_MODE = process.env.NODE_ENV !== 'production'

// Debug logging
console.log('💰 COURSE_PRICE:', COURSE_PRICE, 'тийинов =', (COURSE_PRICE / 100).toLocaleString(), 'сум')
console.log('🏪 PAYME_MERCHANT_ID:', PAYME_MERCHANT_ID)
console.log('🧪 IS_TEST_MODE:', IS_TEST_MODE)

// Обработчики команд и сообщений
bot.command('buy', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    // Проверяем, не оплачен ли уже курс
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    if (user?.isPaid) {
      await ctx.reply(
        '✅ Вы уже оплатили курс!\n\n' +
        'Используйте команду /mycourse для доступа к материалам.'
      )
      return
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Оплатить через Payme', 'pay_payme')],
      [Markup.button.callback('📞 Связаться с админом', 'contact_admin')]
    ])

    await ctx.reply(
      `💰 Стоимость курса: ${(COURSE_PRICE / 100).toLocaleString()} сум\n\n` +
      `📚 В курс входит:\n` +
      `• Все видео уроки\n` +
      `• Практические задания\n` +
      `• Поддержка куратора\n` +
      `• Сертификат об окончании\n\n` +
      `Выберите способ оплаты:`,
      keyboard
    )
  } catch (error) {
    console.error('Error in /buy command:', error)
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.')
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
      await ctx.reply('Вы еще не зарегистрированы в системе. Используйте /start для регистрации.')
      return
    }

    const statusIcon = user.isPaid ? '✅' : '❌'
    const statusText = user.isPaid ? 'Оплачен' : 'Не оплачен'
    
    const lastPayment = user.payments[0]
    let paymentInfo = ''
    
    if (lastPayment) {
      const date = lastPayment.createdAt.toLocaleDateString('ru-RU')
      paymentInfo = `\n📋 Последний платеж: #${lastPayment.orderNumber}\n` +
                   `📅 Дата: ${date}\n` +
                   `💰 Сумма: ${(lastPayment.amount / 100).toLocaleString()} сум\n` +
                   `🔖 Статус: ${lastPayment.status === 'PAID' ? '✅ Оплачен' : lastPayment.status === 'PENDING' ? '⏳ Ожидает' : '❌ Отменен'}`
    }

    await ctx.reply(
      `📊 **Ваш статус**\n\n` +
      `👤 Имя: ${user.fullName || user.firstName}\n` +
      `📱 Телефон: ${user.phoneNumber || 'Не указан'}\n` +
      `${statusIcon} Доступ к курсу: ${statusText}${paymentInfo}\n\n` +
      (user.isPaid ? '📚 Используйте /mycourse для доступа к материалам' : '💳 Используйте /buy для покупки курса')
    )
  } catch (error) {
    console.error('Error checking status:', error)
    await ctx.reply('Произошла ошибка при проверке статуса.')
  }
})

// Команда для доступа к курсу
bot.command('mycourse', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    if (!user) {
      await ctx.reply('Вы еще не зарегистрированы. Используйте /start для начала.')
      return
    }

    if (!user.isPaid) {
      await ctx.reply(
        '❌ Доступ к курсу не активирован\n\n' +
        'Для получения доступа к материалам курса необходимо оплатить подписку.\n\n' +
        '💳 Используйте /buy для покупки курса'
      )
      return
    }

    // Отправляем материалы курса
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📺 Видеоуроки', 'https://example.com/videos')],
      [Markup.button.url('📄 Материалы курса', 'https://example.com/materials')],
      [Markup.button.url('💬 Чат поддержки', 'https://t.me/support_chat')],
      [Markup.button.url('📝 Задания', 'https://example.com/tasks')]
    ])

    await ctx.reply(
      `🎓 **Добро пожаловать на курс!**\n\n` +
      `✅ Ваш доступ активирован\n\n` +
      `📚 Доступные материалы:\n` +
      `• Видеоуроки - полный курс по программированию\n` +
      `• Текстовые материалы и шпаргалки\n` +
      `• Практические задания с проверкой\n` +
      `• Чат с куратором и другими студентами\n` +
      `• Сертификат после завершения\n\n` +
      `Выберите раздел:`,
      keyboard
    )
  } catch (error) {
    console.error('Error in /mycourse:', error)
    await ctx.reply('Произошла ошибка при получении материалов курса.')
  }
})

// Обработчик для запроса номера телефона
bot.hears('📚 Купить курс', async (ctx: BotContext) => {
  const keyboard = Markup.keyboard([
    [Markup.button.contactRequest('📱 Поделиться номером телефона')]
  ]).resize()

  await ctx.reply(
    'Для покупки курса нам нужен ваш номер телефона.\n' +
    'Нажмите кнопку ниже, чтобы поделиться контактом:',
    keyboard
  )
})

// Обработчик кнопки "Контакты"
bot.hears('📞 Контакты', async (ctx: BotContext) => {
  await ctx.reply(
    '📞 **Контакты Call Center:**\n\n' +
    '☎️ +998 78 113 60 12\n' +
    '☎️ +998 78 113 60 13\n\n' +
    '⏰ Режим работы: Пн-Пт, 9:00 - 18:00\n\n'
  )
})

// Обработчик кнопки "О курсе"
bot.hears('📋 О курсе', async (ctx: BotContext) => {
  await ctx.reply(
    '📚 **О курсе по программированию**\n\n' +
    '💰 Стоимость: 11,000 сум\n\n' +
    '📝 **Что входит в курс:**\n' +
    '• 📹 Видеоуроки (полный курс)\n' +
    '• 📄 Текстовые материалы и шпаргалки\n' +
    '• ✍️ Практические задания с проверкой\n' +
    '• 💬 Поддержка куратора\n' +
    '• 🎓 Сертификат об окончании\n\n' +
    '⏱️ Длительность: Доступ навсегда\n\n' +
    '🎰 **Бонус:** Все оплатившие участвуют в розыгрыше призов!\n\n' +
    '📚 Для покупки нажмите "Купить курс"'
  )
})

// Обработка получения контакта
bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact
  const telegramId = ctx.from?.id

  if (!contact || !telegramId) return

  try {
    // Создаем или обновляем пользователя
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: {
        phoneNumber: contact.phone_number,
        firstName: contact.first_name,
        username: ctx.from?.username
      },
      create: {
        telegramId: BigInt(telegramId),
        phoneNumber: contact.phone_number,
        firstName: contact.first_name,
        fullName: `${contact.first_name} ${contact.last_name || ''}`.trim(),
        username: ctx.from?.username
      }
    })

    // Возвращаем основное меню после сохранения контакта
    const mainKeyboard = Markup.keyboard([
      ['📚 Купить курс', '💰 Проверить оплату'],
      ['📞 Контакты', '📋 О курсе']
    ]).resize()

    await ctx.reply(
      `✅ Спасибо! Ваш контакт сохранен.\n\n` +
      `💰 Стоимость курса: ${(COURSE_PRICE / 100).toLocaleString()} сум\n\n` +
      `📚 В курс входит:\n` +
      `• Все видео уроки\n` +
      `• Практические задания\n` +
      `• Поддержка куратора\n` +
      `• Сертификат об окончании\n\n` +
      `Теперь вы можете приобрести курс:`,
      mainKeyboard
    )

    // Дополнительно показываем inline кнопку для быстрой оплаты
    const paymentKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Оплатить через Payme', 'pay_payme')]
    ])

    await ctx.reply(
      `🚀 Готовы начать обучение?`,
      paymentKeyboard
    )
  } catch (error) {
    console.error('Error saving contact:', error)
    await ctx.reply('Произошла ошибка при сохранении контакта.')
  }
})

// Обработка callback кнопок
bot.action('pay_payme', async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  const telegramId = ctx.from?.id
  if (!telegramId) {
    console.error('❌ pay_payme: telegramId не найден')
    return
  }

  try {
    console.log(`🔵 pay_payme: Начало обработки для telegramId ${telegramId}`)
    
    // Получаем данные пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    console.log(`🔵 pay_payme: Пользователь найден:`, user ? `ID ${user.id}` : 'НЕТ')

    if (!user) {
      await ctx.reply('❌ Ошибка: пользователь не найден. Пожалуйста, начните заново с /start')
      return
    }

    if (!user.phoneNumber) {
      await ctx.reply('❌ Для оплаты необходим ваш номер телефона. Пожалуйста, поделитесь контактом через кнопку "📚 Купить курс"')
      return
    }

    console.log(`🔵 pay_payme: Создание платежа, COURSE_PRICE = ${COURSE_PRICE}`)

    // Создаем запись о платеже
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: COURSE_PRICE,
        currency: 'UZS',
        status: 'PENDING'
      }
    })

    console.log(`🔵 pay_payme: Платеж создан #${payment.orderNumber}`)

    // Генерируем URL для оплаты через Payme Checkout
    const paymentUrl = generatePaymeCheckoutUrl(
      PAYME_MERCHANT_ID,
      {
        order_id: payment.orderNumber.toString(),
        user_id: user.id
      },
      COURSE_PRICE,
      IS_TEST_MODE
    )
    
    console.log(`🔵 pay_payme: Payme checkout URL сгенерирован`)
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💳 Перейти к оплате', paymentUrl)],
      [Markup.button.callback('✅ Я оплатил', `check_payment_${payment.id}`)]
    ])

    await ctx.reply(
      `💳 **Оплата курса через Payme**\n\n` +
      `💰 Сумма: ${(payment.amount / 100).toLocaleString()} сум\n` +
      `📱 Телефон: ${user.phoneNumber}\n` +
      `📋 Номер заказа: #${payment.orderNumber}\n\n` +
      `🔒 Безопасная оплата через Payme\n\n` +
      `Нажмите кнопку "💳 Перейти к оплате" для оплаты через Payme.\n\n` +
      `После успешной оплаты вы получите уведомление, и доступ к курсу будет автоматически активирован.`,
      keyboard
    )

    console.log('✅ Payment created:', payment.orderNumber)
  } catch (error) {
    console.error('❌ Error creating payment:', error)
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    await ctx.reply('❌ Произошла ошибка при создании платежа. Попробуйте позже.')
  }
})

bot.action('contact_admin', async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  await ctx.reply(
    '📞 Свяжитесь с администратором:\n\n' +
    '• Telegram: @ibrakhimzhanovit\n' +
    '• Email: support@example.com'
  )
})

// Обработчик проверки платежа
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
      await ctx.reply('❌ Платеж не найден.')
      return
    }

    if (payment.status === 'PAID') {
      await ctx.reply(
        '✅ Ваш платеж уже подтвержден! Доступ к курсу активен.\n\n' +
        '📚 Используйте /mycourse для доступа к материалам курса.'
      )
      return
    }

    if (payment.status === 'CANCELLED') {
      await ctx.reply(
        '❌ Этот платеж был отменен.\n\n' +
        'Попробуйте создать новый заказ с помощью команды /buy'
      )
      return
    }

    // В mock режиме просто показываем статус
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Проверить еще раз', `check_payment_${paymentId}`)]
    ])

    const timeElapsed = Math.floor((Date.now() - payment.createdAt.getTime()) / 1000 / 60)

    await ctx.reply(
      `⏳ Ваш платеж находится в обработке\n\n` +
      `📋 Номер заказа: #${payment.orderNumber}\n` +
      `💰 Сумма: ${(payment.amount / 100).toLocaleString()} сум\n` +
      `⏱️ Создан: ${timeElapsed} мин. назад\n\n` +
      `🔍 Если вы уже совершили оплату, подождите несколько секунд и нажмите кнопку "Проверить еще раз".\n\n` +
      `📞 Если возникли проблемы, свяжитесь с поддержкой: @ibrakhimzhanovit`,
      keyboard
    )

  } catch (error) {
    console.error('Error checking payment:', error)
    await ctx.reply('❌ Ошибка при проверке платежа.')
  }
})

// Административные команды
bot.command('admin_stats', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  
  if (!telegramId || !hasAdminAccess(telegramId)) {
    return
  }

  try {
    const totalUsers = await prisma.user.count()
    const paidUsers = await prisma.user.count({ where: { isPaid: true } })
    const totalPayments = await prisma.payment.count()
    const paidPayments = await prisma.payment.count({ where: { status: 'PAID' } })
    const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } })
    
    // Считаем доход
    const paidPaymentsData = await prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { amount: true }
    })
    const totalRevenue = paidPaymentsData.reduce((sum, p) => sum + p.amount, 0)
    
    await ctx.reply(
      `📊 **Статистика бота**\n\n` +
      `👥 **Пользователи:**\n` +
      `• Всего: ${totalUsers}\n` +
      `• Оплативших: ${paidUsers} (${Math.round(paidUsers / totalUsers * 100)}%)\n` +
      `• Не оплативших: ${totalUsers - paidUsers}\n\n` +
      `💳 **Платежи:**\n` +
      `• Всего: ${totalPayments}\n` +
      `• Оплачено: ${paidPayments}\n` +
      `• В ожидании: ${pendingPayments}\n\n` +
      `💰 **Доход:**\n` +
      `• Общий: ${(totalRevenue / 100).toLocaleString()} сум`
    )
  } catch (error) {
    console.error('Error getting stats:', error)
    await ctx.reply('Ошибка при получении статистики.')
  }
})

// Административные обработчики для подтверждения платежей
bot.action(/admin_confirm_(.+)/, async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  const paymentId = ctx.match![1]
  const adminUsername = ctx.from?.username
  const adminUsernames = process.env.ADMIN_IDS?.split(',') || []
  
  if (!adminUsername || !adminUsernames.includes(adminUsername)) {
    await ctx.reply('❌ У вас нет прав для этого действия.')
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

    // Обновляем статус пользователя
    await prisma.user.update({
      where: { id: payment.userId },
      data: { isPaid: true }
    })

    await ctx.reply(`✅ Платеж подтвержден! Заказ #${payment.orderNumber}`)
    
    // Уведомляем пользователя
    try {
      await ctx.telegram.sendMessage(
        payment.user.telegramId.toString(),
        `🎉 Поздравляем! Ваш платеж подтвержден!\n\n` +
        `✅ Доступ к курсу активирован\n` +
        `👤 ID пользователя: ${payment.user.id}\n` +
        `📋 Номер заказа: ${payment.orderNumber}\n\n` +
        `📚 Добро пожаловать на курс! Начинайте обучение прямо сейчас.`
      )
    } catch (error) {
      console.error('Failed to notify user:', error)
    }
  } catch (error) {
    console.error('Error confirming payment:', error)
    await ctx.reply('❌ Ошибка при подтверждении платежа.')
  }
})

bot.action(/admin_reject_(.+)/, async (ctx: BotContext) => {
  await ctx.answerCbQuery()
  
  const paymentId = ctx.match![1]
  const adminUsername = ctx.from?.username
  const adminUsernames = process.env.ADMIN_IDS?.split(',') || []
  
  if (!adminUsername || !adminUsernames.includes(adminUsername)) {
    await ctx.reply('❌ У вас нет прав для этого действия.')
    return
  }

  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
      include: { user: true }
    })

    await ctx.reply(`❌ Платеж отклонен. Заказ #${payment.orderNumber}`)
    
    // Уведомляем пользователя
    try {
      await ctx.telegram.sendMessage(
        payment.user.telegramId.toString(),
        `❌ К сожалению, ваш платеж не был подтвержден.\n\n` +
        `👤 ID пользователя: ${payment.user.id}\n` +
        `📋 Номер заказа: ${payment.orderNumber}\n\n` +
        `📞 Если у вас есть вопросы, свяжитесь с поддержкой: @ibrakhimzhanovit`
      )
    } catch (error) {
      console.error('Failed to notify user:', error)
    }
  } catch (error) {
    console.error('Error rejecting payment:', error)
    await ctx.reply('❌ Ошибка при отклонении платежа.')
  }
})

// ============ АДМИНСКИЕ ОБРАБОТЧИКИ ============

// Кнопка "🔧 Админ-панель"
bot.hears('🔧 Админ-панель', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) {
    await ctx.reply('❌ У вас нет доступа к админ-панели.')
    return
  }
  
  await showAdminPanel(ctx)
})

// Кнопка "🔙 Назад в главное меню"
bot.hears('🔙 Назад в главное меню', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  const isAdmin = telegramId ? hasAdminAccess(telegramId) : false
  
  if (isAdmin) {
    const role = getRoleText(telegramId!)
    const keyboard = Markup.keyboard([
      ['🔧 Админ-панель'],
      ['📚 Купить курс', '💰 Проверить оплату'],
      ['📞 Контакты', '📋 О курсе']
    ]).resize()
    
    await ctx.reply(
      `${role}, выберите действие:`,
      keyboard
    )
  } else {
    const keyboard = Markup.keyboard([
      ['📚 Купить курс', '💰 Проверить оплату'],
      ['📞 Контакты', '📋 О курсе']
    ]).resize()
    
    await ctx.reply(
      'Выберите действие:',
      keyboard
    )
  }
})

// Кнопка "🗂 Экспорт XLSX"
bot.hears('🗂 Экспорт XLSX', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return
  
  await handleExportXLSX(ctx)
})

// Кнопка "🔔 Управление розыгрышем"
bot.hears('🔔 Управление розыгрышем', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return
  
  await handleLotteryControl(ctx)
})

// Кнопка "🎁 Выбрать победителя"
bot.hears('🎁 Выбрать победителя', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return
  
  await handleSelectWinner(ctx)
})

// Кнопка "🏆 История розыгрышей"
bot.hears('🏆 История розыгрышей', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return
  
  await handleLotteryHistory(ctx)
})

// Кнопка "🧾 Чек по userId"
bot.hears('🧾 Чек по userId', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return
  
  await handleCheckUserId(ctx)
})

// Кнопка "📊 Статистика"
bot.hears('📊 Статистика', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) return

  try {
    const totalUsers = await prisma.user.count()
    const paidUsers = await prisma.user.count({ where: { isPaid: true } })
    const totalPayments = await prisma.payment.count()
    const paidPayments = await prisma.payment.count({ where: { status: 'PAID' } })
    const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } })
    
    // Считаем доход
    const paidPaymentsData = await prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { amount: true }
    })
    const totalRevenue = paidPaymentsData.reduce((sum, p) => sum + p.amount, 0)
    
    await ctx.reply(
      `📊 **Статистика бота**\n\n` +
      `👥 **Пользователи:**\n` +
      `• Всего: ${totalUsers}\n` +
      `• Оплативших: ${paidUsers} (${totalUsers > 0 ? Math.round(paidUsers / totalUsers * 100) : 0}%)\n` +
      `• Не оплативших: ${totalUsers - paidUsers}\n\n` +
      `💳 **Платежи:**\n` +
      `• Всего: ${totalPayments}\n` +
      `• Оплачено: ${paidPayments}\n` +
      `• В ожидании: ${pendingPayments}\n\n` +
      `💰 **Доход:**\n` +
      `• Общий: ${(totalRevenue / 100).toLocaleString()} сум`
    )
  } catch (error) {
    console.error('Error getting stats:', error)
    await ctx.reply('❌ Ошибка при получении статистики.')
  }
})

// Обработка UUID для чека (когда админ вводит текст после нажатия "Чек по userId")
bot.on('text', async (ctx: BotContext) => {
  if (!ctx.message || !('text' in ctx.message)) return
  
  const text = ctx.message.text
  const telegramId = ctx.from?.id
  
  // Проверяем, является ли это UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(text)) return // Не UUID, пропускаем
  
  if (!telegramId || !hasAdminAccess(telegramId)) return // Только для админов
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: text },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    
    if (!user) {
      await ctx.reply('❌ Пользователь с таким ID не найден.')
      return
    }
    
    const { maskPhone } = await import('./admin/export-xlsx')
    const maskedPhone = maskPhone(user.phoneNumber || '')
    
    let message = `🧾 **Информация о пользователе**\n\n`
    message += `👤 Имя: ${user.fullName || user.firstName}\n`
    message += `📱 Телефон: ${maskedPhone}\n`
    message += `🆔 Username: @${user.username || 'не указан'}\n`
    message += `💳 Статус: ${user.isPaid ? '✅ Оплачен' : '❌ Не оплачен'}\n`
    message += `📅 Регистрация: ${user.createdAt.toLocaleString('ru-RU')}\n\n`
    
    if (user.payments.length > 0) {
      message += `💰 **Платежи (последние 5):**\n\n`
      for (const payment of user.payments) {
        const statusEmoji = payment.status === 'PAID' ? '✅' : payment.status === 'PENDING' ? '⏳' : '❌'
        message += `${statusEmoji} #${payment.orderNumber} - ${(payment.amount / 100).toLocaleString()} сум\n`
        message += `   ${payment.createdAt.toLocaleString('ru-RU')}\n`
        if (payment.completedAt) {
          message += `   Оплачен: ${payment.completedAt.toLocaleString('ru-RU')}\n`
        }
        message += `\n`
      }
    } else {
      message += `💰 Платежей нет`
    }
    
    await ctx.reply(message)
  } catch (error) {
    console.error('Error checking user:', error)
    await ctx.reply('❌ Ошибка при получении данных пользователя.')
  }
})

// Callback для управления розыгрышем
bot.action('lottery_start', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) {
    await ctx.answerCbQuery('❌ Нет доступа')
    return
  }
  
  await handleLotteryStart(ctx)
})

bot.action('lottery_stop', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) {
    await ctx.answerCbQuery('❌ Нет доступа')
    return
  }
  
  await handleLotteryStop(ctx)
})

bot.action('admin_panel', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) {
    await ctx.answerCbQuery('❌ Нет доступа')
    return
  }
  
  await ctx.answerCbQuery()
  
  // Удаляем предыдущее сообщение
  try {
    await ctx.deleteMessage()
  } catch (error) {
    // Игнорируем ошибку, если сообщение уже удалено
  }
  
  await showAdminPanel(ctx)
})

bot.action('generate_random_receipt', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId || !hasAdminAccess(telegramId)) {
    await ctx.answerCbQuery('❌ Нет доступа')
    return
  }
  
  await handleGenerateRandomReceipt(ctx)
})

export { bot }
