'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function MockPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const receiptId = searchParams.get('receipt_id')
  const userId = searchParams.get('user_id')
  const orderNumber = searchParams.get('order')
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handlePayment = async (success: boolean) => {
    setStatus('processing')
    setMessage('Обработка платежа...')

    try {
      const response = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId,
          userId,
          orderNumber,
          success
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage(success ? 'Оплата успешно выполнена! ✅' : 'Оплата отменена ❌')
        
        setTimeout(() => {
          window.close()
        }, 2000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Ошибка обработки платежа')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Ошибка соединения с сервером')
    }
  }

  if (!receiptId || !userId || !orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка</h1>
          <p>Неверные параметры платежа</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Тестовая оплата
          </h1>
          <p className="text-gray-600 text-sm">
            Mock Payment Gateway
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Номер заказа:</span>
            <span className="font-semibold">#{orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ID чека:</span>
            <span className="font-mono text-xs">{receiptId.substring(0, 20)}...</span>
          </div>
        </div>

        {status === 'idle' && (
          <>
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Это тестовый режим оплаты. Реальные деньги не списываются.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handlePayment(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>✅</span>
                <span>Симулировать успешную оплату</span>
              </button>

              <button
                onClick={() => handlePayment(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>❌</span>
                <span>Симулировать отмену оплаты</span>
              </button>
            </div>
          </>
        )}

        {status === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {message.includes('успешно') ? '✅' : '❌'}
            </div>
            <p className="text-lg font-semibold text-gray-800">{message}</p>
            <p className="text-sm text-gray-600 mt-2">
              Окно закроется автоматически...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-lg font-semibold text-red-600">{message}</p>
            <button
              onClick={() => {
                setStatus('idle')
                setMessage('')
              }}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <MockPaymentContent />
    </Suspense>
  )
}
