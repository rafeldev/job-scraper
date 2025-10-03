import fetch from 'node-fetch';
import { saveToNotion } from './notion.js';
import { sendEmailNotification } from './email.js';
import { loadCache, saveCache, isInCache } from './cache.js';
import fs from 'fs/promises';

// Configuración
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';

// Cargar configuración de sitios
const config = JSON.parse(await fs.readFile('./config/sites.json', 'utf-8'));

/**
 * Realiza una búsqueda con Firecrawl
 */
async function searchWithFirecrawl(query, limit = 10) {
  try {
    console.log(`🔍 Buscando: ${query}`);
    
    const response = await fetch(`${FIRECRAWL_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        limit,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Encontrados ${data.data?.length || 0} resultados`);
    
    return data.data || [];
  } catch (error) {
    console.error(`❌ Error en búsqueda: ${error.message}`);
    return [];
  }
}

/**
 * Extrae información de la oferta
 */
function parseJobOffer(result, siteName) {
  const title = result.title || 'Sin título';
  const url = result.url || '';
  const description = result.markdown || result.description || '';
  
  // Intentar extraer empresa del título o descripción
  let company = 'No especificada';
  const companyMatch = description.match(/empresa[:\s]+([^\n]+)/i) || 
                       description.match(/company[:\s]+([^\n]+)/i);
  if (companyMatch) {
    company = companyMatch[1].trim().substring(0, 50);
  }
  
  // Detectar modalidad
  let modality = '🏠 Remoto'; // Por defecto
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('hybrid') || text.includes('híbrido')) {
    modality = '🏢 Híbrido';
  } else if (text.includes('presencial') || text.includes('on-site')) {
    modality = '🏢 Presencial';
  }
  
  // Detectar ubicación
  let location = 'No especificada';
  const locationMatch = text.match(/(bogotá|medellín|cali|colombia|latam|remote)/i);
  if (locationMatch) {
    location = locationMatch[1].charAt(0).toUpperCase() + locationMatch[1].slice(1);
  }
  
  // Detectar salario (si está disponible)
  let salary = 'No especificado';
  const salaryMatch = description.match(/\$?\s*(\d[\d,\.]+)\s*(cop|usd|million|millones)/i);
  if (salaryMatch) {
    salary = salaryMatch[0];
  }
  
  return {
    title: title.substring(0, 100),
    company,
    location,
    modality,
    salary,
    site: siteName,
    url,
    description: description.substring(0, 500),
    date: new Date().toISOString(),
    applied: false
  };
}

/**
 * Filtra ofertas por criterios
 */
function filterJobs(jobs) {
  const { excludeCompanies, maxAgeHours } = config.filters;
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convertir a ms
  
  return jobs.filter(job => {
    // Excluir empresas no deseadas
    const companyLower = job.company.toLowerCase();
    if (excludeCompanies.some(exc => companyLower.includes(exc.toLowerCase()))) {
      console.log(`⏭️  Excluida: ${job.company}`);
      return false;
    }
    
    // Verificar edad (si tenemos la fecha)
    if (job.date) {
      const jobAge = Date.now() - new Date(job.date).getTime();
      if (jobAge > maxAge) {
        console.log(`⏭️  Muy antigua: ${job.title}`);
        return false;
      }
    }
    
    // Verificar si ya está en caché
    if (isInCache(job.url)) {
      console.log(`⏭️  Ya existe: ${job.title}`);
      return false;
    }
    
    return true;
  });
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando scraping de ofertas de trabajo...\n');
  
  const startTime = Date.now();
  let allJobs = [];
  let creditsUsed = 0;
  const cache = loadCache();
  
  try {
    // Buscar en cada sitio configurado
    for (const site of config.sites) {
      if (!site.enabled) {
        console.log(`⏭️  Sitio deshabilitado: ${site.name}`);
        continue;
      }
      
      console.log(`\n📍 Buscando en ${site.name}...`);
      
      const results = await searchWithFirecrawl(
        site.searchUrl,
        config.limits.maxResultsPerSite
      );
      
      creditsUsed += results.length;
      
      // Parsear resultados
      const jobs = results.map(result => parseJobOffer(result, site.name));
      allJobs.push(...jobs);
      
      // Pequeña pausa entre sitios para no saturar
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n📊 Total encontrado: ${allJobs.length} ofertas`);
    console.log(`💳 Créditos usados: ${creditsUsed}`);
    
    // Filtrar ofertas
    const filteredJobs = filterJobs(allJobs);
    console.log(`✅ Ofertas nuevas después de filtrar: ${filteredJobs.length}`);
    
    if (filteredJobs.length === 0) {
      console.log('ℹ️  No hay ofertas nuevas para procesar');
      await sendEmailNotification({
        totalFound: allJobs.length,
        newJobs: 0,
        creditsUsed,
        duration: Date.now() - startTime
      });
      return;
    }
    
    // Guardar en Notion
    console.log('\n💾 Guardando en Notion...');
    let savedCount = 0;
    for (const job of filteredJobs) {
      try {
        await saveToNotion(job);
        saveCache(job.url, job);
        savedCount++;
        console.log(`✅ Guardado: ${job.title}`);
      } catch (error) {
        console.error(`❌ Error guardando ${job.title}: ${error.message}`);
      }
    }
    
    // Enviar notificación por email
    const duration = Date.now() - startTime;
    await sendEmailNotification({
      totalFound: allJobs.length,
      newJobs: savedCount,
      creditsUsed,
      duration,
      jobs: filteredJobs.slice(0, 5) // Primeras 5 ofertas
    });
    
    console.log('\n✨ Proceso completado exitosamente!');
    console.log(`⏱️  Duración: ${Math.round(duration / 1000)}s`);
    console.log(`💾 Guardadas: ${savedCount} ofertas`);
    
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error);
    
    // Enviar email de error
    await sendEmailNotification({
      error: error.message,
      totalFound: allJobs.length,
      creditsUsed
    });
    
    process.exit(1);
  }
}

// Ejecutar
main();