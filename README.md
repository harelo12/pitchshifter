# PitchShifter Backend (Node.js + Express)

Backend profesional para recibir archivos de audio reales, aplicar **pitch shift en semitonos** y devolver el archivo transformado para descarga.

## 1) Objetivo del sistema

- Recibir audio real (MP3, WAV, FLAC, OGG, etc.).
- Validar autenticación Google OAuth antes de procesar.
- Validar tamaño y formato real de archivo (no solo extensión).
- Aplicar cambio de tono sin requerir streaming en tiempo real.
- Devolver el audio transformado como descarga.

## 2) Arquitectura usada

Se usa una arquitectura por capas (inspirada en Clean/Hexagonal ligera):

- **Routes**: definen endpoints y composición de middlewares.
- **Controllers**: coordinan la petición y respuesta HTTP.
- **Services**: contienen lógica de negocio (validación audio, pitch shift, almacenamiento).
- **Middleware**: cross-cutting concerns (auth, upload, rate limit, errores).
- **Config**: configuración centralizada por entorno con valores por defecto.
- **Utils/Errors**: utilidades transversales y errores tipados.

Ventajas:
- Separación de responsabilidades.
- Fácil mantenimiento y pruebas.
- Preparado para extraer workers/colas en el futuro.

## 3) Estructura de carpetas

```txt
.
├── Dockerfile
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── .dockerignore
├── storage/
│   ├── uploads/
│   ├── processed/
│   └── temp/
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    │   ├── env.js
    │   ├── appConfig.js
    │   └── passport.js
    ├── controllers/
    │   ├── authController.js
    │   ├── healthController.js
    │   └── pitchController.js
    ├── errors/
    │   └── AppError.js
    ├── middleware/
    │   ├── errorHandler.js
    │   ├── rateLimiter.js
    │   ├── requireAuth.js
    │   └── uploadMiddleware.js
    ├── routes/
    │   ├── index.js
    │   ├── authRoutes.js
    │   ├── healthRoutes.js
    │   └── pitchRoutes.js
    ├── services/
    │   ├── audioProcessingService.js
    │   ├── fileValidationService.js
    │   └── storageService.js
    └── utils/
        ├── asyncHandler.js
        ├── fsUtils.js
        └── logger.js
```

## 4) Flujo completo (de subida a descarga)

1. Cliente inicia OAuth con Google (`/api/v1/auth/google`).
2. Google redirige a callback (`/api/v1/auth/google/callback`) y se crea sesión.
3. Cliente autenticado envía `POST /api/v1/pitch/process` con `multipart/form-data`:
   - campo archivo: `audio`
   - campo `semitones`: número entre -24 y 24
   - campo opcional `outputFormat`: formato de salida permitido
4. `multer` guarda temporalmente en disco con límite de 100MB configurable.
5. `fileValidationService` valida:
   - existe archivo
   - tamaño permitido
   - formato real detectado por firma/mime (`file-type` + validaciones RIFF/FLAC)
6. `audioProcessingService`:
   - usa `ffprobe` para sample rate
   - ejecuta `ffmpeg` con filtros para pitch shift
   - genera archivo final en `storage/processed`
7. Se devuelve el archivo con `res.download(...)`.
8. Al finalizar, se limpia archivo de entrada y salida para evitar acumulación.

## 5) Endpoints principales

### Health
- `GET /api/v1/health`

### Auth
- `GET /api/v1/auth/google`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/failure`

### Pitch (protegidos)
- `GET /api/v1/pitch/config`
- `POST /api/v1/pitch/process`

## 6) Configuración centralizada

Toda la configuración vive en `src/config/env.js` y `src/config/appConfig.js`.

Variables relevantes:
- `MAX_FILE_SIZE_MB`
- `ALLOWED_INPUT_FORMATS`
- `ALLOWED_OUTPUT_FORMATS`
- `DEFAULT_OUTPUT_FORMAT`
- `UPLOAD_DIR`, `PROCESSED_DIR`, `TEMP_DIR`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX_REQUESTS`

## 7) Seguridad aplicada

- Autenticación con Google OAuth 2.0 (Passport).
- Sesión HTTP-only con `express-session`.
- Validación de formato real del archivo (no solo extensión).
- Límite de tamaño de carga y de número de archivos.
- `helmet` para cabeceras de seguridad.
- `express-rate-limit` para limitar abuso de API.
- Manejo centralizado de errores, sin filtrar stack traces al cliente.

## 8) Escalabilidad futura

El diseño facilita migrar a:
- cola de trabajos (BullMQ/RabbitMQ/SQS)
- workers dedicados de FFmpeg
- almacenamiento externo (S3, GCS)
- base de datos para historial de trabajos

La lógica de audio ya está encapsulada en `audioProcessingService`, lo que permite moverla a workers sin romper rutas/controladores.

## 9) Ejecución en local

### Requisitos
- Node.js 20+
- FFmpeg instalado en sistema (si no usas Docker)

### Pasos

```bash
cp .env.example .env
npm install
npm run dev
```

## 10) Ejecución con Docker

```bash
docker build -t pitchshifter-backend .
docker run --rm -p 3000:3000 --env-file .env pitchshifter-backend
```

## 11) Qué hace cada parte del Dockerfile

1. Usa `node:20-bookworm-slim` como base.
2. Instala `ffmpeg` (requisito para procesar audio real).
3. Copia `package*.json` e instala dependencias de producción.
4. Copia el resto del proyecto.
5. Crea directorios de almacenamiento.
6. Expone puerto `3000`.
7. Arranca con `npm start`.

## 12) Notas operativas

- Este backend usa sesión de servidor. Para apps móviles/escritorio puedes mantener cookies de sesión o extender a JWT en una siguiente iteración.
- En producción debes configurar `SESSION_SECRET` robusto y cookies seguras detrás de HTTPS.
- El algoritmo de pitch shift usa FFmpeg con compensación de tempo; la calidad final depende de codec/origen y build de FFmpeg.
