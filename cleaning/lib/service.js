const { CLEANING_TIMEZONE, PEOPLE, TASKS } = require('./config');
const {
  getWeekDeadlineDate,
  getReprogramDate,
  getWeekRangeStrings,
  parseWeekStart,
  formatYMD,
  formatDisplayDateTime,
  getMonthWeeks
} = require('./weekUtils');
const {
  getWeekData,
  saveWeekData,
  getWeeksData,
  recordNotification,
  hasNotification
} = require('./storage');

function getPeopleMap() {
  return PEOPLE.reduce((acc, person) => {
    acc[person.id] = person;
    return acc;
  }, {});
}

const PEOPLE_MAP = getPeopleMap();

function buildInitialTask(taskConfig, timestampIso) {
  return {
    taskId: taskConfig.id,
    title: taskConfig.title,
    ownerId: taskConfig.ownerId,
    status: 'pending',
    completedBy: null,
    completedAt: null,
    history: [
      {
        action: 'initialized',
        actor: 'system',
        timestamp: timestampIso,
        details: {
          ownerId: taskConfig.ownerId
        }
      }
    ]
  };
}

function createInitialWeek(weekStart) {
  const timestamp = new Date().toISOString();
  const range = getWeekRangeStrings(weekStart);

  return {
    weekStart,
    weekEnd: range.end,
    timezone: CLEANING_TIMEZONE,
    createdAt: timestamp,
    updatedAt: timestamp,
    tasks: TASKS.map(task => buildInitialTask(task, timestamp))
  };
}

async function getOrCreateWeek(weekStart) {
  let weekData = await getWeekData(weekStart);

  if (!weekData) {
    weekData = createInitialWeek(weekStart);
    await saveWeekData(weekStart, weekData);
  }

  return weekData;
}

function cloneTask(task) {
  return JSON.parse(JSON.stringify(task));
}

