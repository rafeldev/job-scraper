import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * Verifica y actualiza las propiedades de la base de datos
 */
async function setupDatabase() {
  try {
    console.log('🔍 Verificando base de datos...');
    
    // Primero, obtener la estructura actual
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID
    });
    
    console.log('✅ Base de datos encontrada:', database.title[0]?.plain_text || 'Sin título');
    console.log('\n📋 Propiedades actuales:');
    Object.keys(database.properties).forEach(prop => {
      console.log(`  - ${prop} (${database.properties[prop].type})`);
    });
    
    console.log('\n🔄 Actualizando propiedades...');
    
    // Actualizar la base de datos con las propiedades necesarias
    const response = await notion.databases.update({
      database_id: DATABASE_ID,
      properties: {
        // Título (Title property)
        "Título": {
          title: {}
        },
        
        // Empresa (Rich Text)
        "Empresa": {
          rich_text: {}
        },
        
        // Ubicación (Rich Text)
        "Ubicación": {
          rich_text: {}
        },
        
        // Modalidad (Select)
        "Modalidad": {
          select: {
            options: [
              { name: "🏠 Remoto", color: "green" },
              { name: "🏢 Híbrido", color: "yellow" },
              { name: "🏢 Presencial", color: "red" },
              { name: "No especificado", color: "gray" }
            ]
          }
        },
        
        // Salario (Rich Text)
        "Salario": {
          rich_text: {}
        },
        
        // Sitio Web (Rich Text)
        "Sitio": {
          rich_text: {}
        },
        
        // Link (URL)
        "Link": {
          url: {}
        },
        
        // Fecha (Date)
        "Fecha": {
          date: {}
        },
        
        // ¿Aplicado? (Checkbox)
        "¿Aplicado?": {
          checkbox: {}
        }
      }
    });
    
    console.log('\n✅ Base de datos configurada correctamente!');
    console.log('\n📋 Propiedades finales:');
    Object.keys(response.properties).forEach(prop => {
      console.log(`  - ${prop} (${response.properties[prop].type})`);
    });
    
    console.log('\n🎉 ¡Todo listo! Ahora puedes ejecutar tu scraper.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'object_not_found') {
      console.log('\n💡 Asegúrate de:');
      console.log('1. Que el NOTION_DATABASE_ID en .env sea correcto');
      console.log('2. Que hayas compartido la base de datos con tu integración');
      console.log('   → Abre tu base de datos en Notion');
      console.log('   → Haz clic en ⋯ (tres puntos) arriba a la derecha');
      console.log('   → "Connections" → Selecciona tu integración');
    } else if (error.code === 'unauthorized') {
      console.log('\n💡 Verifica que tu NOTION_API_KEY sea correcta en el archivo .env');
    }
    
    process.exit(1);
  }
}

setupDatabase();

