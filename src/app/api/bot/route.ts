import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Простая проверка подключения к БД
    const userCount = await prisma.user.count()
    
    return NextResponse.json({ 
      status: 'Bot is running',
      database: 'Connected',
      users: userCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      status: 'Bot is running',
      database: 'Error connecting',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
