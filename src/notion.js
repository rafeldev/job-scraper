import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Cargar variables de entorno (solo en desarrollo local)
dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;
let CURRENT_DATABASE_ID = null; // Se creará dinámicamente
/**
 * Crea una nueva base de datos para el día actual
 */
export async function createDailyDatabase() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayName = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    console.log(`📅 Creando base de datos para: ${dayName}`);
    
    const response = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: PARENT_PAGE_ID
      },
      icon: {
        type: "emoji",
        emoji: "💼"
      },
      title: [
        {
          type: "text",
          text: {
            content: `Ofertas de Trabajo - ${dateStr}`
          }
        }
      ],
      properties: {
        "Título": {
          title: {}
        },
        "Empresa": {
          rich_text: {}
        },
        "Ubicación": {
          rich_text: {}
        },
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
        "Salario": {
          rich_text: {}
        },
        "Sitio": {
          rich_text: {}
        },
        "Link": {
          url: {}
        },
        "Fecha": {
          date: {}
        },
        "¿Aplicado?": {
          checkbox: {}
        }
      }
    });
    
    CURRENT_DATABASE_ID = response.id;
    console.log(`✅ Base de datos creada: ${response.id}`);
    console.log(`🔗 URL: https://notion.so/${response.id.replace(/-/g, '')}`);
    
    return response;
  } catch (error) {
    console.error('❌ Error creando base de datos:', error.message);
    
    if (error.code === 'object_not_found') {
      console.log('\n💡 Asegúrate de:');
      console.log('1. Que el NOTION_PARENT_PAGE_ID en .env sea correcto');
      console.log('2. Que hayas compartido la PÁGINA PADRE con tu integración');
      console.log('   → Abre tu página padre en Notion');
      console.log('   → Haz clic en ⋯ (tres puntos) arriba a la derecha');
      console.log('   → "Connections" → Selecciona tu integración');
    }
    
    throw error;
  }
}

/**
 * Guarda una oferta de trabajo en Notion
 */
export async function saveToNotion(job) {
  try {
    if (!CURRENT_DATABASE_ID) {
      throw new Error('No hay una base de datos activa. Llama a createDailyDatabase() primero.');
    }
    
    const response = await notion.pages.create({
      parent: {
        database_id: CURRENT_DATABASE_ID
      },
      properties: {
        // Título (Title property)
        "Título": {
          title: [
            {
              text: {
                content: job.title
              }
            }
          ]
        },
        
        // Empresa (Rich Text)
        "Empresa": {
          rich_text: [
            {
              text: {
                content: job.company
              }
            }
          ]
        },
        
        // Ubicación (Rich Text)
        "Ubicación": {
          rich_text: [
            {
              text: {
                content: job.location
              }
            }
          ]
        },
        
        // Modalidad (Select)
        "Modalidad": {
          select: {
            name: job.modality
          }
        },
        
        // Salario (Rich Text)
        "Salario": {
          rich_text: [
            {
              text: {
                content: job.salary
              }
            }
          ]
        },
        
        // Sitio Web (Rich Text)
        "Sitio": {
          rich_text: [
            {
              text: {
                content: job.site
              }
            }
          ]
        },
        
        // Link (URL)
        "Link": {
          url: job.url
        },
        
        // Fecha (Date)
        "Fecha": {
          date: {
            start: job.date.split('T')[0] // Solo la fecha YYYY-MM-DD
          }
        },
        
        // ¿Aplicado? (Checkbox)
        "¿Aplicado?": {
          checkbox: false
        }
      },
      
      // Agregar la descripción como contenido de la página
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: job.description
                }
              }
            ]
          }
        }
      ]
    });
    
    return response;
  } catch (error) {
    console.error('Error guardando en Notion:', error.message);
    throw error;
  }
}

/**
 * Crea la base de datos en Notion (ejecutar solo una vez)
 */
export async function createNotionDatabase(parentPageId) {
  try {
    const response = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: parentPageId
      },
      title: [
        {
          type: "text",
          text: {
            content: "Ofertas de Trabajo - React/TypeScript"
          }
        }
      ],
      properties: {
        "Título": {
          title: {}
        },
        "Empresa": {
          rich_text: {}
        },
        "Ubicación": {
          rich_text: {}
        },
        "Modalidad": {
          select: {
            options: [
              { name: "🏠 Remoto", color: "green" },
              { name: "🏢 Híbrido", color: "yellow" },
              { name: "🏢 Presencial", color: "red" }
            ]
          }
        },
        "Salario": {
          rich_text: {}
        },
        "Sitio": {
          rich_text: {}
        },
        "Link": {
          url: {}
        },
        "Fecha": {
          date: {}
        },
        "¿Aplicado?": {
          checkbox: {}
        }
      }
    });
    
    console.log('✅ Base de datos creada en Notion!');
    console.log('Database ID:', response.id);
    return response;
  } catch (error) {
    console.error('Error creando base de datos:', error.message);
    throw error;
  }
}