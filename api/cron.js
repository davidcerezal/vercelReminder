const { isLastWorkingDayOfMonth } = require('../lib/dateUtils');
const { getTodaysBirthdays } = require('../lib/birthdays');
const emailService = require('../lib/email');
const telegramService = require('../lib/telegram');
const { logExecution } = require('../lib/logger-hybrid');

async function handleCronJob(req, res) {
  const startTime = Date.now();
  console.log('Cron job started at:', new Date().toISOString());
  
  // Authentication check for external requests (GitHub Actions, etc.)
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret && (!authHeader || authHeader !== `Bearer ${expectedSecret}`)) {
      console.log('Unauthorized cron request');
      await logExecution(false, 'Unauthorized access attempt', { 
        duration: `${Date.now() - startTime}ms`,
        additionalInfo: { 
          ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  try {
    const results = [];
    const today = new Date();

    // Check if today is the last working day of the month
    if (isLastWorkingDayOfMonth()) {
      console.log('Today is the last working day of the month - sending work hours reminder');

      // Send email reminder
      const emailSent = await emailService.sendWorkHoursReminder();
      if (emailSent) {
        results.push('Work hours reminder email sent successfully');
      } else {
        results.push('Failed to send work hours reminder email');
      }

      // Send Telegram reminder
      const telegramSent = await telegramService.sendWorkHoursReminder();
      if (telegramSent) {
        results.push('Work hours reminder Telegram message sent successfully');
      } else {
        results.push('Failed to send work hours reminder Telegram message');
      }
    }

    // Check for birthdays
    console.log(`DEBUG: Current date for birthday check: ${today.toISOString()}`);
    console.log(`DEBUG: Local date: ${today.toLocaleDateString('es-ES')}`);
    console.log(`DEBUG: Day/Month format: ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`);

    const todaysBirthdays = await getTodaysBirthdays(today);
    console.log(`Found ${todaysBirthdays.length} birthdays today`);

    if (todaysBirthdays.length > 0) {
      console.log('Today\'s birthdays:', todaysBirthdays.map(b => `${b.name} (${b.date})`));
    } else {
      console.log('DEBUG: No birthdays found for today');
    }

    for (const birthday of todaysBirthdays) {
      console.log(`Sending birthday message for ${birthday.name}`);
      const birthdayMessageSent = await telegramService.sendBirthdayMessage(birthday.name, birthday.date);

      if (birthdayMessageSent) {
        results.push(`Birthday message sent for ${birthday.name}`);
      } else {
        results.push(`Failed to send birthday message for ${birthday.name}`);
      }
    }

    if (results.length === 0) {
      results.push('No reminders to send today');
    }

    const endTime = Date.now();
    const duration = `${endTime - startTime}ms`;
    const summary = results.join(', ');

    console.log('Cron job completed:', results);

    // Log once at the end with all results
    const finalLog = logExecution(true, `Cron completed: ${summary}`, {
      duration: duration,
      additionalInfo: {
        resultsCount: results.length,
        results: results,
        type: 'cron_execution'
      }
    });

    // Don't wait for logging to complete
    finalLog.catch(err => console.error('Logging error:', err));
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results,
      duration: duration
    });
    
  } catch (error) {
    const endTime = Date.now();
    const duration = `${endTime - startTime}ms`;
    
    console.error('Error in cron job:', error);
    
    // Log the error
    await logExecution(false, `Error: ${error.message}`, { 
      duration: duration,
      additionalInfo: { errorStack: error.stack }
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: duration
    });
  }
}

// For Vercel cron jobs
module.exports = handleCronJob;

// For local testing
if (require.main === module) {
  // Run the function directly when file is executed
  const mockReq = {};
  const mockRes = {
    status: (code) => ({
      json: (data) => console.log(`Response ${code}:`, JSON.stringify(data, null, 2))
    })
  };
  
  handleCronJob(mockReq, mockRes);
}