// Тестовый скрипт для проверки Payme endpoint локально

const PAYME_X_AUTH = 'Paycom:GjdJQHqcqjYFmZDpjhbM#rXdYAPq7XnB0GyM'
const authHeader = Buffer.from(PAYME_X_AUTH).toString('base64')

console.log('🔑 Auth header:', `Basic ${authHeader}`)
console.log('')

// Тест 1: CheckPerformTransaction с неверной суммой (должна вернуться ошибка -31001)
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'CheckPerformTransaction',
  params: {
    amount: 1, // Неверная сумма (в базе 250000000)
    account: {
      order_id: '46'
    }
  }
}

console.log('📤 Sending request:', JSON.stringify(testRequest, null, 2))
console.log('')

fetch('http://localhost:3000/api/payme/billing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${authHeader}`
  },
  body: JSON.stringify(testRequest)
})
  .then(res => res.json())
  .then(data => {
    console.log('📥 Response:', JSON.stringify(data, null, 2))
    console.log('')
    
    if (data.error && data.error.code === -31001) {
      console.log('✅ SUCCESS! Получена ошибка -31001 (неверная сумма)')
    } else {
      console.log('❌ FAIL! Ожидалась ошибка -31001, но получено:', data)
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message)
  })
