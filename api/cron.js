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

    // Send daily confirmation message first
    const dailyConfirmationSent = await telegramService.sendDailyConfirmation(today);
    if (dailyConfirmationSent) {
      results.push('Daily confirmation message sent');
      await logExecution(true, 'Daily confirmation message sent', {
        duration: `${Date.now() - startTime}ms`,
        additionalInfo: { type: 'daily_confirmation', date: today.toISOString() }
      });
    }

    // Check if today is the last working day of the month
    if (isLastWorkingDayOfMonth()) {
      console.log('Today is the last working day of the month - sending work hours reminder');
      
      // Send email reminder
      const emailSent = await emailService.sendWorkHoursReminder();
      if (emailSent) {
        results.push('Work hours reminder email sent successfully');
        await logExecution(true, 'Work hours reminder email sent successfully', { 
          duration: `${Date.now() - startTime}ms`,
          additionalInfo: { type: 'work_hours_email' }
        });
      } else {
        results.push('Failed to send work hours reminder email');
        await logExecution(false, 'Failed to send work hours reminder email', { 
          duration: `${Date.now() - startTime}ms`,
          additionalInfo: { type: 'work_hours_email' }
        });
      }
      
      // Send Telegram reminder
      const telegramSent = await telegramService.sendWorkHoursReminder();
      if (telegramSent) {
        results.push('Work hours reminder Telegram message sent successfully');
        await logExecution(true, 'Work hours reminder Telegram message sent successfully', { 
          duration: `${Date.now() - startTime}ms`,
          additionalInfo: { type: 'work_hours_telegram' }
        });
      } else {
        results.push('Failed to send work hours reminder Telegram message');
        await logExecution(false, 'Failed to send work hours reminder Telegram message', { 
          duration: `${Date.now() - startTime}ms`,
          additionalInfo: { type: 'work_hours_telegram' }
        });
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
        await logExecution(true, `Birthday message sent for ${birthday.name}`, {
          duration: `${Date.now() - startTime}ms`,
          additionalInfo: { type: 'birthday', name: birthday.name }
        });
      } else {
        results.push(`Failed to send birthday message for ${birthday.name}`);
        await logExecution(false, `Failed to send birthday message for ${birthday.name}`, {
          duration: `${Date.now() - startTime}ms`,
          additionalInfo: { type: 'birthday', name: birthday.name }
        });
      }
    }
    
    if (results.length === 0) {
      results.push('No reminders to send today');
      await logExecution(true, 'No reminders to send today', { 
        duration: `${Date.now() - startTime}ms`,
        additionalInfo: { type: 'no_activity' }
      });
    }
    
    const endTime = Date.now();
    const duration = `${endTime - startTime}ms`;
    const summary = results.join(', ');
    
    console.log('Cron job completed:', results);
    
    // Log the final summary (only if there were multiple actions)
    if (results.length > 1) {
      await logExecution(true, `Cron job completed: ${summary}`, { 
        duration: duration,
        additionalInfo: { resultsCount: results.length, details: results, type: 'summary' }
      });
    }
    
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