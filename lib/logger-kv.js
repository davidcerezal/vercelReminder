// Vercel KV Redis-based logger for persistent logs
const { kv } = require('@vercel/kv');

const MAX_LOGS = 100;
const LOGS_KEY = 'cron-logs';

async function logExecution(success, message, details = {}) {
  try {
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      success: success,
      message: message,
      duration: details.duration || null,
      details: details.additionalInfo || null,
      type: determineLogType(message)
    };

    // Get existing logs with timeout
    const kvPromise = kv.get(LOGS_KEY);
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 2000)
    );

    const existingLogs = await Promise.race([kvPromise, timeoutPromise]) || { logs: [], lastUpdated: null };

    // Add new log at the beginning
    existingLogs.logs.unshift(logEntry);

    // Keep only the latest MAX_LOGS entries
    if (existingLogs.logs.length > MAX_LOGS) {
      existingLogs.logs = existingLogs.logs.slice(0, MAX_LOGS);
    }

    existingLogs.lastUpdated = new Date().toISOString();

    // Save back to KV with fire-and-forget approach
    // Don't await to prevent blocking
    kv.set(LOGS_KEY, existingLogs).catch(err => {
      console.error('Background log save error:', err);
    });

    console.log('Log entry queued for KV:', logEntry);
    return true;

  } catch (error) {
    console.error('Error saving log entry to KV:', error);
    // Fallback to console logging
    console.log('FALLBACK LOG:', { success, message, details });
    return false;
  }
}

async function readLogs(limit = MAX_LOGS) {
  try {
    const logData = await kv.get(LOGS_KEY);
    
    if (!logData || !logData.logs) {
      return [];
    }
    
    return logData.logs.slice(0, limit);
    
  } catch (error) {
    console.error('Error reading logs from KV:', error);
    return [];
  }
}

async function clearLogs() {
  try {
    const initialData = {
      logs: [],
      lastUpdated: new Date().toISOString()
    };
    await kv.set(LOGS_KEY, initialData);
    return true;
  } catch (error) {
    console.error('Error clearing logs in KV:', error);
    return false;
  }
}

function determineLogType(message) {
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('birthday') || msgLower.includes('cumpleaños')) {
    return 'birthday';
  } else if (msgLower.includes('work hours') || msgLower.includes('horas')) {
    return 'work_hours';
  } else if (msgLower.includes('no reminders')) {
    return 'no_activity';
  } else {
    return 'general';
  }
}

async function getLogStats() {
  try {
    const logs = await readLogs();
    
    const stats = {
      total: logs.length,
      successful: logs.filter(log => log.success).length,
      failed: logs.filter(log => !log.success).length,
      byType: {
        birthday: logs.filter(log => log.type === 'birthday').length,
        work_hours: logs.filter(log => log.type === 'work_hours').length,
        no_activity: logs.filter(log => log.type === 'no_activity').length,
        general: logs.filter(log => log.type === 'general').length
      },
      lastExecution: logs.length > 0 ? logs[0].timestamp : null
    };
    
    return stats;
    
  } catch (error) {
    console.error('Error getting log stats from KV:', error);
    return {
      total: 0,
      successful: 0,
      failed: 0,
      byType: { birthday: 0, work_hours: 0, no_activity: 0, general: 0 },
      lastExecution: null
    };
  }
}

module.exports = {
  logExecution,
  readLogs,
  clearLogs,
  getLogStats
};