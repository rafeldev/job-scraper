# Diseño: Notificaciones de ofertas a Discord

## Objetivo

Enviar una notificación diaria al celular (vía Discord) con el número de ofertas nuevas encontradas en las últimas 24 horas, a las 8:00 AM (hora Colombia), y disparar una alerta adicional cuando el volumen supere un umbral.

## Requisitos validados

- Canal: Discord (webhook en canal privado).
- Frecuencia: resumen diario a las 8:00 AM `America/Bogota`.
- Métrica: total de ofertas nuevas en ventana móvil de 24 horas.
- Contenido del resumen: solo el total (sin top ofertas ni desglose por fuente).
- Alerta extra: enviar segundo mensaje si `total >= 20`.

## Opciones consideradas

1. Webhook de Discord + job programado (recomendada).
2. Bot de Discord completo (más flexible, mayor complejidad).
3. Notificaciones indirectas vía Notion + tercero (más dependencias, menor simplicidad).

Se selecciona la opción 1 por simplicidad, costo cero y bajo mantenimiento.

## Arquitectura propuesta

### Componentes

- `src/integrations/discord.ts` (nuevo):
  - Cliente mínimo para enviar mensajes a webhook.
  - Manejo de errores HTTP y mensajes no exitosos.
- `src/scripts/notifyDiscord.ts` (nuevo):
  - Carga de variables de entorno.
  - Consulta SQL para contar ofertas nuevas en 24 horas.
  - Envío del resumen diario.
  - Envío condicional de alerta por umbral.
- `.github/workflows/discord-notify.yml` (nuevo recomendado):
  - Ejecución diaria y manual (`workflow_dispatch`).
  - Inyección de secretos y ejecución del script.

### Variables de entorno

- `DISCORD_WEBHOOK_URL` (requerida)
- `DISCORD_ALERT_THRESHOLD` (opcional, default `20`)
- `NOTIFY_TIMEZONE` (opcional, default `America/Bogota`)
- `DATABASE_URL` (requerida, ya existente)

## Flujo operativo

1. El scheduler dispara el workflow a las 8:00 AM hora Colombia.
2. El script abre conexión a PostgreSQL.
3. Ejecuta conteo de `jobs` con `first_seen_at >= now() - interval '24 hours'`.
4. Envía mensaje base: `Ofertas nuevas (24h): N`.
5. Si `N >= threshold`, envía alerta extra.
6. Cierra recursos y finaliza.

## Manejo de errores

- Falla rápida si falta `DISCORD_WEBHOOK_URL` o `DATABASE_URL`.
- Si Discord responde error (`4xx/5xx`), registrar detalle y terminar con código de error.
- Reintento ligero para webhook (1 intento adicional con backoff corto).
- No ocultar errores de DB; propagar para visibilidad en CI.

## Plan de implementación

1. Crear integración `discord.ts`.
2. Crear script `notifyDiscord.ts`.
3. Añadir script npm `notify:discord`.
4. Agregar variables en `.env.example` y documentación en `README.md`.
5. Crear workflow `discord-notify.yml`.
6. Validar con corrida manual y pruebas de umbral/fallo.

## Plan de pruebas

- Prueba local: `npm run notify:discord` con webhook real.
- Prueba umbral: set temporal `DISCORD_ALERT_THRESHOLD=1`.
- Prueba de fallo: webhook inválido para confirmar error controlado.
- Prueba CI: ejecutar `workflow_dispatch` y verificar recepción en Discord.

## Criterios de éxito

- Se recibe un resumen diario a las 8:00 AM con el total de 24h.
- Si el total es mayor o igual a 20, llega alerta adicional.
- El flujo opera sin intervención manual por al menos 3 días seguidos.

## Rollback

- Desactivar workflow o remover `DISCORD_WEBHOOK_URL` del entorno.
- No requiere rollback de esquema ni migraciones de base de datos.

