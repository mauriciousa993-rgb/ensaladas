# Despliegue: Render (backend) + Vercel (frontend)

## 1) Backend en Render

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

## 2) Frontend en Vercel

1. En Vercel, importa el mismo repo.
2. Configura el proyecto para usar:
   - `Root Directory`: `frontend`
   - Framework: `Next.js`
3. Variables de entorno recomendadas en Vercel:
   - `NEXT_PUBLIC_APP_URL=https://tu-frontend.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL=https://tu-backend.onrender.com`
   - `NEXT_PUBLIC_WOMPI_REDIRECT_URL=https://tu-frontend.vercel.app/payment/response`
   - (Opcional solo fallback local sin backend remoto) `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`
4. Despliega.

## 3) Validación cruzada

1. Abre `https://tu-frontend.vercel.app`.
2. Crea un pedido de prueba.
3. Revisa en `https://tu-frontend.vercel.app/admin` que aparezca la orden.
4. Si falla por CORS, confirma que `CORS_ORIGINS` en Render coincide exactamente con tu dominio de Vercel.

## 4) Desarrollo local con la misma arquitectura

1. Backend local:
   - `cd backend`
   - `npm run dev`
2. Frontend local:
   - `cd frontend`
   - configura `.env.local` con `NEXT_PUBLIC_API_BASE_URL=http://localhost:3002`
   - `npm run dev`
