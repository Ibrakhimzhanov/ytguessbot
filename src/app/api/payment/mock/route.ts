import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bot } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const { receiptId, userId, orderNumber, success } = await req.json()

    console.log('🔵 Mock payment callback:', { receiptId, userId, orderNumber, success })

    if (!receiptId || !userId || !orderNumber) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    // Найти платеж по номеру заказа
    const payment = await prisma.payment.findFirst({
      where: { orderNumber: parseInt(orderNumber) },
      include: { user: true }
    })

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 })
    }

    if (success) {
      // Успешная оплата
      const now = new Date()
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paymeId: receiptId,
          completedAt: now
        }
      })

      // Обновляем статус пользователя
      await prisma.user.update({
        where: { id: payment.userId },
        data: { isPaid: true }
      })

      // Уведомляем пользователя в Telegram
      try {
        await bot.telegram.sendMessage(
          payment.user.telegramId.toString(),
          `🎉 Поздравляем! Ваш платеж успешно подтвержден!\n\n` +
          `✅ Доступ к курсу активирован\n` +
          `📋 Номер заказа: #${payment.orderNumber}\n` +
          `💰 Сумма: ${(payment.amount / 100).toLocaleString()} сум\n\n` +
          `📚 Используйте команду /mycourse для доступа к материалам курса.\n\n` +
          `🎓 Приятного обучения!`
        )
      } catch (error) {
        console.error('Failed to notify user:', error)
      }

      console.log('✅ Mock payment completed successfully')
      return NextResponse.json({ success: true, status: 'paid' })
      
    } else {
      // Отмена оплаты
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELLED',
          completedAt: new Date()
        }
      })

      // Уведомляем пользователя
      try {
        await bot.telegram.sendMessage(
          payment.user.telegramId.toString(),
          `❌ Оплата была отменена.\n\n` +
          `📋 Номер заказа: #${payment.orderNumber}\n\n` +
          `Если это произошло по ошибке, вы можете попробовать снова, используя команду /buy`
        )
      } catch (error) {
        console.error('Failed to notify user:', error)
      }

      console.log('❌ Mock payment cancelled')
      return NextResponse.json({ success: true, status: 'cancelled' })
    }

  } catch (error) {
    console.error('❌ Mock payment error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
