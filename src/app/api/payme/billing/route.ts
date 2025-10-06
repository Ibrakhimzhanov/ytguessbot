// Billing endpoint для запросов от Payme к нашему биллингу
// Этот URL нужно предоставить Payme при регистрации кассы

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bot } from '@/lib/telegram'

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

// Обработка GET запросов - возвращаем ошибку
export async function GET() {
  return NextResponse.json({
    error: {
      code: -32300,
      message: {
        ru: 'Только POST запросы разрешены',
        uz: 'Faqat POST so\'rovlarga ruxsat berilgan',
        en: 'Only POST requests are allowed'
      }
    }
  }, { status: 405 })
}

export async function POST(req: NextRequest) {
  let requestId: number | undefined
  
  try {
    console.log('🔵 Payme Billing Request received')
    
    // Проверка авторизации
    const authHeader = req.headers.get('Authorization')
    
    // Пытаемся прочитать тело запроса для получения id
    let body: MerchantRequest | null = null
    try {
      body = await req.json()
      requestId = body.id
      console.log('📋 Payme Request:')
      console.log('  Method:', body.method)
      console.log('  Params:', JSON.stringify(body.params, null, 2))
      console.log('  ID:', body.id)
    } catch {
      // Если не удалось прочитать body, продолжаем без id
    }
    
    console.log('🔐 Checking authorization...')
    
    if (!authHeader) {
      return NextResponse.json({
        id: requestId,
        error: {
          code: -32504,
          message: {
            ru: 'Заголовок авторизации отсутствует',
            uz: 'Avtorizatsiya sarlavhasi mavjud emas',
            en: 'Authorization header is missing'
          }
        }
      }, { status: 200 })
    }

    // Проверяем базовую авторизацию от Payme
    // Payme отправляет Authorization: Basic base64(Paycom:KEY)
    // где KEY — TEST_KEY в песочнице или KEY в продакшене
    // Нормализуем пароль из переменных окружения:
    //   - PAYME_BASIC_KEY (если задан) содержит только KEY
    //   - PAYME_X_AUTH может быть в форматах:
    //       * "merchant_id:KEY"
    //       * "Paycom:KEY"
    //   В итоге формируем Basic по правилу base64("Paycom:" + KEY)
    const rawEnv = process.env.PAYME_X_AUTH || ''
    const basicKey = process.env.PAYME_BASIC_KEY
      ? process.env.PAYME_BASIC_KEY
      : ((): string => {
          if (!rawEnv) return ''
          // Если значение уже в виде "Paycom:KEY" или "merchant:KEY"
          if (rawEnv.includes(':')) {
            const parts = rawEnv.split(':')
            return parts[1] || ''
          }
          // Если в переменной уже только KEY
          return rawEnv
        })()

    const expectedAuth = Buffer.from(`Paycom:${basicKey}`).toString('base64')
    console.log('🔍 DEBUG: Using KEY length:', basicKey ? basicKey.length : 0)
    console.log('🔍 DEBUG: Expected auth:', `Basic ${expectedAuth}`)
    console.log('🔍 DEBUG: Received auth:', authHeader)
    console.log('🔍 DEBUG: Match:', authHeader === `Basic ${expectedAuth}`)
    if (authHeader !== `Basic ${expectedAuth}`) {
      return NextResponse.json({
        id: requestId,
        error: {
          code: -32504,
          message: {
            ru: 'Неверные учетные данные авторизации',
            uz: 'Avtorizatsiya ma\'lumotlari noto\'g\'ri',
            en: 'Invalid authorization credentials'
          }
        }
      }, { status: 200 })
    }
    
    console.log('✅ Authorization passed')
    
    // Если body уже прочитан, используем его, иначе это ошибка
    if (!body) {
      return NextResponse.json({
        id: requestId,
        error: {
          code: -32700,
          message: {
            ru: 'Невозможно прочитать JSON',
            uz: 'JSON o\'qib bo\'lmadi',
            en: 'Unable to parse JSON'
          }
        }
      }, { status: 200 })
    }

    console.log('📦 Creating response object...')
    const response: MerchantResponse = { id: body.id }
    console.log(`🔀 Switch: method=${body.method}`)

    switch (body.method) {
      case MerchantMethod.CHECK_PERFORM_TRANSACTION:
        console.log('➡️ Calling checkPerformTransaction...')
        response.result = await checkPerformTransaction(body.params)
        console.log('✅ checkPerformTransaction completed')
        break

      case MerchantMethod.CREATE_TRANSACTION:
        console.log('➡️ Calling createTransaction...')
        response.result = await createTransaction(body.params)
        console.log('✅ createTransaction completed')
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
          message: {
            ru: 'Метод не найден',
            uz: 'Metod topilmadi',
            en: 'Method not found'
          }
        }
    }

    console.log('🟢 Payme Response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Payme Billing Error:', error)
    
    // Если это ошибка от методов Payme с кодом и сообщением
    if (error && typeof error === 'object' && 'code' in error) {
      return NextResponse.json({
        id: requestId,
        error: {
          code: error.code,
          message: error.message || {
            ru: 'Неизвестная ошибка',
            uz: 'Noma\'lum xato',
            en: 'Unknown error'
          },
          data: error.data
        }
      }, { status: 200 })
    }
    
    // Общая ошибка
    return NextResponse.json({
      id: requestId,
      error: {
        code: -32400,
        message: {
          ru: 'Неверный запрос',
          uz: 'Noto\'g\'ri so\'rov',
          en: 'Invalid request'
        },
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 200 })
  }
}

