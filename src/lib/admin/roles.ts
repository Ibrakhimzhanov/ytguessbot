import dotenv from 'dotenv'
dotenv.config()

// Роли админов
export enum AdminRole {
  OWNER = 'owner',
  ADMIN = 'admin'
}

// Конфигурация админов из .env
// Формат: OWNER_IDS=123456789,987654321 (через запятую)
// Формат: ADMIN_IDS=111111111,222222222 (через запятую)

const parseAdminIds = (envVar: string | undefined): bigint[] => {
  if (!envVar) return []
  return envVar.split(',')
    .map(id => id.trim())
    .filter(id => /^\d+$/.test(id)) // Только числовые ID
    .map(id => {
      try {
        return BigInt(id)
      } catch (error) {
        console.warn(`⚠️ Не удалось распарсить ID: ${id}`)
        return BigInt(0)
      }
    })
    .filter(id => id > 0)
}

export const OWNER_IDS = parseAdminIds(process.env.OWNER_IDS)
export const ADMIN_IDS = parseAdminIds(process.env.ADMIN_IDS)

// Все админы (owner + admin)
export const ALL_ADMIN_IDS = [...OWNER_IDS, ...ADMIN_IDS]

/**
 * Проверка является ли пользователь owner
 */
export function isOwner(telegramId: number | bigint): boolean {
  const id = BigInt(telegramId)
  return OWNER_IDS.some(ownerId => ownerId === id)
}

/**
 * Проверка является ли пользователь admin
 */
export function isAdmin(telegramId: number | bigint): boolean {
  const id = BigInt(telegramId)
  return ADMIN_IDS.some(adminId => adminId === id)
}

/**
 * Проверка имеет ли пользователь любую админ роль
 */
export function hasAdminAccess(telegramId: number | bigint): boolean {
  return isOwner(telegramId) || isAdmin(telegramId)
}

/**
 * Получить роль пользователя
 */
export function getUserRole(telegramId: number | bigint): AdminRole | null {
  if (isOwner(telegramId)) return AdminRole.OWNER
  if (isAdmin(telegramId)) return AdminRole.ADMIN
  return null
}

/**
 * Получить текстовое представление роли
 */
export function getRoleText(telegramId: number | bigint): string {
  const role = getUserRole(telegramId)
  if (role === AdminRole.OWNER) return '👑 Owner'
  if (role === AdminRole.ADMIN) return '🔧 Admin'
  return '👤 User'
}

console.log(`🔐 Админы загружены:`)
console.log(`👑 Owners: ${OWNER_IDS.length}`)
console.log(`🔧 Admins: ${ADMIN_IDS.length}`)
