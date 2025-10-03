// Тестовый endpoint для проверки генерации Payme URL
import { NextRequest, NextResponse } from 'next/server'
import { generatePaymeCheckoutUrl } from '@/lib/payme/payme-utils'

export async function GET(req: NextRequest) {
  try {
    const COURSE_PRICE = parseInt(process.env.COURSE_PRICE || '250000000')
    const PAYME_MERCHANT_ID = process.env.PAYME_X_AUTH?.split(':')[0] || ''
    const IS_TEST_MODE = process.env.NODE_ENV !== 'production'

    // Генерируем тестовый URL
    const testOrderId = '999'
    const testUserId = 'test-user-id-123'

    const paymentUrl = generatePaymeCheckoutUrl(
      PAYME_MERCHANT_ID,
      {
        order_id: testOrderId,
        user_id: testUserId
      },
      COURSE_PRICE,
      IS_TEST_MODE
    )

    // Декодируем для проверки
    const base64Part = paymentUrl.split('/').pop() || ''
    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8')
    
    // Парсим параметры (формат: key=value;key2=value2)
    const params: Record<string, any> = {}
    decoded.split(';').forEach(pair => {
      const [key, value] = pair.split('=')
      if (key && value) {
        // Обрабатываем вложенные ключи типа ac.order_id
        if (key.includes('.')) {
          const [parent, child] = key.split('.')
          if (!params[parent]) params[parent] = {}
          params[parent][child] = value
        } else {
          params[key] = value
        }
      }
    })

    return NextResponse.json({
      success: true,
      config: {
        COURSE_PRICE,
        COURSE_PRICE_SUM: COURSE_PRICE / 100,
        PAYME_MERCHANT_ID,
        IS_TEST_MODE,
        PAYME_X_AUTH: process.env.PAYME_X_AUTH ? '✅ Установлен' : '❌ Не найден'
      },
      test_data: {
        order_id: testOrderId,
        user_id: testUserId
      },
      generated_url: paymentUrl,
      decoded_params: params,
      verification: {
        merchant_id_correct: params.m === PAYME_MERCHANT_ID,
        amount_correct: params.a === COURSE_PRICE,
        order_id_correct: params.ac?.order_id === testOrderId,
        user_id_correct: params.ac?.user_id === testUserId
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
