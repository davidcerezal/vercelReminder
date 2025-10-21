const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    if (req.url === '/cleaning-plan/app.js' || req.url.endsWith('/app.js')) {
      const jsPath = path.join(__dirname, '../cleaning/public/app.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      return res.status(200).send(jsContent);
    }

    const htmlPath = path.join(__dirname, '../cleaning/public/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlContent);
  } catch (error) {
    console.error('Error serving cleaning plan page:', error);
    return res.status(500).send('Error loading cleaning plan page');
  }
};
