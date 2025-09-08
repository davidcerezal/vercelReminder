const { sendWorkHoursReminder: sendEmailReminder } = require('../lib/email');
const { sendWorkHoursReminder: sendTelegramReminder, sendBirthdayMessage } = require('../lib/telegram');
const { logExecution } = require('../lib/logger-hybrid');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use GET or POST to test the notifications'
    });
  }

  const { type = 'all', name = 'Usuario de Prueba' } = req.query;

  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test email
    if (type === 'all' || type === 'email') {
      console.log('Testing email notification...');
      const emailResult = await sendEmailReminder();
      results.tests.email = {
        success: emailResult,
        message: emailResult ? 'Email enviado correctamente' : 'Error al enviar email'
      };
      
      // Log the test result
      await logExecution(emailResult, 
        emailResult ? 'TEST: Email enviado correctamente' : 'TEST: Error al enviar email', 
        { 
          duration: '0ms',
          additionalInfo: { type: 'test_email' }
        }
      );
    }

    // Test Telegram work hours reminder
    if (type === 'all' || type === 'telegram') {
      console.log('Testing Telegram work hours notification...');
      const telegramResult = await sendTelegramReminder();
      results.tests.telegram_work = {
        success: telegramResult,
        message: telegramResult ? 'Mensaje de Telegram (horas) enviado correctamente' : 'Error al enviar mensaje de Telegram (horas)'
      };
      
      // Log the test result
      await logExecution(telegramResult, 
        telegramResult ? 'TEST: Mensaje de Telegram (horas) enviado correctamente' : 'TEST: Error al enviar mensaje de Telegram (horas)', 
        { 
          duration: '0ms',
          additionalInfo: { type: 'test_telegram_work' }
        }
      );
    }

    // Test Telegram birthday message
    if (type === 'all' || type === 'birthday') {
      console.log('Testing Telegram birthday notification...');
      const birthdayResult = await sendBirthdayMessage(name);
      results.tests.telegram_birthday = {
        success: birthdayResult,
        message: birthdayResult ? `Mensaje de cumpleaños para ${name} enviado correctamente` : `Error al enviar mensaje de cumpleaños para ${name}`
      };
      
      // Log the test result
      await logExecution(birthdayResult, 
        birthdayResult ? `TEST: Mensaje de cumpleaños para ${name} enviado correctamente` : `TEST: Error al enviar mensaje de cumpleaños para ${name}`, 
        { 
          duration: '0ms',
          additionalInfo: { type: 'test_birthday', name: name }
        }
      );
    }

    // Check if all tests passed
    const allTestsPassed = Object.values(results.tests).every(test => test.success);
    
    res.status(allTestsPassed ? 200 : 500).json({
      success: allTestsPassed,
      message: allTestsPassed ? 'Todas las pruebas pasaron correctamente' : 'Algunas pruebas fallaron',
      ...results
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};