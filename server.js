const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const app = express();

const PORT = process.env.PORT || 3000;
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

app.use(express.static(path.join(__dirname, 'public')));

// /start command sends button to open web app
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, '🚀 Open FunkyCoin Web App:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 Open App',
          web_app: { url: 'https://funkycoin.onrender.com' }
        }
      ]]
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FunkyCoin running at http://localhost:${PORT}`);
});
