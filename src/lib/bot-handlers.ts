import { bot, BotContext } from './telegram'
import { prisma } from './prisma'
import { Markup } from 'telegraf'

// Обработчики команд и сообщений
bot.command('buy', async (ctx: BotContext) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💳 Оплатить через Payme', 'pay_payme')],
    [Markup.button.callback('📞 Связаться с админом', 'contact_admin')]
  ])

  await ctx.reply(
    `💰 Стоимость курса: ${(parseInt(process.env.COURSE_PRICE!) / 100).toLocaleString()} сум\n\n` +
    `📚 В курс входит:\n` +
    `• Все видео уроки\n` +
    `• Практические задания\n` +
    `• Поддержка куратора\n` +
    `• Сертификат об окончании\n\n` +
    `Выберите способ оплаты:`,
    keyboard
  )
})

bot.command('status', async (ctx: BotContext) => {
  const telegramId = ctx.from?.id
  if (!telegramId) return

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { payments: true }
    })

    if (!user) {
      await ctx.reply('Вы еще не зарегистрированы в системе.')
      return
    }

    const status = user.isPaid ? '✅ Оплачен' : '❌ Не оплачен'
    await ctx.reply(`Ваш статус: ${status}`)
  } catch (error) {
    console.error('Error checking status:', error)
    await ctx.reply('Произошла ошибка при проверке статуса.')
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
      `💰 Стоимость курса: ${(parseInt(process.env.COURSE_PRICE!) / 100).toLocaleString()} сум\n\n` +
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
  if (!telegramId) return

  try {
    // Получаем данные пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    })

    if (!user) {
      await ctx.reply('❌ Ошибка: пользователь не найден. Пожалуйста, начните заново с /start')
      return
    }

    // Создаем запись о платеже
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: parseInt(process.env.COURSE_PRICE!),
        currency: 'UZS',
        status: 'PENDING'
      }
    })

    // Формируем ссылку на оплату Payme (пример)
    const paymeUrl = `https://payme.uz/checkout?amount=${payment.amount}&order_id=${payment.orderNumber}&phone=${user.phoneNumber}`
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💳 Перейти к оплате', paymeUrl)],
      [Markup.button.callback('✅ Я оплатил', `check_payment_${payment.id}`)]
    ])

    await ctx.reply(
      `💳 **Оплата курса**\n\n` +
      `💰 Сумма: ${(payment.amount / 100).toLocaleString()} сум\n` +
      `📱 Телефон: ${user.phoneNumber}\n` +
      `👤 ID пользователя: ${user.id}\n` +
      `📋 Номер заказа: ${payment.orderNumber}\n\n` +
      `Нажмите кнопку ниже для перехода к оплате:`,
      keyboard
    )
  } catch (error) {
    console.error('Error creating payment:', error)
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
      await ctx.reply('✅ Ваш платеж уже подтвержден! Доступ к курсу активен.')
      return
    }

    // В реальной системе здесь была бы проверка через API Payme
    // Пока сделаем ручную проверку админом
    const adminUsernames = process.env.ADMIN_IDS?.split(',') || []
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Проверить еще раз', `check_payment_${paymentId}`)]
    ])

    await ctx.reply(
      `⏳ Ваш платеж находится в обработке.\n\n` +
      `👤 ID пользователя: ${payment.user.id}\n` +
      `📋 Номер заказа: ${payment.orderNumber}\n` +
      `💰 Сумма: ${(payment.amount / 100).toLocaleString()} сум\n\n` +
      `🔍 Мы проверяем оплату. Это может занять несколько минут.\n` +
      `📞 Если оплата не подтверждается автоматически, свяжитесь с поддержкой: @ibrakhimzhanovit`,
      keyboard
    )

    // Уведомляем админов о новом платеже
    for (const adminUsername of adminUsernames) {
      try {
        const adminKeyboard = Markup.inlineKeyboard([
          [Markup.button.callback('✅ Подтвердить', `admin_confirm_${paymentId}`)],
          [Markup.button.callback('❌ Отклонить', `admin_reject_${paymentId}`)]
        ])
        
        await ctx.telegram.sendMessage(
          `@${adminUsername}`,
          `💳 Новый запрос на проверку платежа:\n\n` +
          `👤 Пользователь: ${payment.user.fullName}\n` +
          `🆔 ID пользователя: ${payment.user.id}\n` +
          `📋 Номер заказа: ${payment.orderNumber}\n` +
          `📱 Телефон: ${payment.user.phoneNumber}\n` +
          `💰 Сумма: ${(payment.amount / 100).toLocaleString()} сум`,
          adminKeyboard
        )
      } catch (error) {
        console.error(`Failed to notify admin ${adminUsername}:`, error)
      }
    }
  } catch (error) {
    console.error('Error checking payment:', error)
    await ctx.reply('❌ Ошибка при проверке платежа.')
  }
})

// Административные команды
bot.command('admin_stats', async (ctx: BotContext) => {
  const username = ctx.from?.username
  const adminUsernames = process.env.ADMIN_IDS?.split(',') || []
  
  if (!username || !adminUsernames.includes(username)) {
    return
  }

  try {
    const totalUsers = await prisma.user.count()
    const paidUsers = await prisma.user.count({ where: { isPaid: true } })
    const totalPayments = await prisma.payment.count()
    
    await ctx.reply(
      `📊 Статистика:\n\n` +
      `👥 Всего пользователей: ${totalUsers}\n` +
      `✅ Оплативших: ${paidUsers}\n` +
      `💰 Всего платежей: ${totalPayments}`
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

export { bot }
