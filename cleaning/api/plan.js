const { CLEANING_TIMEZONE, PEOPLE, TASKS, setTaskCompletion, getWeekOverview } = require('../lib/service');
const { getWeekStart, formatYMD } = require('../lib/weekUtils');

function parseWeekStartFromQuery(query) {
  if (query.weekStart) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.weekStart)) {
      throw new Error('Invalid weekStart format. Use YYYY-MM-DD');
    }
    return query.weekStart;
  }

  if (query.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    const date = new Date(`${query.date}T00:00:00Z`);
    return formatYMD(getWeekStart(date, CLEANING_TIMEZONE));
  }

  return formatYMD(getWeekStart(new Date(), CLEANING_TIMEZONE));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const weekStart = parseWeekStartFromQuery(req.query || {});
      const overview = await getWeekOverview(weekStart);

      return res.status(200).json({
        success: true,
        timezone: CLEANING_TIMEZONE,
        week: overview.week,
        summary: overview.summary,
        deadline: {
          utc: overview.deadlineUtc,
          formatted: overview.deadlineFormatted
        },
        reprogram: {
          utc: overview.reprogramUtc,
          formatted: overview.reprogramFormatted
        },
        pendingByPerson: overview.pendingByPerson,
        people: PEOPLE,
        tasksCatalog: TASKS
      });
    }

    if (req.method === 'POST') {
      const { weekStart, taskId, completed, actorId } = req.body || {};

      if (!taskId) {
        return res.status(400).json({ success: false, error: 'taskId is required' });
      }

      if (typeof completed !== 'boolean') {
        return res.status(400).json({ success: false, error: 'completed flag must be provided' });
      }

      const effectiveWeekStart = weekStart
        ? parseWeekStartFromQuery({ weekStart })
        : formatYMD(getWeekStart(new Date(), CLEANING_TIMEZONE));

      const result = await setTaskCompletion({
        weekStart: effectiveWeekStart,
        taskId,
        completed,
        actorId
      });

      return res.status(200).json({
        success: true,
        week: result.week,
        task: result.task
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in cleaning plan API:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
