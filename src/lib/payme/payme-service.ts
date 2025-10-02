// Payme Subscribe API сервис

import {
  PaymeConfig,
  PaymeRequest,
  PaymeResponse,
  CardCreateRequest,
  CardToken,
  CardVerifyRequest,
  CardCheckRequest,
  ReceiptCreateRequest,
  Receipt,
  ReceiptPayRequest,
  ReceiptCheckRequest,
  PaymeError
} from './payme-types'
import { PAYME_ENDPOINTS, PAYME_METHODS } from './payme-constants'

export class PaymeService {
  private config: PaymeConfig
  private requestId: number = 1

  constructor(config: PaymeConfig) {
    this.config = config
  }

  /**
   * Создать PaymeService для тестирования
   */
  static createTestInstance(merchantId: string, password: string): PaymeService {
    return new PaymeService({
      merchantId,
      password,
      endpointUrl: PAYME_ENDPOINTS.TEST,
      isTest: true
    })
  }

  /**
   * Создать PaymeService для продакшена
   */
  static createProductionInstance(merchantId: string, password: string): PaymeService {
    return new PaymeService({
      merchantId,
      password, 
      endpointUrl: PAYME_ENDPOINTS.PRODUCTION,
      isTest: false
    })
  }

  /**
   * Базовый метод для отправки запросов к Payme API
   */
  private async makeRequest<T>(method: string, params: Record<string, any>): Promise<T> {
    const request: PaymeRequest = {
      id: this.requestId++,
      method,
      params
    }

    console.log(`🔵 Payme API Request: ${method}`, JSON.stringify(request, null, 2))

    try {
      const response = await fetch(this.config.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth': `${this.config.merchantId}:${this.config.password}`,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }

      const result: PaymeResponse<T> = await response.json()
      
      console.log(`🟢 Payme API Response: ${method}`, JSON.stringify(result, null, 2))

      if (result.error) {
        throw new PaymeApiError(result.error)
      }

      return result.result!
    } catch (error) {
      console.error(`❌ Payme API Error: ${method}`, error)
      throw error
    }
  }

  // ============ CARDS METHODS ============

  /**
   * Создать токен карты
   */
  async createCard(request: CardCreateRequest): Promise<{ card: CardToken }> {
    return this.makeRequest(PAYME_METHODS.CARDS_CREATE, request)
  }

  /**
   * Запросить код верификации по SMS
   */
  async getVerifyCode(token: string): Promise<{ sent: boolean; phone: string }> {
    return this.makeRequest(PAYME_METHODS.CARDS_GET_VERIFY_CODE, { token })
  }

  /**
   * Верифицировать карту с помощью SMS кода
   */
  async verifyCard(request: CardVerifyRequest): Promise<{ card: CardToken }> {
    return this.makeRequest(PAYME_METHODS.CARDS_VERIFY, request)
  }

  /**
   * Проверить токен карты
   */
  async checkCard(request: CardCheckRequest): Promise<{ card: CardToken }> {
    return this.makeRequest(PAYME_METHODS.CARDS_CHECK, request)
  }

  /**
   * Удалить токен карты
   */
  async removeCard(token: string): Promise<{ success: boolean }> {
    return this.makeRequest(PAYME_METHODS.CARDS_REMOVE, { token })
  }

  // ============ RECEIPTS METHODS ============

  /**
   * Создать чек на оплату
   */
  async createReceipt(request: ReceiptCreateRequest): Promise<{ receipt: Receipt }> {
    return this.makeRequest(PAYME_METHODS.RECEIPTS_CREATE, request)
  }

  /**
   * Оплатить чек по токену карты
   */
  async payReceipt(request: ReceiptPayRequest): Promise<{ receipt: Receipt }> {
    return this.makeRequest(PAYME_METHODS.RECEIPTS_PAY, request)
  }

  /**
   * Проверить статус чека
   */
  async checkReceipt(request: ReceiptCheckRequest): Promise<{ receipt: Receipt }> {
    return this.makeRequest(PAYME_METHODS.RECEIPTS_CHECK, request)
  }

  /**
   * Получить полную информацию по чеку
   */
  async getReceipt(id: string): Promise<{ receipt: Receipt }> {
    return this.makeRequest(PAYME_METHODS.RECEIPTS_GET, { id })
  }

  /**
   * Отменить чек
   */
  async cancelReceipt(id: string): Promise<{ receipt: Receipt }> {
    return this.makeRequest(PAYME_METHODS.RECEIPTS_CANCEL, { id })
  }

  /**
   * Получить все чеки за период
   */
  async getAllReceipts(from: number, to: number, offset = 0, limit = 50): Promise<{ receipts: Receipt[] }> {
    return this.makeRequest(PAYME_METHODS.RECEIPTS_GET_ALL, {
      from,
      to, 
      offset,
      limit
    })
  }

  // ============ HELPER METHODS ============

  /**
   * Создать чек для курса
   */
  async createCourseReceipt(userId: string, orderNumber: number, coursePrice: number): Promise<{ receipt: Receipt }> {
    const request: ReceiptCreateRequest = {
      amount: coursePrice, // уже в тийинах
      account: {
        order_id: orderNumber.toString(),
        user_id: userId
      },
      description: 'Оплата онлайн курса по программированию',
      detail: {
        receipt_type: 0,
        items: [
          {
            title: 'Онлайн курс по программированию',
            price: coursePrice,
            count: 1,
            code: '06201001001000001', // ИКПУ для образовательных услуг
            units: 796, // код единицы измерения
            vat_percent: 12, // НДС 12%
            package_code: 'SERVICE'
          }
        ]
      }
    }

    return this.createReceipt(request)
  }
}

/**
 * Класс ошибки Payme API
 */
export class PaymeApiError extends Error {
  public code: number
  public data?: any

  constructor(error: PaymeError) {
    super(error.message)
    this.name = 'PaymeApiError'
    this.code = error.code
    this.data = error.data
  }

  toString(): string {
    return `PaymeApiError(${this.code}): ${this.message}`
  }
}

/**
 * Создать экземпляр PaymeService из переменных окружения
 */
export function createPaymeService(): PaymeService {
  const authHeader = process.env.PAYME_X_AUTH
  if (!authHeader) {
    throw new Error('PAYME_X_AUTH не задан в переменных окружения')
  }

  const [merchantId, password] = authHeader.split(':')
  if (!merchantId || !password) {
    throw new Error('PAYME_X_AUTH должен быть в формате merchant_id:password')
  }

  const isTest = process.env.NODE_ENV !== 'production'
  
  return isTest 
    ? PaymeService.createTestInstance(merchantId, password)
    : PaymeService.createProductionInstance(merchantId, password)
}
