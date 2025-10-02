require('dotenv').config();

console.log('🤖 Запуск полноценного курс-бота...');

// Используем tsx для запуска TypeScript файлов
require('child_process').spawn('npx', ['tsx', 'src/lib/bot-start.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

console.log('✅ Бот запускается...');
console.log('📱 Попробуйте написать боту: @YTCodeGuessbot');
console.log('💬 Команды: /start, /buy, /status');
console.log('🔄 Нажмите Ctrl+C для остановки');
