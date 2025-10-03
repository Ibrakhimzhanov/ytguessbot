import dotenv from 'dotenv'
dotenv.config()

import { Markup } from 'telegraf'
import { BotContext } from '../telegram'
import { prisma } from '../prisma'
import { hasAdminAccess, isOwner, getRoleText } from './roles'
import { generateUsersXLSX, getXLSXFilename, maskPhone } from './export-xlsx'
import { 
  isLotteryActive, 
  startLottery, 
  stopLottery, 
  selectRandomWinner,
  saveWinner,
  getLotteryHistory,
  isLotteryLocked,
  lockLottery,
  unlockLottery 
} from './lottery'

/**
 * Middleware для проверки админских прав
 */
export async function adminMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const telegramId = ctx.from?.id
  
  if (!telegramId || !hasAdminAccess(telegramId)) {
    await ctx.reply('❌ У вас нет доступа к админ-панели.')
    return
  }
  
  return next()
}

/**
 * Показать админ-панель
 */
export async function showAdminPanel(ctx: BotContext) {
  const telegramId = ctx.from?.id
  if (!telegramId) return
  
  const role = getRoleText(telegramId)
  const lotteryStatus = isLotteryActive() ? '🔔 Активен' : '⏹ Остановлен'
  
  const keyboard = Markup.keyboard([
    ['🔔 Управление розыгрышем', '🗂 Экспорт XLSX'],
    ['🎁 Выбрать победителя', '🏆 История розыгрышей'],
    ['🧾 Чек по userId', '📊 Статистика'],
    ['🔙 Назад в главное меню']
  ]).resize()
  
  await ctx.reply(
    `🔧 **Админ-панель**\n\n` +
    `👤 Ваша роль: ${role}\n` +
    `🎰 Розыгрыш: ${lotteryStatus}\n\n` +
    `Выберите действие:`,
    keyboard
  )
}

/**
 * Экспорт XLSX
 */
export async function handleExportXLSX(ctx: BotContext) {
  try {
    await ctx.reply('⏳ Генерирую XLSX файл...')
    
    const buffer = await generateUsersXLSX()
    const filename = getXLSXFilename()
    
    await ctx.replyWithDocument(
      { source: buffer, filename },
      { caption: '📊 Экспорт пользователей курса' }
    )
    
    console.log(`✅ XLSX экспорт отправлен: ${filename}`)
  } catch (error) {
    console.error('❌ Error exporting XLSX:', error)
    await ctx.reply('❌ Ошибка при генерации файла')
  }
}

/**
 * Управление розыгрышем
 */
export async function handleLotteryControl(ctx: BotContext) {
  const isActive = isLotteryActive()
  
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(
        isActive ? '⏹ Остановить розыгрыш' : '🔔 Включить розыгрыш',
        isActive ? 'lottery_stop' : 'lottery_start'
      )
    ],
    [Markup.button.callback('🔙 Назад', 'admin_panel')]
  ])
  
  await ctx.reply(
    `🎰 **Управление розыгрышем**\n\n` +
    `Текущий статус: ${isActive ? '🔔 Активен' : '⏹ Остановлен'}\n\n` +
    isActive 
      ? 'Розыгрыш активен. Пользователи могут участвовать после оплаты.'
      : 'Розыгрыш остановлен.',
    keyboard
  )
}

/**
 * Включить розыгрыш
 */
export async function handleLotteryStart(ctx: BotContext) {
  if (isLotteryLocked()) {
    await ctx.answerCbQuery('⏳ Подождите...')
    return
  }
  
  const success = startLottery()
  
  if (success) {
    await ctx.answerCbQuery('✅ Розыгрыш включен!')
    await ctx.editMessageText(
      '✅ Розыгрыш активирован!\n\nВсе пользователи, оплатившие курс, автоматически участвуют.',
      Markup.inlineKeyboard([
        [Markup.button.callback('⏹ Остановить розыгрыш', 'lottery_stop')],
        [Markup.button.callback('🔙 Назад', 'admin_panel')]
      ])
    )
  } else {
    await ctx.answerCbQuery('❌ Ошибка')
  }
}

/**
 * Остановить розыгрыш
 */
export async function handleLotteryStop(ctx: BotContext) {
  if (isLotteryLocked()) {
    await ctx.answerCbQuery('⏳ Подождите...')
    return
  }
  
  const success = stopLottery()
  
  if (success) {
    await ctx.answerCbQuery('⏹ Розыгрыш остановлен')
    await ctx.editMessageText(
      '⏹ Розыгрыш остановлен\n\nНовые участники больше не добавляются автоматически.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔔 Включить розыгрыш', 'lottery_start')],
        [Markup.button.callback('🔙 Назад', 'admin_panel')]
      ])
    )
  } else {
    await ctx.answerCbQuery('❌ Ошибка')
  }
}

