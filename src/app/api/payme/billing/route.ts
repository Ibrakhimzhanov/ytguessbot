// Billing endpoint для запросов от Payme к нашему биллингу
// Этот URL нужно предоставить Payme при регистрации кассы

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Merchant API методы, которые может вызывать Payme
enum MerchantMethod {
  CHECK_PERFORM_TRANSACTION = 'CheckPerformTransaction',
  CREATE_TRANSACTION = 'CreateTransaction', 
  PERFORM_TRANSACTION = 'PerformTransaction',
  CANCEL_TRANSACTION = 'CancelTransaction',
  CHECK_TRANSACTION = 'CheckTransaction',
  GET_STATEMENT = 'GetStatement'
}

interface MerchantRequest {
  id: number
  method: MerchantMethod
  params: {
    account?: {
      order_id?: string
      user_id?: string
    }
    id?: string
    time?: number
    amount?: number
    from?: number
    to?: number
  }
}

interface MerchantResponse {
  id: number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 Payme Billing Request received')
    
    // Проверка авторизации
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({
        error: {
          code: -32504,
          message: 'Authorization header required'
        }
      }, { status: 401 })
    }

    // Проверяем базовую авторизацию от Payme
    const expectedAuth = Buffer.from(`Paycom:${process.env.PAYME_X_AUTH?.split(':')[1] || ''}`).toString('base64')
    if (authHeader !== `Basic ${expectedAuth}`) {
      return NextResponse.json({
        error: {
          code: -32504,
          message: 'Invalid authorization'
        }
      }, { status: 401 })
    }

    const body: MerchantRequest = await req.json()
    console.log('📋 Payme Request:', JSON.stringify(body, null, 2))

    const response: MerchantResponse = { id: body.id }

    switch (body.method) {
      case MerchantMethod.CHECK_PERFORM_TRANSACTION:
        response.result = await checkPerformTransaction(body.params)
        break

      case MerchantMethod.CREATE_TRANSACTION:
        response.result = await createTransaction(body.params)
        break

      case MerchantMethod.PERFORM_TRANSACTION:
        response.result = await performTransaction(body.params)
        break

      case MerchantMethod.CANCEL_TRANSACTION:
        response.result = await cancelTransaction(body.params)
        break

      case MerchantMethod.CHECK_TRANSACTION:
        response.result = await checkTransaction(body.params)
        break

      case MerchantMethod.GET_STATEMENT:
        response.result = await getStatement(body.params)
        break

      default:
        response.error = {
          code: -32601,
          message: 'Method not found'
        }
    }

    console.log('🟢 Payme Response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Payme Billing Error:', error)
    return NextResponse.json({
      error: {
        code: -32400,
        message: 'Invalid request',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 400 })
  }
}

// ============ MERCHANT API METHODS ============

/**
 * Проверка возможности создания транзакции
 */
async function checkPerformTransaction(params: any) {
  const { account, amount } = params

  if (!account?.order_id) {
    throw { code: -31001, message: 'order_id is required' }
  }

  // Найти платеж по номеру заказа
  const payment = await prisma.payment.findFirst({
    where: { orderNumber: parseInt(account.order_id) },
    include: { user: true }
  })

  if (!payment) {
    throw { code: -31050, message: 'Order not found' }
  }

  if (payment.status === 'PAID') {
    throw { code: -31051, message: 'Order already paid' }
  }

  if (payment.status === 'CANCELLED') {
    throw { code: -31052, message: 'Order cancelled' }
  }

  // Проверка суммы (amount в тийинах)
  if (amount !== payment.amount) {
    throw { code: -31001, message: 'Invalid amount' }
  }

  return {
    allow: true
  }
}

/**
 * Создание транзакции
 */
