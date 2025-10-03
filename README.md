# 🚀 Job Scraper Automation

Sistema automatizado de scraping de ofertas de trabajo React/TypeScript en LATAM usando GitHub Actions + Firecrawl + Notion.

## ✨ Novedades

- 🆕 **Crea una base de datos nueva cada día automáticamente**
- 🗂️ **Mantén tus búsquedas organizadas por fecha**
- 📅 **No más mezcla de resultados de diferentes días**

## 📋 Características

- ✅ **Scraping automático diario** a las 9:00 AM UTC (4:00 AM Colombia)
- ✅ **Base de datos nueva cada día** en Notion
- ✅ **Filtrado inteligente** (< 72 horas, excluye empresas no deseadas)
- ✅ **Sistema de caché** (evita duplicados)
- ✅ **100% gratis** usando GitHub Actions
- ✅ **Logs detallados** para debugging

## 🛠️ Tecnologías

- **GitHub Actions** - Automatización y scheduling
- **Firecrawl API** - Web scraping inteligente
- **Notion API** - Base de datos de ofertas
- **Node.js 18+** - Runtime

---

## 📦 Instalación

### Paso 1: Fork o Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/job-scraper.git
cd job-scraper

# Instalar dependencias
npm install
```

### Paso 2: Configurar Notion

#### 2.1. Crear una Integración en Notion

1. Ve a [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click en **"+ New integration"**
3. Configuración:
   - **Name**: `Job Scraper Bot`
   - **Associated workspace**: Selecciona tu workspace
   - **Capabilities**: 
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. Click **"Submit"**
5. **Copia el "Internal Integration Secret"** → lo necesitarás como `NOTION_API_KEY`

#### 2.2. Crear una Página Padre en Notion

1. **Crea una nueva página en Notion** (puedes llamarla "Job Scraper" o "Ofertas de Trabajo")
2. **Comparte la página con tu integración:**
   - Abre la página
   - Click en `⋯` (tres puntos) arriba a la derecha
   - Click en **"Connections"** o **"Conectar con"**
   - Busca y selecciona tu integración **"Job Scraper Bot"**
   - Click **"Confirm"**

#### 2.3. Obtener el ID de la Página Padre

Tienes dos opciones:

**Opción A: Manualmente desde la URL**

La URL de tu página se ve así:
```
https://www.notion.so/mi-workspace/Job-Scraper-abc123def456...?pvs=4
                                              ↑ Este es el ID
```

Copia todo desde el último `/` hasta el `?` (o hasta el final si no hay `?`).

**Opción B: Usando el script helper** (Recomendado)

```bash
# 1. Crea el archivo .env
cp .env.example .env

# 2. Edita .env y agrega tu NOTION_API_KEY
nano .env

# 3. Ejecuta el script
npm run get-page-id
```

Este script te mostrará todas las páginas accesibles y sus IDs.

#### 2.4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API de Notion
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PARENT_PAGE_ID=abc123def456...

# API de Firecrawl
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxxxxxxxxxx
```

### Paso 3: Configurar Firecrawl

