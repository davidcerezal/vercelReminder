const fs = require('fs').promises;
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'cron-logs.json');
const MAX_LOGS = 100; // Keep only the last 100 executions

async function ensureLogFile() {
  try {
    await fs.access(LOG_FILE);
  } catch (error) {
    // File doesn't exist, create it with empty array
    const initialData = {
      logs: [],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(LOG_FILE, JSON.stringify(initialData, null, 2));
  }
}

async function logExecution(success, message, details = {}) {
  try {
    await ensureLogFile();
    
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const logData = JSON.parse(data);
    
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      success: success,
      message: message,
      duration: details.duration || null,
      details: details.additionalInfo || null,
      type: determineLogType(message)
    };
    
    // Add new log at the beginning
    logData.logs.unshift(logEntry);
    
    // Keep only the latest MAX_LOGS entries
    if (logData.logs.length > MAX_LOGS) {
      logData.logs = logData.logs.slice(0, MAX_LOGS);
    }
    
    logData.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(LOG_FILE, JSON.stringify(logData, null, 2));
    
    console.log('Log entry saved:', logEntry);
    return true;
    
  } catch (error) {
    console.error('Error saving log entry:', error);
    return false;
  }
}

async function readLogs(limit = MAX_LOGS) {
  try {
    await ensureLogFile();
    
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const logData = JSON.parse(data);
    
    // Return the most recent logs first
    return logData.logs.slice(0, limit);
    
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

async function clearLogs() {
  try {
    const initialData = {
      logs: [],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(LOG_FILE, JSON.stringify(initialData, null, 2));
    return true;
  } catch (error) {
    console.error('Error clearing logs:', error);
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
    console.error('Error getting log stats:', error);
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