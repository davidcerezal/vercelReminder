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

function getRandomBirthdayMessage(name) {
  const messages = [
    `¡Feliz cumple ${name}! 🎉🎂 Pasa un lindo día! 🥳🎈🎊`,
    `¡Que cumplas muchos más ${name}! 🎁🎉 Disfruta tu día especial! 🎂🎈🥳`,
    `¡Felicidades en tu día ${name}! 🌟🎊 A celebrar se ha dicho! ✨🎁🎂`,
    `¡Feliz cumpleaños ${name}! 🎂🎉 ¡Que la pases increíble! 🥳🎈🍰`,
    `¡Muchas felicidades ${name}! 😊🎂 ¡A disfrutar el día! 🎉🎁🎈`,
    `¡Feliz cumple querido ${name}! 🥳🎉 ¡Dale que es tu día! 🎂🎊🎁`,
    `¡Que tengas un cumpleaños genial ${name}! 🎈🎁 ¡Disfrútalo al máximo! 🎉🎂🥳`,
    `¡Felicidades ${name}! 🌈🎂 ¡Que la pases bomba! 🎉🎊🎈`,
    `¡Feliz cumpleaños ${name}! 💫🎊 ¡A celebrar como se debe! 🎂🥳🎁`,
    `¡Muchas felicidades en tu día ${name}! 🎉🥳 ¡Que sea épico! 🎂🎈🍰`,
    `¡Feliz cumple ${name}! 🌸🎈 ¡Que tengas un día brutal! 🎉🎂🎊`,
    `¡Felicidades en tu cumpleaños ${name}! 🎁✨ ¡Que sea inolvidable! 🎂🥳🎉`,
    `¡Feliz cumple ${name}! 🎂🌟 ¡Que lo disfrutes un montón! 🎉🎈🎊`,
    `¡Muchas felicidades ${name}! 🎊🎉 ¡Que esté lleno de sorpresas! 🎂🎁🥳`,
    `¡Feliz cumpleaños ${name}! 💝🥳 ¡A pasarla bien! 🎂🎉🎈`,
    `¡Felicidades ${name}! 😊🎈 ¡Que sea un día de película! 🎂🎉🎊`,
    `¡Feliz cumple ${name}! 🚀🎁 ¡Que tengas un día de lujo! 🎂🥳🎉`,
    `¡Muchas felicidades en tu día ${name}! 🌟🎂 ¡Que sea increíble! 🎉🎈🎊`,
    `¡Feliz cumpleaños ${name}! ✨🎊 ¡Que sea un día top! 🎂🥳🎁`,
    `¡Feliz cumple ${name}! 🥳🎉 ¡Que lo disfrutes al máximo! 🎂🎈🎊`
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

async function sendBirthdayMessage(name, birthdayDate) {
  try {
    // Primer mensaje: Información del cumpleaños
    const infoMessage = `🎂 **CUMPLEAÑOS HOY** 🎂\n\n👤 **${name}**\n📅 **${birthdayDate}**`;

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, infoMessage, {
      parse_mode: 'Markdown'
    });

    // Pequeña pausa entre mensajes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Segundo mensaje: Mensaje aleatorio para copiar
    const randomMessage = getRandomBirthdayMessage(name);
    const copyMessage = `${randomMessage}`;

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, copyMessage, {
      parse_mode: 'Markdown'
    });

    console.log(`Birthday messages sent for ${name} via Telegram`);
    return true;
  } catch (error) {
    console.error(`Failed to send birthday messages for ${name} via Telegram:`, error);
    return false;
  }
}

async function sendDailyConfirmation(date = new Date()) {
  try {
    const currentDate = new Date(date);

    // Debug timezone information
    const utcDate = currentDate.toISOString();
    const localDate = currentDate.toLocaleDateString('es-ES');
    const localTime = currentDate.toLocaleTimeString('es-ES');
    const dayMonth = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const message = `
✅ *PROCESADO OK* ✅

📅 **Fecha:** ${localDate}
🕐 **Hora:** ${localTime}
🌍 **UTC:** ${utcDate}
📍 **Día/Mes:** ${dayMonth}

🔍 **Debug Info:**
• Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
• Timestamp: ${currentDate.getTime()}
• Día del año: ${Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))}

✨ Sistema de recordatorios funcionando correctamente
    `;

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: 'Markdown'
    });

    console.log('Daily confirmation message sent via Telegram');
    return true;
  } catch (error) {
    console.error('Failed to send daily confirmation via Telegram:', error);
    return false;
  }
}

module.exports = {
  sendWorkHoursReminder,
  sendBirthdayMessage,
  sendDailyConfirmation
};