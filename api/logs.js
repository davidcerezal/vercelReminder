const { readLogs } = require('../lib/logger-hybrid');

async function handleLogsRequest(req, res) {
  try {
    // Set CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const logs = await readLogs();
    
    res.status(200).json({
      success: true,
      logs: logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      logs: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = handleLogsRequest;