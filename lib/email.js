const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWorkHoursReminder() {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject: '⏰ Recordatorio: Registrar horas de trabajo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">🕒 Recordatorio de Horas</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0;">
              <strong>¡Hola!</strong>
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Este es tu recordatorio automático para registrar las horas de trabajo antes de que termine el mes.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              📅 <strong>Fecha:</strong> Último día laboral del mes<br>
              ⏰ <strong>Acción requerida:</strong> Registrar todas las horas trabajadas
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #6b7280;">
              Recordatorio automático generado el ${new Date().toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Work hours reminder email sent successfully:', data.id);
    return true;
  } catch (error) {
    console.error('Failed to send work hours reminder email:', error);
    return false;
  }
}

module.exports = {
  sendWorkHoursReminder
};