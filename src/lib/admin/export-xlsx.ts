import ExcelJS from 'exceljs'
import { prisma } from '../prisma'

/**
 * Маскирование телефона
 * Формат: +998XX *** ** NN
 * Пример: +99894 123 45 67 -> +9989X *** ** 67
 */
export function maskPhone(phone: string): string {
  // Убираем все нецифровые символы
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length < 12) {
    return phone // Вернем как есть, если формат неверный
  }
  
  // Формат: 998 XX XXX XX NN
  // Показываем: +998XX *** ** NN (последние 2 цифры)
  const countryCode = digits.slice(0, 3) // 998
  const operatorCode = digits.slice(3, 5) // XX (94, 91, etc.)
  const lastTwo = digits.slice(-2) // NN (последние 2)
  
  return `+${countryCode}${operatorCode} *** ** ${lastTwo}`
}

/**
 * Генерация XLSX файла со списком пользователей
 */
export async function generateUsersXLSX(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Пользователи курса')

  // Настройка колонок
  worksheet.columns = [
    { header: 'Номер заказа', key: 'orderNumber', width: 15 },
    { header: 'User ID', key: 'userId', width: 40 },
    { header: 'Имя', key: 'name', width: 25 },
    { header: 'Телефон (маска)', key: 'phone', width: 20 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Дата оплаты', key: 'paidAt', width: 20 }
  ]

  // Стилизация заголовков
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  }
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  // Получаем только пользователей со статусом PAID
  const users = await prisma.user.findMany({
    where: { isPaid: true },
    include: {
      payments: {
        where: { status: 'PAID' },
        orderBy: { completedAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Добавляем данные
  for (const user of users) {
    const lastPayment = user.payments[0]
    
    worksheet.addRow({
      orderNumber: lastPayment?.orderNumber || '-',
      userId: user.id,
      name: user.fullName || user.firstName || '-',
      phone: maskPhone(user.phoneNumber || ''),
      username: user.username ? `@${user.username}` : '-',
      paidAt: lastPayment?.completedAt 
        ? lastPayment.completedAt.toLocaleString('ru-RU') 
        : '-'
    })
  }

  // Применяем границы ко всем ячейкам
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    // Чередующиеся цвета строк (кроме заголовка)
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        }
      })
    }
  })

  // Автоподбор высоты строк
  worksheet.getRow(1).height = 25

  // Генерируем buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Генерация имени файла с текущей датой
 */
export function getXLSXFilename(): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
  return `users_export_${dateStr}_${timeStr}.xlsx`
}
