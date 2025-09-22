function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

function getLastWorkingDayOfMonth(year, month) {
  // month is 0-indexed (0 = January, 11 = December)
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Go backwards from the last day until we find a working day
  let currentDate = new Date(lastDayOfMonth);
  
  while (isWeekend(currentDate)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return currentDate;
}

function isLastWorkingDayOfMonth(date = new Date()) {
  const today = new Date(date);
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const lastWorkingDay = getLastWorkingDayOfMonth(year, month);
  
  return (
    today.getDate() === lastWorkingDay.getDate() &&
    today.getMonth() === lastWorkingDay.getMonth() &&
    today.getFullYear() === lastWorkingDay.getFullYear()
  );
}

function isTodayBirthday(birthdayString, date = new Date()) {
  // birthdayString format: "DD/MM" or "DD-MM"
  const checkDate = new Date(date);
  const todayDay = checkDate.getDate();
  const todayMonth = checkDate.getMonth() + 1; // getMonth() returns 0-11

  // Parse birthday string
  const [day, month] = birthdayString.split(/[\/\-]/).map(num => parseInt(num, 10));

  console.log(`DEBUG isTodayBirthday: Checking ${birthdayString} against ${todayDay}/${todayMonth}`);

  return todayDay === day && todayMonth === month;
}

function formatDate(date) {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

module.exports = {
  isLastWorkingDayOfMonth,
  isTodayBirthday,
  formatDate,
  getLastWorkingDayOfMonth,
  isWeekend
};