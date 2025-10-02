// Payme Subscribe API TypeScript типы

export interface PaymeConfig {
  merchantId: string
  password: string
  endpointUrl: string
  isTest: boolean
}

// Базовые типы JSON-RPC 2.0
export interface PaymeRequest {
  id: number
  method: string
  params: Record<string, any>
}

export interface PaymeResponse<T = any> {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: PaymeError
}

export interface PaymeError {
  code: number
  message: string
  data?: any
}

// Cards API типы
export interface CardData {
  number: string
  expire: string
}

export interface CardCreateRequest {
  card: CardData
  save?: boolean
  account?: Record<string, any>
  customer?: string
}

export interface CardToken {
  number: string // Masked number like "860006******6311"
  expire: string
  token: string
  recurrent: boolean
  verify: boolean
}

export interface CardVerifyRequest {
  token: string
  code: string
}

export interface CardCheckRequest {
  token: string
}

// Receipts API типы  
export interface ReceiptAccount {
  order_id: string
  user_id: string
}

export interface ReceiptItem {
  title: string
  price: number // в тийинах
  count: number
  code: string // ИКПУ код
  units?: number
  vat_percent: number
  package_code: string
  discount?: number
}

export interface ReceiptShipping {
  title: string
  price: number // в тийинах
}

export interface ReceiptDetail {
  receipt_type: number // 0 для продажи
  items: ReceiptItem[]
  shipping?: ReceiptShipping
}

export interface ReceiptCreateRequest {
  amount: number // в тийинах
  account: ReceiptAccount
  description?: string
  detail?: ReceiptDetail
}

export interface Receipt {
  _id: string
  create_time: number
  pay_time: number
  cancel_time: number
  state: number
  type: number
  external: boolean
  operation: number
  category: any
  error: any
  description: string
  detail: ReceiptDetail
  amount: number
  currency: number
  commission: number
  account: Array<{
    name: string
    title: string
    value: string
    main: boolean
  }>
  card: any
  merchant: {
    _id: string
    name: string
    organization: string
    address: string
    business_id: string
    epos: {
      merchantId: string
      terminalId: string
    }
    date: number
    logo: any
    type: string
    terms: any
  }
  meta: {
    source: string
    owner: string
  }
  processing_id: any
}

export interface ReceiptPayRequest {
  id: string // receipt ID
  token: string // card token
}

export interface ReceiptCheckRequest {
  id: string // receipt ID
}

// Payment states
export enum ReceiptState {
  WAITING = 0,
  PREAUTH = 1, 
  PAID = 2,
  CANCELLED = 3,
  CANCELLED_AFTER_PREAUTH = 4
}

// Error codes
export enum PaymeErrorCode {
  INVALID_CARD = -31001,
  CARD_EXPIRED = -31002,
  CARD_BLOCKED = -31003,
  INSUFFICIENT_FUNDS = -31004,
  TRANSACTION_NOT_FOUND = -31050,
  INVALID_AMOUNT = -31051,
  RECEIPT_NOT_FOUND = -31052,
  RECEIPT_ALREADY_PAID = -31053,
  RECEIPT_CANCELLED = -31054,
  INVALID_TOKEN = -31055
}
