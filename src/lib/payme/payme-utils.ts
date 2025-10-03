// Утилиты для работы с Payme

import crypto from 'crypto'

/**
 * Генерирует URL для оплаты через Payme Checkout
 * @param merchantId - ID мерчанта
 * @param accountParams - параметры аккаунта (order_id, user_id и т.д.)
 * @param amount - сумма в тийинах
 * @param isTest - тестовый или продакшн режим
 */
export function generatePaymeCheckoutUrl(
  merchantId: string,
  accountParams: Record<string, string>,
  amount: number,
  isTest: boolean = false
): string {
  const baseUrl = isTest
    ? 'https://checkout.test.paycom.uz'
    : 'https://checkout.paycom.uz'

  // Кодируем параметры в Base64 как требует Payme
  const params: Record<string, any> = {
    m: merchantId,
    a: amount,
    ac: accountParams
  }

  const encoded = Buffer.from(JSON.stringify(params)).toString('base64')
  
  return `${baseUrl}/${encoded}`
}

/**
 * Проверяет авторизацию от Payme
 */
export function verifyPaymeAuth(authHeader: string | null, password: string): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  const base64Credentials = authHeader.substring(6)
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const expectedCredentials = `Paycom:${password}`

  return credentials === expectedCredentials
}

/**
 * Генерирует уникальный ID транзакции для Payme
 */
export function generateTransactionId(): string {
  return crypto.randomBytes(12).toString('hex')
}
