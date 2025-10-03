import { loadCache, saveCache, isInCache, getCacheStats } from './cache.js';

console.log('🧪 Probando el sistema de caché...\n');

// Test 1: Cargar caché inicial
console.log('1️⃣ Test: Cargar caché inicial');
const cache1 = loadCache();
console.log('Caché inicial:', cache1);
console.log('Stats:', getCacheStats());
console.log('');

// Test 2: Guardar un job en caché
console.log('2️⃣ Test: Guardar un job en caché');
const testJob = {
  title: 'React Developer Test',
  company: 'Test Company',
  date: new Date().toISOString()
};
const testUrl = 'https://example.com/job/123';
const saved = saveCache(testUrl, testJob);
console.log('¿Guardado exitosamente?', saved);
console.log('');

// Test 3: Verificar si está en caché
console.log('3️⃣ Test: Verificar si está en caché');
const inCache = isInCache(testUrl);
console.log('¿Está en caché?', inCache);
console.log('');

// Test 4: Guardar otro job
console.log('4️⃣ Test: Guardar otro job');
const testJob2 = {
  title: 'TypeScript Developer Test',
  company: 'Another Company',
  date: new Date().toISOString()
};
const testUrl2 = 'https://example.com/job/456';
saveCache(testUrl2, testJob2);
console.log('');

// Test 5: Ver estadísticas finales
console.log('5️⃣ Test: Ver estadísticas finales');
const finalCache = loadCache();
console.log('Caché final:', finalCache);
console.log('Stats finales:', getCacheStats());
console.log('');

console.log('✅ Pruebas completadas');