/**
 * Выбрать победителя с анимацией
 */
export async function handleSelectWinner(ctx: BotContext) {
  if (isLotteryLocked()) {
    await ctx.reply('⏳ Идет выбор победителя, подождите...')
    return
  }
  
  try {
    lockLottery()
    
    const participants = await prisma.user.findMany({
      where: { isPaid: true }
    })
    
    if (participants.length === 0) {
      await ctx.reply('❌ Нет участников! Необходимо хотя бы один оплативший пользователь.')
      unlockLottery()
      return
    }
    
    // Отправляем начальное сообщение
    const message = await ctx.reply('🎰 Выбираю победителя...')
    
    // Анимация: показываем случайных участников
    const animationSteps = 8
    for (let i = 0; i < animationSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 250)) // 250ms
      
      const randomParticipant = participants[Math.floor(Math.random() * participants.length)]
      const maskedPhone = maskPhone(randomParticipant.phoneNumber || '')
      
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        message.message_id,
        undefined,
        `🎰 Выбираю победителя...\n\n` +
        `👤 ${randomParticipant.fullName || randomParticipant.firstName}\n` +
        `📱 ${maskedPhone}\n` +
        `🆔 @${randomParticipant.username || 'без username'}`
      ).catch(() => {}) // Игнорируем ошибки редактирования
    }
    
    // Финальный выбор
    await new Promise(resolve => setTimeout(resolve, 500))
    const winner = await selectRandomWinner()
    
    if (!winner) {
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        message.message_id,
        undefined,
        '❌ Ошибка при выборе победителя'
      )
      unlockLottery()
      return
    }
    
    // Сохраняем победителя
    await saveWinner(winner.id, 'Главный приз')
    
    const maskedPhone = maskPhone(winner.phoneNumber || '')
    
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      message.message_id,
      undefined,
      `🎉 **ПОБЕДИТЕЛЬ ВЫБРАН!**\n\n` +
      `👤 Имя: ${winner.fullName || winner.firstName}\n` +
      `📱 Телефон: ${maskedPhone}\n` +
      `🆔 Username: @${winner.username || 'не указан'}\n` +
      `🎁 Приз: Главный приз\n\n` +
      `Поздравляем! 🎊`
    )
    
    // Уведомляем победителя
    try {
      await ctx.telegram.sendMessage(
        winner.telegramId.toString(),
        '🎉 **Поздравляем!**\n\n' +
        'Вы стали победителем розыгрыша!\n' +
        'Скоро с вами свяжется администратор для вручения приза.'
      )
    } catch (error) {
      console.error('Failed to notify winner:', error)
    }
    
  } catch (error) {
    console.error('Error selecting winner:', error)
    await ctx.reply('❌ Ошибка при выборе победителя')
  } finally {
    unlockLottery()
  }
}

/**
 * История розыгрышей
 */
export async function handleLotteryHistory(ctx: BotContext) {
  try {
    const history = await getLotteryHistory(10)
    
    if (history.length === 0) {
      await ctx.reply('📋 История розыгрышей пуста')
      return
    }
    
    let message = '🏆 **История розыгрышей** (последние 10)\n\n'
    
    for (const [index, item] of history.entries()) {
      const date = item.createdAt.toLocaleString('ru-RU')
      const winner = item.winner
      const maskedPhone = maskPhone(winner.phoneNumber || '')
      
      message += `${index + 1}. ${date}\n`
      message += `👤 ${winner.fullName || winner.firstName}\n`
      message += `📱 ${maskedPhone}\n`
      message += `🎁 ${item.prize}\n\n`
    }
    
    await ctx.reply(message)
  } catch (error) {
    console.error('Error fetching lottery history:', error)
    await ctx.reply('❌ Ошибка при получении истории')
  }
}

/**
 * Чек по userId
 */
export async function handleCheckUserId(ctx: BotContext) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🎲 Сгенерировать рандомный чек', 'generate_random_receipt')],
    [Markup.button.callback('🔙 Назад', 'admin_panel')]
  ])
  
  await ctx.reply(
    '🧾 **Проверка пользователя**\n\n' +
    'Отправьте User ID для проверки:\n' +
    '(UUID формат, например: a1b2c3d4-...)\n\n' +
    'Или сгенерируйте рандомный чек Payme:',
    keyboard
  )
}

/**
 * Генерация рандомного чека
 */
export async function handleGenerateRandomReceipt(ctx: BotContext) {
  try {
    await ctx.answerCbQuery()
    
    const { generateDetailedReceipt } = await import('./receipt-generator')
    const receipt = generateDetailedReceipt()
    
    await ctx.reply(
      '🧾 **Сгенерирован тестовый чек Payme:**\n\n' +
      '```\n' +
      receipt +
      '\n```',
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('Error generating receipt:', error)
    await ctx.reply('❌ Ошибка при генерации чека')
  }
}
