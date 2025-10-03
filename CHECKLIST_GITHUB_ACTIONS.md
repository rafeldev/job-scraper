# ✅ Checklist para Ejecutar en GitHub Actions

Este documento lista todos los pasos necesarios para que el proyecto funcione correctamente en GitHub Actions.

---

## 🔴 ERRORES CRÍTICOS (Bloquean ejecución)

### 1. Renombrar archivo `emai.js` → `email.js`
**Problema:** El archivo se llama `emai.js` pero en `scraper.js` se importa como `email.js`

**Solución:**
```bash
mv src/emai.js src/email.js
```

---

## 🟡 ERRORES IMPORTANTES (Pueden causar fallos)

### 2. Corregir importación en `cache.js`
**Problema:** Importa `fs/promises` pero usa métodos síncronos que no existen en ese módulo.

**Solución:** Cambiar línea 1 de `src/cache.js`:
```javascript
// ❌ Antes:
import fs from 'fs/promises';

// ✅ Después:
import fs from 'fs';
```

---

## 📝 CONFIGURACIÓN GIT

### 3. Agregar archivos al repositorio
**Problema:** Tienes archivos sin rastrear que son necesarios para GitHub Actions.

**Solución:**
```bash
# Agregar workflow de GitHub Actions
git add .github/

# Agregar gitignore
git add .gitignore

# Agregar package-lock.json (necesario para npm ci)
git add package-lock.json

# Commit
git commit -m "Add GitHub Actions workflow and configuration"

# Push al repositorio
git push origin main
```

---

## 🔐 CONFIGURAR SECRETS EN GITHUB

Antes de que el workflow pueda ejecutarse, necesitas configurar estos secrets en GitHub:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click en "New repository secret"
4. Agrega cada uno de estos:

| Secret Name | Descripción | Dónde obtenerlo |
|-------------|-------------|-----------------|
| `FIRECRAWL_API_KEY` | API key de Firecrawl | https://firecrawl.dev/dashboard |
| `NOTION_API_KEY` | Token de integración de Notion | https://www.notion.so/my-integrations |
| `NOTION_DATABASE_ID` | ID de tu base de datos | URL de tu database en Notion |
| `EMAIL_USER` | Tu email de Gmail | tu-email@gmail.com |
| `EMAIL_APP_PASSWORD` | App Password de Gmail (NO tu contraseña normal) | https://myaccount.google.com/security |
| `EMAIL_TO` | Email donde recibirás notificaciones | Puede ser el mismo que EMAIL_USER |

---

## 🧪 TESTING LOCAL

Antes de ejecutar en GitHub Actions, prueba localmente:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
export FIRECRAWL_API_KEY="tu-api-key"
export NOTION_API_KEY="tu-notion-key"
export NOTION_DATABASE_ID="tu-database-id"
export EMAIL_USER="tu-email@gmail.com"
export EMAIL_APP_PASSWORD="tu-app-password"
export EMAIL_TO="tu-email@gmail.com"

# 3. Ejecutar scraper
npm run scrape
```

Si funciona localmente, funcionará en GitHub Actions.

---

## 🚀 EJECUTAR EN GITHUB ACTIONS

### Ejecución Manual (Para Testing)
1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Selecciona **"Daily Job Scraper"** en el menú izquierdo
4. Click en **"Run workflow"**
5. Selecciona la rama `main`
6. Click en **"Run workflow"** (botón verde)

### Ejecución Automática
El workflow está configurado para ejecutarse automáticamente:
- **Todos los días a las 6:00 AM** (hora Colombia / 11:00 UTC)
- Cron: `0 11 * * *`

---

## 📊 VERIFICAR QUE FUNCIONA

Después de ejecutar el workflow:

1. **Ver logs:**
   - Actions → Click en la ejecución más reciente
   - Click en "Scrape Job Offers"
   - Expande los steps para ver detalles

2. **Verificar Notion:**
   - Abre tu base de datos en Notion
   - Deberías ver las nuevas ofertas agregadas

3. **Revisar email:**
   - Revisa tu bandeja de entrada
   - Deberías recibir un email con el resumen

4. **Descargar logs (si hay error):**
   - En la página de la ejecución
   - Scroll abajo hasta "Artifacts"
   - Descarga `scraper-logs-XXX`

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module './email.js'"
→ No renombraste `emai.js` a `email.js`

### Error: "fs.existsSync is not a function"
→ No corregiste la importación en `cache.js`

### Error: "Firecrawl API authentication failed"
→ Verifica el secret `FIRECRAWL_API_KEY` en GitHub

### Error: "Could not create page in Notion"
→ Verifica que conectaste la integración a tu database en Notion

### No llegan emails
→ Verifica `EMAIL_APP_PASSWORD` (debe ser App Password, no tu contraseña normal)

### El workflow no se ejecuta automáticamente
→ GitHub Actions requiere actividad reciente. Haz un commit o ejecútalo manualmente

---

## ✅ CHECKLIST FINAL

Antes de considerar el proyecto listo:

- [ ] ✅ Archivo renombrado: `email.js` existe
- [ ] ✅ Importación corregida en `cache.js`
- [ ] ✅ Archivos agregados a git (.github/, .gitignore, package-lock.json)
- [ ] ✅ Código pusheado a GitHub
- [ ] ✅ Secrets configurados en GitHub (6 secrets)
- [ ] ✅ Base de datos creada en Notion
- [ ] ✅ Integración de Notion conectada a la database
- [ ] ✅ Testing local exitoso
- [ ] ✅ Primera ejecución manual en GitHub Actions exitosa
- [ ] ✅ Email de notificación recibido
- [ ] ✅ Ofertas guardadas en Notion

---

## 📞 Si tienes problemas

1. Revisa los logs en GitHub Actions (paso a paso)
2. Verifica que todos los secrets estén correctos
3. Prueba localmente primero para aislar el problema
4. Revisa la consola de Firecrawl para ver el uso de créditos

---

**¡Buena suerte con tu búsqueda de empleo! 🚀**