async function createTransaction(params: any) {
  const { account, amount, time, id } = params

  // Проверяем возможность создания
  await checkPerformTransaction(params)

  // Найти платеж
  const payment = await prisma.payment.findFirst({
    where: { orderNumber: parseInt(account.order_id) },
    include: { user: true }
  })

  if (!payment) {
    throw { code: -31050, message: 'Order not found' }
  }

  // Обновить статус и добавить paymeId
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      paymeId: id,
      status: 'PENDING'
    }
  })

  return {
    create_time: time,
    transaction: payment.orderNumber.toString(),
    state: 1
  }
}

/**
 * Проведение транзакции (подтверждение оплаты)
 */
async function performTransaction(params: any) {
  const { id } = params

  const payment = await prisma.payment.findFirst({
    where: { paymeId: id },
    include: { user: true }
  })

  if (!payment) {
    throw { code: -31050, message: 'Transaction not found' }
  }

  if (payment.status === 'PAID') {
    return {
      perform_time: payment.completedAt?.getTime() || Date.now(),
      transaction: payment.orderNumber.toString(),
      state: 2
    }
  }

  // Подтверждаем оплату
  const now = new Date()
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      completedAt: now
    }
  })

  // Обновляем статус пользователя
  await prisma.user.update({
    where: { id: payment.userId },
    data: { isPaid: true }
  })

  return {
    perform_time: now.getTime(),
    transaction: payment.orderNumber.toString(),
    state: 2
  }
}

/**
 * Отмена транзакции
 */
async function cancelTransaction(params: any) {
  const { id, reason } = params

  const payment = await prisma.payment.findFirst({
    where: { paymeId: id }
  })

  if (!payment) {
    throw { code: -31050, message: 'Transaction not found' }
  }

  if (payment.status === 'CANCELLED') {
    return {
      cancel_time: payment.completedAt?.getTime() || Date.now(),
      transaction: payment.orderNumber.toString(),
      state: -2
    }
  }

  // Отменяем платеж
  const now = new Date()
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'CANCELLED',
      completedAt: now
    }
  })

  // Если был оплачен, убираем статус у пользователя
  if (payment.status === 'PAID') {
    await prisma.user.update({
      where: { id: payment.userId },
      data: { isPaid: false }
    })
  }

  return {
    cancel_time: now.getTime(),
    transaction: payment.orderNumber.toString(),
    state: -2
  }
}

/**
 * Проверка состояния транзакции
 */
async function checkTransaction(params: any) {
  const { id } = params

  const payment = await prisma.payment.findFirst({
    where: { paymeId: id }
  })

  if (!payment) {
    throw { code: -31050, message: 'Transaction not found' }
  }

  let state: number
  switch (payment.status) {
    case 'PENDING':
      state = 1
      break
    case 'PAID':
      state = 2
      break
    case 'CANCELLED':
      state = -2
      break
    default:
      state = 0
  }

  return {
    create_time: payment.createdAt.getTime(),
    perform_time: payment.completedAt?.getTime() || 0,
    cancel_time: payment.status === 'CANCELLED' ? (payment.completedAt?.getTime() || 0) : 0,
    transaction: payment.orderNumber.toString(),
    state,
    reason: null
  }
}

/**
 * Получение выписки по транзакциям
 */
async function getStatement(params: any) {
  const { from, to } = params

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to)
      },
      paymeId: { not: null }
    },
    include: { user: true }
  })

  const transactions = payments.map(payment => {
    let state: number
    switch (payment.status) {
      case 'PENDING':
        state = 1
        break
      case 'PAID':
        state = 2
        break
      case 'CANCELLED':
        state = -2
        break
      default:
        state = 0
    }

    return {
      id: payment.paymeId,
      time: payment.createdAt.getTime(),
      amount: payment.amount,
      account: {
        order_id: payment.orderNumber.toString(),
        user_id: payment.userId
      },
      create_time: payment.createdAt.getTime(),
      perform_time: payment.completedAt?.getTime() || 0,
      cancel_time: payment.status === 'CANCELLED' ? (payment.completedAt?.getTime() || 0) : 0,
      transaction: payment.orderNumber.toString(),
      state,
      reason: null
    }
  })

  return { transactions }
}
