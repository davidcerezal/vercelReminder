// Hybrid logger: uses Vercel KV in production, file system in development
const isVercel = process.env.VERCEL_ENV || process.env.VERCEL;

let logger;

if (isVercel) {
  // Use KV in production
  try {
    logger = require('./logger-kv');
    console.log('🚀 Using Vercel KV logger for persistent logs');
  } catch (error) {
    console.warn('⚠️  Vercel KV not available, falling back to file logger');
    logger = require('./logger');
  }
} else {
  // Use file system in development
  logger = require('./logger');
  console.log('💻 Using file system logger for development');
}

module.exports = logger;