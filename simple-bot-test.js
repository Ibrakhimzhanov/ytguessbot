require('dotenv').config();

const { Telegraf } = require('telegraf');

console.log('🧪 Тест простого бота...');

const bot = new Telegraf(process.env.BOT_TOKEN);

console.log('🔑 Bot Token:', process.env.BOT_TOKEN ? 'Найден' : 'НЕ НАЙДЕН');

// Простые обработчики для теста
bot.start((ctx) => {
  console.log('📥 Получена команда /start от:', ctx.from.first_name);
  ctx.reply(`Привет, ${ctx.from.first_name}! Бот работает! 🎉`);
});

bot.help((ctx) => {
  console.log('📥 Получена команда /help от:', ctx.from.first_name);
  ctx.reply('Доступные команды:\n/start - Начать\n/help - Помощь\n/test - Тест');
});

bot.command('test', (ctx) => {
  console.log('📥 Получена команда /test от:', ctx.from.first_name);
  ctx.reply('Тест прошел успешно! ✅');
});

// Обработка всех сообщений
bot.on('message', (ctx) => {
  console.log('📨 Получено сообщение:', ctx.message.text, 'от:', ctx.from.first_name);
  if (ctx.message.text && !ctx.message.text.startsWith('/')) {
    ctx.reply('Я получил ваше сообщение: ' + ctx.message.text);
  }
});

async function startBot() {
  try {
    console.log('🚀 Запуск тестового бота...');
    
    const botInfo = await bot.telegram.getMe();
    console.log(`✅ Подключение к боту: ${botInfo.first_name} (@${botInfo.username})`);
    
    await bot.launch();
    console.log('✅ Бот запущен! Попробуйте написать ему в Telegram');
    console.log('💬 Команды для тестирования: /start, /help, /test');
    console.log('📝 Или просто напишите любое сообщение');
    console.log('🛑 Нажмите Ctrl+C для остановки');
    
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

startBot();
