# Market Pulse — Etapa 1

PWA informativa de mercados financieros (Argentina). Etapa 1: cotizaciones del dólar,
brecha cambiaria y ranking de acciones argentinas (subas/bajas). Todo con servicios
**100% gratuitos, sin tarjeta de crédito**.

> App **informativa**. No constituye recomendación de compra o venta.

## Arquitectura (resumen)

```
GitHub Actions (cron 15 min)  →  DolarAPI + data912  →  upsert  →  Supabase (Postgres)
                                                                        ↑ SELECT (anon + RLS)
                                                     PWA React (Cloudflare Pages) ─┘
```

- El **frontend solo lee** de Supabase. Nunca llama a las APIs externas.
- Toda escritura pasa por `sync/` (GitHub Actions) con la `service_role` key.
- Ver `CLAUDE.md` para las decisiones de diseño y las fuentes verificadas.

## Requisitos

- Node.js 20 LTS (incluye npm).
- Cuentas gratuitas (sin tarjeta): GitHub, Supabase, Cloudflare.

---

## Puesta en marcha — paso a paso

### 1. Crear el proyecto en Supabase
1. Entrá a https://supabase.com → **New project** (registro con GitHub, no pide tarjeta).
2. Cuando esté listo, andá a **SQL Editor** y pegá/ejecutá, en orden:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_retention.sql`
3. Andá a **Project Settings → API** y copiá:
   - **Project URL**
   - **anon public** key
   - **service_role** key ⚠️ (secreta)

### 2. Variables de entorno locales
```bash
cp .env.example .env
```
Completá `.env` con los valores del paso anterior. **`.env` no se commitea** (está en `.gitignore`).

### 3. Instalar y probar en local
```bash
npm install
npm run sync      # hace una corrida de sync (llena la base)
npm run dev       # abre el frontend en http://localhost:5173
```
> `npm run sync` en local usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de tu `.env`.
> Si el mercado de acciones está cerrado, sólo se cargará el dólar (es lo esperado).

### 4. Subir a GitHub (repo PÚBLICO)
Creá un repositorio **público** (así los minutos de GitHub Actions son ilimitados) y subí el código.
Luego, en **Settings → Secrets and variables → Actions → New repository secret**, cargá:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

El cron (`.github/workflows/sync.yml`) empieza a correr solo cada 15 min. Podés dispararlo
manualmente desde la pestaña **Actions → sync-market-data → Run workflow**.

### 5. Deploy del frontend en Cloudflare Pages
1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
2. Elegí el repo. Configuración de build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. En **Settings → Environment variables** cargá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Tu PWA queda en `https://<tu-proyecto>.pages.dev` — instalable en celular y desktop.

---

## Secretos: qué va dónde

| Variable | Dónde | ¿Secreta? |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` local + Cloudflare Pages | No |
| `VITE_SUPABASE_ANON_KEY` | `.env` local + Cloudflare Pages | No (protegida por RLS) |
| `SUPABASE_URL` | `.env` local + GitHub Secrets | No |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` local + GitHub Secrets | **SÍ — nunca al frontend ni al repo** |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Frontend en modo desarrollo |
| `npm run build` | Build de producción (`dist/`) |
| `npm run preview` | Previsualiza el build |
| `npm run sync` | Corre el sync una vez (necesita `.env`) |
| `npm run typecheck` | Chequeo de tipos |

## Pendiente antes del deploy final (opcional)

- **Iconos PWA:** falta generar `public/pwa-192x192.png`, `public/pwa-512x512.png` y
  `public/apple-touch-icon.png` (el `favicon.svg` ya está). Podés generarlos desde el SVG con
  cualquier herramienta (p. ej. https://realfavicongenerator.net) y dejarlos en `public/`.
  Sin ellos la app funciona igual, pero el instalador PWA queda más prolijo con los PNG.

## Costos

Cero. Supabase Free (sin tarjeta, sin overage), GitHub Actions (ilimitado en repo público),
Cloudflare Pages (sin techo de ancho de banda), DolarAPI y data912 (gratis, sin key).
El sync hace **< 300 requests/día**, muy por debajo de cualquier límite.
