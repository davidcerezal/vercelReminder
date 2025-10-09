const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/daily-checkin.json');
const DEFAULT_TIMEZONE = 'Europe/Madrid';

/**
 * Initialize storage file if it doesn't exist
 */
async function initStorage() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it with default structure
    const defaultData = {
      timezone: DEFAULT_TIMEZONE,
      logs: {}
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

/**
 * Read all data from storage
 */
async function readData() {
  await initStorage();
  const content = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(content);
}

/**
 * Write data to storage
 */
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Get log entry for a specific date (YYYY-MM-DD)
 */
async function getLog(date) {
  const data = await readData();
  return data.logs[date] || null;
}

/**
 * Save or update log entry for a specific date
 */
async function saveLog(date, logEntry) {
  const data = await readData();

  const entry = {
    eaten_well: !!logEntry.eaten_well,
    did_sport: !!logEntry.did_sport,
    studied: !!logEntry.studied,
    slept_early: !!logEntry.slept_early,
    saved_at: new Date().toISOString()
  };

  data.logs[date] = entry;
  await writeData(data);

  return entry;
}

/**
 * Get all logs for a specific month (YYYY-MM)
 */
async function getMonthLogs(yearMonth) {
  const data = await readData();
  const logs = {};

  Object.keys(data.logs).forEach(date => {
    if (date.startsWith(yearMonth)) {
      logs[date] = data.logs[date];
    }
  });

  return logs;
}

/**
 * Get logs within a date range
 */
async function getLogsByRange(startDate, endDate) {
  const data = await readData();
  const logs = {};

  Object.keys(data.logs).forEach(date => {
    if (date >= startDate && date <= endDate) {
      logs[date] = data.logs[date];
    }
  });

  return logs;
}

/**
 * Check if log exists for a specific date
 */
async function hasLog(date) {
  const log = await getLog(date);
  return log !== null;
}

/**
 * Delete log for a specific date
 */
async function deleteLog(date) {
  const data = await readData();
  if (data.logs[date]) {
    delete data.logs[date];
    await writeData(data);
    return true;
  }
  return false;
}

/**
 * Get timezone configuration
 */
async function getTimezone() {
  const data = await readData();
  return data.timezone || DEFAULT_TIMEZONE;
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
