import dotenv from 'dotenv';

// Cargar variables de entorno (solo en desarrollo local)
dotenv.config();

console.log(process.env.NOTION_API_KEY, 'notion api key');
console.log(process.env.NOTION_DATABASE_ID, 'database id');
