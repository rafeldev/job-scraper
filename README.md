# 🚀 Job Scraper Automation

Sistema automatizado de scraping de ofertas de trabajo React/TypeScript en LATAM usando GitHub Actions + Firecrawl + Notion.

## 📋 Características

- ✅ **Scraping automático diario** a las 6:00 AM (hora Colombia)
- ✅ **Filtrado inteligente** (< 72 horas, excluye empresas no deseadas)
- ✅ **Sistema de caché** (evita duplicados)
- ✅ **Guardado automático en Notion**
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
3. Nombre: `Job Scraper Bot`
4. Workspace: Selecciona tu workspace
5. Capabilities: Marca `Read content`, `Update content`, `Insert content`
6. Click **"Submit"**
7. **Copia el "Internal Integration Token"** (lo necesitarás después)

#### 2.2. Crear la Base de Datos en Notion

**Opción A: Crear manualmente**

1. Crea una nueva página en Notion
2. Agrega un database (tipo Table)
3. Nombra la database: **"Ofertas de Trabajo - React/TypeScript"**
4. Agrega estas columnas (propiedades):
   - `Título` (Title) - Ya existe por defecto
   - `Empresa` (Text)
   - `Ubicación` (Text)
   - `Modalidad` (Select) - Opciones: 🏠 Remoto, 🏢 Híbrido, 🏢 Presencial
   - `Salario` (Text)
   - `Sitio` (Text)
   - `Link` (URL)
   - `Fecha` (Date)
   - `¿Aplicado?` (Checkbox)

5. Click en `•••` (menú) → `Add connections` → Busca tu integración → `Confirm`
6. Copia el **Database ID** de la URL:
   ```
   https://notion.so/[workspace]/[DATABASE_ID]?v=...
                                 ↑ Copia esto
   ```

**Opción B: Crear con código**

```javascript
// create-database.js
import { createNotionDatabase } from './src/notion.js';

const PARENT_PAGE_ID = 'tu-page-id-aqui';
await createNotionDatabase(PARENT_PAGE_ID);
```

### Paso 3: Configurar Firecrawl

1. Ve a [https://firecrawl.dev](https://firecrawl.dev)
2. Regístrate (email + Google)
3. Ve a Dashboard → API Keys
4. **Copia tu API Key**
5. Plan recomendado:
   - **Free**: 500 créditos (prueba)
   - **Hobby**: $16/mes, 3,000 créditos (recomendado)

### Paso 4: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **"New repository secret"** y agrega estos secrets:

| Secret Name | Valor | Descripción |
|------------|-------|-------------|
| `FIRECRAWL_API_KEY` | `fc-xxxxx...` | Tu API key de Firecrawl |
| `NOTION_API_KEY` | `secret_xxxxx...` | Token de integración de Notion |
| `NOTION_DATABASE_ID` | `xxxxx...` | ID de tu base de datos de Notion |

**Ejemplo de cómo agregar un secret:**
```
Name: FIRECRAWL_API_KEY
Secret: fc-abc123def456...
```

---

## 🚀 Uso

### Ejecución Manual (Testing)

```bash
# Configurar variables de entorno localmente
export FIRECRAWL_API_KEY="tu-api-key"
export NOTION_API_KEY="tu-notion-key"
export NOTION_DATABASE_ID="tu-database-id"

# Ejecutar scraper
npm run scrape
```

### Ejecución Automática (GitHub Actions)

El workflow se ejecuta automáticamente:
- **Diariamente a las 6:00 AM** (hora Colombia / 11:00 AM UTC)
- O manualmente desde GitHub:
  1. Ve a **Actions** tab
  2. Click en **"Daily Job Scraper"**
  3. Click en **"Run workflow"**

### Ver Logs

1. Ve a **Actions** tab en GitHub
2. Click en la ejecución más reciente
3. Click en **"Scrape Job Offers"**
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
      "searchUrl": "site:linkedin.com/jobs react typescript Colombia",
      "priority": "high"
    }
  ]
}
```

### Personalizar Filtros

```json
{
  "filters": {
    "maxAgeHours": 72,
    "excludeCompanies": ["BairesDev", "OtraEmpresa"],
    "keywords": ["react", "typescript"],
    "locations": ["Colombia", "LATAM"],
    "modalities": ["remote", "hybrid"]
  }
}
```

### Cambiar Horario

Edita `.github/workflows/daily-scraper.yml`:

```yaml
on:
  schedule:
    # 6 AM Colombia = 11 AM UTC
    - cron: '0 11 * * *'
    
    # Para 8 AM Colombia = 1 PM UTC
    # - cron: '0 13 * * *'