// ============ MERCHANT API METHODS ============

/**
 * Проверка возможности создания транзакции
 */
async function checkPerformTransaction(params: any) {
  console.log('⚡ checkPerformTransaction called with:', JSON.stringify(params))
  
  const { account, amount } = params

  // Проверка наличия account
  if (!account) {
    throw { 
      code: -31050, 
      message: {
        ru: 'Параметр account обязателен',
        uz: 'Account parametri majburiy',
        en: 'Parameter account is required'
      }
    }
  }

  // Проверка наличия order_id
  if (!account.order_id) {
    throw { 
      code: -31050, 
      message: {
        ru: 'Параметр order_id обязателен',
        uz: 'order_id parametri majburiy',
        en: 'Parameter order_id is required'
      }
    }
  }

  // Проверка что order_id это число
  const orderNumber = parseInt(account.order_id)
  if (isNaN(orderNumber)) {
    throw { 
      code: -31050, 
      message: {
        ru: 'Неверный формат order_id',
        uz: 'order_id formati noto\'g\'ri',
        en: 'Invalid order_id format'
      }
    }
  }

  // Найти платеж по номеру заказа
  const payment = await prisma.payment.findFirst({
    where: { orderNumber },
    include: { user: true }
  })

  console.log(`🔍 Payment lookup: orderNumber=${orderNumber}, found=${!!payment}`)
  if (payment) {
    console.log(`📦 Payment details: amount=${payment.amount}, status=${payment.status}`)
  }

  if (!payment) {
    throw { 
      code: -31050, 
      message: {
        ru: 'Заказ не найден',
        uz: 'Buyurtma topilmadi',
        en: 'Order not found'
      }
    }
  }

  if (payment.status === 'PAID') {
    throw { 
      code: -31051, 
      message: {
        ru: 'Заказ уже оплачен',
        uz: 'Buyurtma allaqachon to\'langan',
        en: 'Order already paid'
      }
    }
  }

  if (payment.status === 'CANCELLED') {
    throw { 
      code: -31052, 
      message: {
        ru: 'Заказ отменен',
        uz: 'Buyurtma bekor qilingan',
        en: 'Order cancelled'
      }
    }
  }

  // Проверка суммы (amount в тийинах)
  // Преобразуем оба значения в числа для корректного сравнения
  const requestAmount = Number(amount)
  const expectedAmount = Number(payment.amount)
  
  console.log(`💰 Amount check: received=${requestAmount}, expected=${expectedAmount}`)
  
  if (requestAmount !== expectedAmount) {
    throw { 
      code: -31001, 
      message: {
        ru: 'Неверная сумма',
        uz: 'Noto\'g\'ri summa',
        en: 'Invalid amount'
      },
      data: {
        expected: expectedAmount,
        received: requestAmount
      }
    }
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

  // Проверяем возможность создания (выбросит исключение если не пройдет)
  await checkPerformTransaction(params)

  const orderNumber = parseInt(account.order_id)
  
  // Всегда ищем по paymeId с findUnique (требуется @unique индекс)
  const existing = await prisma.payment.findUnique({
    where: { paymeId: id }
  })

  // Если нашли - это повторный запрос, возвращаем ровно сохраненные данные
  if (existing) {
    return {
      create_time: Number(existing.paymeCreateTime!),
      transaction: existing.orderNumber.toString(),
      state: 1
    }
  }

  // Ищем заказ по номеру
  const invoice = await prisma.payment.findFirst({
    where: { orderNumber },
    orderBy: { createdAt: 'desc' }
  })

  if (!invoice) {
    throw { 
      code: -31050, 
      message: {
        ru: 'Заказ не найден',
        uz: 'Buyurtma topilmadi',
        en: 'Order not found'
      }
    }
  }
  
  // Одна активная транзакция на заказ запрещена
  if (invoice.paymeId && invoice.status === 'PENDING') {
    throw {
      code: -31008,
      message: {
        ru: 'Невозможно выполнить операцию',
        uz: 'Operatsiyani bajarish mumkin emas',
        en: 'Unable to perform operation'
      }
    }
  }

  // Атомарно пишем и тут же читаем сохранённое значение
  try {
    const saved = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: invoice.id },
        data: {
          paymeId: id,
          paymeCreateTime: BigInt(time),
          status: 'PENDING'
        }
      })
      
      return tx.payment.findUnique({
        where: { id: invoice.id }
      })
    })

    return {
      create_time: Number(saved!.paymeCreateTime!),
      transaction: saved!.orderNumber.toString(),
      state: 1
    }
  } catch (e: any) {
    // Race condition: другой запрос уже создал транзакцию с этим paymeId
    if (e.code === 'P2002') {
      const existing = await prisma.payment.findUnique({
        where: { paymeId: id }
      })
      return {
        create_time: Number(existing!.paymeCreateTime!),
        transaction: existing!.orderNumber.toString(),
        state: 1
      }
    }
    throw e
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
    throw { 
      code: -31050, 
      message: {
        ru: 'Транзакция не найдена',
        uz: 'Tranzaksiya topilmadi',
        en: 'Transaction not found'
      }
    }
  }

  if (payment.status === 'PAID') {
    return {
      perform_time: Number(payment.paymePerformTime || 0n),
      transaction: payment.orderNumber.toString(),
      state: 2
    }
  }

  // Подтверждаем оплату
  const now = Date.now()
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      completedAt: new Date(now),
      paymePerformTime: BigInt(now)
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
    console.error('Failed to notify user via Telegram:', error)
  }

  return {
    perform_time: now,
    transaction: payment.orderNumber.toString(),
    state: 2
  }
}

