const fs = require('fs').promises;
const path = require('path');
const { isTodayBirthday } = require('./dateUtils');

async function loadBirthdays() {
  try {
    const birthdaysPath = path.join(__dirname, '..', 'data', 'birthdays.json');
    const data = await fs.readFile(birthdaysPath, 'utf8');
    const birthdayData = JSON.parse(data);
    return birthdayData.birthdays || [];
  } catch (error) {
    console.error('Error loading birthdays:', error);
    return [];
  }
}

async function getTodaysBirthdays() {
  const birthdays = await loadBirthdays();
  
  return birthdays.filter(birthday => {
    return isTodayBirthday(birthday.date);
  });
}

async function addBirthday(name, date, description = '') {
  try {
    const birthdaysPath = path.join(__dirname, '..', 'data', 'birthdays.json');
    const data = await fs.readFile(birthdaysPath, 'utf8');
    const birthdayData = JSON.parse(data);
    
    const newBirthday = {
      name: name,
      date: date,
      description: description
    };
    
    birthdayData.birthdays.push(newBirthday);
    
    await fs.writeFile(birthdaysPath, JSON.stringify(birthdayData, null, 2), 'utf8');
    console.log(`Birthday added for ${name} on ${date}`);
    return true;
  } catch (error) {
    console.error('Error adding birthday:', error);
    return false;
  }
}

module.exports = {
  loadBirthdays,
  getTodaysBirthdays,
  addBirthday
};