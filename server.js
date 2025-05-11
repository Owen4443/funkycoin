const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Telegram Bot Token from environment variable
const token = process.env.TELEGRAM_BOT_TOKEN;

// ✅ Initialize the bot with polling
const bot = new TelegramBot(token, { polling: true });

// ✅ Basic bot command (for testing)
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🚀 Welcome to FunkyCoin!');
});

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FunkyCoin running at http://localhost:${PORT}`);
});
