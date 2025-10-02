import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Обработка webhook от Telegram
    await bot.handleUpdate(body)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Для development - получение обновлений через long polling
export async function GET() {
  if (process.env.NODE_ENV === 'development') {
    try {
      await bot.launch()
      console.log('Bot started in development mode')
      return NextResponse.json({ message: 'Bot started in development mode' })
    } catch (error) {
      console.error('Bot launch error:', error)
      return NextResponse.json({ error: 'Failed to start bot' }, { status: 500 })
    }
  }
  
  return NextResponse.json({ message: 'Webhook endpoint' })
}
