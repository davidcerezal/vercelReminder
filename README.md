# 📅 App de Recordatorios Automáticos

Aplicación que envía recordatorios automáticos por email y Telegram para:
- ⏰ **Recordatorio de horas de trabajo**: El último día laboral de cada mes
- 🎂 **Felicitaciones de cumpleaños**: Cada mañana a las 9:00 AM

## 🚀 Características

- **Email con Resend**: Recordatorios de horas laborales con diseño profesional
- **Telegram Bot**: Mensajes automáticos con emojis personalizados
- **Cálculo inteligente**: Detecta automáticamente el último día laboral del mes
- **Calendario de cumpleaños**: Sistema flexible para gestionar fechas importantes
- **Deploy en Vercel**: Configurado para ejecutarse automáticamente en la nube

## 📋 Configuración paso a paso

### 1. Configurar Resend (Email)

1. Ve a [Resend.com](https://resend.com) y crea una cuenta gratuita
2. Crea un API Key en el dashboard
3. Configura un dominio verificado (o usa el dominio de prueba para testing)

### 2. Configurar Telegram Bot

1. Abre Telegram y busca [@BotFather](https://t.me/botfather)
2. Envía `/newbot` y sigue las instrucciones
3. Guarda el **Bot Token** que te proporciona
4. Para obtener tu **Chat ID**:
   - Envía un mensaje a tu bot
   - Ve a: `https://api.telegram.org/bot<TU_BOT_TOKEN>/getUpdates`
   - Busca el `"chat":{"id":NUMERO}` en la respuesta

### 3. Configurar variables de entorno

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con tus credenciales:
   ```env
   # Resend Email Configuration
   RESEND_API_KEY=re_tu_api_key_de_resend
   FROM_EMAIL=recordatorios@tudominio.com
   TO_EMAIL=tu@email.com

   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_CHAT_ID=123456789
   
   # Security (opcional - solo para GitHub Actions)
   CRON_SECRET=tu_string_aleatorio_aqui
   ```

### 4. Configurar cumpleaños

Edita `data/birthdays.json` para agregar cumpleaños:

```json
{
  "birthdays": [
    {
      "name": "Alicia",
      "date": "29/04",
      "description": "Ejemplo: 29 de abril - Alicia"
    },
    {
      "name": "Pedro",
      "date": "15/06",
      "description": "15 de junio - Pedro"
    },
    {
      "name": "María",
      "date": "03/12",
      "description": "3 de diciembre - María"
    }
  ]
}
```

**Formato de fechas**: Usa `"DD/MM"` (día/mes) o `"DD-MM"`

### 5. Instalar dependencias

```bash
npm install
```

### 6. Probar localmente

```bash
npm run dev
```

Esto ejecutará el cron job una vez para verificar que todo funciona.

## 🌐 Deploy en Vercel

### 1. Preparar el proyecto

1. Sube tu código a GitHub (sin el archivo `.env`)
2. Asegúrate de que `.env` esté en `.gitignore`

### 2. Deploy en Vercel

1. Ve a [Vercel.com](https://vercel.com) y conecta tu cuenta de GitHub
2. Importa tu repositorio
3. En **Environment Variables**, agrega todas las variables de tu `.env`:
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `TO_EMAIL`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `CRON_SECRET` (opcional - solo si usas GitHub Actions)

### 3. Configurar la ejecución automática

**Esta app está configurada para usar GitHub Actions (gratuito)** en lugar de los cron jobs de Vercel que requieren plan Pro.

### 4. Configurar GitHub Actions (GRATIS)

Sigue estos pasos para configurar la ejecución automática:

1. **Configura el token de seguridad** (opcional pero recomendado):
   - Genera un string aleatorio: `openssl rand -base64 32`
   - En Vercel, agrega la variable `CRON_SECRET` con este valor
   - En GitHub, ve a Settings > Secrets > Actions
   - Agrega dos secretos:
     - `CRON_SECRET`: El mismo string aleatorio
     - `VERCEL_APP_URL`: La URL de tu app (ej: `https://tu-app.vercel.app`)

2. **El archivo de workflow ya está incluido** en `.github/workflows/daily-cron.yml`

3. **Activar GitHub Actions**:
   - Haz push de tu código a GitHub
   - Ve a la pestaña "Actions" en tu repositorio
   - Los workflows se ejecutarán automáticamente

**¡Importante!** GitHub Actions usa horario UTC. El workflow está configurado para las 9:00 AM UTC (10:00 AM CEST, 11:00 AM CET en España).

### Otras alternativas gratuitas:
- [Uptime Robot](https://uptimerobot.com) (llamadas HTTP periódicas)
- [EasyCron](https://www.easycron.com)
- [IFTTT](https://ifttt.com) con webhooks

## 📅 Cómo funciona

### Recordatorio de horas de trabajo
- ✅ Se ejecuta todos los días a las 9:00 AM
- ✅ Calcula automáticamente el último día laboral del mes (excluyendo fines de semana)
- ✅ Envía email profesional + mensaje de Telegram cuando es el día indicado

### Cumpleaños
- ✅ Revisa diariamente el archivo `birthdays.json`
- ✅ Envía mensajes personalizados con emojis cuando es el cumpleaños de alguien
- ✅ Solo por Telegram (puedes extenderlo para email si quieres)

### Ejemplo de mensajes

**Email de recordatorio de horas:**
```
⏰ Recordatorio: Registrar horas de trabajo

¡Hola!

Este es tu recordatorio automático para registrar las horas de trabajo antes de que termine el mes.

📅 Fecha: Último día laboral del mes
⏰ Acción requerida: Registrar todas las horas trabajadas
```

**Telegram de cumpleaños:**
```
🎉 🎂 🎈 🎁 🌟 ¡FELIZ CUMPLEAÑOS! 🎉 🎂 🎈 🎁 🌟

🎂 ¡Hoy es el cumpleaños de Alicia! 🎂

¡Que tengas un día maravilloso lleno de alegría y sorpresas! 🥳🎊
```

## 🛠 Personalización

### Cambiar horario del cron job

Edita `vercel.json`:
```json
"schedule": "0 8 * * *"  // 8:00 AM en lugar de 9:00 AM
```

### Modificar mensajes

- **Email**: Edita `lib/email.js`
- **Telegram**: Edita `lib/telegram.js`

### Agregar más funciones

El código está modularizado, puedes agregar fácilmente:
- Nuevos tipos de recordatorios
- Más canales de notificación
- Lógica de fechas más compleja

## 🐛 Solución de problemas

### Error: "Bot token invalid"
- Verifica que el `TELEGRAM_BOT_TOKEN` sea correcto
- Asegúrate de que no tenga espacios extra

### Error: "Chat not found"
- Verifica el `TELEGRAM_CHAT_ID`
- Asegúrate de haber enviado al menos un mensaje al bot

### Error: "Resend API key invalid"
- Verifica tu `RESEND_API_KEY`
- Comprueba que tu dominio esté verificado en Resend

### Los cron jobs no se ejecutan en Vercel
- Los cron jobs requieren plan Pro en Vercel
- Usa alternativas gratuitas como GitHub Actions

### Para debugging local
```bash
# Ejecutar una vez para probar
node api/cron.js

# Ver logs detallados
DEBUG=* node api/cron.js
```

## 🖥️ Dashboard Web

La aplicación incluye un dashboard web para monitorear las ejecuciones:

### Características del Dashboard:
- **📊 Estadísticas en tiempo real**: Contadores de éxitos, errores y total
- **📋 Tabla detallada**: Historial de las últimas 100 ejecuciones
- **🔄 Auto-refresh**: Se actualiza cada 30 segundos automáticamente
- **📱 Responsive**: Funciona en móviles y tablets
- **🎨 Interfaz moderna**: Diseño atractivo con gradientes

### Acceso al Dashboard:
- **URL**: `https://tu-app.vercel.app/` (tu dominio principal)
- **API de logs**: `https://tu-app.vercel.app/api/logs`

El dashboard muestra información como:
- Fecha y hora de cada ejecución
- Estado (éxito/error) con indicadores visuales
- Tipo de recordatorio (cumpleaños, horas, sin actividad)
- Duración de la ejecución
- Mensajes descriptivos

## 📁 Estructura del proyecto

```
├── .github/
│   └── workflows/
│       └── daily-cron.yml   # GitHub Actions para cron gratuito
├── api/
│   ├── cron.js              # Endpoint principal del cron job
│   └── logs.js              # API para el dashboard
├── lib/
│   ├── email.js             # Servicio de email con Resend
│   ├── telegram.js          # Servicio de Telegram
│   ├── dateUtils.js         # Utilidades para fechas
│   ├── birthdays.js         # Gestión de cumpleaños
│   └── logger.js            # Sistema de logging
├── public/
│   └── index.html           # Dashboard web
├── data/
│   ├── birthdays.json       # Calendario de cumpleaños
│   └── cron-logs.json       # Logs de ejecuciones
├── package.json
├── vercel.json              # Configuración de Vercel
├── .env.example             # Plantilla de variables de entorno
├── .gitignore
└── README.md
```

## ✨ Funciones destacadas

- **🎯 Precisión**: Calcula correctamente días laborales (M-V)
- **🎨 Mensajes atractivos**: Diseño profesional para emails, emojis divertidos para Telegram
- **🔧 Fácil configuración**: Solo necesitas configurar las variables de entorno
- **📈 Escalable**: Código modular fácil de extender
- **🛡 Seguro**: Autenticación opcional para endpoints, no expone credenciales
- **📊 Dashboard incluido**: Interfaz web para monitorear ejecuciones
- **💰 Opción gratuita**: GitHub Actions como alternativa a Vercel Pro
- **📝 Logging completo**: Historial detallado de todas las ejecuciones

¡Tu app de recordatorios con dashboard está lista para funcionar 24/7! 🚀

## 🚀 Próximos pasos

1. **Configura las variables de entorno**
2. **Agrega tus cumpleaños en `data/birthdays.json`** 
3. **Despliega en Vercel**
4. **Configura GitHub Actions si usas el plan gratuito**
5. **Accede al dashboard para monitorear**

¡Disfruta de tus recordatorios automáticos!