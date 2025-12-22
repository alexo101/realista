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
    
    // Create pending agent record immediately (new flow)
    // This allows the agent to appear in the team table as "Pendiente"
    await storage.createPendingInvitedAgent({
      email: to,
      name,
      surname,
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      agencyId,
      invitedBy
    });
    
    // Also keep the invitation record for backwards compatibility
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
export async function sendReviewRequest(
  to: string, 
  clientName: string, 
  agentName: string, 
  agencyName: string,
  agentProfileUrl: string,
  agencyProfileUrl: string
) {
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
        <p>El agente inmobiliario <strong>${agentName}</strong> de la agencia <strong>${agencyName}</strong> te ha solicitado una reseña sobre los servicios que has recibido.</p>
        <p>Tu opinión es muy importante para mejorar la transparencia y calidad del sector inmobiliario.</p>
        <p>Para compartir tu experiencia, puedes hacerlo en el perfil del agente o de la agencia:</p>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 10px;">
            <a href="${agencyProfileUrl}" style="color: #2563eb; text-decoration: underline;">Perfil de la agencia ${agencyName}</a>
          </li>
          <li>
            <a href="${agentProfileUrl}" style="color: #2563eb; text-decoration: underline;">Perfil del agente ${agentName}</a>
          </li>
        </ul>
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

// Función para enviar contacto de cliente a agencia (owner recibe el email)
export async function sendAgencyContactEmail(
  ownerEmail: string,
  ownerName: string,
  agencyName: string,
  contactData: {
    name: string;
    phone: string;
    email: string;
    message: string;
  }
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const subject = `Nuevo contacto para ${agencyName} de ${contactData.name} - Realista`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Nuevo mensaje de cliente para ${agencyName}</h2>
        <p>Hola ${ownerName},</p>
        <p>Has recibido un nuevo mensaje de un cliente interesado en los servicios de ${agencyName}.</p>
        
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
      to: [ownerEmail],
      replyTo: contactData.email,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend al enviar email de contacto de agencia:', error);
      return false;
    }

    console.log('Email de contacto de agencia enviado:', data?.id);
    return true;
  } catch (error) {
    console.error('Error al enviar email de contacto de agencia:', error);
    return false;
  }
}

// Función para enviar confirmación de reseña
export async function sendReviewConfirmationEmail(
  reviewerEmail: string,
  reviewerName: string,
  targetName: string,
  targetType: 'agent' | 'agency',
  confirmationToken: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const frontendUrl = getFrontendUrl();
    
    const targetTypeLabel = targetType === 'agent' ? 'el agente' : 'la agencia';
    const subject = `Confirma tu reseña para ${targetName} - Realista`;
    const confirmationUrl = `${frontendUrl}/confirmar-resena/${confirmationToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Confirma tu reseña</h1>
        <p>Hola${reviewerName ? ` ${reviewerName}` : ''},</p>
        <p>Gracias por dejar una reseña sobre ${targetTypeLabel} <strong>${targetName}</strong> en Realista.</p>
        <p>Para publicar tu reseña, por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${confirmationUrl}" 
             style="background-color: #2563eb; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            Confirmar mi reseña
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <a href="${confirmationUrl}" style="color: #2563eb; word-break: break-all;">${confirmationUrl}</a>
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 30px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>¿No has dejado ninguna reseña?</strong><br>
            Si no has sido tú quien ha dejado esta reseña, puedes ignorar este correo.
          </p>
        </div>
        
        <p style="margin-top: 30px; color: #666;">El equipo de Realista</p>
      </body>
      </html>
    `;

    const { data, error } = await client.emails.send({
      from: `Realista <${fromEmail}>`,
      to: [reviewerEmail],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Error de Resend al enviar email de confirmación de reseña:', error);
      return false;
    }

    console.log('Email de confirmación de reseña enviado:', data?.id);
    return true;
  } catch (error) {
    console.error('Error al enviar email de confirmación de reseña:', error);
    return false;
  }
}

