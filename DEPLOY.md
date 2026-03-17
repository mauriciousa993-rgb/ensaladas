# Despliegue (recomendado): Vercel (full‑stack Next.js)

Este repo es un monorepo con:
- `frontend/`: Next.js 14 (incluye rutas `src/app/api/*` + conexión a MongoDB).
- `backend/`: Express/TS (opcional, si quieres separar backend).

Hoy puedes desplegar **todo en Vercel** usando solo `frontend/` (API + UI), sin Render.

## Opción A (recomendada): Todo en Vercel (solo `frontend/`)

1. Sube este repo a GitHub.
2. En Vercel, importa el repo y configura:
   - `Root Directory`: `frontend`
   - Framework: `Next.js`
3. Variables de entorno en Vercel (Project → Settings → Environment Variables):
   - `MONGODB_URI` (obligatoria si NO es demo)
   - Demo (si quieres una demo sin backend/Mongo):
     - `NEXT_PUBLIC_DEMO_MODE=true`
     - (opcional) `DEMO_MODE=true`
   - `NEXT_PUBLIC_APP_URL=https://tu-frontend.vercel.app`
   - `NEXT_PUBLIC_WOMPI_REDIRECT_URL=https://tu-frontend.vercel.app/payment/response`
   - Cloudinary (recomendado si usas el admin para subir imágenes):
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
     - `CLOUDINARY_FOLDER` (opcional, ejemplo: `ensaladas`)
   - WhatsApp/Twilio (opcional):
     - `WHATSAPP_BUSINESS_NUMBER` (ejemplo: `573001234567`)
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
4. Despliega.
5. Validación rápida:
   - Abre `https://tu-frontend.vercel.app`.
   - Prueba que `GET /api/salads` responda (desde la app o directo).

Notas:
- Si usas MongoDB Atlas con IP whitelist, debes permitir conexiones desde Vercel (suele ser `0.0.0.0/0` con usuario/clave fuertes) o configurar una red que lo soporte.
- En este modo **NO necesitas** `NEXT_PUBLIC_API_BASE_URL` (las llamadas usan `/api/*` del mismo Next).
- En **demo** el menú/órdenes/reportes usan datos mock y no se guardan; Cloudinary y operaciones de escritura (crear/editar/borrar) quedan deshabilitadas.

---

## Opción B: Render (backend) + Vercel (frontend)

### 1) Backend en Render

1. Sube este repo a GitHub.
2. En Render, crea un `Blueprint` desde el repo (usa `render.yaml`) o crea un `Web Service` manual con:
   - `Root Directory`: `backend`
   - `Build Command`: `npm ci && npm run build`
   - `Start Command`: `npm start`
   - `Health Check Path`: `/health`
3. Configura variables de entorno del backend:
   - `MONGODB_URI`
   - `CORS_ORIGINS` (ejemplo: `https://tu-frontend.vercel.app,https://*.vercel.app`)
   - `FRONTEND_URL` (ejemplo: `https://tu-frontend.vercel.app`)
   - `WOMPI_REDIRECT_URL` (ejemplo: `https://tu-frontend.vercel.app/payment/response`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_FOLDER` (opcional, ejemplo: `ensaladas`)
4. Despliega y verifica:
   - `https://tu-backend.onrender.com/health` debe responder `{ ok: true, ... }`

### 2) Frontend en Vercel

1. En Vercel, importa el mismo repo.
2. Configura el proyecto para usar:
   - `Root Directory`: `frontend`
   - Framework: `Next.js`
3. Variables de entorno recomendadas en Vercel:
   - `NEXT_PUBLIC_APP_URL=https://tu-frontend.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL=https://tu-backend.onrender.com` (si quieres que el frontend apunte al backend de Render)
   - `NEXT_PUBLIC_WOMPI_REDIRECT_URL=https://tu-frontend.vercel.app/payment/response`
   - (Opcional solo fallback local sin backend remoto) `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`
4. Despliega.

### 3) Validación cruzada

1. Abre `https://tu-frontend.vercel.app`.
2. Crea un pedido de prueba.
3. Revisa en `https://tu-frontend.vercel.app/admin` que aparezca la orden.
4. Si falla por CORS, confirma que `CORS_ORIGINS` en Render coincide exactamente con tu dominio de Vercel.

### 4) Desarrollo local con la misma arquitectura

1. Backend local:
   - `cd backend`
   - `npm run dev`
2. Frontend local:
   - `cd frontend`
   - configura `.env.local` con `NEXT_PUBLIC_API_BASE_URL=http://localhost:3002`
   - `npm run dev`
