import dotenv from 'dotenv';

// Cargar variables de entorno (solo en desarrollo local)
dotenv.config();

console.log(process.env.NOTION_API_KEY, 'notion api key');
console.log(process.env.NOTION_DATABASE_ID, 'database id');
console.log(process.env.NOTION_PARENT_PAGE_ID, 'NOTION_PARENT_PAGE_ID id');
