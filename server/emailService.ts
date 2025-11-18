import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import { storage } from './storage';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'no-reply@realista.homes'
  };
}

// Inicializar el servicio de email
export async function initEmailService() {
  try {
    // Test the Resend connection by getting credentials
    await getCredentials();
    const frontendUrl = getFrontendUrl();
    console.log('Servicio de email Resend inicializado correctamente');
    console.log('Emails se enviarán desde el dominio: realista.homes');
    console.log('URLs de registro usarán:', frontendUrl);
    return true;
  } catch (error) {
    console.error('Error al inicializar el servicio de email Resend:', error);
    return false;
  }
}

// Función para enviar correo de bienvenida a nuevos agentes
export async function sendWelcomeEmail(to: string, name: string, isAgent: boolean) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    // Determinar el tipo de bienvenida según el tipo de usuario
    const subject = isAgent 
      ? '¡Bienvenido a Realista - Tu portal inmobiliario!' 
      : '¡Bienvenido a Realista!';
    
    // Personalizar el contenido para agentes o clientes
    const htmlContent = isAgent 
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">¡Bienvenido a Realista, ${name}!</h1>
          <p>Nos complace darte la bienvenida como nuevo agente en nuestra plataforma.</p>
          <p>Con Realista podrás:</p>
          <ul style="line-height: 1.8;">
            <li>Gestionar tus propiedades</li>
            <li>Conectar con clientes interesados</li>
            <li>Promocionar tus servicios en los barrios de tu especialidad</li>
            <li>Administrar citas y seguimiento de clientes</li>
          </ul>
          <p>Si tienes alguna duda o necesitas ayuda, no dudes en contactarnos.</p>
          <p>¡Esperamos que disfrutes de nuestra plataforma!</p>
          <p style="margin-top: 30px;">El equipo de Realista</p>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">¡Bienvenido a Realista, ${name}!</h1>
          <p>Gracias por unirte a la comunidad inmobiliaria más grande de España.</p>
          <p>Ya puedes comenzar a explorar propiedades, contactar con agentes y encontrar tu hogar ideal.</p>
          <p>¡Esperamos que encuentres lo que buscas!</p>
          <p style="margin-top: 30px;">El equipo de Realista</p>
        </body>
        </html>
      `;

    // Enviar el correo con Resend
    const { data, error } = await client.emails.send({
      from: `Realista <${fromEmail}>`,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend al enviar email de bienvenida:', error);
      return false;
    }

    console.log('Email de bienvenida enviado:', data?.id);
    return true;
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return false;
  }
}

// Helper function to get environment-aware frontend URL
function getFrontendUrl(): string {
  // If FRONTEND_URL is explicitly set, use it
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // Check if we're in Replit development environment
  const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDevDomain) {
    return `https://${replitDevDomain}`;
  }
  
  // Check for deployment URL
  const replitDeploymentUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : null;
  
  if (replitDeploymentUrl) {
    return replitDeploymentUrl;
  }
  
  // Fallback to production domain
  return 'https://realista.homes';
}

// Función para enviar invitación a agente
export async function sendAgentInvitation(
  to: string, 
  name: string, 
  surname: string, 
  agencyName: string,
  agencyId: number,
  invitedBy: number
) {
  try {
    // Generate secure token
    const token = randomUUID();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create invitation record in database
    await storage.createInvitation({
      token,
      email: to,
      name,
      surname,
      agencyId,
      invitedBy,
      expiresAt
    });
    
    const { client, fromEmail } = await getUncachableResendClient();
    const frontendUrl = getFrontendUrl();
    
    const subject = `Invitación para unirse a ${agencyName} en Realista`;
    const registrationUrl = `${frontendUrl}/registrarse?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Invitación a unirte a ${agencyName}</h1>
        <p>Hola ${name} ${surname},</p>
        <p>Has sido invitado/a a unirte a <strong>${agencyName}</strong> en la plataforma Realista.</p>
        <p>Realista es la plataforma inmobiliaria líder en España donde podrás gestionar propiedades, conectar con clientes y hacer crecer tu negocio.</p>
        <div style="margin: 30px 0;">
          <a href="${registrationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Completar mi registro
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          O copia y pega este enlace en tu navegador:<br>
          <a href="${registrationUrl}" style="color: #2563eb; word-break: break-all;">${registrationUrl}</a>
        </p>
        <p style="margin-top: 30px;">¡Bienvenido/a al equipo!</p>
        <p>El equipo de Realista</p>
      </body>
      </html>
    `;

    const { data, error } = await client.emails.send({
      from: `Realista <${fromEmail}>`,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend al enviar email de invitación:', error);
      return false;
    }

    console.log('Email de invitación enviado:', data?.id);
    return true;
  } catch (error) {
    console.error('Error al enviar email de invitación:', error);
    return false;
  }
}

// Función para enviar solicitud de reseña
export async function sendReviewRequest(to: string, clientName: string, agentName: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const subject = `Solicitud de reseña de ${agentName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Solicitud de reseña</h2>
        <p>Hola ${clientName},</p>
        <p>El agente <strong>${agentName}</strong> te ha solicitado una reseña sobre los servicios que has recibido.</p>
        <p>Tu opinión es muy importante para nosotros y nos ayuda a seguir mejorando nuestros servicios.</p>
        <p>Si deseas compartir tu experiencia, puedes hacerlo accediendo a nuestra plataforma.</p>
        <p>Muchas gracias por tu tiempo y confianza.</p>
        <p style="margin-top: 30px;">Saludos cordiales,<br>El equipo de Realista</p>
      </body>
      </html>
    `;

    const { data, error } = await client.emails.send({
      from: `Realista <${fromEmail}>`,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend al enviar solicitud de reseña:', error);
      return false;
    }

    console.log('Solicitud de reseña enviada:', data?.id);
    return true;
  } catch (error) {
    console.error('Error al enviar la solicitud de reseña:', error);
    return false;
  }
}

// Función para enviar contacto de cliente a agente
export async function sendAgentContactEmail(
  agentEmail: string,
  agentName: string,
  contactData: {
    name: string;
    phone: string;
    email: string;
    message: string;
  }
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const subject = `Nuevo contacto de ${contactData.name} - Realista`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Nuevo mensaje de cliente</h2>
        <p>Hola ${agentName},</p>
        <p>Has recibido un nuevo mensaje de un cliente interesado en tus servicios.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Información del cliente:</h3>
          <p><strong>Nombre:</strong> ${contactData.name}</p>
          <p><strong>Teléfono:</strong> ${contactData.phone}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          <p><strong>Mensaje:</strong></p>
          <p style="background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 10px 0;">
            ${contactData.message}
          </p>
        </div>
        
        <p>Puedes contactar con el cliente directamente usando la información proporcionada.</p>
        <p style="margin-top: 30px;">El equipo de Realista</p>
      </body>
      </html>
    `;

    const { data, error } = await client.emails.send({
      from: `Realista <${fromEmail}>`,
      to: [agentEmail],
      replyTo: contactData.email,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend al enviar email de contacto:', error);
      return false;
    }

    console.log('Email de contacto enviado:', data?.id);
    return true;
  } catch (error) {
    console.error('Error al enviar email de contacto:', error);
    return false;
  }
}
