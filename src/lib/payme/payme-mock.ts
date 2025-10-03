// Mock Payme service для тестирования без реальных ключей

import { 
  PaymeConfig,
  CardCreateRequest,
  CardToken,
  CardVerifyRequest,
  ReceiptCreateRequest,
  Receipt,
  ReceiptPayRequest,
  ReceiptCheckRequest,
  ReceiptState
} from './payme-types'

/**
 * Mock PaymeService для тестирования
 * Симулирует работу Payme API без реальных запросов
 */
export class MockPaymeService {
  private mockReceipts: Map<string, Receipt> = new Map()
  private mockCards: Map<string, CardToken> = new Map()
  private receiptCounter = 1000

  /**
   * Создать mock токен карты
   */
  async createCard(request: CardCreateRequest): Promise<{ card: CardToken }> {
    console.log('🟡 [MOCK] Creating card token...')
    
    await this.simulateDelay(500)

    const token = `mock_card_token_${Date.now()}`
    const cardToken: CardToken = {
      number: request.card.number.replace(/(\d{6})\d+(\d{4})/, '$1******$2'),
      expire: request.card.expire,
      token,
      recurrent: true,
      verify: false
    }

    this.mockCards.set(token, cardToken)
    
    console.log('✅ [MOCK] Card token created:', token)
    return { card: cardToken }
  }

  /**
   * Запросить SMS код (mock)
   */
  async getVerifyCode(token: string): Promise<{ sent: boolean; phone: string }> {
    console.log('🟡 [MOCK] Sending SMS code...')
    
    await this.simulateDelay(300)

    if (!this.mockCards.has(token)) {
      throw new Error('Invalid token')
    }

    console.log('✅ [MOCK] SMS code sent (mock code: 123456)')
    return {
      sent: true,
      phone: '+998901234567'
    }
  }

  /**
   * Верифицировать карту (mock)
   */
  async verifyCard(request: CardVerifyRequest): Promise<{ card: CardToken }> {
    console.log('🟡 [MOCK] Verifying card...')
    
    await this.simulateDelay(500)

    const card = this.mockCards.get(request.token)
    if (!card) {
      throw new Error('Invalid token')
    }

    // В mock режиме принимаем любой код
    card.verify = true
    
    console.log('✅ [MOCK] Card verified')
    return { card }
  }

  /**
   * Создать чек (mock)
   */
  async createReceipt(request: ReceiptCreateRequest): Promise<{ receipt: Receipt }> {
    console.log('🟡 [MOCK] Creating receipt...')
    
    await this.simulateDelay(500)

    const receiptId = `mock_receipt_${this.receiptCounter++}_${Date.now()}`
    const now = Date.now()

    const receipt: Receipt = {
      _id: receiptId,
      create_time: now,
      pay_time: 0,
      cancel_time: 0,
      state: ReceiptState.WAITING,
      type: 2,
      external: false,
      operation: -1,
      category: null,
      error: null,
      description: request.description || 'Mock payment',
      detail: request.detail || {
        receipt_type: 0,
        items: []
      },
      amount: request.amount,
      currency: 860,
      commission: 0,
      account: [
        {
          name: 'order_id',
          title: 'Номер заказа',
          value: request.account.order_id,
          main: true
        },
        {
          name: 'user_id',
          title: 'ID пользователя',
          value: request.account.user_id,
          main: false
        }
      ],
      card: null,
      merchant: {
        _id: 'mock_merchant_id',
        name: 'Test Merchant',
        organization: 'Test Organization',
        address: 'Test Address',
        business_id: '123456789',
        epos: {
          merchantId: 'mock_merchant',
          terminalId: 'mock_terminal'
        },
        date: now,
        logo: null,
        type: 'test',
        terms: null
      },
      meta: {
        source: 'subscribe',
        owner: 'mock_owner'
      },
      processing_id: null
    }

    this.mockReceipts.set(receiptId, receipt)
    
    console.log('✅ [MOCK] Receipt created:', receiptId)
    return { receipt }
  }

