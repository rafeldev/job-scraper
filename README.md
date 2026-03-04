# Job Scraper Colombia (Playwright + TypeScript + PostgreSQL)

Sistema de scraping modular para ofertas Frontend (React/TypeScript) en Colombia, sin dependencia de servicios pagos de scraping.

## Stack

- Node.js + TypeScript
- Playwright + stealth
- PostgreSQL (fuente principal de verdad)
- GitHub Actions (2-3 ejecuciones diarias)
- Exportación a JSON/CSV/XLSX
- Sincronización opcional a Notion

## Sitios objetivo

**Colombia / regional:** Computrabajo, ElEmpleo, Indeed Colombia, Magneto365.

**Remoto internacional (EE.UU. / global):** Working Nomads (gratuito), Remote OK (API JSON).

## Arquitectura

```text
src/
  core/
    browser/         # anti-detección: UA rotativo, throttling, circuit breaker
    parsers/         # normalización, filtros, dedupe
    orchestrator.ts  # coordinación de scrapers y pipeline
    exporter.ts      # exportaciones JSON/CSV/XLSX
  scrapers/          # un scraper por portal
  db/
    migrations/      # SQL versionado
    repositories/    # persistencia, versionado, desactivación
  integrations/
    notion.ts        # salida opcional
```

## Configuración

### 1) Variables de entorno

```bash
cp .env.example .env
```

Variables principales:

- `DATABASE_URL`: conexión a PostgreSQL (requerida)
- `NOTION_SYNC_ENABLED`: `true/false` (opcional)
- `NOTION_API_KEY`, `NOTION_PARENT_PAGE_ID` (si Notion está habilitado)
- `NOTION_SYNC_SINCE_DAYS`: cuántos días atrás sincronizar (por defecto 7; solo para `npm run sync:notion`)

### 2) Configuración de scraping

Archivo: `config/sites.yaml`

- URLs iniciales por sitio
- Selectores primarios y fallback
- Límites (timeouts, retries, delays)
- Filtros (keywords, ubicaciones, empresas excluidas)

## Instalación local

```bash
npm install
npx playwright install chromium
npm run migrate
npm run scrape
```

## Ejecución con Docker

```bash
docker compose up --build
```

Esto levanta PostgreSQL y ejecuta migraciones + scraper.

## Sincronización con Notion (tablas por día)

La fuente de verdad es **Supabase**. Notion se rellena leyendo de la DB:

- **Una tabla (base de datos) por día**: se crea o reutiliza una base en Notion con nombre `Ofertas de Trabajo - YYYY-MM-DD`.
- El día se define por **first_seen_at** en la DB: los jobs que “vimos por primera vez” ese día van a esa tabla.
- Tras cada `npm run scrape` se sincronizan automáticamente los **últimos 3 días** desde Supabase a Notion (crear/actualizar páginas por URL).
- Para sincronizar más días sin hacer scrape: `npm run sync:notion`. Usa `NOTION_SYNC_SINCE_DAYS` (por defecto 7).

Requisitos: `NOTION_SYNC_ENABLED=true`, `NOTION_API_KEY`, `NOTION_PARENT_PAGE_ID` (página bajo la que se crean las bases).

## Scripts

- `npm run migrate`: aplica migraciones SQL
- `npm run scrape`: ejecuta pipeline principal (incluye sync Notion últimos 3 días)
- `npm run sync:notion`: solo sincroniza Supabase → Notion (últimos `NOTION_SYNC_SINCE_DAYS` días)
- `npm run lint`: validación TypeScript
- `npm run test`: pruebas unitarias e integración con fixtures
- `npm run dev`: ejecutar en modo desarrollo con `tsx`

## Scheduler (GitHub Actions)

Workflow: `.github/workflows/daily-scraper.yml`

- Ejecuta en UTC: `11:00`, `16:00`, `21:00` (3 veces al día)
- Instala Chromium de Playwright
- Corre migraciones y scraping
- Publica artefactos de `logs/` y `exports/`

Secretos recomendados en GitHub:

- `DATABASE_URL`
- `NOTION_SYNC_ENABLED` (opcional)
- `NOTION_API_KEY`, `NOTION_PARENT_PAGE_ID` (opcionales)

## Modelo de datos

Tablas principales:

- `jobs`: estado actual de la vacante
- `job_versions`: historial de cambios de contenido
- `job_sources`: misma vacante detectada en distintos portales
- `scrape_runs`: métricas por ejecución
- `scrape_errors`: errores estructurados por fase/sitio

## Cómo agregar un nuevo sitio

1. Crea un scraper en `src/scrapers/<sitio>.scraper.ts` extendiendo `BaseSiteScraper`.
2. Regístralo en `src/scrapers/index.ts`.
3. Agrega su bloque en `config/sites.yaml` con:
   - `startUrls`
   - `selectors.card/title/company/location/salary/link/date`
   - `selectors.nextPage` (si aplica)
4. Agrega fixture HTML y prueba de integración en `src/scrapers/`.

**Qué tener en cuenta:** Inspecciona el HTML real de la página de listado para definir selectores estables (evita clases generadas). Incluye 2–3 fallbacks por campo. Si el sitio tiene API pública (ej. Remote OK), puedes implementar un scraper con `fetch()` y mapear a `RawJob[]`; en `sites.yaml` el schema exige al menos un selector en `card`/`title`/`link` (puedes usar placeholders). El `name` en YAML debe coincidir con la clave en `createScraperMap()`. Respeta rate limiting y términos de uso (algunas APIs piden enlazar y citar la fuente).

## Testing

- Unit tests: normalización, filtros y dedupe.
- Integration tests: parsing con fixtures HTML (sin requests reales).
- Smoke test recomendado: correr 1 página por sitio en entorno de staging.

## Troubleshooting

- **Timeouts o 403/429**: aumenta `minDelayMs/maxDelayMs`, reduce `maxPages`, y revisa retries.
- **0 resultados en un sitio**: probablemente cambiaron selectores; ajusta fallback en `config/sites.yaml`.
- **Error de DB**: verifica `DATABASE_URL` y corre `npm run migrate`.
- **Playwright en CI falla**: revisa step `npx playwright install --with-deps chromium`.

## Consideraciones éticas y legales

- Verifica y respeta los términos de servicio de cada portal antes de usar en producción.
- Mantén rate limiting responsable para no sobrecargar servidores de terceros.
- Usa los datos exclusivamente para fines personales y legítimos de búsqueda de empleo.

## Estado actual del proyecto

Migrado a pipeline TypeScript + Playwright + PostgreSQL.
El flujo legacy de Firecrawl quedó desactivado en `src/scraper.js`.
