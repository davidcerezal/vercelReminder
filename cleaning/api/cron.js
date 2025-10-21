const {
  CLEANING_TIMEZONE,
  PEOPLE,
  MIDWEEK_REMINDER,
  DEADLINE,
  REPROGRAM_TIME,
  MONTHLY_SUMMARY,
  getWeekOverview,
  markPendingTasksAsMissed,
  reprogramMissedTasksToNextWeek,
  registerNotification,
  notificationAlreadySent,
  generateMonthlySummary
} = require('../lib/service');
const {
  getTimezoneDate,
  getWeekStart,
  formatYMD
} = require('../lib/weekUtils');
const {
  sendMidweekTelegramReminder,
  sendWeekendEmail,
  sendMonthlySummaryEmail
} = require('../lib/notifications');

function matchesSchedule(localDate, schedule) {
  if (schedule.day === 'last') {
    const nextDay = new Date(localDate.getTime());
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    if (nextDay.getUTCMonth() === localDate.getUTCMonth()) {
      return false;
    }
  } else if (typeof schedule.weekday === 'number') {
    if (localDate.getUTCDay() !== schedule.weekday) {
      return false;
    }
  }

  const hour = schedule.hour ?? 0;
  const minute = schedule.minute ?? 0;

  return localDate.getUTCHours() === hour && localDate.getUTCMinutes() === minute;
}

function getTodayString(localDate) {
  return formatYMD(localDate);
}

async function handleMidweekReminder(now) {
  const localNow = getTimezoneDate(now, CLEANING_TIMEZONE);
  const weekStart = formatYMD(getWeekStart(now, CLEANING_TIMEZONE));
  const todayStr = getTodayString(localNow);

  const overview = await getWeekOverview(weekStart);
  const pendingByPerson = overview.pendingByPerson;
  const results = [];

  for (const person of PEOPLE) {
    const pendingTasks = pendingByPerson[person.id] || [];
    if (pendingTasks.length === 0) {
      results.push({ personId: person.id, skipped: true, reason: 'no_pending_tasks' });
      continue;
    }

    if (await notificationAlreadySent('midweek', todayStr, person.id)) {
      results.push({ personId: person.id, skipped: true, reason: 'already_sent' });
      continue;
    }

    try {
      const response = await sendMidweekTelegramReminder(person.id, pendingTasks);
      if (response.success) {
        await registerNotification('midweek', todayStr, person.id);
      }
      results.push({ personId: person.id, ...response });
    } catch (error) {
      console.error(`Error sending midweek reminder to ${person.id}:`, error);
      results.push({ personId: person.id, success: false, error: error.message });
    }
  }

  return {
    event: 'midweek',
    weekStart,
    today: todayStr,
    results
  };
}

async function handleDeadline(now) {
  const localNow = getTimezoneDate(now, CLEANING_TIMEZONE);
  const weekStart = formatYMD(getWeekStart(now, CLEANING_TIMEZONE));
  const todayStr = getTodayString(localNow);

  await markPendingTasksAsMissed(weekStart);
  const overview = await getWeekOverview(weekStart);
  const pendingByPerson = overview.pendingByPerson;
  const results = [];

  for (const person of PEOPLE) {
    const pendingTasks = pendingByPerson[person.id] || [];
    if (pendingTasks.length === 0) {
      results.push({ personId: person.id, skipped: true, reason: 'nothing_to_send' });
      continue;
    }

    if (await notificationAlreadySent('weekend-email', todayStr, person.id)) {
      results.push({ personId: person.id, skipped: true, reason: 'already_sent' });
      continue;
    }

    try {
      const response = await sendWeekendEmail(person.id, pendingTasks, overview.deadlineUtc || now.toISOString());
      if (response.success) {
        await registerNotification('weekend-email', todayStr, person.id);
      }
      results.push({ personId: person.id, ...response });
    } catch (error) {
      console.error(`Error sending weekend email to ${person.id}:`, error);
      results.push({ personId: person.id, success: false, error: error.message });
    }
  }

  return {
    event: 'deadline',
    weekStart,
    today: todayStr,
    results
  };
}

async function handleReprogram(now) {
  const weekStart = formatYMD(getWeekStart(now, CLEANING_TIMEZONE));
  const reprogramResult = await reprogramMissedTasksToNextWeek(weekStart);

  return {
    event: 'reprogram',
    weekStart,
    missedCount: reprogramResult.missedCount
  };
}

async function handleMonthlySummary(now) {
  const localNow = getTimezoneDate(now, CLEANING_TIMEZONE);
  const year = localNow.getUTCFullYear();
  const month = localNow.getUTCMonth() + 1;
  const summary = await generateMonthlySummary(year, month);
  const notificationKey = summary.month;

  if (await notificationAlreadySent('monthly-summary', notificationKey, 'all')) {
    return {
      event: 'monthly-summary',
      summaryMonth: summary.month,
      skipped: true,
      reason: 'already_sent'
    };
  }

  const response = await sendMonthlySummaryEmail(summary);
  if (response.success) {
    await registerNotification('monthly-summary', notificationKey, 'all');
  }

  return {
    event: 'monthly-summary',
    summaryMonth: summary.month,
    recipients: response.recipients,
    success: response.success
  };
}

async function handleEvent(event, now) {
  switch (event) {
    case 'midweek':
      return [await handleMidweekReminder(now)];
    case 'deadline':
      return [await handleDeadline(now)];
    case 'reprogram':
      return [await handleReprogram(now)];
    case 'monthly-summary':
      return [await handleMonthlySummary(now)];
    case 'auto':
    default: {
      const localNow = getTimezoneDate(now, CLEANING_TIMEZONE);
      const results = [];

      if (matchesSchedule(localNow, MIDWEEK_REMINDER)) {
        results.push(await handleMidweekReminder(now));
      }

      if (matchesSchedule(localNow, DEADLINE)) {
        results.push(await handleDeadline(now));
      }

      if (matchesSchedule(localNow, REPROGRAM_TIME)) {
        results.push(await handleReprogram(now));
      }

      if (matchesSchedule(localNow, MONTHLY_SUMMARY)) {
        results.push(await handleMonthlySummary(now));
      }

      if (results.length === 0) {
        results.push({
          event: 'auto',
          message: 'No cleaning events triggered at this time',
          timestamp: now.toISOString()
        });
      }

      return results;
    }
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const event = req.query?.event || req.body?.event || 'auto';
    const now = new Date();
    const results = await handleEvent(event, now);

    return res.status(200).json({
      success: true,
      event,
      results
    });
  } catch (error) {
    console.error('Error in cleaning cron handler:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
