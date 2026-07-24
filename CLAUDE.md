# Market Pulse

PWA informativa de mercados financieros para uso personal y un grupo cerrado de amigos. No comercial, no escala a miles de usuarios. **Solo informativa: nunca presentar señales como recomendaciones de compra/venta.**

## Restricción absoluta: costo cero

- Solo servicios con plan gratuito real, sin tarjeta de crédito, sin riesgo de cobro automático.
- Ante la duda entre una opción potente-pero-potencialmente-paga y una limitada-pero-gratis, elegir siempre la gratis.
- Datos demorados son aceptables; tiempo real no es requisito.
- Antes de integrar cualquier servicio: verificar plan free vigente, límites, qué pasa al superarlos, y calcular las solicitudes diarias estimadas.

## Stack decidido (verificado 2026-07-23)

| Capa | Servicio | Notas |
|---|---|---|
| Frontend | React + TypeScript + Vite + vite-plugin-pwa | PWA instalable |
| Hosting | Cloudflare Pages (free, sin tarjeta) | Ancho de banda ilimitado en estáticos |
| DB + API | Supabase free (sin tarjeta) | Postgres + REST (PostgREST) + RLS. Se pausa tras 7 días sin actividad → el cron diario lo mantiene activo |
| Cron / sync | GitHub Actions (repo **público** = minutos ilimitados) | Script Node/TS que consulta las fuentes y hace upsert en Supabase con `service_role` (GH Secret) |
| Repo | GitHub free | Secrets en GH Secrets, nunca en el código. `.env.example` sí |

## Fuentes de datos (verificadas)

- **Dólar (oficial/blue/MEP/CCL/tarjeta/mayorista/cripto):** DolarAPI (`https://dolarapi.com/v1/dolares`, gratis, sin key). Fallback: Bluelytics.
- **Acciones argentinas / CEDEARs / MEP / CCL / históricos:** **data912.com** — API gratuita sin key, rate limit 120 req/min, licencia "do whatever you want". Endpoints: `/live/arg_stocks`, `/live/arg_cedears`, `/live/mep`, `/live/ccl`, `/historical/stocks/{ticker}`. Es la fuente que alimenta a finanzasargy.com (mismo autor, Milton Casco). **finanzasargy.com en sí devuelve 403 a clientes automatizados — no scrapear.**
- **Cripto (Etapa 2):** CoinGecko free.
- **Acciones US (Etapa 2):** data912 `/live/usa_stocks` / `/live/usa_adrs`; evaluar Finnhub/Stooq como complemento.
- **Noticias (Etapa 2):** RSS públicos (verificar cada feed antes de incluirlo; no asumir que existe).
- **Push (Etapa 3):** FCM sin activar Blaze ni billing.

## Etapas

1. **(actual)** Dólar + brecha cambiaria + acciones argentinas con ranking subas/bajas + historial básico + PWA deployada. Sin auth, sin noticias, sin cripto, sin push, sin cartera.
2. Cripto + acciones US + noticias + filtros + detalle de activo.
3. Alertas + FCM + notificaciones en segundo plano.
4. Cartera personal + RSI/medias móviles + sistema de oportunidades.
5. Supabase Auth + invitaciones + RLS por usuario.

No avanzar de etapa hasta que la actual funcione. Antes de cada etapa: explicar qué se construye, re-verificar gratuidad, avisar qué debe configurar el usuario, recién después codear. Entregar archivos completos con su ruta exacta.

## Decisiones de diseño clave

- El frontend **solo lee** de Supabase (anon key + RLS solo-SELECT). Nunca llama a las APIs externas directamente.
- Toda escritura pasa por el script de sync en GitHub Actions (service_role).
- Guardar siempre el último dato válido; si una fuente falla, se muestra el dato anterior con su timestamp.
- Deduplicación por `UNIQUE (…, quoted_at)` + upsert idempotente.
- No consultar fuera del horario de mercado (BYMA ≈ 11:00–17:00 ART; cron en UTC = ART+3).
- Registrar cada corrida en `sync_runs` y errores en `sync_errors`.
- Mantener repo público sin secretos para minutos ilimitados de Actions; workflow con keepalive para que GitHub no deshabilite el cron a los 60 días sin commits.
