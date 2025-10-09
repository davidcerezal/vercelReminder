const storage = require('../lib/storage');
const dateUtils = require('../lib/dateUtils');

/**
 * API handler for daily check-in data operations
 * Supports GET (retrieve) and POST (save) operations
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'POST') {
      return await handlePost(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in data API:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Handle GET requests
 * Query params:
 * - date: specific date (YYYY-MM-DD)
 * - month: specific month (YYYY-MM)
 */
async function handleGet(req, res) {
  const { date, month } = req.query;
  const timezone = await storage.getTimezone();

  if (date) {
    // Get specific date log
    const log = await storage.getLog(date);
    return res.status(200).json({
      date,
      log,
      timezone
    });
  }

  if (month) {
    // Get all logs for a specific month
    const logs = await storage.getMonthLogs(month);
    return res.status(200).json({
      month,
      logs,
      timezone
    });
  }

  // Default: return current month logs
  const currentMonth = dateUtils.getCurrentYearMonth(timezone);
  const logs = await storage.getMonthLogs(currentMonth);
  const today = dateUtils.getTodayString(timezone);

  return res.status(200).json({
    month: currentMonth,
    today,
    logs,
    timezone
  });
}

/**
 * Handle POST requests
 * Body should contain:
 * - date: YYYY-MM-DD
 * - eaten_well: boolean
 * - did_sport: boolean
 * - studied: boolean
 * - slept_early: boolean
 */
async function handlePost(req, res) {
  const { date, eaten_well, did_sport, studied, slept_early } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  const logEntry = {
    eaten_well,
    did_sport,
    studied,
    slept_early
  };

  const savedLog = await storage.saveLog(date, logEntry);

  return res.status(200).json({
    success: true,
    date,
    log: savedLog
  });
}
