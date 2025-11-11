const storage = require('../lib/storage');
const dateUtils = require('../lib/dateUtils');
const telegram = require('../lib/telegram');

/**
 * Cron endpoint for daily check-in reminders
 * Should be called by GitHub Actions or external cron service
 *
 * Schedule:
 * - 22:00 (10 PM) Monday-Thursday: First reminder
 * - 23:00 (11 PM) Monday-Thursday: Second reminder (only if no log exists)
 *
 * Query parameters:
 * - force=true: Send reminder regardless of time or weekday
 */
module.exports = async (req, res) => {
  try {
    const timezone = await storage.getTimezone();
    const currentHour = dateUtils.getCurrentHour(timezone);
    const todayStr = dateUtils.getTodayString(timezone);
    const isWeekday = dateUtils.isWeekday(timezone);

    // Check for force parameter (supports query string or body)
    const forceParam = req.query?.force || req.body?.force;
    const isForced = forceParam === 'true' || forceParam === true;

    // Only send reminders Monday to Thursday (unless forced)
    if (!isWeekday && !isForced) {
      return res.status(200).json({
        success: true,
        message: 'No reminder sent - not a weekday',
        date: todayStr
      });
    }

    // Check if log already exists for today
    const hasLog = await storage.hasLog(todayStr);

    // Determine if it's a first or second reminder based on existing log
    const isFirstReminder = !hasLog;

    // Always send reminder when called
    const message = telegram.createReminderMessage(isFirstReminder);
    const result = await telegram.sendReminder(message);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Reminder sent at ${currentHour}:00`,
        date: todayStr,
        reminderType: isFirstReminder ? 'first' : 'second',
        hasLog
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send reminder'
      });
    }
  } catch (error) {
    console.error('Error in daily check-in cron:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
