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
    await ctx.reply('❌ Sizda admin panelga kirish huquqi yo\'q.')
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
    ['🗂 Ishtirokchilarni eksport qilish', '📊 Statistika'],
    ['🔙 Asosiy menyuga qaytish']
  ]).resize()
  
  await ctx.reply(
    `🔧 Admin paneli\n\n` +
    `👤 Sizning rolingiz: ${role}\n\n` +
    `Harakatni tanlang:`,
    keyboard
  )
}

/**
 * Экспорт XLSX
 */
export async function handleExportXLSX(ctx: BotContext) {
  try {
    await ctx.reply('⏳ XLSX fayl yaratilmoqda...')
    
    const buffer = await generateUsersXLSX()
    const filename = getXLSXFilename()
    
    await ctx.replyWithDocument(
      { source: buffer, filename },
      { caption: '📊 Kurs ishtirokchilarini eksport qilish' }
    )
    
    console.log(`✅ XLSX eksport yuborildi: ${filename}`)
  } catch (error) {
    console.error('❌ Error exporting XLSX:', error)
    await ctx.reply('❌ Fayl yaratishda xatolik')
  }
}
