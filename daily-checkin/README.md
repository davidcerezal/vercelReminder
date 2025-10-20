# Daily Check-In Module

Módulo independiente para registrar estado diario con cuestionario, calendario visual y recordatorios por Telegram.

## Características

### 1. Cuestionario Diario
- 4 preguntas con toggles Sí/No:
  - Has comido bien
  - Has hecho deporte
  - Has estudiado algo
  - Te has ido pronto a la cama
- Guarda automáticamente el registro del día
- Permite editar registros anteriores

### 2. Calendario Mensual
- Vista de calendario con navegación mes a mes
- Código de colores:
  - **Verde**: Todas las respuestas son "Sí"
  - **Rojo**: Al menos una respuesta es "No"
  - **Gris**: Sin registro para ese día
- Click en cualquier día para ver/editar su registro

### 3. Recordatorios por Telegram
- Lunes a Jueves a las 21:00 / 9 PM (Europe/Madrid)
- Recordatorio adicional a las 22:00 / 10 PM si no hay registro
- Usa bot de Telegram independiente

## Estructura de Archivos

```
daily-checkin/
├── lib/
│   ├── storage.js       # Manejo de persistencia JSON
│   ├── dateUtils.js     # Utilidades de fecha/timezone
│   └── telegram.js      # Envío de mensajes Telegram
├── api/
│   ├── data.js          # API para CRUD de datos
│   └── cron.js          # Lógica de recordatorios
└── public/
    ├── index.html       # Interfaz web
    └── app.js           # JavaScript del frontend

api/ (root)
├── daily-checkin.js      # Endpoint API datos
├── daily-checkin-cron.js # Endpoint cron
└── daily-checkin-page.js # Servidor de HTML

data/
└── daily-checkin.json    # Base de datos JSON
```

## Persistencia

Usa archivo JSON (`data/daily-checkin.json`) con el siguiente esquema:

```json
{
  "timezone": "Europe/Madrid",
  "logs": {
    "2025-10-09": {
      "eaten_well": true,
      "did_sport": false,
      "studied": true,
      "slept_early": false,
      "saved_at": "2025-10-09T10:23:45+02:00"
    }
  }
}
```

## Variables de Entorno

Requiere las siguientes variables en `.env`:

```env
TELEGRAM_DAILY_BOT_TOKEN=tu_bot_token
TELEGRAM_CHAT_ID=tu_chat_id
VERCEL_APP_URL=https://tu-app.vercel.app
```

## Endpoints API

### GET `/api/daily-checkin`
Obtener datos:
- `?date=YYYY-MM-DD` - Log de un día específico
- `?month=YYYY-MM` - Logs de un mes
- Sin params - Mes actual + hoy

### POST `/api/daily-checkin`
Guardar registro:
```json
{
  "date": "2025-10-09",
  "eaten_well": true,
  "did_sport": true,
  "studied": true,
  "slept_early": false
}
```

### POST `/api/daily-checkin-cron`
Ejecutar recordatorios (llamado por GitHub Actions)

## Interfaz Web

Accede a `/daily-checkin` para ver:
- Calendario mensual con navegación
- Formulario de check-in diario
- Indicador visual del día seleccionado

## Cron Jobs

Configurado en `.github/workflows/daily-checkin-cron.yml`:
- 20:00 UTC (21:00 Madrid / 9 PM) Lunes-Jueves
- 21:00 UTC (22:00 Madrid / 10 PM) Lunes-Jueves

## Independencia del Sistema Principal

Este módulo es **completamente independiente** del sistema de recordatorios de cumpleaños:
- Carpeta separada `daily-checkin/`
- Base de datos JSON independiente
- Bot de Telegram independiente
- Workflow de GitHub Actions separado
- Sin dependencias compartidas con el código existente

## Instalación

El módulo ya está integrado. Solo necesitas:

1. Configurar las variables de entorno
2. El archivo `data/daily-checkin.json` se crea automáticamente
3. Acceder a `/daily-checkin` para usar la interfaz

## Desarrollo Local

Para probar localmente:

```bash
# El módulo se sirve automáticamente junto con la app principal
npm run dev

# Acceder a:
# - Interfaz: http://localhost:3000/daily-checkin
# - API datos: http://localhost:3000/api/daily-checkin
# - API cron: http://localhost:3000/api/daily-checkin-cron
```
