export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Telegram Course Bot
        </h1>
        <div className="text-center">
          <p className="text-lg mb-4">
            Бот для продажи курсов в Telegram
          </p>
          <p className="text-gray-600">
            Статус: Запущен и готов к работе
          </p>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Возможности бота:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Регистрация пользователей</li>
              <li>Прием оплаты через Payme</li>
              <li>Управление доступом к курсу</li>
              <li>Административная панель</li>
              <li>Система лотереи</li>
            </ul>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Технологии:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Next.js 14</li>
              <li>TypeScript</li>
              <li>Prisma ORM</li>
              <li>PostgreSQL</li>
              <li>Telegraf.js</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
