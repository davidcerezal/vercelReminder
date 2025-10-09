/**
 * Vercel serverless function for daily check-in API
 * This is the entry point that Vercel will use
 */
const handler = require('../daily-checkin/api/data');

module.exports = handler;
