import nodemailer, { TransportOptions } from 'nodemailer';

// Variable global para el transporter
let transporter: nodemailer.Transporter;

// Función para crear una cuenta de prueba en Ethereal si no hay credenciales
async function createTestAccount() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    try {
      console.log('Creando cuenta de prueba de Ethereal para emails...');
      const testAccount = await nodemailer.createTestAccount();
      
      console.log('Cuenta de prueba de email creada:');
      console.log('Usuario:', testAccount.user);
      console.log('Contraseña:', testAccount.pass);
      console.log('URL de preview:', 'https://ethereal.email');
      
      // Crear el transporter con las credenciales de prueba
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error al crear cuenta de prueba de email:', error);
      return false;
    }
  } else {
    // Usar credenciales del entorno
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return true;
}

// Inicializar el servicio
export async function initEmailService() {
  const success = await createTestAccount();
  if (success) {
    console.log('Servicio de email inicializado correctamente');
  } else {
    console.error('Error al inicializar el servicio de email');
  }
  return success;
}

// Función para enviar correo de bienvenida a nuevos agentes
export async function sendWelcomeEmail(to: string, name: string, isAgent: boolean) {
  try {
    // Determinar el tipo de bienvenida según el tipo de usuario
    const subject = isAgent 
      ? '¡Bienvenido a Realista - Tu portal inmobiliario!' 
      : '¡Bienvenido a Realista!';
    
    // Personalizar el contenido para agentes o agencias
    const content = isAgent 
      ? `
        <h1>¡Bienvenido a Realista, ${name}!</h1>
        <p>Nos complace darte la bienvenida como nuevo agente en nuestra plataforma.</p>
        <p>Con Realista podrás:</p>
        <ul>
          <li>Gestionar tus propiedades</li>
          <li>Conectar con clientes interesados</li>
          <li>Promocionar tus servicios en los barrios de tu especialidad</li>
          <li>Administrar citas y seguimiento de clientes</li>
        </ul>
        <p>Si tienes alguna duda o necesitas ayuda, no dudes en contactarnos.</p>
        <p>¡Esperamos que disfrutes de nuestra plataforma!</p>
        <p>El equipo de Realista</p>
      `
      : `
        <h1>¡Bienvenido a Realista, ${name}!</h1>
        <p>Gracias por unirte a la comunidad inmobiliaria más grande de España.</p>
        <p>Ya puedes comenzar a explorar propiedades, contactar con agentes y encontrar tu hogar ideal.</p>
        <p>¡Esperamos que encuentres lo que buscas!</p>
        <p>El equipo de Realista</p>
      `;

    // Enviar el correo
    const info = await transporter.sendMail({
      from: '"Realista" <noreply@realista.es>',
      to,
      subject,
      html: content,
    });

    console.log('Email de bienvenida enviado:', info.messageId);
    // En Ethereal, el objeto info puede contener una URL para visualizar el mensaje (no estándar en nodemailer)
    if ((info as any).messageUrl) {
      console.log('Preview URL (solo para pruebas):', (info as any).messageUrl);
    }
    
    return true;
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return false;
  }
}

// Función para enviar solicitud de reseña
export async function sendReviewRequest(to: string, clientName: string, agentName: string) {
  try {
    const subject = `Solicitud de reseña de ${agentName}`;
    const content = `
      <h2>Solicitud de reseña</h2>
      <p>Hola ${clientName},</p>
      <p>El agente <strong>${agentName}</strong> te ha solicitado una reseña sobre los servicios que has recibido.</p>
      <p>Tu opinión es muy importante para nosotros y nos ayuda a seguir mejorando nuestros servicios.</p>
      <p>Si deseas compartir tu experiencia, puedes hacerlo accediendo a nuestra plataforma.</p>
      <p>Muchas gracias por tu tiempo y confianza.</p>
      <p>Saludos cordiales,<br>El equipo de Realista</p>
    `;

    const info = await transporter.sendMail({
      from: '"Realista" <noreply@realista.es>',
      to: to,
      subject: subject,
      html: content,
    });

    console.log('Solicitud de reseña enviada:', info.messageId);
    if ((info as any).messageUrl) {
      console.log('Preview URL (solo para pruebas):', (info as any).messageUrl);
    }
    
    return true;
  } catch (error) {
    console.error('Error al enviar la solicitud de reseña:', error);
    return false;
  }
}