const { createClient } = require('redis');

const DEFAULT_TIMEZONE = 'Europe/Madrid';
const TIMEZONE_KEY = 'daily-checkin:timezone';
const LOG_KEY_PREFIX = 'daily-checkin:log:';

// Create Redis client
let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = await createClient({
      url: process.env.REDIS_URL
    }).connect();
  }
  return redisClient;
}

/**
 * Initialize storage with default timezone if not set
 */
async function initStorage() {
  const redis = await getRedisClient();
  const timezone = await redis.get(TIMEZONE_KEY);
  if (!timezone) {
    await redis.set(TIMEZONE_KEY, DEFAULT_TIMEZONE);
  }
}

/**
 * Read all data from storage (legacy compatibility - not efficient for Redis)
 * @deprecated Use specific get functions instead
 */
async function readData() {
  await initStorage();
  const redis = await getRedisClient();
  const timezone = await redis.get(TIMEZONE_KEY) || DEFAULT_TIMEZONE;

  // Get all log keys
  const keys = await redis.keys(`${LOG_KEY_PREFIX}*`);
  const logs = {};

  for (const key of keys) {
    const date = key.replace(LOG_KEY_PREFIX, '');
    const value = await redis.get(key);
    logs[date] = value ? JSON.parse(value) : null;
  }

  return { timezone, logs };
}

/**
 * Write data to storage (legacy compatibility - not efficient for Redis)
 * @deprecated Use specific set functions instead
 */
async function writeData(data) {
  const redis = await getRedisClient();

  if (data.timezone) {
    await redis.set(TIMEZONE_KEY, data.timezone);
  }

  if (data.logs) {
    for (const [date, log] of Object.entries(data.logs)) {
      await redis.set(`${LOG_KEY_PREFIX}${date}`, JSON.stringify(log));
    }
  }
}

/**
 * Get log entry for a specific date (YYYY-MM-DD)
 */
async function getLog(date) {
  const redis = await getRedisClient();
  const value = await redis.get(`${LOG_KEY_PREFIX}${date}`);
  return value ? JSON.parse(value) : null;
}

/**
 * Save or update log entry for a specific date
 */
async function saveLog(date, logEntry) {
  const redis = await getRedisClient();

  const entry = {
    eaten_well: !!logEntry.eaten_well,
    did_sport: !!logEntry.did_sport,
    studied: !!logEntry.studied,
    slept_early: !!logEntry.slept_early,
    saved_at: new Date().toISOString()
  };

  await redis.set(`${LOG_KEY_PREFIX}${date}`, JSON.stringify(entry));

  return entry;
}

/**
 * Get all logs for a specific month (YYYY-MM)
 */
async function getMonthLogs(yearMonth) {
  const redis = await getRedisClient();

  // Get all log keys that match the month pattern
  const pattern = `${LOG_KEY_PREFIX}${yearMonth}*`;
  const keys = await redis.keys(pattern);
  const logs = {};

  for (const key of keys) {
    const date = key.replace(LOG_KEY_PREFIX, '');
    const value = await redis.get(key);
    logs[date] = value ? JSON.parse(value) : null;
  }

  return logs;
}

/**
 * Get logs within a date range
 */
async function getLogsByRange(startDate, endDate) {
  const redis = await getRedisClient();

  // Get all log keys
  const keys = await redis.keys(`${LOG_KEY_PREFIX}*`);
  const logs = {};

  for (const key of keys) {
    const date = key.replace(LOG_KEY_PREFIX, '');
    if (date >= startDate && date <= endDate) {
      const value = await redis.get(key);
      logs[date] = value ? JSON.parse(value) : null;
    }
  }

  return logs;
}

/**
 * Check if log exists for a specific date
 */
async function hasLog(date) {
  const redis = await getRedisClient();
  const value = await redis.get(`${LOG_KEY_PREFIX}${date}`);
  return value !== null;
}

/**
 * Delete log for a specific date
 */
async function deleteLog(date) {
  const redis = await getRedisClient();
  const key = `${LOG_KEY_PREFIX}${date}`;
  const exists = await redis.get(key);

  if (exists) {
    await redis.del(key);
    return true;
  }
  return false;
}

/**
 * Get timezone configuration
 */
async function getTimezone() {
  await initStorage();
  const redis = await getRedisClient();
  const timezone = await redis.get(TIMEZONE_KEY);
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