/**
 * Отмена транзакции
 */
async function cancelTransaction(params: any) {
  const { id, reason } = params

  // 1) Валидация reason
  if (reason !== undefined && (typeof reason !== 'number' || reason < 1 || reason > 7)) {
    throw {
      code: -31050,
      message: {
        ru: 'Неверная причина отмены',
        uz: 'Bekor qilish sababi noto\'g\'ri',
        en: 'Invalid cancellation reason'
      }
    }
  }

  const payment = await prisma.payment.findFirst({
    where: { paymeId: id }
  })

  if (!payment) {
    throw { 
      code: -31050, 
      message: {
        ru: 'Транзакция не найдена',
        uz: 'Tranzaksiya topilmadi',
        en: 'Transaction not found'
      }
    }
  }

  // 2) Идемпотентность: если уже отменена, вернуть сохраненные данные
  if (payment.status === 'CANCELLED') {
    const cancelled = Number(payment.paymeCancelTime || 0n)
    const state = payment.paymePerformTime ? -2 : -1
    return {
      cancel_time: cancelled,
      transaction: payment.orderNumber.toString(),
      state
    }
  }

  // 3) Вычисляем состояние после отмены (до perform = -1, после = -2)
  const state = payment.paymePerformTime ? -2 : -1
  const now = Date.now()

  // Запоминаем статус до отмены
  const wasPaid = payment.status === 'PAID'
  
  // 4) Сохраняем фиксированное время отмены
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'CANCELLED',
      paymeCancelTime: BigInt(now),
      completedAt: new Date(now)
    }
  })

  // Если был оплачен, убираем статус у пользователя
  if (wasPaid) {
    await prisma.user.update({
      where: { id: payment.userId },
      data: { isPaid: false }
    })
  }

  // Уведомляем пользователя об отмене
  const user = await prisma.user.findUnique({
    where: { id: payment.userId }
  })

  if (user) {
    try {
      await bot.telegram.sendMessage(
        user.telegramId.toString(),
        `❌ Платеж был отменен.\n\n` +
        `📋 Номер заказа: #${payment.orderNumber}\n` +
        `Причина: ${reason || 'Не указана'}\n\n` +
        `Если это произошло по ошибке, вы можете попробовать снова, используя команду /buy`
      )
    } catch (error) {
      console.error('Failed to notify user about cancellation:', error)
    }
  }

  return {
    cancel_time: now,
    transaction: payment.orderNumber.toString(),
    state  // -2 если был perform (paymePerformTime), -1 если не был
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
    throw { 
      code: -31050, 
      message: {
        ru: 'Транзакция не найдена',
        uz: 'Tranzaksiya topilmadi',
        en: 'Transaction not found'
      }
    }
  }

  let state: number
  if (payment.status === 'CANCELLED') {
    // Если была perform (paymePerformTime есть) → -2, иначе → -1
    state = payment.paymePerformTime ? -2 : -1
  } else if (payment.status === 'PAID') {
    state = 2
  } else if (payment.status === 'PENDING') {
    state = 1
  } else {
    state = 0
  }

  return {
    create_time: Number(payment.paymeCreateTime!),
    perform_time: Number(payment.paymePerformTime || 0n),
    cancel_time: Number(payment.paymeCancelTime || 0n),
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
    const state = payment.status === 'CANCELLED'
      ? (payment.paymePerformTime ? -2 : -1)
      : payment.status === 'PAID'
      ? 2
      : payment.status === 'PENDING'
      ? 1
      : 0

    return {
      id: payment.paymeId,
      time: Number(payment.paymeCreateTime!),
      amount: payment.amount,
      account: {
        order_id: payment.orderNumber.toString(),
        user_id: payment.userId
      },
      create_time: Number(payment.paymeCreateTime!),
      perform_time: Number(payment.paymePerformTime || 0n),
      cancel_time: Number(payment.paymeCancelTime || 0n),
      transaction: payment.orderNumber.toString(),
      state,
      reason: null
    }
  })

  return { transactions }
}
