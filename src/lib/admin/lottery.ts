import { prisma } from '../prisma'

// Состояние розыгрыша (в памяти)
let lotteryActive = false
let lotteryLocked = false // Защита от двойного клика

/**
 * Проверить активен ли розыгрыш
 */
export function isLotteryActive(): boolean {
  return lotteryActive
}

/**
 * Включить розыгрыш
 */
export function startLottery(): boolean {
  if (lotteryLocked) return false
  lotteryActive = true
  return true
}

/**
 * Остановить розыгрыш
 */
export function stopLottery(): boolean {
  if (lotteryLocked) return false
  lotteryActive = false
  return true
}

/**
 * Проверить залочен ли розыгрыш
 */
export function isLotteryLocked(): boolean {
  return lotteryLocked
}

/**
 * Залочить розыгрыш (защита от двойного клика)
 */
export function lockLottery(): void {
  lotteryLocked = true
}

/**
 * Разлочить розыгрыш
 */
export function unlockLottery(): void {
  lotteryLocked = false
}

/**
 * Получить список участников розыгрыша (оплативших)
 */
export async function getLotteryParticipants() {
  return await prisma.user.findMany({
    where: {
      isPaid: true
    },
    select: {
      id: true,
      telegramId: true,
      firstName: true,
      fullName: true,
      username: true,
      phoneNumber: true
    }
  })
}

/**
 * Выбрать случайного победителя из оплативших
 */
export async function selectRandomWinner() {
  const participants = await getLotteryParticipants()
  
  if (participants.length === 0) {
    return null
  }
  
  // Случайный индекс
  const randomIndex = Math.floor(Math.random() * participants.length)
  return participants[randomIndex]
}

/**
 * Сохранить победителя в БД
 */
export async function saveWinner(userId: string, prize: string) {
  return await prisma.lottery.create({
    data: {
      winnerId: userId,
      prize
    }
  })
}

/**
 * Получить историю розыгрышей
 */
export async function getLotteryHistory(limit: number = 10) {
  return await prisma.lottery.findMany({
    include: {
      winner: {
        select: {
          fullName: true,
          firstName: true,
          username: true,
          phoneNumber: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
}
