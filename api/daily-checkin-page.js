const fs = require('fs');
const path = require('path');

/**
 * Serve the daily check-in HTML page
 */
module.exports = async (req, res) => {
    try {
        // Check if requesting the JS file
        if (req.url === '/daily-checkin/app.js') {
            const jsPath = path.join(__dirname, '../daily-checkin/public/app.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            res.setHeader('Content-Type', 'application/javascript');
            return res.status(200).send(jsContent);
        }

        // Otherwise serve the HTML page
        const htmlPath = path.join(__dirname, '../daily-checkin/public/index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(htmlContent);
    } catch (error) {
        console.error('Error serving daily check-in page:', error);
        return res.status(500).send('Error loading page');
    }
};
