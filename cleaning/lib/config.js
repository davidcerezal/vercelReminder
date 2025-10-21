const CLEANING_TIMEZONE = 'Europe/Madrid';

const PEOPLE = [
  {
    id: 'david',
    name: 'David',
    email: 'david.cerezal77@gmail.com',
    telegramChatIdEnv: 'TELEGRAM_CHAT_ID',
    telegramBotTokenEnv: 'TELEGRAM_DAILY_CLEANING_BOT_TOKEN'
  },
  {
    id: 'eva',
    name: 'Eva',
    email: 'evapascualllanos@gmail.com',
    telegramChatIdEnv: 'TELEGRAM_CHAT_ID',
    telegramBotTokenEnv: 'TELEGRAM_DAILY_CLEANING_EVA_BOT_TOKEN'
  }
];

const TASKS = [
  { id: 'compra', title: 'Compra', ownerId: 'david' },
  { id: 'lavadora', title: 'Lavadora', ownerId: 'david' },
  { id: 'polvo-orden', title: 'Polvo/habitaciones + ordenar', ownerId: 'david' },
  { id: 'cocina', title: 'Cocina', ownerId: 'eva' },
  { id: 'banos', title: 'Baños', ownerId: 'eva' },
  { id: 'suelos', title: 'Suelos (barrer o aspirador)', ownerId: 'eva' },
  { id: 'lavavajillas', title: 'Responsable del lavavajillas', ownerId: 'eva' }
];

const DEADLINE = {
  weekday: 0, // Sunday
  hour: 20,
  minute: 0
};

const MIDWEEK_REMINDER = {
  weekday: 3, // Wednesday
  hour: 19,
  minute: 0
};

const REPROGRAM_TIME = {
  weekday: 0, // Sunday
  hour: 21,
  minute: 0
};

const MONTHLY_SUMMARY = {
  day: 'last',
  hour: 20,
  minute: 0
};

module.exports = {
  CLEANING_TIMEZONE,
  PEOPLE,
  TASKS,
  DEADLINE,
  MIDWEEK_REMINDER,
  REPROGRAM_TIME,
  MONTHLY_SUMMARY
};