// Interface for property info in email
interface PropertyForEmail {
  uuid: string;
  title: string;
  address: string;
  price: number | null;
  type: string;
  slug?: string | null;
}

// Interface for client info in email
interface ClientForEmail {
  id: number;
  email: string;
  name: string;
  surname?: string | null;
}

// Interface for agent info in email
interface AgentForEmail {
  name: string;
  surname?: string | null;
  email: string;
  phone?: string | null;
  agencyName?: string | null;
}

// Send properties to multiple clients via email
export async function sendPropertiesToClients(
  clients: ClientForEmail[],
  properties: PropertyForEmail[],
  message: string,
  agent: AgentForEmail
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  const errors: string[] = [];
  let sentCount = 0;
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const frontendUrl = getFrontendUrl();
    
    // Send individual emails to each client
    for (const clientData of clients) {
      try {
        const clientName = clientData.surname 
          ? `${clientData.name} ${clientData.surname}` 
          : clientData.name;
        
        const agentName = agent.surname 
          ? `${agent.name} ${agent.surname}` 
          : agent.name;
        
        // Build properties HTML
        const propertiesHtml = properties.map(property => {
          const propertyUrl = property.slug 
            ? `${frontendUrl}/propiedades/${property.slug}` 
            : `${frontendUrl}/propiedades/${property.uuid}`;
          
          const formattedPrice = property.price 
            ? `€${property.price.toLocaleString('es-ES')}` 
            : 'Consultar';
          
          return `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${property.title || 'Propiedad'}</h3>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${property.address || 'Sin dirección'}</p>
              <p style="margin: 0 0 12px 0; color: #0d9488; font-size: 18px; font-weight: bold;">${formattedPrice}</p>
              <a href="${propertyUrl}" style="display: inline-block; background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">Ver Propiedad</a>
            </div>
          `;
        }).join('');
        
        // Build custom message HTML if provided
        const messageHtml = message.trim() 
          ? `<div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; color: #333; white-space: pre-wrap;">${message}</p>
            </div>`
          : '';
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0d9488; margin-bottom: 8px;">Nuevas propiedades para ti</h1>
            <p style="color: #666; margin-bottom: 24px;">Hola ${clientName},</p>
            
            ${messageHtml}
            
            <p style="margin-bottom: 16px;">${agentName} te ha enviado ${properties.length} propiedad${properties.length > 1 ? 'es' : ''} que podrían interesarte:</p>
            
            ${propertiesHtml}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="color: #666; font-size: 14px;">
              <p style="margin: 0;"><strong>${agentName}</strong></p>
              ${agent.agencyName ? `<p style="margin: 0;">${agent.agencyName}</p>` : ''}
              ${agent.phone ? `<p style="margin: 4px 0;"><a href="tel:${agent.phone}" style="color: #0d9488;">${agent.phone}</a></p>` : ''}
              <p style="margin: 4px 0;"><a href="mailto:${agent.email}" style="color: #0d9488;">${agent.email}</a></p>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Este correo ha sido enviado a través de <a href="${frontendUrl}" style="color: #0d9488;">Realista</a>
            </p>
          </body>
          </html>
        `;
        
        const { error } = await client.emails.send({
          from: `${agentName} via Realista <${fromEmail}>`,
          to: [clientData.email],
          subject: `${agentName} te ha enviado ${properties.length} propiedad${properties.length > 1 ? 'es' : ''}`,
          html: htmlContent,
        });
        
        if (error) {
          console.error(`Error sending to ${clientData.email}:`, error);
          errors.push(`Error enviando a ${clientData.email}: ${error.message}`);
        } else {
          sentCount++;
          console.log(`Email sent to ${clientData.email}`);
        }
      } catch (err) {
        console.error(`Error processing email for ${clientData.email}:`, err);
        errors.push(`Error procesando ${clientData.email}`);
      }
    }
    
    return {
      success: sentCount > 0,
      sentCount,
      errors,
    };
  } catch (error) {
    console.error('Error in sendPropertiesToClients:', error);
    return {
      success: false,
      sentCount: 0,
      errors: ['Error general al enviar correos'],
    };
  }
}
