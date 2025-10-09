/**
 * Get current date in YYYY-MM-DD format for a specific timezone
 */
function getTodayString(timezone = 'Europe/Madrid') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(now); // Returns YYYY-MM-DD
}

/**
 * Get year-month string (YYYY-MM) for a specific date
 */
function getYearMonth(date, timezone = 'Europe/Madrid') {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit'
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;

  return `${year}-${month}`;
}

/**
 * Get the current hour in a specific timezone
 */
function getCurrentHour(timezone = 'Europe/Madrid') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  });

  return parseInt(formatter.format(now));
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get days in a specific month
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Get first day of week for a month (0 = Sunday, 1 = Monday, etc.)
 */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Check if date is today
 */
function isToday(dateStr, timezone = 'Europe/Madrid') {
  return dateStr === getTodayString(timezone);
}

/**
 * Navigate to previous month
 */
function getPreviousMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 2, 1); // month-2 because month is 1-based
  return getYearMonth(date);
}

/**
 * Navigate to next month
 */
function getNextMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month, 1); // month is already correct for next
  return getYearMonth(date);
}

/**
 * Get current year-month
 */
function getCurrentYearMonth(timezone = 'Europe/Madrid') {
  return getYearMonth(new Date(), timezone);
}

/**
 * Check if it's Monday to Thursday
 */
function isWeekday(timezone = 'Europe/Madrid') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long'
  });

  const dayName = formatter.format(now);
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].includes(dayName);
}

module.exports = {
  getTodayString,
  getYearMonth,
  getCurrentHour,
  parseDateString,
  formatDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  isToday,
  getPreviousMonth,
  getNextMonth,
  getCurrentYearMonth,
  isWeekday
};
