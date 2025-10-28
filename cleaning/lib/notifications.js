const nodemailer = require('nodemailer');
const TelegramBot = require('node-telegram-bot-api');
const { PEOPLE, CLEANING_TIMEZONE } = require('./config');
const { formatDisplayDateTime } = require('./weekUtils');

let mailTransporter;
const telegramBots = new Map(); // Cache de bots por persona

function getMailer() {
  if (!mailTransporter) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be configured to send emails.');
    }

    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  return mailTransporter;
}

function getTelegramBotForPerson(person) {
  if (!person?.telegramBotTokenEnv) {
    console.warn(`No telegramBotTokenEnv configured for ${person.name}.`);
    return null;
  }

  // Si ya tenemos el bot en cache, devolverlo
  if (telegramBots.has(person.id)) {
    return telegramBots.get(person.id);
  }

  // Obtener el token de la variable de entorno específica de la persona
  const token = process.env[person.telegramBotTokenEnv];

  if (!token) {
    console.warn(`Telegram bot token not found in ${person.telegramBotTokenEnv} for ${person.name}.`);
    return null;
  }

  // Crear y cachear el bot
  const bot = new TelegramBot(token);
  telegramBots.set(person.id, bot);

  return bot;
}

function getPersonById(personId) {
  return PEOPLE.find(person => person.id === personId);
}

function getTelegramChatId(person) {
  if (!person?.telegramChatIdEnv) {
    return null;
  }
  return process.env[person.telegramChatIdEnv] || null;
}

function buildTaskListMessage(tasks) {
  if (!tasks || tasks.length === 0) {
    return '¡Todo al día!';
  }

  return tasks.map(task => `- ${task.title}`).join('\n');
}

async function sendTelegramReminder(personId, templateBuilder) {
  const person = getPersonById(personId);
  if (!person) {
    return { success: false, reason: 'person_not_found' };
  }

  const bot = getTelegramBotForPerson(person);
  if (!bot) {
    return { success: false, reason: 'telegram_bot_not_configured' };
  }

  const chatId = getTelegramChatId(person);
  if (!chatId) {
    console.warn(`Telegram chat ID not configured for ${person.name}.`);
    return { success: false, reason: 'chat_id_not_configured' };
  }

  const message = templateBuilder(person);

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown'
  });

  return { success: true };
}

function buildMidweekMessage(person, tasks) {
  const taskList = buildTaskListMessage(tasks);
  const appUrl = process.env.VERCEL_APP_URL || 'https://reminderdave.vercel.app';
  return `¡Hola, ${person.name}! Recordatorio de mitad de semana:\n\n${taskList}\n\n🕐 Límite: domingo 20:00\n\n📋 Marca tus tareas aquí:\n${appUrl}/cleaning-plan`;
}

async function sendMidweekTelegramReminder(personId, tasks) {
  return sendTelegramReminder(personId, person => buildMidweekMessage(person, tasks));
}

async function sendWeekendEmail(personId, tasks, deadlineIso) {
  const person = getPersonById(personId);
  if (!person) {
    throw new Error(`Person ${personId} not found`);
  }

  if (!person.email) {
    console.warn(`Email not configured for ${person.name}`);
    return { success: false, reason: 'email_not_configured' };
  }

  if (!tasks || tasks.length === 0) {
    return { success: false, reason: 'no_pending_tasks' };
  }

  const transporter = getMailer();
  const deadlineFormatted = formatDisplayDateTime(new Date(deadlineIso), 'es-ES', CLEANING_TIMEZONE);
  const appUrl = process.env.VERCEL_APP_URL || 'https://reminderdave.vercel.app';

  const taskItems = tasks
    .map(task => `<li><strong>${task.title}</strong></li>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; text-align: center;">Tareas pendientes de la semana</h2>
      <p>Hola, ${person.name}. Siguen pendientes:</p>
      <ul>${taskItems}</ul>
      <p>Si no las completas hoy, se reprogramarán automáticamente para la semana siguiente.</p>
      <p style="color: #64748b; font-size: 0.9rem;">Límite formal: ${deadlineFormatted}</p>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${appUrl}/cleaning-plan"
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          📋 Marcar tareas como completadas
        </a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Planificación Casa" <${process.env.GMAIL_USER}>`,
    to: person.email,
    subject: '[Casa] Tareas pendientes de la semana',
    html
  });

  return { success: true };
}

function buildSummaryRows(summary) {
  const rows = Object.values(summary.statsByPerson).map(stats => {
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${stats.ownerName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${stats.assigned}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${stats.completed}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${stats.pending}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${stats.missed}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${stats.completionRate}%</td>
      </tr>
    `;
  });

  return rows.join('');
}

function getMonthLabel(summary) {
  const [year, month] = summary.month.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: CLEANING_TIMEZONE,
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function buildMostForgottenSection(summary) {
  if (!summary.mostForgottenTasks || summary.mostForgottenTasks.length === 0) {
    return '<p>Sin tareas olvidadas este mes. ¡Buen trabajo!</p>';
  }

  const items = summary.mostForgottenTasks
    .map(task => `<li><strong>${task.title}</strong>: ${task.misses} vez/veces</li>`)
    .join('');

  return `<ul>${items}</ul>`;
}

function buildSummaryComment(summary) {
  const hasMisses = summary.mostForgottenTasks && summary.mostForgottenTasks.length > 0;
  if (!hasMisses) {
    return '¡Enhorabuena! Equipo al día con todas las tareas.';
  }

  const focusTasks = summary.mostForgottenTasks.slice(0, 3).map(task => task.title);
  return `Revisad estas tareas con más cariño la próxima semana: ${focusTasks.join(', ')}.`;
}

async function sendMonthlySummaryEmail(summary) {
  const transporter = getMailer();
  const monthLabel = getMonthLabel(summary);
  const comment = buildSummaryComment(summary);
  const recipients = PEOPLE.filter(person => !!person.email).map(person => person.email);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Resumen mensual ${monthLabel}</h2>
      <p>Hola equipo, este es el resumen de limpieza del mes.</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #1e293b;">Persona</th>
            <th style="padding: 8px; border-bottom: 2px solid #1e293b;">Asignadas</th>
            <th style="padding: 8px; border-bottom: 2px solid #1e293b;">Hechas</th>
            <th style="padding: 8px; border-bottom: 2px solid #1e293b;">Pendientes</th>
            <th style="padding: 8px; border-bottom: 2px solid #1e293b;">No hechas</th>
            <th style="padding: 8px; border-bottom: 2px solid #1e293b;">% Cumplimiento</th>
          </tr>
        </thead>
        <tbody>
          ${buildSummaryRows(summary)}
        </tbody>
      </table>

      <div style="margin-top: 20px;">
        <h3>Tareas más olvidadas</h3>
        ${buildMostForgottenSection(summary)}
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 8px;">
        <strong>Sugerencia:</strong>
        <p>${comment}</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Planificación Casa" <${process.env.GMAIL_USER}>`,
    to: recipients,
    subject: `[Casa] Resumen mensual ${monthLabel}`,
    html
  });

  return { success: true, recipients };
}

module.exports = {
  sendMidweekTelegramReminder,
  sendWeekendEmail,
  sendMonthlySummaryEmail
};
