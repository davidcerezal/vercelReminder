const { createClient } = require('redis');
const { CLEANING_TIMEZONE } = require('./config');

const CLEANING_WEEK_KEY_PREFIX = 'cleaning:week:';
const NOTIFICATION_KEY_PREFIX = 'cleaning:notifications:';
const NOTIFICATION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', err => {
      console.error('Redis client error (cleaning storage):', err);
    });

    await redisClient.connect();
  }

  return redisClient;
}

function getWeekKey(weekStart) {
  return `${CLEANING_WEEK_KEY_PREFIX}${weekStart}`;
}

function getNotificationKey(type, dateStr, personId) {
  return `${NOTIFICATION_KEY_PREFIX}${type}:${dateStr}:${personId}`;
}

async function getWeekData(weekStart) {
  const client = await getRedisClient();
  const raw = await client.get(getWeekKey(weekStart));
  return raw ? JSON.parse(raw) : null;
}

async function saveWeekData(weekStart, data) {
  const client = await getRedisClient();
  await client.set(getWeekKey(weekStart), JSON.stringify(data));
  return data;
}

async function getAllWeekKeys() {
  const client = await getRedisClient();
  const keys = [];

  for await (const key of client.scanIterator({
    MATCH: `${CLEANING_WEEK_KEY_PREFIX}*`
  })) {
    keys.push(key);
  }

  keys.sort();
  return keys;
}

async function getWeeksData(weekStarts) {
  const client = await getRedisClient();
  const keys = weekStarts.map(getWeekKey);

  if (keys.length === 0) {
    return [];
  }

  const values = await client.mGet(keys);

  return values.map((value, index) => {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error parsing week data for ${weekStarts[index]}:`, error);
      return null;
    }
  });
}

async function hasNotification(type, dateStr, personId) {
  const client = await getRedisClient();
  const key = getNotificationKey(type, dateStr, personId);
  return (await client.exists(key)) === 1;
}

async function recordNotification(type, dateStr, personId) {
  const client = await getRedisClient();
  const key = getNotificationKey(type, dateStr, personId);
  await client.set(key, '1', {
    EX: NOTIFICATION_TTL_SECONDS
  });
}

module.exports = {
  getRedisClient,
  getWeekData,
  saveWeekData,
  getAllWeekKeys,
  getWeeksData,
  hasNotification,
  recordNotification,
  CLEANING_WEEK_KEY_PREFIX,
  CLEANING_TIMEZONE
};
