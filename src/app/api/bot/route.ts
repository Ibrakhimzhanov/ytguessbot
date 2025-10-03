import { NextRequest, NextResponse } from 'next/server'
// Важно: сначала импортируем bot-handlers, чтобы зарегистрировать все обработчики
import { bot } from '@/lib/bot-handlers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('📨 Webhook received:', JSON.stringify(body, null, 2))
    
    // Обработка webhook от Telegram
    await bot.handleUpdate(body)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Telegram Bot Webhook Endpoint',
    timestamp: new Date().toISOString()
  })
}