```

**Conversor de zona horaria:**
- Colombia (COT) = UTC-5
- 6:00 AM COT = 11:00 AM UTC
- 8:00 AM COT = 1:00 PM UTC

---

## 📊 Monitoreo

### Ver Estadísticas de Créditos

Firecrawl muestra el uso en el dashboard:
- Plan Free: 500 créditos totales
- Plan Hobby: 3,000 créditos/mes

**Estimación de uso:**
- ~50-100 páginas por día
- ~1,500-3,000 páginas por mes
- Plan Hobby es suficiente ✅

---

## 🐛 Troubleshooting

### El workflow no se ejecuta

**Problema**: GitHub Actions requiere actividad reciente en el repo.

**Solución**:
1. Haz un commit vacío: `git commit --allow-empty -m "Trigger workflow"`
2. O ejecuta manualmente desde Actions tab

### Error: "Firecrawl API authentication failed"

**Problema**: API key inválida o expirada.

**Solución**:
1. Verifica el secret `FIRECRAWL_API_KEY` en GitHub
2. Genera una nueva API key en Firecrawl dashboard
3. Actualiza el secret

### Error: "Could not create page in Notion"

**Problema**: Permisos de Notion incorrectos.

**Solución**:
1. Ve a tu database en Notion
2. Click `•••` → `Add connections`
3. Selecciona tu integración
4. Verifica que el `NOTION_DATABASE_ID` sea correcto

### "Rate limit exceeded"

**Problema**: Demasiadas requests a Firecrawl.

**Solución**:
1. Reduce `maxResultsPerSite` en `config/sites.json`
2. Desactiva sitios no prioritarios
3. Aumenta el delay entre sitios en `scraper.js`

---

## 💰 Costos

| Servicio | Plan | Costo | Notas |
|----------|------|-------|-------|
| **GitHub Actions** | Free | $0/mes | 2,000 min/mes incluidos |
| **Firecrawl** | Free | $0 | 500 créditos one-time |
| **Firecrawl** | Hobby | $16/mes | 3,000 créditos/mes ⭐ |
| **Notion** | Personal | $0/mes | Suficiente para esto |
| **Gmail** | Free | $0/mes | Con App Password |

**Total recomendado**: $16/mes (solo Firecrawl Hobby)

---

## 📈 Roadmap

- [ ] Agregar más sitios de empleo
- [ ] Integración con Telegram bot
- [ ] Dashboard web con estadísticas
- [ ] ML para filtrar ofertas por relevancia
- [ ] Integración con LinkedIn Easy Apply
- [ ] Export a CSV/Excel

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📝 Licencia

MIT License - úsalo libremente!

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/job-scraper.git && cd job-scraper

# 2. Instalar
npm install

# 3. Configurar secrets en GitHub (ver sección de configuración)

# 4. Commit y push
git add . && git commit -m "Initial setup" && git push

# 5. ¡Listo! El workflow se ejecutará mañana a las 6 AM
```

---

## 📞 Soporte

¿Problemas? Abre un issue en GitHub o contacta a [tu-email]

---

**¡Feliz búsqueda de empleo! 🎉**