1. Ve a [https://firecrawl.dev](https://firecrawl.dev)
2. Regístrate (email o Google)
3. Ve a **Dashboard** → **API Keys**
4. **Copia tu API Key**
5. Planes disponibles:
   - **Free**: 500 créditos one-time (para probar)
   - **Hobby**: $16/mes, 3,000 créditos (recomendado)
   - **Standard**: $79/mes, 15,000 créditos

### Paso 4: Configurar GitHub Secrets (Para automatización)

Para que GitHub Actions ejecute el scraper automáticamente:

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **"New repository secret"** y agrega estos 3 secrets:

| Secret Name | Valor | Descripción |
|------------|-------|-------------|
| `NOTION_API_KEY` | `secret_xxxxx...` | Token de integración de Notion |
| `NOTION_PARENT_PAGE_ID` | `abc123...` | ID de tu página padre en Notion |
| `FIRECRAWL_API_KEY` | `fc-xxxxx...` | Tu API key de Firecrawl |

---

## 🚀 Uso

### Ejecución Manual (Testing Local)

```bash
# Asegúrate de tener el archivo .env configurado
npm run scrape
```

Esto creará una nueva base de datos en Notion con la fecha de hoy y guardará todas las ofertas encontradas.

### Verificar Configuración

```bash
# Ver todas las páginas accesibles y sus IDs
npm run get-page-id
```

### Ejecución Automática (GitHub Actions)

El workflow se ejecuta automáticamente:
- **Diariamente a las 9:00 AM UTC** (4:00 AM Colombia)
- **Crea una base de datos nueva cada día** con el formato: `Ofertas de Trabajo - YYYY-MM-DD`
- O ejecuta manualmente:
  1. Ve a la pestaña **Actions** en GitHub
  2. Click en **"Daily Job Scraper"**
  3. Click en **"Run workflow"** → **"Run workflow"**

### Ver Logs

1. Ve a la pestaña **Actions** en GitHub
2. Click en la ejecución más reciente
3. Click en el job **"scrape-and-save"**
4. Expande los steps para ver logs detallados

---

## ⚙️ Configuración

### Personalizar Sitios de Búsqueda

Edita `config/sites.json`:

```json
{
  "sites": [
    {
      "name": "LinkedIn",
      "enabled": true,
      "useFirecrawl": true,
      "searchUrl": "site:linkedin.com/jobs react typescript Colombia",
      "priority": "high"
    },
    {
      "name": "Get on Board",
      "enabled": true,
      "useFirecrawl": true,
      "searchUrl": "site:getonbrd.com react typescript",
      "priority": "medium"
    }
  ]
}
```

### Personalizar Filtros

```json
{
  "filters": {
    "maxAgeHours": 72,
    "excludeCompanies": ["BairesDev", "bairesdev"],
    "keywords": ["react", "typescript", "javascript", "frontend"],
    "locations": ["Colombia", "LATAM", "Remote"],
    "modalities": ["remote", "hybrid", "remoto", "híbrido"]
  }
}
```

### Cambiar Horario de Ejecución

Edita `.github/workflows/daily-scrape.yml`:

```yaml
on:
  schedule:
    # Formato: minuto hora día mes día-semana (UTC)
    - cron: '0 9 * * *'   # 9:00 AM UTC = 4:00 AM Colombia
    
    # Otros ejemplos:
    # - cron: '0 13 * * *'  # 1:00 PM UTC = 8:00 AM Colombia
    # - cron: '0 18 * * *'  # 6:00 PM UTC = 1:00 PM Colombia
```

**Conversor de zona horaria:**
- Colombia (COT) = UTC-5
- Para convertir: Hora_Colombia + 5 = Hora_UTC
- Ejemplo: 8:00 AM Colombia = 1:00 PM UTC (13:00)

Usa [crontab.guru](https://crontab.guru/) para generar expresiones cron.

---

## 📊 Estructura de la Base de Datos en Notion

Cada día se crea una base de datos con estas propiedades:

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| **Título** | Title | Título de la oferta |
| **Empresa** | Text | Nombre de la empresa |
| **Ubicación** | Text | Ciudad/país |
| **Modalidad** | Select | 🏠 Remoto, 🏢 Híbrido, 🏢 Presencial |
| **Salario** | Text | Rango salarial (si está disponible) |
| **Sitio** | Text | Fuente (LinkedIn, etc.) |
| **Link** | URL | URL de la oferta |
| **Fecha** | Date | Fecha de scraping |
| **¿Aplicado?** | Checkbox | Para marcar si ya aplicaste |

La descripción completa de cada oferta se guarda en el contenido de la página.

---

## 🐛 Troubleshooting

### Error: "Could not find database with ID"

**Solución**: Este error ya no debería aparecer porque ahora el sistema crea la base de datos automáticamente.

### Error: "Could not find page with ID"

**Problema**: El `NOTION_PARENT_PAGE_ID` es incorrecto o la página no está compartida con tu integración.

**Solución**:
1. Ejecuta `npm run get-page-id` para ver tus páginas disponibles
2. Verifica que la página esté compartida con tu integración:
   - Abre la página en Notion
   - Click `⋯` → "Connections" → Selecciona tu integración
3. Actualiza el `NOTION_PARENT_PAGE_ID` en tu `.env` o GitHub Secrets

### Error: "Firecrawl API authentication failed"

**Solución**:
1. Verifica tu `FIRECRAWL_API_KEY` en `.env` o GitHub Secrets
2. Genera una nueva API key en [Firecrawl Dashboard](https://firecrawl.dev/app/api-keys)
3. Asegúrate de que tu plan tenga créditos disponibles

### El workflow no se ejecuta automáticamente

**Problema**: GitHub desactiva workflows en repos inactivos después de 60 días.

**Solución**:
1. Haz cualquier commit: `git commit --allow-empty -m "Keep workflow active"`
2. O ejecuta el workflow manualmente desde Actions tab

### "No hay ofertas nuevas para procesar"

**Problema**: El sistema filtra ofertas duplicadas y antiguas.

**Solución**:
1. Verifica que `maxAgeHours: 72` no sea muy restrictivo
2. Revisa los logs para ver qué ofertas fueron excluidas
3. Ajusta los filtros en `config/sites.json`

---

## 💰 Costos

| Servicio | Plan | Costo | Notas |
|----------|------|-------|-------|
| **GitHub Actions** | Free | $0/mes | 2,000 min/mes incluidos |
| **Firecrawl** | Free | $0 | 500 créditos one-time (prueba) |
| **Firecrawl** | Hobby | $16/mes | 3,000 créditos/mes ⭐ |
| **Notion** | Personal | $0/mes | Suficiente para esto |

**Total recomendado**: $16/mes (solo Firecrawl Hobby)

**Estimación de uso:**
- ~50-100 páginas scrapeadas por día
- ~1,500-3,000 páginas por mes
- Plan Hobby es suficiente ✅

---

## 📁 Estructura del Proyecto

```
job-scraper/
├── .github/
│   └── workflows/
│       └── daily-scrape.yml     # GitHub Actions workflow
├── cache/
│   └── jobs.json                # Caché de ofertas (evita duplicados)
├── config/
│   └── sites.json               # Configuración de sitios a scrapear
├── src/
│   ├── cache.js                 # Manejo de caché
│   ├── get-page-id.js           # Helper: obtener IDs de páginas
│   ├── notion.js                # Integración con Notion
│   ├── scraper.js               # Script principal
│   └── setup-database.js        # Configurar base de datos existente
├── .env                         # Variables de entorno (NO commitear)
├── package.json
└── README.md
```

---

## 🎯 Flujo de Ejecución

```
1. GitHub Actions se ejecuta (schedule o manual)
   ↓
2. Se crea una nueva base de datos en Notion
   Nombre: "Ofertas de Trabajo - 2025-10-03"
   ↓
3. Se buscan ofertas en cada sitio configurado
   (LinkedIn, Computrabajo, Get on Board, etc.)
   ↓
4. Se filtran ofertas:
   - ❌ Antiguas (> 72 horas)
   - ❌ Empresas excluidas (ej: BairesDev)
   - ❌ Ya existentes en caché
   ↓
5. Se guardan ofertas nuevas en la base de datos del día
   ↓
6. Se actualiza el caché
   ↓
7. ✅ Proceso completado
```

---

## 📈 Roadmap

- [x] Crear base de datos automáticamente
- [x] Una base de datos por día
- [ ] Agregar más sitios de empleo LATAM
- [ ] Integración con Telegram bot para notificaciones
- [ ] Dashboard web con estadísticas
- [ ] ML para filtrar ofertas por relevancia
- [ ] Export a CSV/Excel
- [ ] Integración con aplicación automática

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Clonar e instalar
git clone https://github.com/tu-usuario/job-scraper.git
cd job-scraper
npm install

# 2. Configurar Notion
# - Crea una integración en https://www.notion.so/my-integrations
# - Crea una página en Notion y compártela con tu integración
# - Obtén el ID de la página

# 3. Configurar .env
echo "NOTION_API_KEY=secret_tu_key_aquí" > .env
echo "NOTION_PARENT_PAGE_ID=tu_page_id_aquí" >> .env
echo "FIRECRAWL_API_KEY=fc_tu_key_aquí" >> .env

# 4. Ver tus páginas disponibles
npm run get-page-id

# 5. Probar localmente
npm run scrape

# 6. Configurar GitHub Secrets (para automatización)
# - Ve a Settings → Secrets → Actions
# - Agrega: NOTION_API_KEY, NOTION_PARENT_PAGE_ID, FIRECRAWL_API_KEY

# 7. Push y listo!
git add .
git commit -m "Initial setup"
git push

# ✅ El workflow se ejecutará automáticamente cada día
```

---

## 📞 Soporte

- 🐛 **Bugs**: Abre un [issue en GitHub](https://github.com/tu-usuario/job-scraper/issues)
- 💡 **Sugerencias**: Abre un [discussion](https://github.com/tu-usuario/job-scraper/discussions)
- 📧 **Contacto**: [tu-email@example.com]

---

## 📝 Licencia

MIT License - ¡úsalo libremente!

---

**¡Feliz búsqueda de empleo! 🎉💼**

> **Tip**: Revisa tu Notion cada mañana para ver las nuevas ofertas del día. ¡No olvides marcar "¿Aplicado?" cuando apliques! 😊
