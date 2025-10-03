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

  // Формируем строку параметров в формате Payme: key=value;key2=value2
  // Пример: m=merchant_id;ac.order_id=123;a=500
  const parts: string[] = []
  
  // Добавляем merchant ID
  parts.push(`m=${merchantId}`)
  
  // Добавляем account параметры с префиксом ac.
  for (const [key, value] of Object.entries(accountParams)) {
    parts.push(`ac.${key}=${value}`)
  }
  
  // Добавляем сумму
  parts.push(`a=${amount}`)
  
  // Объединяем через точку с запятой
  const paramsString = parts.join(';')
  
  // Кодируем в Base64
  const encoded = Buffer.from(paramsString).toString('base64')
  
  console.log('🔗 Payme URL params:', paramsString)
  console.log('🔗 Payme URL base64:', encoded)
  
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
