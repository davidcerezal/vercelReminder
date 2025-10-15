const { kv } = require('@vercel/kv');

const DEFAULT_TIMEZONE = 'Europe/Madrid';
const TIMEZONE_KEY = 'daily-checkin:timezone';
const LOG_KEY_PREFIX = 'daily-checkin:log:';

/**
 * Initialize storage with default timezone if not set
 */
async function initStorage() {
  const timezone = await kv.get(TIMEZONE_KEY);
  if (!timezone) {
    await kv.set(TIMEZONE_KEY, DEFAULT_TIMEZONE);
  }
}

/**
 * Read all data from storage (legacy compatibility - not efficient for Redis)
 * @deprecated Use specific get functions instead
 */
async function readData() {
  await initStorage();
  const timezone = await kv.get(TIMEZONE_KEY) || DEFAULT_TIMEZONE;

  // Get all log keys
  const keys = await kv.keys(`${LOG_KEY_PREFIX}*`);
  const logs = {};

  for (const key of keys) {
    const date = key.replace(LOG_KEY_PREFIX, '');
    logs[date] = await kv.get(key);
  }

  return { timezone, logs };
}

/**
 * Write data to storage (legacy compatibility - not efficient for Redis)
 * @deprecated Use specific set functions instead
 */
async function writeData(data) {
  if (data.timezone) {
    await kv.set(TIMEZONE_KEY, data.timezone);
  }

  if (data.logs) {
    for (const [date, log] of Object.entries(data.logs)) {
      await kv.set(`${LOG_KEY_PREFIX}${date}`, log);
    }
  }
}

/**
 * Get log entry for a specific date (YYYY-MM-DD)
 */
async function getLog(date) {
  const log = await kv.get(`${LOG_KEY_PREFIX}${date}`);
  return log || null;
}

/**
 * Save or update log entry for a specific date
 */
async function saveLog(date, logEntry) {
  const entry = {
    eaten_well: !!logEntry.eaten_well,
    did_sport: !!logEntry.did_sport,
    studied: !!logEntry.studied,
    slept_early: !!logEntry.slept_early,
    saved_at: new Date().toISOString()
  };

  await kv.set(`${LOG_KEY_PREFIX}${date}`, entry);

  return entry;
}

/**
 * Get all logs for a specific month (YYYY-MM)
 */
async function getMonthLogs(yearMonth) {
  // Get all log keys that match the month pattern
  const pattern = `${LOG_KEY_PREFIX}${yearMonth}*`;
  const keys = await kv.keys(pattern);
  const logs = {};

  for (const key of keys) {
    const date = key.replace(LOG_KEY_PREFIX, '');
    logs[date] = await kv.get(key);
  }

  return logs;
}

/**
 * Get logs within a date range
 */
async function getLogsByRange(startDate, endDate) {
  // Get all log keys
  const keys = await kv.keys(`${LOG_KEY_PREFIX}*`);
  const logs = {};

  for (const key of keys) {
    const date = key.replace(LOG_KEY_PREFIX, '');
    if (date >= startDate && date <= endDate) {
      logs[date] = await kv.get(key);
    }
  }

  return logs;
}

/**
 * Check if log exists for a specific date
 */
async function hasLog(date) {
  const log = await kv.get(`${LOG_KEY_PREFIX}${date}`);
  return log !== null;
}

/**
 * Delete log for a specific date
 */
async function deleteLog(date) {
  const key = `${LOG_KEY_PREFIX}${date}`;
  const exists = await kv.get(key);

  if (exists) {
    await kv.del(key);
    return true;
  }
  return false;
}

/**
 * Get timezone configuration
 */
async function getTimezone() {
  await initStorage();
  const timezone = await kv.get(TIMEZONE_KEY);
  return timezone || DEFAULT_TIMEZONE;
}

module.exports = {
  initStorage,
  readData,
  writeData,
  getLog,
  saveLog,
  getMonthLogs,
  getLogsByRange,
  hasLog,
  deleteLog,
  getTimezone
};
