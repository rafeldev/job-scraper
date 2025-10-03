import nodemailer from 'nodemailer';

// Configuración del transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // App Password de Gmail
  }
});

/**
 * Envía notificación por email
 */
export async function sendEmailNotification(data) {
  const {
    totalFound = 0,
    newJobs = 0,
    creditsUsed = 0,
    duration = 0,
    jobs = [],
    error = null
  } = data;
  
  const durationSeconds = Math.round(duration / 1000);
  const durationMinutes = Math.round(duration / 60000);
  
  // Subject del email
  let subject = '';
  if (error) {
    subject = '❌ Error en Scraping de Ofertas';
  } else if (newJobs === 0) {
    subject = 'ℹ️  Scraping Completado - Sin Ofertas Nuevas';
  } else {
    subject = `✅ ${newJobs} Nuevas Ofertas de Trabajo Encontradas!`;
  }
  
  // Construir HTML del email
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .job-card {
          background: white;
          padding: 20px;
          margin: 15px 0;
          border-radius: 8px;
          border-left: 4px solid #667eea;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .job-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .job-meta {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }
        .job-link {
          display: inline-block;
          margin-top: 10px;
          padding: 10px 20px;
          background: #667eea;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 500;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #999;
          font-size: 12px;
        }
        .error-box {
          background: #fee;
          border-left: 4px solid #f44;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .success-box {
          background: #efe;
          border-left: 4px solid #4f4;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${subject}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">
          ${new Date().toLocaleString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      
      <div class="content">
  `;
  
  if (error) {
    // Email de error
    htmlContent += `
      <div class="error-box">
        <h2 style="margin-top: 0; color: #f44;">⚠️ Error Detectado</h2>
        <p><strong>Mensaje:</strong> ${error}</p>
        <p><strong>Ofertas procesadas antes del error:</strong> ${totalFound}</p>
        <p><strong>Créditos usados:</strong> ${creditsUsed}</p>
      </div>
      <p>Por favor revisa los logs en GitHub Actions para más detalles.</p>
    `;
  } else if (newJobs === 0) {
    // Sin ofertas nuevas
    htmlContent += `
      <div class="success-box">
        <h2 style="margin-top: 0; color: #4a4;">✓ Proceso Completado</h2>
        <p>El scraping se ejecutó correctamente pero no se encontraron ofertas nuevas.</p>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${totalFound}</div>
          <div class="stat-label">Ofertas encontradas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${creditsUsed}</div>
          <div class="stat-label">Créditos usados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${durationSeconds}s</div>
          <div class="stat-label">Duración</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">0</div>
          <div class="stat-label">Ofertas nuevas</div>
        </div>
      </div>
      
      <p style="color: #666;">
        ℹ️ Todas las ofertas encontradas ya estaban en la base de datos o fueron filtradas por los criterios configurados.
      </p>
    `;
  } else {
    // Ofertas nuevas encontradas
    htmlContent += `
      <div class="success-box">
        <h2 style="margin-top: 0; color: #4a4;">🎉 ¡Nuevas Oportunidades!</h2>
        <p>Se encontraron <strong>${newJobs}</strong> ofertas nuevas que coinciden con tus criterios.</p>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${newJobs}</div>
          <div class="stat-label">Ofertas nuevas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${creditsUsed}</div>
          <div class="stat-label">Créditos usados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalFound}</div>
          <div class="stat-label">Total encontradas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${durationSeconds}s</div>
          <div class="stat-label">Duración</div>
        </div>
      </div>
      
      <h2 style="margin-top: 30px;">📋 Ofertas Destacadas</h2>
    `;
    
    // Agregar las primeras 5 ofertas
    jobs.slice(0, 5).forEach((job, index) => {
      htmlContent += `
        <div class="job-card">
          <div class="job-title">${index + 1}. ${job.title}</div>
          <div class="job-meta">🏢 <strong>Empresa:</strong> ${job.company}</div>
          <div class="job-meta">📍 <strong>Ubicación:</strong> ${job.location}</div>
          <div class="job-meta">💼 <strong>Modalidad:</strong> ${job.modality}</div>
          <div class="job-meta">💰 <strong>Salario:</strong> ${job.salary}</div>
          <div class="job-meta">🌐 <strong>Fuente:</strong> ${job.site}</div>
          <a href="${job.url}" class="job-link" target="_blank">Ver Oferta →</a>
        </div>
      `;
    });
    
    if (newJobs > 5) {
      htmlContent += `
        <p style="text-align: center; color: #666; margin-top: 20px;">
          ... y ${newJobs - 5} ofertas más en tu base de datos de Notion
        </p>
      `;
    }
    
    htmlContent += `
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
        <p style="margin: 0 0 15px 0; font-weight: 500;">Ver todas las ofertas en Notion</p>
        <a href="https://notion.so" 
           style="display: inline-block; padding: 12px 30px; background: #000; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Abrir Notion →
        </a>
      </div>
    `;
  }
  
  htmlContent += `
      </div>
      
      <div class="footer">
        <p>🤖 Automatizado con GitHub Actions + Firecrawl + Notion</p>
        <p>Próxima ejecución: Mañana a las 6:00 AM 🇨🇴</p>
      </div>
    </body>
    </html>
  `;
  
  // Configurar y enviar email
  const mailOptions = {
    from: `"Job Scraper Bot" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: subject,
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    // No lanzar error para no detener el proceso
  }
}

/**
 * Envía email de prueba
 */
export async function sendTestEmail() {
  return sendEmailNotification({
    totalFound: 10,
    newJobs: 3,
    creditsUsed: 25,
    duration: 45000,
    jobs: [
      {
        title: 'Senior Frontend Developer (React + TypeScript)',
        company: 'Tech Company LATAM',
        location: 'Colombia',
        modality: '🏠 Remoto',
        salary: '$4.000.000 COP',
        site: 'LinkedIn',
        url: 'https://linkedin.com/jobs/test'
      },
      {
        title: 'React Developer',
        company: 'Startup Innovadora',
        location: 'Bogotá',
        modality: '🏢 Híbrido',
        salary: 'No especificado',
        site: 'Computrabajo',
        url: 'https://computrabajo.com/test'
      }
    ]
  });
}