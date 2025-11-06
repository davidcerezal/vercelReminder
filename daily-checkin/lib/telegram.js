const TelegramBot = require('node-telegram-bot-api');

/**
 * Send reminder via Telegram
 */
async function sendReminder(message) {
  const token = process.env.TELEGRAM_DAILY_BOT_TOKEN;
  const chatIdDavid = process.env.TELEGRAM_CHAT_ID;
  const chatIdEva = process.env.TELEGRAM_CHAT_ID_EVA;

  if (!token) {
    console.error('TELEGRAM_DAILY_BOT_TOKEN not configured');
    return { success: false, error: 'Token not configured' };
  }

  if (!chatIdDavid && !chatIdEva) {
    console.error('No TELEGRAM_CHAT_ID configured');
    return { success: false, error: 'Chat ID not configured' };
  }

  try {
    const bot = new TelegramBot(token);
    const baseUrl = process.env.VERCEL_APP_URL || 'http://localhost:3000';
    const checkinUrl = `${baseUrl}/daily-checkin`;

    const messageOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Completar Check-In', url: checkinUrl }
        ]]
      }
    };

    // Send to both chat IDs
    const promises = [];

    if (chatIdDavid) {
      promises.push(bot.sendMessage(chatIdDavid, message, messageOptions));
    }

    if (chatIdEva) {
      promises.push(bot.sendMessage(chatIdEva, message, messageOptions));
    }

    await Promise.all(promises);

    console.log('Daily check-in reminder sent via Telegram to all recipients');
    return { success: true };
  } catch (error) {
    console.error('Error sending Telegram reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create reminder message
 */
function createReminderMessage(isFirstReminder = true) {
  const baseUrl = process.env.VERCEL_APP_URL || 'http://localhost:3000';
  const checkinUrl = `${baseUrl}/daily-checkin`;

  if (isFirstReminder) {
    return `📊 <b>Daily Check-In Reminder</b>

¡Hola! Es hora de registrar tu progreso del día.

Por favor, completa tu check-in diario:
🍎 ¿Has comido bien?
🏃 ¿Has hecho deporte?
📚 ¿Has estudiado algo?
😴 ¿Te has ido pronto a la cama?

👉 <a href="${checkinUrl}">Completar Check-In</a>`;
  } else {
    return `⏰ <b>Recordatorio Final - Daily Check-In</b>

Aún no has registrado tu progreso de hoy.

Este es el último recordatorio del día.

👉 <a href="${checkinUrl}">Completar Check-In Ahora</a>`;
  }
}

module.exports = {
  sendReminder,
  createReminderMessage
};
