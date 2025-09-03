const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

async function sendWorkHoursReminder() {
  try {
    const message = `
⏰ *RECORDATORIO DE HORAS* ⏰

¡Hola! 👋

📅 Es el último día laboral del mes y es hora de registrar tus horas de trabajo.

🔔 *Acción requerida:*
• Registrar todas las horas trabajadas este mes
• Revisar que no falte ningún día
• Completar el registro antes de que termine el día

¡No lo olvides! 💪

_Recordatorio automático - ${new Date().toLocaleDateString('es-ES')}_
    `;

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: 'Markdown'
    });

    console.log('Work hours reminder sent via Telegram');
    return true;
  } catch (error) {
    console.error('Failed to send work hours reminder via Telegram:', error);
    return false;
  }
}

async function sendBirthdayMessage(name) {
  try {
    const birthdayEmojis = ['🎉', '🎂', '🎈', '🎁', '🌟', '✨', '🥳', '💝', '🎊', '🌈'];
    const randomEmojis = birthdayEmojis.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    const message = `
${randomEmojis.join(' ')} *¡FELIZ CUMPLEAÑOS!* ${randomEmojis.join(' ')}

🎂 ¡Hoy es el cumpleaños de *${name}*! 🎂

${birthdayEmojis.join(' ')}

¡Que tengas un día maravilloso lleno de alegría, sorpresas y momentos especiales! 🌟

Que todos tus deseos se hagan realidad y que este nuevo año de vida esté lleno de:
• Mucha felicidad 😊
• Grandes aventuras 🚀
• Momentos inolvidables 💫
• Éxitos y logros 🏆
• Salud y bienestar 🌸

¡A celebrar se ha dicho! 🥳🎊

${birthdayEmojis.join(' ')}

_Recordatorio automático de cumpleaños - ${new Date().toLocaleDateString('es-ES')}_
    `;

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: 'Markdown'
    });

    console.log(`Birthday message sent for ${name} via Telegram`);
    return true;
  } catch (error) {
    console.error(`Failed to send birthday message for ${name} via Telegram:`, error);
    return false;
  }
}

module.exports = {
  sendWorkHoursReminder,
  sendBirthdayMessage
};