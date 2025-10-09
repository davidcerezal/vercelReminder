/**
 * Vercel serverless function for daily check-in cron
 * This is the entry point that Vercel and GitHub Actions will use
 */
const handler = require('../daily-checkin/api/cron');

module.exports = handler;
