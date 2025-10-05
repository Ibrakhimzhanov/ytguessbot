import dotenv from 'dotenv'
dotenv.config()

import { Markup } from 'telegraf'
import { BotContext } from '../telegram'
import { hasAdminAccess, getRoleText } from './roles'
import { generateUsersXLSX, getXLSXFilename } from './export-xlsx'

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
  
  const keyboard = Markup.keyboard([
    ['🗂 Экспорт участников', '📊 Статистика'],
    ['🔙 Назад в главное меню']
  ]).resize()
  
  await ctx.reply(
    `🔧 Админ-панель\n\n` +
    `👤 Ваша роль: ${role}\n\n` +
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