function ensureTaskExists(weekData, taskId) {
  const task = weekData.tasks.find(t => t.taskId === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found for week ${weekData.weekStart}`);
  }
  return task;
}

async function setTaskCompletion({ weekStart, taskId, completed, actorId }) {
  const week = await getOrCreateWeek(weekStart);
  const task = ensureTaskExists(week, taskId);
  const actor = actorId || task.ownerId;
  const nowIso = new Date().toISOString();
  const previousStatus = task.status;

  if (completed) {
    task.status = 'done';
    task.completedBy = actor;
    task.completedAt = nowIso;
    task.history.push({
      action: 'completed',
      actor,
      timestamp: nowIso,
      details: {
        fromStatus: previousStatus
      }
    });
  } else {
    task.status = 'pending';
    task.completedBy = null;
    task.completedAt = null;
    task.history.push({
      action: previousStatus === 'missed' ? 'reopened_after_missed' : 'reopened',
      actor,
      timestamp: nowIso,
      details: {
        fromStatus: previousStatus
      }
    });
  }

  week.updatedAt = nowIso;
  await saveWeekData(weekStart, week);

  return {
    week,
    task: cloneTask(task)
  };
}

async function markPendingTasksAsMissed(weekStart) {
  const week = await getOrCreateWeek(weekStart);
  const nowIso = new Date().toISOString();
  let updated = false;

  for (const task of week.tasks) {
    if (task.status === 'pending') {
      task.status = 'missed';
      task.history.push({
        action: 'marked_missed',
        actor: 'system',
        timestamp: nowIso
      });
      updated = true;
    }
  }

  if (updated) {
    week.updatedAt = nowIso;
    await saveWeekData(weekStart, week);
  }

  return {
    week,
    updated
  };
}

async function reprogramMissedTasksToNextWeek(weekStart) {
  const currentWeek = await getOrCreateWeek(weekStart);
  const missedTasks = currentWeek.tasks.filter(task => task.status === 'missed');

  const currentStartDate = parseWeekStart(weekStart);
  currentStartDate.setUTCDate(currentStartDate.getUTCDate() + 7);
  const nextWeekStart = formatYMD(currentStartDate);

  const nextWeek = await getOrCreateWeek(nextWeekStart);
  const nowIso = new Date().toISOString();

  if (missedTasks.length > 0) {
    const nextWeekTasksMap = nextWeek.tasks.reduce((acc, task) => {
      acc[task.taskId] = task;
      return acc;
    }, {});

    for (const missed of missedTasks) {
      const target = nextWeekTasksMap[missed.taskId];
      if (target) {
        target.history.push({
          action: 'reprogrammed',
          actor: 'system',
          timestamp: nowIso,
          details: {
            fromWeek: weekStart
          }
        });
      }
    }

    nextWeek.updatedAt = nowIso;
    await saveWeekData(nextWeekStart, nextWeek);
  }

  return {
    currentWeek,
    nextWeek,
    missedCount: missedTasks.length
  };
}

function groupTasksByOwner(week) {
  const byOwner = {};

  for (const task of week.tasks) {
    if (!byOwner[task.ownerId]) {
      byOwner[task.ownerId] = [];
    }
    byOwner[task.ownerId].push(task);
  }

  return byOwner;
}

function getPendingTasksByPerson(week) {
  const tasksByOwner = groupTasksByOwner(week);
  const result = {};

  for (const [ownerId, tasks] of Object.entries(tasksByOwner)) {
    result[ownerId] = tasks.filter(task => task.status !== 'done');
  }

  return result;
}

function buildWeekSummary(week) {
  const byOwner = groupTasksByOwner(week);

  return Object.entries(byOwner).map(([ownerId, tasks]) => {
    const person = PEOPLE_MAP[ownerId];
    const pending = tasks.filter(task => task.status === 'pending').length;
    const missed = tasks.filter(task => task.status === 'missed').length;

    return {
      ownerId,
      ownerName: person?.name || ownerId,
      total: tasks.length,
      done: tasks.filter(task => task.status === 'done').length,
      pending,
      missed
    };
  });
}

async function getWeekOverview(weekStart) {
  const week = await getOrCreateWeek(weekStart);
  const deadlineDate = getWeekDeadlineDate(parseWeekStart(weekStart));
  const reprogramDate = getReprogramDate(parseWeekStart(weekStart));

  return {
    week,
    summary: buildWeekSummary(week),
    deadlineUtc: deadlineDate.toISOString(),
    deadlineFormatted: formatDisplayDateTime(deadlineDate),
    reprogramUtc: reprogramDate.toISOString(),
    reprogramFormatted: formatDisplayDateTime(reprogramDate),
    pendingByPerson: getPendingTasksByPerson(week)
  };
}

async function generateMonthlySummary(year, month) {
  const weekStarts = getMonthWeeks(year, month);
  const weeks = await getWeeksData(weekStarts);
  const statsByPerson = {};
  const missesByTask = {};

  for (const person of PEOPLE) {
    statsByPerson[person.id] = {
      ownerId: person.id,
      ownerName: person.name,
      assigned: 0,
      completed: 0,
      missed: 0,
      pending: 0
    };
  }

  weeks.forEach((week, index) => {
    if (!week) {
      return;
    }

    for (const task of week.tasks) {
      const personStats = statsByPerson[task.ownerId];
      if (!personStats) {
        continue;
      }

      personStats.assigned += 1;

      if (task.status === 'done') {
        personStats.completed += 1;
      } else if (task.status === 'missed') {
        personStats.missed += 1;
        missesByTask[task.taskId] = (missesByTask[task.taskId] || 0) + 1;
      } else {
        personStats.pending += 1;
      }
    }
  });

  for (const stats of Object.values(statsByPerson)) {
    stats.completionRate = stats.assigned === 0 ? 0 : Math.round((stats.completed / stats.assigned) * 100);
  }

  const mostForgottenTasks = Object.entries(missesByTask)
    .map(([taskId, misses]) => {
      const taskConfig = TASKS.find(task => task.id === taskId);
      return {
        taskId,
        title: taskConfig?.title || taskId,
        misses
      };
    })
    .sort((a, b) => b.misses - a.misses);

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    timezone: CLEANING_TIMEZONE,
    statsByPerson,
    mostForgottenTasks,
    totalWeeks: weeks.filter(Boolean).length,
    generatedAt: new Date().toISOString(),
    weekStarts
  };
}

async function registerNotification(type, dateStr, personId) {
  await recordNotification(type, dateStr, personId);
}

async function notificationAlreadySent(type, dateStr, personId) {
  return hasNotification(type, dateStr, personId);
}

module.exports = {
  CLEANING_TIMEZONE,
  PEOPLE,
  TASKS,
  PEOPLE_MAP,
  getOrCreateWeek,
  setTaskCompletion,
  getWeekOverview,
  markPendingTasksAsMissed,
  reprogramMissedTasksToNextWeek,
  getPendingTasksByPerson,
  generateMonthlySummary,
  registerNotification,
  notificationAlreadySent
};
