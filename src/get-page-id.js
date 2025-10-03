import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

/**
 * Script helper para obtener el ID de una página de Notion
 * Te ayuda a encontrar el PARENT_PAGE_ID necesario
 */
async function getPageInfo() {
  console.log('🔍 Buscando páginas accesibles en tu workspace...\n');
  
  try {
    // Buscar todas las páginas accesibles
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      },
      page_size: 20
    });
    
    if (response.results.length === 0) {
      console.log('❌ No se encontraron páginas.');
      console.log('\n💡 Asegúrate de:');
      console.log('1. Tener al menos una página en Notion');
      console.log('2. Haber compartido esa página con tu integración');
      console.log('   → Abre la página en Notion');
      console.log('   → Haz clic en ⋯ (tres puntos) arriba a la derecha');
      console.log('   → "Connections" → Selecciona tu integración');
      return;
    }
    
    console.log(`✅ Encontradas ${response.results.length} páginas:\n`);
    console.log('═'.repeat(80));
    console.log(process.env.NOTION_API_KEY);
    
    response.results.forEach((page, index) => {
      const title = page.properties?.title?.title?.[0]?.plain_text || 
                   page.properties?.Name?.title?.[0]?.plain_text ||
                   'Sin título';
      
      console.log(`\n${index + 1}. 📄 ${title}`);
      console.log(`   ID: ${page.id}`);
      console.log(`   URL: https://notion.so/${page.id.replace(/-/g, '')}`);
      console.log(`   Creada: ${new Date(page.created_time).toLocaleDateString('es-ES')}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 Para usar una de estas páginas como PARENT:');
    console.log('1. Elige la página donde quieres que se creen las bases de datos');
    console.log('2. Copia su ID');
    console.log('3. Agrégalo a tu .env como:');
    console.log('   NOTION_PARENT_PAGE_ID=el_id_aquí');
    console.log('\n🎯 Recomendación: Crea una página llamada "Job Scraper" para organizar todo ahí.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'unauthorized') {
      console.log('\n💡 Tu NOTION_API_KEY parece incorrecta. Verifica tu archivo .env');
    }
  }
}

getPageInfo();

