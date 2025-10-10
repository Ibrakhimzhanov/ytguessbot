// Payme Subscribe API константы

export const PAYME_ENDPOINTS = {
  TEST: 'https://checkout.test.paycom.uz/api',
  PRODUCTION: 'https://checkout.paycom.uz/api'
} as const

export const PAYME_METHODS = {
  // Cards methods
  CARDS_CREATE: 'cards.create',
  CARDS_GET_VERIFY_CODE: 'cards.get_verify_code', 
  CARDS_VERIFY: 'cards.verify',
  CARDS_CHECK: 'cards.check',
  CARDS_REMOVE: 'cards.remove',
  
  // Receipts methods
  RECEIPTS_CREATE: 'receipts.create',
  RECEIPTS_PAY: 'receipts.pay',
  RECEIPTS_SEND: 'receipts.send',
  RECEIPTS_CANCEL: 'receipts.cancel',
  RECEIPTS_CHECK: 'receipts.check',
  RECEIPTS_GET: 'receipts.get',
  RECEIPTS_GET_ALL: 'receipts.get_all'
} as const

// Payme error messages (русский)
export const PAYME_ERROR_MESSAGES = {
  [-31001]: 'Неверные данные карты',
  [-31002]: 'Срок действия карты истек',
  [-31003]: 'Карта заблокирована',
  [-31004]: 'Недостаточно средств на карте', 
  [-31050]: 'Транзакция не найдена',
  [-31051]: 'Неверная сумма платежа',
  [-31052]: 'Чек не найден',
  [-31053]: 'Чек уже оплачен',
  [-31054]: 'Чек отменен',
  [-31055]: 'Неверный токен карты'
} as const

// Тестовые карты для разработки
export const TEST_CARDS = {
  SUCCESS: {
    number: '8600069195406311',
    expire: '0399'
  },
  SMS_NOT_CONNECTED: {
    number: '8600060921090842', 
    expire: '0399'
  },
  EXPIRED: {
    number: '3333336415804657',
    expire: '0399' 
  },
  BLOCKED: {
    number: '4444445987459073',
    expire: '0399'
  },
  SYSTEM_ERROR: {
    number: '8600143417770323',
    expire: '0399'
  }
} as const

// SMS код для всех тестовых карт
export const TEST_SMS_CODE = '666666'

// Курс продукт для чека
export const COURSE_PRODUCT = {
  title: 'Онлайн курс по ютубу',
  code: '06201001001000001', // ИКПУ код для образовательных услуг
  units: 796, // код единицы измерения для услуг
  vat_percent: 12, // НДС для образовательных услуг в УЗ
  package_code: 'SERVICE' // код упаковки для услуг
} as const

// Валюта
export const CURRENCY_UZS = 860
