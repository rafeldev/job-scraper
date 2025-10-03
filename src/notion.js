import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Cargar variables de entorno (solo en desarrollo local)
dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;
/**
 * Guarda una oferta de trabajo en Notion
 */
export async function saveToNotion(job) {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID
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