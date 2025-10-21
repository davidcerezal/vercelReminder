const { CLEANING_TIMEZONE, DEADLINE, REPROGRAM_TIME } = require('./config');

function getTimeParts(date = new Date(), timezone = CLEANING_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const partMap = {};

  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
    hour: parseInt(partMap.hour, 10),
    minute: parseInt(partMap.minute, 10),
    second: parseInt(partMap.second, 10)
  };
}

function toUTCDate(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, 0));
}

function getTimezoneDate(date = new Date(), timezone = CLEANING_TIMEZONE) {
  return toUTCDate(getTimeParts(date, timezone));
}

function cloneDate(date) {
  return new Date(date.getTime());
}

function formatYMD(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatHM(date) {
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

function getWeekStart(date = new Date(), timezone = CLEANING_TIMEZONE) {
  const tzDate = getTimezoneDate(date, timezone);
  const day = tzDate.getUTCDay(); // Sunday = 0
  const diff = day === 0 ? -6 : 1 - day; // Move to Monday

  tzDate.setUTCDate(tzDate.getUTCDate() + diff);
  tzDate.setUTCHours(0, 0, 0, 0);
  return tzDate;
}

function getWeekEnd(weekStartDate) {
  const result = cloneDate(weekStartDate);
  result.setUTCDate(result.getUTCDate() + 6);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

function getWeekDeadlineDate(weekStartDate, timezone = CLEANING_TIMEZONE) {
  const deadlineDate = cloneDate(weekStartDate);
  deadlineDate.setUTCDate(deadlineDate.getUTCDate() + (DEADLINE.weekday === 0 ? 6 : DEADLINE.weekday - 1));
  deadlineDate.setUTCHours(DEADLINE.hour, DEADLINE.minute, 0, 0);
  return deadlineDate;
}

function getReprogramDate(weekStartDate, timezone = CLEANING_TIMEZONE) {
  const reprogramDate = cloneDate(weekStartDate);
  reprogramDate.setUTCDate(reprogramDate.getUTCDate() + (REPROGRAM_TIME.weekday === 0 ? 6 : REPROGRAM_TIME.weekday - 1));
  reprogramDate.setUTCHours(REPROGRAM_TIME.hour, REPROGRAM_TIME.minute, 0, 0);
  return reprogramDate;
}

function getCurrentWeekStartString(timezone = CLEANING_TIMEZONE) {
  return formatYMD(getWeekStart(new Date(), timezone));
}

function getWeekRangeStrings(weekStartString) {
  const [year, month, day] = weekStartString.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day));
  const endDate = getWeekEnd(startDate);
  return {
    start: formatYMD(startDate),
    end: formatYMD(endDate)
  };
}

function parseWeekStart(weekStartString) {
  const [year, month, day] = weekStartString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function getMonthWeeks(year, month, timezone = CLEANING_TIMEZONE) {
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0));

  const weeks = new Set();

  for (let day = cloneDate(firstDayOfMonth); day <= lastDayOfMonth; day.setUTCDate(day.getUTCDate() + 1)) {
    weeks.add(formatYMD(getWeekStart(day, timezone)));
  }

  return Array.from(weeks).sort();
}

function formatDisplayDate(date, locale = 'es-ES', timezone = CLEANING_TIMEZONE) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatDisplayDateTime(date, locale = 'es-ES', timezone = CLEANING_TIMEZONE) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth() &&
    dateA.getUTCDate() === dateB.getUTCDate()
  );
}

module.exports = {
  getTimezoneDate,
  getWeekStart,
  getWeekEnd,
  getWeekDeadlineDate,
  getReprogramDate,
  getCurrentWeekStartString,
  getWeekRangeStrings,
  parseWeekStart,
  getMonthWeeks,
  formatYMD,
  formatHM,
  formatDisplayDate,
  formatDisplayDateTime,
  isSameDay
};
