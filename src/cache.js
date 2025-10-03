import fs from 'fs/promises';
import path from 'path';

const CACHE_FILE = './cache/jobs.json';
const CACHE_DIR = './cache';

/**
 * Carga el caché desde archivo
 */
export function loadCache() {
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    
    // Intentar leer archivo de caché
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      const cache = JSON.parse(data);
      console.log(`📦 Caché cargado: ${Object.keys(cache).length} URLs`);
      return cache;
    }
  } catch (error) {
    console.warn('⚠️  Error cargando caché:', error.message);
  }
  
  return {};
}

/**
 * Guarda un job en el caché
 */
export function saveCache(url, job) {
  try {
    const cache = loadCache();
    
    cache[url] = {
      title: job.title,
      company: job.company,
      date: job.date || new Date().toISOString(),
      cachedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error guardando caché:', error.message);
    return false;
  }
}

/**
 * Verifica si una URL está en caché
 */
export function isInCache(url) {
  const cache = loadCache();
  return url in cache;
}

/**
 * Limpia el caché de entradas antiguas (más de 30 días)
 */
export function cleanOldCache(daysToKeep = 30) {
  try {
    const cache = loadCache();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let removedCount = 0;
    const newCache = {};
    
    for (const [url, data] of Object.entries(cache)) {
      const cachedDate = new Date(data.cachedAt);
      if (cachedDate > cutoffDate) {
        newCache[url] = data;
      } else {
        removedCount++;
      }
    }
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(newCache, null, 2));
    console.log(`🧹 Caché limpiado: ${removedCount} entradas antiguas removidas`);
    
    return removedCount;
  } catch (error) {
    console.error('❌ Error limpiando caché:', error.message);
    return 0;
  }
}

/**
 * Obtiene estadísticas del caché
 */
export function getCacheStats() {
  const cache = loadCache();
  const urls = Object.keys(cache);
  
  if (urls.length === 0) {
    return {
      totalEntries: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }
  
  const dates = urls.map(url => new Date(cache[url].cachedAt));
  
  return {
    totalEntries: urls.length,
    oldestEntry: new Date(Math.min(...dates)).toISOString(),
    newestEntry: new Date(Math.max(...dates)).toISOString()
  };
}