  /**
   * Оплатить чек (mock) - симулирует успешную оплату
   */
  async payReceipt(request: ReceiptPayRequest): Promise<{ receipt: Receipt }> {
    console.log('🟡 [MOCK] Paying receipt...')
    
    await this.simulateDelay(1000) // Симулируем задержку обработки

    const receipt = this.mockReceipts.get(request.id)
    if (!receipt) {
      throw new Error('Receipt not found')
    }

    const card = this.mockCards.get(request.token)
    if (!card) {
      throw new Error('Invalid card token')
    }

    // Симулируем успешную оплату
    const now = Date.now()
    receipt.state = ReceiptState.PAID
    receipt.pay_time = now
    receipt.card = {
      number: card.number,
      expire: card.expire
    }

    console.log('✅ [MOCK] Receipt paid successfully:', request.id)
    return { receipt }
  }

  /**
   * Проверить статус чека (mock)
   */
  async checkReceipt(request: ReceiptCheckRequest): Promise<{ receipt: Receipt }> {
    console.log('🟡 [MOCK] Checking receipt...')
    
    await this.simulateDelay(200)

    const receipt = this.mockReceipts.get(request.id)
    if (!receipt) {
      throw new Error('Receipt not found')
    }

    console.log('✅ [MOCK] Receipt status:', receipt.state)
    return { receipt }
  }

  /**
   * Отменить чек (mock)
   */
  async cancelReceipt(id: string): Promise<{ receipt: Receipt }> {
    console.log('🟡 [MOCK] Cancelling receipt...')
    
    await this.simulateDelay(300)

    const receipt = this.mockReceipts.get(id)
    if (!receipt) {
      throw new Error('Receipt not found')
    }

    receipt.state = ReceiptState.CANCELLED
    receipt.cancel_time = Date.now()

    console.log('✅ [MOCK] Receipt cancelled')
    return { receipt }
  }

  /**
   * Создать чек для курса (упрощенный метод)
   */
  async createCourseReceipt(
    userId: string, 
    orderNumber: number, 
    coursePrice: number
  ): Promise<{ receipt: Receipt }> {
    const request: ReceiptCreateRequest = {
      amount: coursePrice,
      account: {
        order_id: orderNumber.toString(),
        user_id: userId
      },
      description: 'Оплата онлайн курса по программированию (ТЕСТ)',
      detail: {
        receipt_type: 0,
        items: [
          {
            title: 'Онлайн курс по программированию',
            price: coursePrice,
            count: 1,
            code: '06201001001000001',
            units: 796,
            vat_percent: 12,
            package_code: 'SERVICE'
          }
        ]
      }
    }

    return this.createReceipt(request)
  }

  /**
   * Симулировать автоматическую успешную оплату (для тестирования)
   */
  async simulateSuccessfulPayment(receiptId: string): Promise<{ receipt: Receipt }> {
    console.log('🟡 [MOCK] Simulating automatic successful payment...')
    
    await this.simulateDelay(2000)

    const receipt = this.mockReceipts.get(receiptId)
    if (!receipt) {
      throw new Error('Receipt not found')
    }

    receipt.state = ReceiptState.PAID
    receipt.pay_time = Date.now()

    console.log('✅ [MOCK] Payment simulated successfully')
    return { receipt }
  }

  /**
   * Получить URL для оплаты (mock)
   */
  getMockPaymentUrl(receiptId: string, userId: string, orderNumber: number): string {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
    return `${baseUrl}/payment/mock?receipt_id=${receiptId}&user_id=${userId}&order=${orderNumber}`
  }

  /**
   * Симулировать задержку
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Очистить все mock данные
   */
  clearMockData(): void {
    this.mockReceipts.clear()
    this.mockCards.clear()
    this.receiptCounter = 1000
    console.log('🗑️ [MOCK] All mock data cleared')
  }
}

/**
 * Создать mock экземпляр Payme сервиса
 */
export function createMockPaymeService(): MockPaymeService {
  console.log('⚠️ Using MOCK Payme Service - no real payments will be processed')
  return new MockPaymeService()
}
