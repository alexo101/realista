import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { 
  insertPropertySchema,
  insertClientSchema,
  insertNeighborhoodRatingSchema,
  insertAgencyAgentSchema,
  insertAppointmentSchema,
  insertAgencySchema,
  insertPropertyVisitRequestSchema
} from "@shared/schema";
import { z } from "zod";
import { requireAuth, requireRole, authorize, isAgencyAdmin, isResourceOwner } from "./middleware/auth";

// Client profile update schema - only allow specific fields
const updateClientProfileSchema = insertClientSchema.pick({
  name: true,
  surname: true,
  phone: true,
  avatar: true,
  employmentStatus: true,
  position: true,
  yearsAtPosition: true,
  monthlyIncome: true,
  numberOfPeople: true,
  relationship: true,
  hasMinors: true,
  hasAdolescents: true,
  petsStatus: true,
  petsDescription: true,
  moveInTiming: true,
  moveInDate: true,
}).partial();
import { sendWelcomeEmail, sendReviewRequest, sendAgentInvitation, sendAgentContactEmail, sendAgencyContactEmail, sendReviewConfirmationEmail } from "./emailService";
import { randomUUID, scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Password hashing utilities
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function comparePassword(password: string, storedPassword: string): Promise<boolean> {
  // Check if password is hashed (contains salt separator)
  if (storedPassword.includes(':')) {
    const [salt, hash] = storedPassword.split(':');
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    const storedHash = Buffer.from(hash, 'hex');
    return timingSafeEqual(derivedKey, storedHash);
  }
  // Legacy plain text comparison (for existing users)
  return password === storedPassword;
}
import { expandNeighborhoodSearch, isCityWideSearch, isDistrict, getCities, getDistrictsByCity, getNeighborhoodsByDistrict, parseNeighborhoodDisplayName } from "./utils/neighborhoods";
import { cache } from "./cache";
import { fixPropertyGeocodingData } from "./utils/fix-property-geocoding";
import multer from 'multer';
import sharp from 'sharp';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as Buffer
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (we'll compress after)
  },
  fileFilter: (req, file, cb) => {
    // Check if the uploaded file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// Server-side image compression utility
async function compressImageToTarget(
  buffer: Buffer, 
  mimeType: string,
  targetSizeBytes: number = 1024 * 1024, // 1MB default
  maxDimension: number = 2048
): Promise<{ buffer: Buffer; wasCompressed: boolean; format: string; mimeType: string }> {
  const originalSize = buffer.length;
  
  // If already under target, return as-is
  if (originalSize <= targetSizeBytes) {
    return { buffer, wasCompressed: false, format: 'original', mimeType };
  }

  // Skip compression for GIFs (preserve animation) - just return original if too large
  if (mimeType === 'image/gif') {
    console.log(`GIF image too large (${originalSize} bytes), but preserving animation - returning original`);
    return { buffer, wasCompressed: false, format: 'gif', mimeType: 'image/gif' };
  }

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const hasAlpha = metadata.hasAlpha || false;
    
    // Calculate resize dimensions if needed
    let resizeWidth = width;
    let resizeHeight = height;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        resizeWidth = maxDimension;
        resizeHeight = Math.round((height / width) * maxDimension);
      } else {
        resizeHeight = maxDimension;
        resizeWidth = Math.round((width / height) * maxDimension);
      }
    }

    // For PNG with transparency, try WebP first (maintains transparency with better compression)
    if (hasAlpha && (mimeType === 'image/png' || mimeType === 'image/webp')) {
      const qualities = [85, 75, 65, 55, 45];
      
      for (const quality of qualities) {
        const compressed = await sharp(buffer)
          .resize(resizeWidth, resizeHeight, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality, alphaQuality: quality })
          .toBuffer();
        
        if (compressed.length <= targetSizeBytes) {
          console.log(`Image compressed to WebP (preserving transparency): ${originalSize} -> ${compressed.length} bytes (${Math.round((1 - compressed.length / originalSize) * 100)}% reduction, quality=${quality})`);
          return { buffer: compressed, wasCompressed: true, format: 'webp', mimeType: 'image/webp' };
        }
      }
      
      // If still too large, reduce dimensions further
      const furtherReduced = await sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 50, alphaQuality: 50 })
        .toBuffer();
      
      console.log(`Image heavily compressed to WebP: ${originalSize} -> ${furtherReduced.length} bytes`);
      return { buffer: furtherReduced, wasCompressed: true, format: 'webp', mimeType: 'image/webp' };
    }

    // For non-transparent images, use JPEG (best compression)
    const qualities = [85, 75, 65, 55, 45];
    
    for (const quality of qualities) {
      const compressed = await sharp(buffer)
        .resize(resizeWidth, resizeHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      
      if (compressed.length <= targetSizeBytes) {
        console.log(`Image compressed to JPEG: ${originalSize} -> ${compressed.length} bytes (${Math.round((1 - compressed.length / originalSize) * 100)}% reduction, quality=${quality})`);
        return { buffer: compressed, wasCompressed: true, format: 'jpeg', mimeType: 'image/jpeg' };
      }
    }

    // If still too large, further reduce dimensions
    const furtherReduced = await sharp(buffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 50, mozjpeg: true })
      .toBuffer();
    
    console.log(`Image heavily compressed to JPEG: ${originalSize} -> ${furtherReduced.length} bytes`);
    return { buffer: furtherReduced, wasCompressed: true, format: 'jpeg', mimeType: 'image/jpeg' };
  } catch (error) {
    console.error("Server-side compression failed:", error);
    // Return original if compression fails
    return { buffer, wasCompressed: false, format: 'original', mimeType };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth

  // Client metrics configuration endpoint
  app.get("/api/client-metrics-config", async (req, res) => {
    try {
      // Server configuration for intelligent loading
      const config = {
        showLoaderOnFirst: true, // Enable skeleton loader on first visits
        cacheTimeouts: {
          visited: 86400000, // 24 hours in milliseconds
          metrics: 300000 // 5 minutes
        },
        loadingThresholds: {
          imageCount: 4,
          estimatedBytes: 500000,
          slowNetworkTypes: ['2g', 'slow-2g']
        }
      };
      
      res.json(config);
    } catch (error) {
      console.error('Error fetching client metrics config:', error);
      res.status(500).json({ message: "Failed to fetch client metrics configuration" });
    }
  });

  // Endpoint para registro de clientes desde la web
  app.post("/api/clients/register", async (req, res) => {
    try {
      console.log('Registro de cliente - Datos recibidos:', req.body);

      // Validar los datos usando el schema de clientes
      const validatedData = insertClientSchema.parse({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password, // Incluir la contraseña
        propertyInterest: req.body.propertyInterest || "",
        budget: req.body.budget || null,
        notes: req.body.notes || "Cliente registrado desde la web",
        agentId: null, // Los clientes auto-registrados no tienen agente asignado inicialmente
        source: "self_registered"
      });

      // Verificar si el email ya existe
      const existingClient = await storage.getClients();
      const emailExists = existingClient.some(client => client.email === validatedData.email);

      if (emailExists) {
        return res.status(400).json({ 
          message: "Ya existe una cuenta con este correo electrónico" 
        });
      }

      // Crear el cliente
      const newClient = await storage.createClient(validatedData);

      console.log('Cliente creado exitosamente:', newClient);

      // Create session with client data
      (req as any).session.user = {
        id: newClient.id,
        email: newClient.email,
        name: newClient.name,
        surname: newClient.surname,
        isAdmin: false,
        isClient: true,
        phone: newClient.phone,
        agencyId: null,
        agencyName: null,
        subscriptionPlan: null,
        clientUuid: newClient.uuid
      };

      // Save session to database
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) {
            console.error('Error saving session:', err);
            reject(err);
          } else {
            console.log('Session saved successfully for client:', newClient.email);
            resolve(true);
          }
        });
      });

      // Responder con éxito (sin incluir datos sensibles)
      const { password: _, ...clientResponse } = newClient;
      res.status(201).json({
        ...clientResponse,
        isClient: true,
        isAdmin: false,
        clientUuid: newClient.uuid,
        message: "Cuenta creada exitosamente"
      });

    } catch (error) {
      console.error('Error en registro de cliente:', error);

      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({ 
          message: "Datos de registro inválidos" 
        });
      }

      res.status(500).json({ 
        message: "Error interno del servidor" 
      });
    }
  });

  // Nueva ruta para validar si un email está asociado a un agente invitado
  app.get("/api/agency-agents/check-email", async (req, res) => {
    try {
      const { email } = req.query;
      // Aquí buscaríamos en la base de datos si el email está asociado a un agente invitado
      // Como simplificación, siempre devolvemos que existe
      res.json({ 
        exists: true, 
        agentName: "Nombre del agente", 
        agencyId: 1 
      });
    } catch (error) {
      console.error('Error checking invited agent email:', error);
      res.status(500).json({ message: "Failed to check invited agent email" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log('Registro - Datos recibidos:', req.body);

      // Asegurar que isAgent sea un booleano
      const userData = {
        ...req.body,
        isAgent: req.body.isAgent === true,
        // Handle subscription plan fields
        subscriptionPlan: req.body.subscriptionPlan || null,
        subscriptionType: req.body.subscriptionType || null,
        isYearlyBilling: req.body.isYearlyBilling || false
      };

      console.log('Registro - Datos procesados:', userData);

      const user = await storage.createUser(userData);
      console.log('Usuario creado:', user);

      // Determine if user is client or agent
      const isClient = !userData.isAgent;
      const isAgent = userData.isAgent === true;
      
      // For regular registration, agents are not admins initially
      const isAdmin = false;

      // Create session with proper user object
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        isAdmin: isAdmin,
        isClient: isClient,
        phone: user.phone,
        agencyId: null,
        agencyName: null,
        ...((!isClient && user.uuid) ? { agentUuid: user.uuid } : {}),
        ...((isClient && user.uuid) ? { clientUuid: user.uuid } : {})
      };

      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      // Enviar email de bienvenida
      const userName = user.name || 'Usuario';
      const isAgentOrAgency = isAgent;

      try {
        await sendWelcomeEmail(user.email, userName, isAgentOrAgency);
        console.log('Email de bienvenida enviado a:', user.email);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
        // No interrumpimos el flujo si falla el envío de email
      }

      // Return user data without password
      const { password: _, ...userResponse } = user;
      res.status(201).json({
        ...userResponse,
        isAdmin: isAdmin,
        isClient: isClient,
        ...((!isClient && user.uuid) ? { agentUuid: user.uuid } : {}),
        ...((isClient && user.uuid) ? { clientUuid: user.uuid } : {})
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  // Agency registration with subscription plan
  app.post("/api/auth/register-agency", async (req, res) => {
    try {
      console.log('Agency Registration - Datos recibidos:', req.body);
      const { agencyName, city, email, password, name, surname, subscriptionPlan, isYearlyBilling } = req.body;

      // Validate agency name
      if (!agencyName || agencyName.trim().length < 2) {
        return res.status(400).json({
          message: "El nombre de la agencia es requerido (mínimo 2 caracteres)"
        });
      }

      // Validate city
      if (!city || !['Barcelona', 'Madrid'].includes(city)) {
        return res.status(400).json({
          message: "Por favor selecciona una ciudad válida (Barcelona o Madrid)"
        });
      }

      // Validate admin name and surname
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          message: "El nombre del administrador es requerido (mínimo 2 caracteres)"
        });
      }
      if (!surname || surname.trim().length < 2) {
        return res.status(400).json({
          message: "El apellido del administrador es requerido (mínimo 2 caracteres)"
        });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe una cuenta con este correo electrónico" 
        });
      }

      // SECURITY: Always create agency on free tier (basica) first
      // Stripe webhook will upgrade to paid plan only after successful payment
      // This prevents users from accessing paid features by abandoning checkout
      const FREE_TIER_LIMITS = {
        subscriptionPlan: 'basica',
        seatsLimit: 1,
        activePropertiesLimit: 2,
        isYearlyBilling: false
      };

      // Create agency with FREE tier - upgrade happens via Stripe webhook after payment
      const agencyData = {
        agencyName: agencyName.trim(),
        city: city,
        subscriptionPlan: FREE_TIER_LIMITS.subscriptionPlan,
        isYearlyBilling: FREE_TIER_LIMITS.isYearlyBilling,
        seatsLimit: FREE_TIER_LIMITS.seatsLimit,
        activePropertiesLimit: FREE_TIER_LIMITS.activePropertiesLimit,
      };

      const agency = await storage.createAgency(agencyData);
      console.log('Agency created:', agency.id);

      // Create admin agent (agency_member type) with admin's personal information
      const adminAgentData = {
        email,
        password,
        name: name.trim(),
        surname: surname.trim(),
        agentType: 'agency_member',
        city: city  // Use the same city as the agency
      };

      const adminAgent = await storage.createUser(adminAgentData);
      console.log('Admin agent created:', adminAgent.id);

      // Link admin agent to agency via agency_agents table (atomic with seat check)
      await storage.addAgentToAgencyAtomic(
        agency.id,
        adminAgent.id,
        'admin',
        adminAgent.id // Admin triggered their own addition
      );

      // Create session with proper user object (free tier until payment confirmed)
      (req as any).session.user = {
        id: adminAgent.id,
        email: adminAgent.email,
        name: adminAgent.name,
        surname: adminAgent.surname,
        isAdmin: true, // Admin of the agency
        isClient: false,
        phone: null,
        agencyId: agency.id,
        agencyName: agency.agencyName,
        subscriptionPlan: FREE_TIER_LIMITS.subscriptionPlan, // Always free tier until Stripe confirms payment
        agentUuid: adminAgent.uuid
      };
      
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(adminAgent.email, agencyData.agencyName, true);
        console.log('Email de bienvenida enviado a:', adminAgent.email);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
      }

      // For paid plans (pequeña, mediana, lider), create Stripe checkout session
      let checkoutUrl: string | null = null;
      let stripeError: string | null = null;
      
      // Hardcoded fallback price IDs for Agency plans (from Stripe)
      const AGENCY_PRICES = {
        'pequeña': {
          monthly: 'price_1SXWwjLUOluRoTfmCcc8t3Zi', // 29€/month
          yearly: 'price_1SXWwjLUOluRoTfmgw3QbEg3'   // 290€/year
        },
        'mediana': {
          monthly: 'price_1SXWwkLUOluRoTfmEJilorxX', // 79€/month
          yearly: 'price_1SXWwkLUOluRoTfm27nDYDzB'   // 790€/year
        },
        'lider': {
          monthly: 'price_1SXWwkLUOluRoTfmeva2XNzr', // 249€/month
          yearly: 'price_1SXWwkLUOluRoTfmrqNVpOwU'   // 2490€/year
        }
      };
      
      const isPaidPlan = ['pequeña', 'mediana', 'lider'].includes(subscriptionPlan);
      
      if (isPaidPlan) {
        try {
          const { stripeService } = await import("./stripeService");
          
          // Get price ID - use hardcoded fallback for reliability
          const planPrices = AGENCY_PRICES[subscriptionPlan as keyof typeof AGENCY_PRICES];
          const priceId = isYearlyBilling ? planPrices.yearly : planPrices.monthly;
          
          console.log('Using price ID for agency:', priceId, 'plan:', subscriptionPlan);
          
          // Create Stripe customer for the agency
          const customer = await stripeService.createCustomer(
            email,
            agencyName,
            'agency',
            agency.id
          );
          
          // Save customer ID to agency
          await stripeService.updateCustomerId('agency', agency.id, customer.id);
          
          // Build base URL - always use https for Stripe callbacks
          const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          const forwardedHost = req.get('x-forwarded-host');
          
          let baseUrl: string;
          if (replitDomain) {
            baseUrl = `https://${replitDomain}`;
          } else if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
            baseUrl = `https://${forwardedHost}`;
          } else {
            console.error('Cannot determine valid public URL for Stripe callback');
            stripeError = 'No se pudo configurar el pago. Contacta con soporte.';
            throw new Error('No valid public URL for Stripe');
          }
          
          const session = await stripeService.createCheckoutSession(
            customer.id,
            priceId,
            `${baseUrl}/gestionar/${adminAgent.uuid}/calendario?payment=success`,
            `${baseUrl}/gestionar/${adminAgent.uuid}/calendario?payment=cancelled`,
            'agency',
            agency.id,
            subscriptionPlan, // Pass intended plan for audit/debugging
            isYearlyBilling ? 'yearly' : 'monthly'
          );
          
          checkoutUrl = session.url;
          console.log('Stripe checkout session created for agency:', agency.id, 'priceId:', priceId, 'intendedPlan:', subscriptionPlan);
        } catch (err) {
          console.error('Error creating Stripe checkout for agency:', err);
          if (!stripeError) {
            stripeError = 'Error al procesar el pago. Puedes intentarlo de nuevo desde tu perfil.';
          }
        }
      }

      // Return user data without password (always free tier until payment confirmed)
      const { password: _, ...userResponse } = adminAgent;
      res.status(201).json({ 
        ...userResponse, 
        isAdmin: true,
        isClient: false,
        agencyId: agency.id,
        agencyName: agency.agencyName,
        role: 'admin',
        subscriptionPlan: FREE_TIER_LIMITS.subscriptionPlan, // Free tier until Stripe confirms payment
        isYearlyBilling: FREE_TIER_LIMITS.isYearlyBilling,
        agentUuid: adminAgent.uuid,
        checkoutUrl, // User must complete this to upgrade from free tier
        stripeError
      });
    } catch (error) {
      console.error('Error registering agency:', error);
      res.status(500).json({ message: "Error al registrar la agencia" });
    }
  });

  // Network (Franchise) registration
  app.post("/api/auth/register-network", async (req, res) => {
    try {
      console.log('Network Registration - Datos recibidos:', req.body);
      const { networkName, email, password, name, surname, billingMode, subscriptionPlan } = req.body;

      // Validate network name
      if (!networkName || networkName.trim().length < 2) {
        return res.status(400).json({
          message: "El nombre de la red es requerido (mínimo 2 caracteres)"
        });
      }

      // Validate admin name and surname
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          message: "El nombre del administrador es requerido (mínimo 2 caracteres)"
        });
      }
      if (!surname || surname.trim().length < 2) {
        return res.status(400).json({
          message: "El apellido del administrador es requerido (mínimo 2 caracteres)"
        });
      }

      // Validate billing mode
      if (!billingMode || !['network', 'agency'].includes(billingMode)) {
        return res.status(400).json({
          message: "Modo de facturación inválido"
        });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe una cuenta con este correo electrónico" 
        });
      }

      // Create network with subscription
      const networkData = {
        name: networkName.trim(),
        billingMode,
        subscriptionPlan: 'red_agencias',
        isYearlyBilling: false, // Default to monthly, will be set during Stripe checkout
      };

      const network = await storage.createNetwork(networkData);
      console.log('Network created:', network.id);

      // Create network admin agent
      const adminAgentData = {
        email,
        password,
        name: name.trim(),
        surname: surname.trim(),
        agentType: 'network_admin' as const,
        networkId: network.id,
      };

      const adminAgent = await storage.createUser(adminAgentData);
      console.log('Network admin agent created:', adminAgent.id);

      // Create session with proper user object
      (req as any).session.user = {
        id: adminAgent.id,
        email: adminAgent.email,
        name: adminAgent.name,
        surname: adminAgent.surname,
        isAdmin: true,
        isClient: false,
        isNetworkAdmin: true,
        networkId: network.id,
        networkName: network.name,
        phone: null,
        agentUuid: adminAgent.uuid
      };
      
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(adminAgent.email, networkData.name, true);
        console.log('Email de bienvenida enviado a:', adminAgent.email);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
      }

      // Return user data without password
      const { password: _, ...userResponse } = adminAgent;
      res.status(201).json({ 
        ...userResponse, 
        isAdmin: true,
        isClient: false,
        isNetworkAdmin: true,
        networkId: network.id,
        networkName: network.name,
        networkUuid: network.uuid,
        networkSlug: network.slug,
        subscriptionPlan: 'red_agencias',
        agentUuid: adminAgent.uuid
      });
    } catch (error) {
      console.error('Error registering network:', error);
      res.status(500).json({ message: "Error al registrar la red de agencias" });
    }
  });

  // Validate invitation token and get details
  app.get("/api/auth/validate-invitation/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ 
          message: "Invitación no válida o expirada" 
        });
      }
      
      // Get agency name
      const agency = await storage.getAgencyById(invitation.agencyId);
      
      res.status(200).json({
        email: invitation.email,
        name: invitation.name,
        surname: invitation.surname,
        agencyId: invitation.agencyId,
        agencyName: agency?.agencyName || 'Realista'
      });
    } catch (error) {
      console.error('Error validating invitation:', error);
      res.status(500).json({ message: "Error al validar la invitación" });
    }
  });

  // Invited agent registration endpoint
  app.post("/api/auth/register-invited-agent", async (req, res) => {
    try {
      console.log('Invited Agent Registration - Datos recibidos:', req.body);
      const { token, password } = req.body;

      // Validate required fields
      if (!token || !password) {
        return res.status(400).json({ 
          message: "Token y contraseña son requeridos" 
        });
      }

      // NEW FLOW: Check for pending agent directly by invitation token
      const pendingAgent = await storage.getAgentByInvitationToken(token);
      
      if (pendingAgent) {
        // NEW FLOW: Activate the pending agent (agent was created when invitation was sent)
        console.log('Found pending agent:', pendingAgent.id, 'activating...');
        
        // Hash the password before storing
        const hashedPassword = await hashPassword(password);
        
        // Activate the agent (set password, change status to active)
        const activatedAgent = await storage.activateInvitedAgent(pendingAgent.id, hashedPassword);
        console.log('Agent activated:', activatedAgent.id);
        
        // Get agency for the session data
        const agentRole = await storage.getAgentRole(activatedAgent.id);
        const agency = agentRole.agencyId ? await storage.getAgencyById(agentRole.agencyId) : null;
        
        // Also mark the old invitation as consumed for backwards compatibility
        await storage.consumeInvitation(token);
        
        // Create session with proper user object
        (req as any).session.user = {
          id: activatedAgent.id,
          email: activatedAgent.email,
          name: activatedAgent.name,
          surname: activatedAgent.surname,
          isAdmin: false,
          isClient: false,
          phone: activatedAgent.phone,
          agencyId: agentRole.agencyId,
          agencyName: agency?.agencyName || null,
          agentUuid: activatedAgent.uuid
        };
        
        await new Promise((resolve, reject) => {
          (req as any).session.save((err: any) => {
            if (err) reject(err);
            else resolve(true);
          });
        });

        // Send welcome email
        try {
          await sendWelcomeEmail(activatedAgent.email, `${activatedAgent.name} ${activatedAgent.surname}`, true);
          console.log('Email de bienvenida enviado a:', activatedAgent.email);
        } catch (emailError) {
          console.error('Error enviando email de bienvenida:', emailError);
        }

        // Return user data without password
        const { password: _, ...agentResponse } = activatedAgent;
        return res.status(201).json({
          ...agentResponse,
          isAdmin: false,
          isClient: false,
          agencyId: agentRole.agencyId,
          agencyName: agency?.agencyName || null,
          role: 'member',
          subscriptionPlan: agency?.subscriptionPlan || null,
          isYearlyBilling: agency?.isYearlyBilling || false,
          agentUuid: activatedAgent.uuid
        });
      }

      // LEGACY FLOW: Fall back to invitation table for old invitations
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ 
          message: "Invitación no válida o expirada" 
        });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe una cuenta con este correo electrónico" 
        });
      }

      // Verify agency exists
      const agency = await storage.getAgencyById(invitation.agencyId);
      if (!agency) {
        return res.status(404).json({ 
          message: "La agencia no existe" 
        });
      }

      // Create agent linked to agency (legacy flow)
      const agentData = {
        email: invitation.email,
        password,
        name: invitation.name,
        surname: invitation.surname,
        agencyId: invitation.agencyId,
        agentType: 'agency_member',
        subscriptionPlan: null, // Agency members inherit agency subscription
        isYearlyBilling: false,
        city: null
      };

      const agent = await storage.createUser(agentData);
      console.log('Invited agent created (legacy):', agent.id, 'for agency:', invitation.agencyId);

      // Link agent to agency via agency_agents table (atomic with seat check)
      await storage.addAgentToAgencyAtomic(
        invitation.agencyId,
        agent.id,
        'member',
        agent.id // Self-registration through invitation
      );
      console.log('Agent successfully linked to agency:', invitation.agencyId);

      // Mark invitation as consumed
      await storage.consumeInvitation(token);
      console.log('Invitation consumed for:', invitation.email);

      // Create session with proper user object
      (req as any).session.user = {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        surname: agent.surname,
        isAdmin: false,
        isClient: false,
        phone: agent.phone,
        agencyId: invitation.agencyId,
        agencyName: agency.agencyName,
        agentUuid: agent.uuid
      };
      
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(agent.email, `${agent.name} ${agent.surname}`, true);
        console.log('Email de bienvenida enviado a:', agent.email);
      } catch (emailError) {
        console.error('Error enviando email de bienvenida:', emailError);
      }

      // Return user data without password
      const { password: _, ...agentResponse } = agent;
      res.status(201).json({
        ...agentResponse,
        isAdmin: false,
        isClient: false,
        agencyId: invitation.agencyId,
        agencyName: agency.agencyName,
        role: 'member',
        subscriptionPlan: agency.subscriptionPlan,
        isYearlyBilling: agency.isYearlyBilling,
        agentUuid: agent.uuid
      });
    } catch (error) {
      console.error('Error registering invited agent:', error);
      res.status(500).json({ message: "Error al registrar el agente invitado" });
    }
  });

  // Agent registration with subscription plan
  app.post("/api/auth/register-agent", async (req, res) => {
    try {
      console.log('Agent Registration - Datos recibidos:', req.body);
      const { email, password, subscriptionPlan, isYearlyBilling } = req.body;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe una cuenta con este correo electrónico" 
        });
      }

      // SECURITY: Always create agent on free tier (basico) first
      // Stripe webhook will upgrade to paid plan only after successful payment
      // This prevents users from accessing paid features by abandoning checkout
      const AGENT_FREE_TIER = {
        subscriptionPlan: 'basico',
        isYearlyBilling: false
      };

      // Create independent agent with FREE tier - upgrade happens via Stripe webhook after payment
      const agentData = {
        email,
        password,
        agentType: 'independent',
        subscriptionPlan: AGENT_FREE_TIER.subscriptionPlan,
        isYearlyBilling: AGENT_FREE_TIER.isYearlyBilling,
        city: null
      };

      const agent = await storage.createUser(agentData);
      console.log('Agent created:', agent.id);

      // Create session with proper user object (free tier until payment confirmed)
      (req as any).session.user = {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        surname: agent.surname,
        isAdmin: false, // Independent agents are not admins
        isClient: false,
        phone: agent.phone,
        agencyId: null,
        agencyName: null,
        subscriptionPlan: AGENT_FREE_TIER.subscriptionPlan, // Always free tier until Stripe confirms payment
        agentUuid: agent.uuid
      };
      
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(agent.email, email.split('@')[0], true);
        console.log('Email de bienvenida enviado a:', agent.email);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
      }

      // For paid plans (lider), create Stripe checkout session
      let checkoutUrl: string | null = null;
      let stripeError: string | null = null;
      
      // Hardcoded fallback price IDs for Agent Líder (from Stripe)
      const AGENT_LIDER_PRICES = {
        monthly: 'price_1SXWwlLUOluRoTfmxmnVsmc0', // 20€/month
        yearly: 'price_1SXWwlLUOluRoTfmhzd9sYvp'   // 200€/year
      };
      
      if (subscriptionPlan === 'lider') {
        try {
          const { stripeService } = await import("./stripeService");
          
          // Try to get price ID dynamically, fallback to hardcoded
          let priceId: string | null = null;
          
          try {
            const products = await stripeService.listProductsWithPrices('agent');
            const agentLiderProduct = products.find((p: any) => 
              p.name?.includes('Agente') && p.name?.includes('Líder')
            );
            
            if (agentLiderProduct && agentLiderProduct.prices.length > 0) {
              const price = agentLiderProduct.prices.find((p: any) => {
                const interval = p.recurring?.interval;
                return isYearlyBilling ? interval === 'year' : interval === 'month';
              });
              if (price?.id) {
                priceId = price.id;
              }
            }
          } catch (lookupError) {
            console.warn('Dynamic price lookup failed, using fallback:', lookupError);
          }
          
          // Use fallback if dynamic lookup failed
          if (!priceId) {
            priceId = isYearlyBilling ? AGENT_LIDER_PRICES.yearly : AGENT_LIDER_PRICES.monthly;
            console.log('Using fallback price ID:', priceId);
          }
          
          // Create Stripe customer
          const customer = await stripeService.createCustomer(
            agent.email,
            agent.name || agent.email,
            'agent',
            agent.id
          );
          
          // Save customer ID to agent
          await stripeService.updateCustomerId('agent', agent.id, customer.id);
          
          // Build base URL - always use https for Stripe callbacks
          // Priority: REPLIT_DOMAINS > x-forwarded-host > fallback to error
          const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          const forwardedHost = req.get('x-forwarded-host');
          
          let baseUrl: string;
          if (replitDomain) {
            baseUrl = `https://${replitDomain}`;
          } else if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
            // Always use https for Stripe (force even if forwarded as http)
            baseUrl = `https://${forwardedHost}`;
          } else {
            // Fallback: can't determine valid public URL
            console.error('Cannot determine valid public URL for Stripe callback');
            stripeError = 'No se pudo configurar el pago. Contacta con soporte.';
            throw new Error('No valid public URL for Stripe');
          }
          
          const session = await stripeService.createCheckoutSession(
            customer.id,
            priceId,
            `${baseUrl}/gestionar/${agent.uuid}/calendario?payment=success`,
            `${baseUrl}/gestionar/${agent.uuid}/calendario?payment=cancelled`,
            'agent',
            agent.id,
            subscriptionPlan, // Pass intended plan for audit/debugging
            isYearlyBilling ? 'yearly' : 'monthly'
          );
          
          checkoutUrl = session.url;
          console.log('Stripe checkout session created for agent:', agent.id, 'priceId:', priceId, 'intendedPlan:', subscriptionPlan);
        } catch (err) {
          console.error('Error creating Stripe checkout for agent:', err);
          stripeError = 'Error al procesar el pago. Puedes intentarlo de nuevo desde tu perfil.';
        }
      }

      // Return user data without password
      const { password: _, ...userResponse } = agent;
      res.status(201).json({
        ...userResponse,
        isAdmin: false,
        isClient: false,
        agentUuid: agent.uuid,
        checkoutUrl,
        stripeError
      });
    } catch (error) {
      console.error('Error registering agent:', error);
      res.status(500).json({ message: "Error al registrar el agente" });
    }
  });

  // Get agencies managed by admin agent
  app.get("/api/agents/:adminId/agencies", async (req, res) => {
    try {
      const adminId = parseInt(req.params.adminId);
      const agencies = await storage.getAgenciesByAdmin(adminId);
      res.json(agencies);
    } catch (error) {
      console.error('Error fetching admin agencies:', error);
      res.status(500).json({ message: "Failed to fetch agencies" });
    }
  });

  // Create agent invitation endpoint for team management
  app.post("/api/agents/invite", requireAuth, async (req, res) => {
    try {
      console.log('Creating agent invitation - Received data:', req.body);

      const { name, surname, email, agencyId } = req.body;

      // Validate required fields
      if (!agencyId) {
        return res.status(400).json({ message: "Se requiere ID de agencia" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe un usuario con este correo electrónico" 
        });
      }

      // Get agency information
      const agency = await storage.getAgencyById(parseInt(agencyId));
      if (!agency) {
        return res.status(404).json({ message: "Agencia no encontrada" });
      }

      const agencyName = agency.agencyName || 'Realista';

      // Send invitation email using Resend
      try {
        const emailSent = await sendAgentInvitation(
          email, 
          name, 
          surname, 
          agencyName, 
          parseInt(agencyId),
          req.user!.id // invitedBy
        );
        
        if (emailSent) {
          console.log('Invitation email sent successfully to:', email);
          res.status(200).json({ 
            message: "Invitación enviada exitosamente",
            email: email,
            name: `${name} ${surname}`
          });
        } else {
          throw new Error('Failed to send invitation email');
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        res.status(500).json({ 
          message: "Error enviando la invitación por email" 
        });
      }
    } catch (error) {
      console.error('Error creating agent invitation:', error);
      res.status(500).json({ 
        message: "Error procesando la invitación del agente" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login - Datos recibidos:', req.body);
      const { email, password } = req.body;

      // Primero intentar encontrar en la tabla de agentes/usuarios
      let user = await storage.getUserByEmail(email);
      console.log('Login - User object from getUserByEmail:', JSON.stringify(user, null, 2));
      let isClient = false;

      // Si no se encuentra en agentes, buscar en clientes
      if (!user) {
        const clients = await storage.getClients();
        const client = clients.find(c => c.email === email);

        if (client && client.password) {
          const clientPasswordValid = await comparePassword(password, client.password);
          if (clientPasswordValid) {
            // Convertir cliente a formato de usuario para compatibilidad
            user = {
              id: client.id,
              uuid: client.uuid, // Include client UUID
              email: client.email,
              password: client.password,
              name: client.name,
              surname: client.surname,
              description: null,
              avatar: null,
              createdAt: client.createdAt,
              influence_neighborhoods: null,
              yearsOfExperience: null,
              languagesSpoken: null,
              agencyId: null,
              isAdmin: false,
              phone: client.phone
            };
            isClient = true;
          }
        }
      }

      console.log('Login - Usuario encontrado:', user ? 'Sí' : 'No', isClient ? '(Cliente)' : '(Agente)');

      // Verify password for agents (clients already verified above)
      if (!user) {
        console.log('Login - Usuario no encontrado');
        return res.status(401).json({ message: "El nombre de usuario o la contraseña que has introducido no son correctos. Comprueba tus datos e inténtalo de nuevo" });
      }
      
      if (!isClient && user.password) {
        const agentPasswordValid = await comparePassword(password, user.password);
        if (!agentPasswordValid) {
          console.log('Login - Credenciales inválidas');
          return res.status(401).json({ message: "El nombre de usuario o la contraseña que has introducido no son correctos. Comprueba tus datos e inténtalo de nuevo" });
        }
      }

      // For agents, check if they're an admin of an agency
      let isAdmin = false;
      let agencyId = null;
      let agencyName = null;
      let subscriptionPlan = null;
      
      if (!isClient) {
        const agentRole = await storage.getAgentRole(user.id);
        isAdmin = agentRole.role === 'admin';
        agencyId = agentRole.agencyId;
        
        // Get agency name and subscription plan if agent belongs to one
        if (agencyId) {
          const agency = await storage.getAgencyById(agencyId);
          if (agency) {
            agencyName = agency.agencyName;
            subscriptionPlan = agency.subscriptionPlan;
          }
        } else {
          // For independent agents, get their personal subscription plan
          subscriptionPlan = user.subscriptionPlan || null;
        }
      }

      console.log('Login - Éxito, devolviendo usuario:', {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: isAdmin,
        isClient: isClient,
        agencyId: agencyId,
        subscriptionPlan: subscriptionPlan,
        agentType: user.agentType,
        networkId: user.networkId
      });

      // Store user data in session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        isAdmin: isAdmin,
        isClient: isClient,
        phone: user.phone,
        agencyId: agencyId,
        agencyName: agencyName,
        subscriptionPlan: subscriptionPlan,
        agentType: user.agentType || null,
        networkId: user.networkId || null,
        ...((!isClient && user.uuid) ? { agentUuid: user.uuid } : {}),
        ...((isClient && user.uuid) ? { clientUuid: user.uuid } : {})
      };

      // Save session to database
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) {
            console.error('Error saving session:', err);
            reject(err);
          } else {
            console.log('Session saved successfully for user:', user.email);
            resolve(true);
          }
        });
      });

      // Remover la contraseña antes de enviar la respuesta
      const { password: _, ...userResponse } = user;
      res.json({ 
        ...userResponse, 
        isClient,
        isAdmin,
        agencyId,
        agencyName,
        subscriptionPlan,
        agentType: user.agentType || null,
        networkId: user.networkId || null,
        ...((!isClient && user.uuid) ? { agentUuid: user.uuid } : {}),
        ...((isClient && user.uuid) ? { clientUuid: user.uuid } : {})
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: "Error en el inicio de sesión" });
    }
  });

  // Session management endpoints
  app.post("/api/auth/logout", async (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ message: "Error al cerrar sesión" });
        }
        res.json({ message: "Sesión cerrada exitosamente" });
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ message: "Error al cerrar sesión" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ message: "Error al obtener información del usuario" });
    }
  });

  // Google Maps configuration endpoint
  app.get("/api/maps-config", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      res.json({ apiKey });
    } catch (error) {
      console.error('Error getting maps config:', error);
      res.status(500).json({ message: "Maps configuration error" });
    }
  });

  // Google Maps Geocoding API endpoint
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }

      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=es&components=country:ES&key=${apiKey}`
      );

      if (!response.ok) {
        console.warn(`Google Maps Geocoding failed for address: ${address}, Status: ${response.status}`);
        return res.status(response.status).json({ message: "Geocoding service unavailable" });
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const result = {
          lat: location.lat,
          lng: location.lng,
          formatted_address: data.results[0].formatted_address
        };
        
        res.json(result);
      } else {
        console.warn(`No geocoding results found for: ${address}, Status: ${data.status}`);
        res.status(404).json({ message: "Address not found" });
      }
    } catch (error) {
      console.error('Google Maps Geocoding error:', error);
      res.status(500).json({ message: "Geocoding service error" });
    }
  });

  // Properties
  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProperty(id);
      res.status(200).json({ message: "Propiedad eliminada exitosamente" });
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ message: "Error al eliminar la propiedad" });
    }
  });

  app.patch("/api/properties/:id/toggle-status", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updatedProperty = await storage.togglePropertyStatus(id, isActive);
      res.status(200).json(updatedProperty);
    } catch (error) {
      console.error('Error toggling property status:', error);
      res.status(500).json({ message: "Error al cambiar el estado de la propiedad" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      console.log('Attempting to create property with data:', req.body);
      const property = insertPropertySchema.parse(req.body);
      
      // Check active properties limit for agencies
      if (property.agencyId) {
        const agency = await storage.getAgencyById(property.agencyId);
        if (agency) {
          // null or undefined means unlimited, otherwise use the limit (default to 2 for basica if undefined)
          const activePropertiesLimit = agency.activePropertiesLimit === undefined ? 2 : agency.activePropertiesLimit;
          
          // null means unlimited, skip the check
          if (activePropertiesLimit !== null) {
            const currentActiveCount = await storage.getActivePropertiesCount(property.agencyId);
            
            if (currentActiveCount >= activePropertiesLimit) {
              return res.status(403).json({ 
                message: `Has alcanzado el límite de ${activePropertiesLimit} propiedades activas de tu plan. Desactiva alguna propiedad existente o mejora tu plan en Realista Pro.`,
                limitReached: true,
                currentCount: currentActiveCount,
                limit: activePropertiesLimit
              });
            }
          }
        }
      }
      
      const result = await storage.createProperty(property);
      console.log('Property created successfully:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(400).json({ message: "Invalid property data" });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      console.log('Attempting to update property:', req.params.id, req.body);
      const property = insertPropertySchema.parse(req.body);
      const result = await storage.updateProperty(req.params.id, property);
      console.log('Property updated successfully:', result);
      res.json(result);
    } catch (error) {
      console.error('Error updating property:', error);
      res.status(400).json({ message: "Invalid property data" });
    }
  });

  app.get("/api/properties", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const agencyId = req.query.agencyId ? parseInt(req.query.agencyId as string) : undefined;
      const mostViewed = req.query.mostViewed === 'true';
      const includeInactive = req.query.includeInactive === 'true';
      const operationType = req.query.operationType as string | undefined;

      console.log(`GET /api/properties - Params: mostViewed=${mostViewed}, operationType=${operationType}, agentId=${agentId}, agencyId=${agencyId}, includeInactive=${includeInactive}`);

      let properties;
      if (mostViewed) {
        // Add aggressive caching for most viewed properties to improve loading performance
        const cacheKey = `most-viewed-${operationType || 'all'}`;
        const etag = `"${cacheKey}-${Math.floor(Date.now() / 300000)}"`;
        
        res.set({
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'ETag': etag
        });

        // Check if client has cached version
        if (req.headers['if-none-match'] === etag) {
          return res.status(304).end();
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
        properties = await storage.getMostViewedProperties(limit, operationType);
        console.log(`Returning ${properties.length} most viewed properties with operationType=${operationType}`);
      } else if (agentId) {
        // Add pagination support for better performance
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        
        // Use getAllPropertiesByAgent for management purposes when includeInactive is true
        properties = includeInactive 
          ? await storage.getAllPropertiesByAgent(agentId, limit, offset)
          : await storage.getPropertiesByAgent(agentId);
      } else if (agencyId) {
        properties = await storage.getPropertiesByAgency(agencyId);
      } else {
        // Apply neighborhood hierarchy expansion to property search
        let updatedQuery = { ...req.query };
        const hasNeighborhoods = updatedQuery.neighborhoods !== undefined && 
                                 typeof updatedQuery.neighborhoods === 'string' && 
                                 updatedQuery.neighborhoods.trim() !== '';

        // If there are neighborhoods selected, expand the search according to hierarchy
        if (hasNeighborhoods && typeof updatedQuery.neighborhoods === 'string') {
          const neighborhood = updatedQuery.neighborhoods;

          // If it's a city-wide search, remove neighborhood filter
          if (isCityWideSearch(neighborhood)) {
            console.log('City-wide search for Barcelona - showing all properties');
            delete updatedQuery.neighborhoods; // Don't filter by specific neighborhoods
          } 
          // If it's a district or specific neighborhood, expand the search
          else {
            // Expand the neighborhood or district to a list of neighborhoods
            const expandedNeighborhoods = expandNeighborhoodSearch(neighborhood);
            console.log(`Expanded search for ${neighborhood} includes: ${expandedNeighborhoods.join(', ')}`);

            if (expandedNeighborhoods.length > 0) {
              // Replace the original filter with the expanded list
              updatedQuery.neighborhoods = expandedNeighborhoods.join(',');
            }
          }
        }

        properties = await storage.searchProperties(updatedQuery);
      }
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      
      let property;
      // Check if identifier is a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(identifier)) {
        property = await storage.getPropertyByUuid(identifier);
      } else {
        property = await storage.getPropertyBySlug(identifier);
      }

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Incrementar el contador de vistas
      await storage.incrementPropertyViewCount(property.uuid);

      // Retornar la propiedad con la vista ya incrementada
      const updatedProperty = await storage.getProperty(property.uuid);
      res.json(updatedProperty);
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Clients
  app.post("/api/clients", async (req, res) => {
    try {
      console.log('Attempting to create client with data:', req.body);
      const client = insertClientSchema.parse({
        ...req.body,
        source: req.body.source || 'manual'
      });
      const result = await storage.createClient(client);
      console.log('Client created successfully:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      console.log('Attempting to update client:', req.params.id, req.body);
      const client = insertClientSchema.parse(req.body);
      const result = await storage.updateClient(parseInt(req.params.id), client);
      console.log('Client updated successfully:', result);
      res.json(result);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      console.log('Attempting to delete client:', clientId);
      await storage.deleteClient(clientId);
      console.log('Client deleted successfully:', clientId);
      res.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ message: "Error al eliminar el cliente" });
    }
  });

  // Send properties to multiple clients via email
  app.post("/api/clients/send-properties", requireAuth, async (req, res) => {
    try {
      const { clientIds, propertyUuids, message } = req.body;
      const userId = (req.user as any).id;
      
      // Validate input
      if (!Array.isArray(clientIds) || clientIds.length === 0) {
        return res.status(400).json({ message: "Se requiere al menos un cliente" });
      }
      if (!Array.isArray(propertyUuids) || propertyUuids.length === 0) {
        return res.status(400).json({ message: "Se requiere al menos una propiedad" });
      }
      
      // Get agent info
      const agent = await storage.getUser(userId);
      if (!agent) {
        return res.status(404).json({ message: "Agente no encontrado" });
      }
      
      // Get agency info if agent belongs to one
      let agencyName: string | null = null;
      const agentRole = await storage.getAgentRole(userId);
      if (agentRole.agencyId) {
        const agency = await storage.getAgencyById(agentRole.agencyId);
        agencyName = agency?.agencyName || null;
      }
      
      // Get clients (verify they belong to this agent)
      const allClients = await storage.getClientsByAgent(userId);
      const validClients = allClients.filter(c => clientIds.includes(c.id));
      
      if (validClients.length === 0) {
        return res.status(400).json({ message: "No se encontraron clientes válidos" });
      }
      
      // Get properties
      const propertiesPromises = propertyUuids.map(uuid => storage.getPropertyByUuid(uuid));
      const propertiesResults = await Promise.all(propertiesPromises);
      const validProperties = propertiesResults.filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);
      
      if (validProperties.length === 0) {
        return res.status(400).json({ message: "No se encontraron propiedades válidas" });
      }
      
      // Send emails
      const { sendPropertiesToClients } = await import('./emailService');
      const result = await sendPropertiesToClients(
        validClients.map(c => ({
          id: c.id,
          email: c.email,
          name: c.name,
          surname: c.surname,
        })),
        validProperties.map(p => ({
          uuid: p.uuid,
          title: p.title,
          address: p.address,
          price: p.price,
          type: p.type,
          slug: p.slug,
        })),
        message || '',
        {
          name: agent.name || 'Agente',
          surname: agent.surname || undefined,
          email: agent.email,
          phone: agent.phone || undefined,
          agencyName,
        }
      );
      
      if (result.success) {
        res.json({
          success: true,
          sentCount: result.sentCount,
          message: `Se enviaron ${result.sentCount} correo${result.sentCount > 1 ? 's' : ''} correctamente`,
        });
      } else {
        res.status(500).json({
          success: false,
          sentCount: result.sentCount,
          errors: result.errors,
          message: "Error al enviar algunos correos",
        });
      }
    } catch (error) {
      console.error('Error sending properties to clients:', error);
      res.status(500).json({ message: "Error al enviar correos" });
    }
  });

  app.get("/api/clients", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : null;
      const agencyId = req.query.agencyId ? parseInt(req.query.agencyId as string) : null;

      if (agencyId) {
        const clients = await storage.getClientsByAgency(agencyId);
        return res.json(clients);
      }
      if (agentId) {
        const clients = await storage.getClientsByAgent(agentId);
        return res.json(clients);
      }
      return res.status(400).json({ message: "agentId or agencyId is required" });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Get clients by agent ID (for event form)
  app.get("/api/agents/:identifier/clients", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agentId;
      if (isNaN(id)) {
        const agent = await storage.getAgentBySlug(identifier);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
        agentId = agent.id;
      } else {
        agentId = id;
      }

      const clientsList = await storage.getClientsByAgent(agentId);
      
      const allReviews = await storage.getAgentReviews(agentId);
      const reviewEmails = new Set(allReviews.map((r: any) => r.reviewerEmail?.toLowerCase()).filter(Boolean));
      
      const clientsWithStatus = clientsList.map((client: any) => {
        const hasReview = reviewEmails.has(client.email?.toLowerCase());
        let reviewStatus = null;
        
        if (client.reviewRequestSentAt) {
          if (hasReview) {
            reviewStatus = 'realizada';
          } else {
            const daysSinceSent = Math.floor((Date.now() - new Date(client.reviewRequestSentAt).getTime()) / (1000 * 60 * 60 * 24));
            reviewStatus = daysSinceSent >= 30 ? 'abandonada' : 'enviada';
          }
        }
        
        return { ...client, reviewStatus };
      });
      
      res.json(clientsWithStatus);
    } catch (error) {
      console.error('Error fetching clients for agent:', error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Client favorite agents endpoints
  app.post("/api/clients/favorites/agents/:agentUuid", async (req, res) => {
    try {
      const agentUuid = req.params.agentUuid;
      const { clientId } = req.body;

      if (!clientId) {
        return res.status(401).json({ message: "Client ID is required" });
      }

      // Look up agent by UUID to get numeric ID
      const agent = await storage.getAgentByUuid(agentUuid);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const isFavorite = await storage.toggleFavoriteAgent(clientId, agent.id);

      res.status(200).json({ 
        message: isFavorite ? "Agente agregado a favoritos" : "Agente eliminado de favoritos",
        isFavorite: isFavorite,
        agentId: agent.id
      });
    } catch (error) {
      console.error('Error updating favorite agent:', error);
      res.status(500).json({ message: "Error al actualizar favoritos" });
    }
  });

  app.get("/api/clients/:clientId/favorites/agents", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const favoriteAgents = await storage.getFavoriteAgentsByClient(clientId);
      res.status(200).json(favoriteAgents);
    } catch (error) {
      console.error('Error fetching favorite agents:', error);
      res.status(500).json({ message: "Failed to fetch favorite agents" });
    }
  });

  app.get("/api/clients/:clientId/favorites/agents/:agentUuid/status", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const agentUuid = req.params.agentUuid;
      
      // Look up agent by UUID to get numeric ID
      const agent = await storage.getAgentByUuid(agentUuid);
      if (!agent) {
        return res.status(200).json({ isFavorite: false });
      }
      
      const isFavorite = await storage.isFavoriteAgent(clientId, agent.id);
      res.status(200).json({ isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Batch agent favorites status endpoint for performance optimization
  app.get("/api/clients/:clientId/favorites/agents/status", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const agentIdsParam = req.query.agentIds as string;
      
      if (!agentIdsParam) {
        return res.status(400).json({ message: "Agent IDs are required" });
      }

      const agentIds = agentIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const favoriteStatuses = await storage.getBatchFavoriteAgentStatus(clientId, agentIds);
      res.status(200).json(favoriteStatuses);
    } catch (error) {
      console.error('Error checking batch agent favorite status:', error);
      res.status(500).json({ message: "Failed to check batch agent favorite status" });
    }
  });

  // Client favorite agencies endpoints
  app.post("/api/clients/favorites/agencies/:agencyUuid", async (req, res) => {
    try {
      const agencyUuid = req.params.agencyUuid;
      const { clientId } = req.body;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }

      // Look up agency by UUID to get numeric ID
      const agency = await storage.getAgencyByUuid(agencyUuid);
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const isFavorite = await storage.toggleFavoriteAgency(clientId, agency.id);
      res.status(200).json({ 
        isFavorite, 
        message: isFavorite ? "Agency added to favorites" : "Agency removed from favorites" 
      });
    } catch (error) {
      console.error('Error toggling agency favorite:', error);
      res.status(500).json({ message: "Failed to update agency favorites" });
    }
  });

  app.get("/api/clients/:clientId/favorites/agencies", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const favoriteAgencies = await storage.getFavoriteAgenciesByClient(clientId);
      res.status(200).json(favoriteAgencies);
    } catch (error) {
      console.error('Error fetching favorite agencies:', error);
      res.status(500).json({ message: "Failed to fetch favorite agencies" });
    }
  });

  app.get("/api/clients/:clientId/favorites/agencies/:agencyUuid/status", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const agencyUuid = req.params.agencyUuid;
      
      // Look up agency by UUID to get numeric ID
      const agency = await storage.getAgencyByUuid(agencyUuid);
      if (!agency) {
        return res.status(200).json({ isFavorite: false });
      }
      
      const isFavorite = await storage.isFavoriteAgency(clientId, agency.id);
      res.status(200).json({ isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Batch agency favorites status endpoint for performance optimization
  app.get("/api/clients/:clientId/favorites/agencies/status", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const agencyIdsParam = req.query.agencyIds as string;
      
      if (!agencyIdsParam) {
        return res.status(400).json({ message: "Agency IDs are required" });
      }

      const agencyIds = agencyIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const favoriteStatuses = await storage.getBatchFavoriteAgencyStatus(clientId, agencyIds);
      res.status(200).json(favoriteStatuses);
    } catch (error) {
      console.error('Error checking batch agency favorite status:', error);
      res.status(500).json({ message: "Failed to check batch agency favorite status" });
    }
  });

  // Property favorites routes
  app.post("/api/clients/favorites/properties/:propertyId", async (req, res) => {
    try {
      const propertyId = req.params.propertyId;
      const { clientId } = req.body;

      console.log('Toggle property favorite request:', { propertyId, clientId, body: req.body });

      if (!clientId) {
        console.log('Missing clientId in request body');
        return res.status(400).json({ message: "Client ID is required" });
      }

      const isFavorite = await storage.toggleFavoriteProperty(clientId, propertyId);
      res.status(200).json({ 
        isFavorite, 
        message: isFavorite ? "Property added to favorites" : "Property removed from favorites" 
      });
    } catch (error) {
      console.error('Error toggling property favorite:', error);
      res.status(500).json({ message: "Failed to update property favorites" });
    }
  });

  app.get("/api/clients/:clientId/favorites/properties", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const favoriteProperties = await storage.getFavoritePropertiesByClient(clientId);
      res.status(200).json(favoriteProperties);
    } catch (error) {
      console.error('Error fetching favorite properties:', error);
      res.status(500).json({ message: "Failed to fetch favorite properties" });
    }
  });

  app.get("/api/clients/:clientId/favorites/properties/:propertyId/status", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const propertyId = req.params.propertyId;
      const isFavorite = await storage.isFavoriteProperty(clientId, propertyId);
      res.status(200).json({ isFavorite });
    } catch (error) {
      console.error('Error checking property favorite status:', error);
      res.status(500).json({ message: "Failed to check property favorite status" });
    }
  });

  // Batch favorites status endpoint for performance optimization
  app.get("/api/clients/:clientId/favorites/properties/batch", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const propertyIdsParam = req.query.propertyIds as string;
      
      if (!propertyIdsParam) {
        return res.status(400).json({ message: "Property IDs are required" });
      }

      const propertyIds = propertyIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0);
      const favoriteStatuses = await storage.getBatchFavoritePropertyStatus(clientId, propertyIds);
      res.status(200).json(favoriteStatuses);
    } catch (error) {
      console.error('Error checking batch property favorite status:', error);
      res.status(500).json({ message: "Failed to check batch property favorite status" });
    }
  });

  // Property Visit Requests
  app.post("/api/property-visit-requests", async (req, res) => {
    try {
      const visitRequestData = insertPropertyVisitRequestSchema.parse({
        propertyId: req.body.propertyId,
        clientId: req.body.clientId,
        agentId: req.body.agentId,
        requestedDate: new Date(req.body.requestedDate),
        requestedTime: req.body.requestedTime,
        clientNotes: req.body.clientNotes || null,
      });

      const visitRequest = await storage.createPropertyVisitRequest(visitRequestData);
      res.status(201).json(visitRequest);
    } catch (error) {
      console.error('Error creating property visit request:', error);
      res.status(500).json({ message: "Failed to create property visit request" });
    }
  });

  app.get("/api/clients/:clientId/visit-requests", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const visitRequests = await storage.getPropertyVisitRequestsByClient(clientId);
      res.status(200).json(visitRequests);
    } catch (error) {
      console.error('Error getting client visit requests:', error);
      res.status(500).json({ message: "Failed to get visit requests" });
    }
  });

  app.get("/api/agents/:identifier/visit-requests", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agentId;
      if (isNaN(id)) {
        // It's a slug, lookup the agent first to get the ID
        const agent = await storage.getAgentBySlug(identifier);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
        agentId = agent.id;
      } else {
        agentId = id;
      }

      const visitRequests = await storage.getPropertyVisitRequestsByAgent(agentId);
      res.status(200).json(visitRequests);
    } catch (error) {
      console.error('Error getting agent visit requests:', error);
      res.status(500).json({ message: "Failed to get visit requests" });
    }
  });

  app.patch("/api/property-visit-requests/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, agentNotes } = req.body;

      const updatedRequest = await storage.updatePropertyVisitRequestStatus(id, status, agentNotes);
      res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('Error updating visit request status:', error);
      res.status(500).json({ message: "Failed to update visit request status" });
    }
  });

  // Fraud reporting endpoints
  app.post("/api/properties/:propertyId/report-fraud", async (req, res) => {
    try {
      const propertyId = req.params.propertyId;

      // Get client IP and user agent for spam prevention
      const reporterIp = req.ip || req.connection.remoteAddress || '';
      const reporterAgent = req.get('User-Agent') || '';

      // Check if this IP has already reported this property recently (within 24 hours)
      const recentReport = await storage.checkRecentFraudReport(propertyId, reporterIp);
      if (recentReport) {
        return res.status(429).json({ message: "Ya has reportado esta propiedad recientemente" });
      }

      // Create fraud report and increment property fraud count
      const fraudReport = await storage.createFraudReport({
        propertyUuid: propertyId,
        reporterIp,
        reporterAgent
      });

      const updatedProperty = await storage.incrementPropertyFraudCount(propertyId);
      
      res.status(201).json({ 
        message: "Reporte de fraude enviado exitosamente",
        fraudCount: updatedProperty?.fraudCount || 0
      });
    } catch (error) {
      console.error('Error reporting property fraud:', error);
      res.status(500).json({ message: "Error al reportar la propiedad" });
    }
  });

  app.get("/api/properties/:propertyId/fraud-count", async (req, res) => {
    try {
      const propertyId = req.params.propertyId;

      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.status(200).json({ fraudCount: property.fraudCount || 0 });
    } catch (error) {
      console.error('Error getting property fraud count:', error);
      res.status(500).json({ message: "Error al obtener el contador de reportes" });
    }
  });

  // Agent Calendar Events
  app.post("/api/agent-events", async (req, res) => {
    try {
      const eventData = {
        agentId: req.body.agentId,
        clientId: req.body.clientId || null,
        propertyId: req.body.propertyId || null,
        eventType: req.body.eventType,
        eventDate: req.body.eventDate,
        eventTime: req.body.eventTime,
        comments: req.body.comments || null,
        status: req.body.status || "scheduled",
      };

      const event = await storage.createAgentEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating agent event:', error);
      res.status(500).json({ message: "Failed to create agent event" });
    }
  });

  app.get("/api/agents/:identifier/events", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agentId;
      if (isNaN(id)) {
        // It's a slug, lookup the agent first to get the ID
        const agent = await storage.getAgentBySlug(identifier);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
        agentId = agent.id;
      } else {
        agentId = id;
      }

      const { startDate, endDate, clientId } = req.query;

      const events = await storage.getAgentEvents(
        agentId, 
        startDate as string, 
        endDate as string
      );
      
      // Filter by clientId if provided
      let filteredEvents = events;
      if (clientId) {
        const clientIdNum = parseInt(clientId as string);
        filteredEvents = events.filter(event => event.clientId === clientIdNum);
      }
      
      res.status(200).json(filteredEvents);
    } catch (error) {
      console.error('Error getting agent events:', error);
      res.status(500).json({ message: "Failed to get agent events" });
    }
  });

  app.get("/api/agents/:agentId/events/all", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await storage.getAllAgentEventsPaginated(agentId, page, limit);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error getting all agent events:', error);
      res.status(500).json({ message: "Failed to get all agent events" });
    }
  });

  app.patch("/api/agent-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const eventData = req.body;

      const updatedEvent = await storage.updateAgentEvent(id, eventData);
      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error('Error updating agent event:', error);
      res.status(500).json({ message: "Failed to update agent event" });
    }
  });

  app.delete("/api/agent-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      await storage.deleteAgentEvent(id);
      res.status(200).json({ message: "Agent event deleted successfully" });
    } catch (error) {
      console.error('Error deleting agent event:', error);
      res.status(500).json({ message: "Failed to delete agent event" });
    }
  });

  // Client visit requests
  app.get("/api/clients/:clientId/visit-requests", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const requests = await storage.getPropertyVisitRequestsByClient(clientId);
      res.status(200).json(requests);
    } catch (error) {
      console.error('Error getting client visit requests:', error);
      res.status(500).json({ message: "Failed to get client visit requests" });
    }
  });

  // Get client details
  app.get("/api/clients/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(200).json(client);
    } catch (error) {
      console.error("Error getting client:", error);
      res.status(500).json({ message: "Failed to get client" });
    }
  });

  // Update client profile
  app.put("/api/clients/:clientId/profile", 
    requireAuth,
    authorize({
      allowAdmin: true,
      allowSelf: (user, req) => user.isClient && user.id === parseInt(req.params.clientId),
      custom: async (user, req) => {
        const clientId = parseInt(req.params.clientId);
        const existingClient = await storage.getClient(clientId);
        return !user.isClient && existingClient !== undefined && existingClient.agentId === user.id;
      }
    }),
    async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Check if client exists first
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Validate the request body using Zod schema
      const validationResult = updateClientProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: validationResult.error.issues 
        });
      }
      
      const profileData = validationResult.data;
      
      // Convert moveInDate string to Date if provided
      if (profileData.moveInDate) {
        profileData.moveInDate = new Date(profileData.moveInDate);
      }

      // Update the client profile
      const updatedClient = await storage.updateClientProfile(clientId, profileData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Failed to update client profile" });
      }
      
      res.status(200).json(updatedClient);
    } catch (error) {
      console.error('Error updating client profile:', error);
      res.status(500).json({ message: "Failed to update client profile" });
    }
  });

  // Saved Searches
  app.post("/api/saved-searches", requireAuth, requireRole('client'), async (req, res) => {
    try {
      // Get count of existing searches for this client to generate default name
      const existingSearches = await storage.getSavedSearchesByClient(req.user!.id);
      const searchCount = existingSearches.length + 1;
      
      const searchData = {
        ...req.body,
        clientId: req.user!.id,
        name: req.body.name || `Mi búsqueda ${searchCount}`,
      };

      const savedSearch = await storage.createSavedSearch(searchData);
      res.status(201).json(savedSearch);
    } catch (error) {
      console.error('Error creating saved search:', error);
      res.status(500).json({ message: "Error al guardar la búsqueda" });
    }
  });

  app.get("/api/saved-searches", requireAuth, requireRole('client'), async (req, res) => {
    try {
      const searches = await storage.getSavedSearchesByClient(req.user!.id);
      res.json(searches);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      res.status(500).json({ message: "Error al obtener las búsquedas guardadas" });
    }
  });

  app.put("/api/saved-searches/:id", requireAuth, requireRole('client'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "El nombre es requerido" });
      }

      const updatedSearch = await storage.updateSavedSearchName(id, name);
      res.json(updatedSearch);
    } catch (error) {
      console.error('Error updating saved search:', error);
      res.status(500).json({ message: "Error al actualizar la búsqueda" });
    }
  });

  app.delete("/api/saved-searches/:id", requireAuth, requireRole('client'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSavedSearch(id);
      res.json({ message: "Búsqueda eliminada exitosamente" });
    } catch (error) {
      console.error('Error deleting saved search:', error);
      res.status(500).json({ message: "Error al eliminar la búsqueda" });
    }
  });

  // Neighborhood Ratings
  app.post("/api/neighborhoods/ratings", async (req, res) => {
    try {
      console.log('Recibiendo valoración de barrio:', req.body);

      // Verificar que el barrio esté presente
      if (!req.body.neighborhood) {
        console.error('Barrio no especificado en la valoración');
        return res.status(400).json({ 
          success: false,
          message: "Datos incompletos. Se requiere especificar un barrio.", 
          received: req.body 
        });
      }

      // Si no hay userId o es -1 (anónimo), asignamos un ID especial para usuarios anónimos
      if (!req.body.userId) {
        req.body.userId = -1; // ID especial para valoraciones anónimas
      }

      // Asegurar que todos los campos de valoración son números
      const ratingFields = ['security', 'parking', 'familyFriendly', 'publicTransport', 'greenSpaces', 'services'];
      for (const field of ratingFields) {
        if (typeof req.body[field] !== 'number') {
          console.error(`Field ${field} is not a number:`, req.body[field]);
          return res.status(400).json({ 
            success: false,
            message: `El campo ${field} debe ser un número`, 
            received: { field, value: req.body[field] } 
          });
        }
      }

      try {
        const rating = insertNeighborhoodRatingSchema.parse(req.body);
        console.log('Rating data validada:', rating);

        const result = await storage.createNeighborhoodRating(rating);
        console.log('Valoración guardada en la base de datos:', result);

        // Invalidar cualquier caché para este barrio específico
        // (En un entorno de producción esto requeriría un mecanismo de invalidación de caché)

        res.status(201).json({
          success: true,
          message: `Valoración para ${rating.neighborhood} guardada con éxito`,
          data: result
        });
      } catch (validationError) {
        console.error('Error validando datos de valoración:', validationError);
        res.status(400).json({ 
          success: false,
          message: "Datos inválidos para la valoración del barrio", 
          error: validationError 
        });
      }
    } catch (error) {
      console.error('Error general al crear valoración de barrio:', error);
      res.status(500).json({ 
        success: false,
        message: "Error interno al procesar la valoración",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  app.get("/api/neighborhoods/ratings", async (req, res) => {
    try {
      const neighborhood = req.query.neighborhood as string;
      const city = (req.query.city as string) || 'Barcelona';
      const district = req.query.district as string;
      const ratings = await storage.getNeighborhoodRatings(neighborhood, city, district);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching neighborhood ratings:', error);
      res.status(500).json({ message: "Failed to fetch neighborhood ratings" });
    }
  });

  app.get("/api/neighborhoods/ratings/average", async (req, res) => {
    try {
      const neighborhood = req.query.neighborhood as string;
      const city = (req.query.city as string) || 'Barcelona';
      const district = req.query.district as string;
      
      console.log(`Recibida solicitud para promedios de barrio: ${neighborhood}, ciudad: ${city}, distrito: ${district || 'N/A'}`);

      if (!neighborhood) {
        return res.status(400).json({ 
          success: false,
          message: "Es necesario especificar el parámetro 'neighborhood'"
        });
      }

      // Añadir cabeceras para evitar caché
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`Obteniendo promedios para barrio: ${neighborhood} en ${city} a las ${new Date().toISOString()}`);
      const averages = await storage.getNeighborhoodRatingsAverage(neighborhood, city, district);
      console.log(`Promedios para ${neighborhood} en ${city} obtenidos:`, averages);

      return res.json(averages);
    } catch (error) {
      console.error('Error al calcular promedios para el barrio:', error);
      res.status(500).json({ 
        success: false,
        message: "Error al calcular los promedios de valoraciones del barrio",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Get all neighborhoods that have ratings
  app.get("/api/neighborhoods", async (req, res) => {
    try {
      const neighborhoods = await storage.getAllNeighborhoodsWithRatings();
      res.json(neighborhoods);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      res.status(500).json({ message: "Failed to fetch neighborhoods" });
    }
  });

  // Hierarchical city/district/neighborhood endpoints
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = getCities();
      res.json(cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.get("/api/cities/:city/districts", async (req, res) => {
    try {
      const city = req.params.city;
      const districts = getDistrictsByCity(city);
      res.json(districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
      res.status(500).json({ message: "Failed to fetch districts" });
    }
  });

  app.get("/api/cities/:city/districts/:district/neighborhoods", async (req, res) => {
    try {
      const { city, district } = req.params;
      const neighborhoods = getNeighborhoodsByDistrict(district, city);
      res.json(neighborhoods);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      res.status(500).json({ message: "Failed to fetch neighborhoods" });
    }
  });

  // Add after the existing agent routes
  app.get("/api/agents/search", async (req, res) => {
    try {
      const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
      const agents = await storage.searchAgents(queryString);
      res.json(agents);
    } catch (error) {
      console.error('Error searching agents:', error);
      res.status(500).json({ message: "Failed to search agents" });
    }
  });

  // Ruta para obtener los agentes vinculados a una agencia
  app.get("/api/agencies/:identifier/agents", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agencyId;
      if (isNaN(id)) {
        // It's a slug, lookup the agency first to get the ID
        const agency = await storage.getAgencyBySlug(identifier);
        if (!agency) {
          return res.status(404).json({ message: "Agency not found" });
        }
        agencyId = agency.id;
      } else {
        agencyId = id;
      }

      console.log(`Fetching agents for agency ID: ${agencyId}`);

      const agents = await storage.getAgencyAgents(agencyId);
      console.log(`Found ${agents.length} agents for agency ${agencyId}`);

      res.json(agents);
    } catch (error) {
      console.error(`Error fetching agents for agency: ${error}`);
      res.status(500).json({ message: "Failed to fetch agents for this agency" });
    }
  });

  app.get("/api/agencies/search", async (req, res) => {
    try {
      const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
      const agencies = await storage.searchAgencies(queryString);
      res.json(agencies);
    } catch (error) {
      console.error('Error searching agencies:', error);
      res.status(500).json({ message: "Failed to search agencies" });
    }
  });

  // Añadir rutas para búsqueda desde la página de búsqueda
  app.get("/api/search/agencies", async (req, res) => {
    try {
      console.log('Search agencies params:', req.query);

      // Usamos las funciones de neighborhoods importadas al principio del archivo

      // Procesar los parámetros de búsqueda
      let updatedQuery = { ...req.query };
      const hasSearchTerm = updatedQuery.agencyName && updatedQuery.agencyName.toString().trim() !== '';
      const hasNeighborhoods = updatedQuery.neighborhoods !== undefined && 
                               typeof updatedQuery.neighborhoods === 'string' && 
                               updatedQuery.neighborhoods.trim() !== '';
      const showAll = updatedQuery.showAll === 'true';

      // Si hay barrios seleccionados, expandir la búsqueda según la jerarquía
      if (hasNeighborhoods && typeof updatedQuery.neighborhoods === 'string') {
        const neighborhood = updatedQuery.neighborhoods;

        // Si es búsqueda a nivel de ciudad, mostramos todas las agencias de esa ciudad
        if (isCityWideSearch(neighborhood)) {
          // Extract city name from the search query (e.g., "Barcelona" or "Barcelona (Todos los barrios)")
          const cityMatch = neighborhood.match(/(Barcelona|Madrid)/i);
          const cityName = cityMatch ? cityMatch[1] : 'Barcelona';
          console.log(`Búsqueda para toda ${cityName} - mostrando todas las agencias de ${cityName}`);
          updatedQuery.showAll = 'true';
          updatedQuery.city = cityName; // Add city filter
          delete updatedQuery.neighborhoods; // No filtrar por barrios específicos
        } 
        // Si es un distrito o barrio específico, expandimos la búsqueda
        else {
          // Expandimos el barrio o distrito a una lista de barrios
          const expandedNeighborhoods = expandNeighborhoodSearch(neighborhood);
          console.log(`Búsqueda expandida para ${neighborhood} incluye: ${expandedNeighborhoods.join(', ')}`);

          if (expandedNeighborhoods.length > 0) {
            // Reemplazamos el filtro original con la lista expandida
            updatedQuery.neighborhoods = expandedNeighborhoods.join(',');
          }
        }
      }
      // Si showAll es falso y no hay términos de búsqueda, retornar array vacío
      else if (!showAll && !hasSearchTerm) {
        console.log('showAll=false y no hay términos de búsqueda, retornando array vacío');
        return res.json([]);
      }

      // Si hay términos de búsqueda, usarlos para filtrar
      if ((hasSearchTerm || hasNeighborhoods) && typeof updatedQuery.neighborhoods === 'string') {
        if (!isCityWideSearch(updatedQuery.neighborhoods)) {
          delete updatedQuery.showAll; // No es necesario con términos de búsqueda
        }
      }

      const queryString = new URLSearchParams(updatedQuery as Record<string, string>).toString();
      console.log('Search agencies queryString:', queryString);
      
      // Check cache for agencies search
      const agenciesCacheKey = `agencies_search:${queryString}`;
      let agencies = cache.get(agenciesCacheKey);
      
      if (!agencies) {
        console.log('Cache miss for agencies search, querying database');
        agencies = await storage.searchAgencies(queryString);
        // Cache agencies for 10 minutes for faster tab switching
        cache.set(agenciesCacheKey, agencies, 600);
      } else {
        console.log('Cache hit for agencies search');
      }

      // Procesamos los resultados para asegurar que se usen las propiedades correctas
      const processedResults = agencies.map(agency => {
        return {
          ...agency,
          // Usamos el avatar del administrador
          avatar: agency.avatar,
          // Usamos la descripción del agente
          description: agency.description
        };
      });

      // Add detailed logging to see what's coming from the database
      console.log('Agency resultsbefore normalization:', JSON.stringify(processedResults, null, 2));

      // Normalize field names to ensure consistent API responses
      const normalizedResults = processedResults.map(agency => {
        console.log(`Processing agency ${agency.id} (${agency.agencyName}):`);

        // Get the agency neighborhoods from the standardized field
        const rawNeighborhoods = agency.agencyInfluenceNeighborhoods;
        console.log('- Original neighborhoods:', rawNeighborhoods);
        console.log('- Type of neighborhoods:', typeof rawNeighborhoods);

        // Initialize array to store neighborhood values
        let neighborhoodsArray = [];

        // Handle PostgreSQL array format: "{\"La Sagrera\",\"Sant Andreu del Palomar\"}"
        if (typeof rawNeighborhoods === 'string') {
          try {
            // Remove the curly braces and attempt to parse if it's a PostgreSQL array string
            const cleaned = rawNeighborhoods.replace(/^\{|\}$/g, '');

            // Check if it's wrapped in quotes and contains commas
            if (cleaned.includes(',') && cleaned.includes('"')) {
              // Split by "," but respect quotes
              neighborhoodsArray = cleaned.split(/","|,/)
                .map(n => n.replace(/^"|"$/g, '').trim())
                .filter(Boolean);
            } else if (cleaned.includes(',')) {
              // Simple comma split if no quotes
              neighborhoodsArray = cleaned.split(',').map(n => n.trim()).filter(Boolean);
            } else {
              // Single value
              neighborhoodsArray = [cleaned.replace(/^"|"$/g, '').trim()].filter(Boolean);
            }

            console.log('- Parsed neighborhoods into array:', neighborhoodsArray);
          } catch (e) {
            console.log('- Failed to parse neighborhoods:', e.message);
            neighborhoodsArray = [];
          }
        } else if (Array.isArray(rawNeighborhoods)) {
          neighborhoodsArray = rawNeighborhoods;
        }

        // Set field to standardized name
        agency.agencyInfluenceNeighborhoods = neighborhoodsArray;

        console.log('- Final neighborhoods array:', agency.agencyInfluenceNeighborhoods);
        return agency;
      });

      console.log('Agency results after normalization:', JSON.stringify(normalizedResults, null, 2));

      console.log('Search agencies results:', normalizedResults.length);
      res.json(normalizedResults);
    } catch (error) {
      console.error('Error searching agencies:', error);
      res.status(500).json({ message: "Failed to search agencies" });
    }
  });

  app.get("/api/search/agents", async (req, res) => {
    try {
      console.log('Search agents params:', req.query);

      // Usamos las funciones de neighborhoods importadas al principio del archivo

      // Procesar los parámetros de búsqueda
      let updatedQuery = { ...req.query };
      const hasSearchTerm = updatedQuery.agentName && updatedQuery.agentName.toString().trim() !== '';
      const hasNeighborhoods = updatedQuery.neighborhoods !== undefined && 
                               typeof updatedQuery.neighborhoods === 'string' && 
                               updatedQuery.neighborhoods.trim() !== '';
      const showAll = updatedQuery.showAll === 'true';

      // Si hay barrios seleccionados, expandir la búsqueda según la jerarquía
      if (hasNeighborhoods && typeof updatedQuery.neighborhoods === 'string') {
        const neighborhood = updatedQuery.neighborhoods;

        // Si es búsqueda a nivel de ciudad, mostramos todos los agentes
        if (isCityWideSearch(neighborhood)) {
          console.log('Búsqueda para toda Barcelona - mostrando todos los agentes');
          updatedQuery.showAll = 'true';
          delete updatedQuery.neighborhoods; // No filtrar por barrios específicos
        } 
        // Si es un distrito o barrio específico, expandimos la búsqueda
        else {
          // Expandimos el barrio o distrito a una lista de barrios
          const expandedNeighborhoods = expandNeighborhoodSearch(neighborhood);
          console.log(`Búsqueda expandida para "${neighborhood}" incluye ${expandedNeighborhoods.length} barrios:`, expandedNeighborhoods.join(', '));

          if (expandedNeighborhoods.length > 0) {
            // Reemplazamos el filtro original con la lista expandida
            updatedQuery.neighborhoods = expandedNeighborhoods.join(',');
          }
        }
      }
      // Si showAll es falso y no hay términos de búsqueda, retornar array vacío
      else if (!showAll && !hasSearchTerm) {
        console.log('showAll=false y no hay términos de búsqueda, retornando array vacío');
        return res.json([]);
      }

      // Si hay términos de búsqueda, usarlos para filtrar
      if ((hasSearchTerm || hasNeighborhoods) && typeof updatedQuery.neighborhoods === 'string') {
        if (!isCityWideSearch(updatedQuery.neighborhoods)) {
          delete updatedQuery.showAll; // No es necesario con términos de búsqueda
        }
      }

      const queryString = new URLSearchParams(updatedQuery as Record<string, string>).toString();
      console.log('Search agents queryString:', queryString);
      
      // Check cache for agents search
      const agentsCacheKey = `agents_search:${queryString}`;
      let agents = cache.get(agentsCacheKey);
      
      if (!agents) {
        console.log('Cache miss for agents search, querying database');
        agents = await storage.searchAgents(queryString);
        // Cache agents for 10 minutes for faster tab switching
        cache.set(agentsCacheKey, agents, 600);
      } else {
        console.log('Cache hit for agents search');
      }
      
      console.log('Search agents results:', agents.length);
      res.json(agents);
    } catch (error) {
      console.error('Error searching agents:', error);
      res.status(500).json({ message: "Failed to search agents" });
    }
  });

  app.get("/api/search/buy", async (req, res) => {
    try {
      // Añadimos el filtro de tipo de operación (venta)
      const filters: Record<string, any> = { ...req.query, operationType: 'Venta' };

      // Usamos las funciones de neighborhoods importadas al principio del archivo

      // Verificar si hay filtro de barrios
      const hasNeighborhoods = 'neighborhoods' in filters && 
                               filters.neighborhoods && 
                               typeof filters.neighborhoods === 'string' && 
                               filters.neighborhoods.trim() !== '';

      if (hasNeighborhoods && typeof filters.neighborhoods === 'string') {
        const searchTerm = filters.neighborhoods;
        console.log(`Processing hierarchical search for: ${searchTerm}`);

        // Parse the hierarchical format ("Neighborhood, District, City")
        const parsed = parseNeighborhoodDisplayName(searchTerm);
        
        if (parsed) {
          console.log(`Parsed location: ${JSON.stringify(parsed)}`);
          
          // Add hierarchical filters
          filters.city = parsed.city;
          if (parsed.district) {
            filters.district = parsed.district;
          }
          filters.neighborhood = parsed.neighborhood;
          
          // Remove the original neighborhoods filter
          delete filters.neighborhoods;
        } else {
          // Fallback: treat as a simple neighborhood name (for backward compatibility)
          console.log(`Could not parse hierarchical format, treating as simple neighborhood: ${searchTerm}`);
          filters.neighborhood = searchTerm;
          filters.city = 'Barcelona'; // Default fallback
          delete filters.neighborhoods;
        }
      }

      const properties = await storage.searchProperties(filters);
      res.json(properties);
    } catch (error) {
      console.error('Error searching properties for buying:', error);
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get("/api/search/rent", async (req, res) => {
    try {
      // Si es carga inicial, devolver lista vacía 
      // (el usuario debe seleccionar al menos un barrio para ver resultados)
      if (req.query.initialLoad === 'true') {
        return res.json([]);
      }

      // Añadimos el filtro de tipo de operación (alquiler)
      const filters: Record<string, any> = { ...req.query, operationType: 'Alquiler' };
      // Eliminamos el parámetro initialLoad si existe
      if ('initialLoad' in filters) {
        delete filters.initialLoad;
      }

      // Usamos las funciones de neighborhoods importadas al principio del archivo

      // Verificar si hay filtro de barrios
      const hasNeighborhoods = 'neighborhoods' in filters && 
                               filters.neighborhoods && 
                               typeof filters.neighborhoods === 'string' && 
                               filters.neighborhoods.trim() !== '';

      if (hasNeighborhoods && typeof filters.neighborhoods === 'string') {
        const searchTerm = filters.neighborhoods;
        console.log(`Processing hierarchical search for: ${searchTerm}`);

        // Parse the hierarchical format ("Neighborhood, District, City")
        const parsed = parseNeighborhoodDisplayName(searchTerm);
        
        if (parsed) {
          console.log(`Parsed location: ${JSON.stringify(parsed)}`);
          
          // Add hierarchical filters
          filters.city = parsed.city;
          if (parsed.district) {
            filters.district = parsed.district;
          }
          filters.neighborhood = parsed.neighborhood;
          
          // Remove the original neighborhoods filter
          delete filters.neighborhoods;
        } else {
          // Fallback: treat as a simple neighborhood name (for backward compatibility)
          console.log(`Could not parse hierarchical format, treating as simple neighborhood: ${searchTerm}`);
          filters.neighborhood = searchTerm;
          filters.city = 'Barcelona'; // Default fallback
          delete filters.neighborhoods;
        }

        const properties = await storage.searchProperties(filters);
        res.json(properties);
      } 
      // Si no hay barrios seleccionados, devolver array vacío
      else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error searching properties for renting:', error);
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.post("/api/agent-reviews", async (req, res) => {
    try {
      const review = await storage.createAgentReview(req.body);
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating agent review:', error);
      res.status(400).json({ message: "Invalid review data" });
    }
  });

  // Nuevas rutas para obtener detalles de agentes y agencias
  app.get("/api/agents/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);
      
      let agent;
      if (isNaN(id)) {
        agent = await storage.getAgentBySlug(identifier);
      } else {
        agent = await storage.getAgentById(id);
      }
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      res.json(agent);
    } catch (error) {
      console.error('Error getting agent details:', error);
      res.status(500).json({ message: "Failed to get agent details" });
    }
  });

  // Obtener propiedades por agente
  app.get("/api/agents/:identifier/properties", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agentId;
      if (isNaN(id)) {
        // It's a slug, lookup the agent first to get the ID
        const agent = await storage.getAgentBySlug(identifier);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
        agentId = agent.id;
      } else {
        agentId = id;
      }

      console.log(`Fetching properties for agent ID: ${agentId} from route handler`);
      const properties = await storage.getPropertiesByAgent(agentId);
      console.log(`Returning ${properties.length} properties for agent ID: ${agentId}`);
      res.json(properties);
    } catch (error) {
      console.error('Error getting agent properties:', error);
      res.status(500).json({ message: "Failed to get agent properties" });
    }
  });

  app.get("/api/agencies/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);
      
      let agency;
      if (isNaN(id)) {
        agency = await storage.getAgencyBySlug(identifier);
      } else {
        agency = await storage.getAgencyById(id);
      }
      
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      res.json(agency);
    } catch (error) {
      console.error('Error getting agency details:', error);
      res.status(500).json({ message: "Failed to get agency details" });
    }
  });

  // Obtener propiedades por agencia
  app.get("/api/agencies/:identifier/properties", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agencyId;
      if (isNaN(id)) {
        // It's a slug, lookup the agency first to get the ID
        const agency = await storage.getAgencyBySlug(identifier);
        if (!agency) {
          return res.status(404).json({ message: "Agency not found" });
        }
        agencyId = agency.id;
      } else {
        agencyId = id;
      }

      const properties = await storage.getPropertiesByAgency(agencyId);
      res.json(properties);
    } catch (error) {
      console.error('Error getting agency properties:', error);
      res.status(500).json({ message: "Failed to get agency properties" });
    }
  });

  // User profile update
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      
      // Determine user role and admin status (consistent with login/register endpoints)
      const isClient = false; // Users in agents table are not clients
      let isAdmin = false;
      let agencyId = null;
      let agencyName = null;
      let subscriptionPlan = null;
      
      // Check if user is an admin of an agency
      const agentRole = await storage.getAgentRole(updatedUser.id);
      isAdmin = agentRole.role === 'admin';
      agencyId = agentRole.agencyId;
      
      // Get agency details if agent belongs to one
      if (agencyId) {
        const agency = await storage.getAgencyById(agencyId);
        if (agency) {
          agencyName = agency.agencyName;
          subscriptionPlan = agency.subscriptionPlan;
        }
      }
      
      // If user is not part of an agency but is an independent agent, use their own subscription
      if (!agencyId && updatedUser.agentType === 'independent') {
        subscriptionPlan = updatedUser.subscriptionPlan;
      }
      
      // Update session to keep it synchronized with database
      if (req.session.user && req.session.user.id === updatedUser.id) {
        req.session.user = {
          ...req.session.user,
          name: updatedUser.name,
          isAdmin,
          isClient,
          agencyId,
          agencyName,
          subscriptionPlan,
          agentUuid: updatedUser.uuid
        };
        
        // Save session to ensure persistence
        await new Promise((resolve, reject) => {
          (req as any).session.save((err: any) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
      }
      
      // Return user data with consistent structure (matching login/register endpoints)
      const { password: _, ...userResponse } = updatedUser;
      res.json({
        ...userResponse,
        isAdmin,
        isClient,
        agencyId,
        agencyName,
        subscriptionPlan,
        agentUuid: updatedUser.uuid
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Agency Agents routes
  app.get("/api/agency-agents/:agencyId", async (req, res) => {
    try {
      const agencyId = parseInt(req.params.agencyId);
      const agents = await storage.getAgencyAgents(agencyId);
      res.json(agents);
    } catch (error) {
      console.error('Error fetching agency agents:', error);
      res.status(500).json({ message: "Failed to fetch agency agents" });
    }
  });

  app.post("/api/agency-agents", async (req, res) => {
    try {
      const agentData = insertAgencyAgentSchema.parse(req.body);
      const result = await storage.createAgencyAgent(agentData);

      // Simulamos envío de correo (en un entorno real usaríamos un servicio de email)
      console.log(`
-----------------------------------
ENVIANDO EMAIL DE INVITACIÓN:
Para: ${agentData.agentEmail}
Asunto: Bienvenido a Realista - Tu perfil ha sido añadido

Contenido:
Hola ${agentData.agentName},

Un agente de tu agencia ha añadido tu perfil a Realista. 
Sigue el siguiente link para acceder a tu cuenta:
[Botón con link a la agencia]

Gracias!
-----------------------------------
`);

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating agency agent:', error);
      res.status(400).json({ message: "Invalid agent data" });
    }
  });

  app.delete("/api/agency-agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAgencyAgent(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting agency agent:', error);
      res.status(500).json({ message: "Failed to delete agency agent" });
    }
  });

  // Appointments routes
  app.get("/api/appointments/client/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const appointments = await storage.getAppointmentsByClient(clientId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching client appointments:', error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/agent/:agentId", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const appointments = await storage.getAppointmentsByAgent(agentId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching agent appointments:', error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      console.log('Attempting to create appointment with data:', req.body);

      // Primero preparamos los datos para asegurarnos de que la fecha es un objeto Date
      const data = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : null
      };

      console.log('Parsed appointment data:', data);

      // Validamos con el esquema
      const appointment = insertAppointmentSchema.parse(data);
      const result = await storage.createAppointment(appointment);
      console.log('Appointment created successfully:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(400).json({ message: "Invalid appointment data" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Preparamos los datos con el formato correcto de fecha
      const appointmentData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      };

      console.log('Updating appointment with data:', appointmentData);
      const updatedAppointment = await storage.updateAppointment(id, appointmentData);
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Rutas para consultas de propiedades (Inquiries)
  app.get("/api/inquiries/agent/:agentId", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const inquiries = await storage.getInquiriesByAgent(agentId);
      res.json(inquiries);
    } catch (error) {
      console.error('Error getting inquiries:', error);
      res.status(500).json({ message: "Error al obtener consultas" });
    }
  });

  app.get("/api/inquiries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inquiry = await storage.getInquiryById(id);

      if (!inquiry) {
        return res.status(404).json({ message: "Consulta no encontrada" });
      }

      res.json(inquiry);
    } catch (error) {
      console.error('Error getting inquiry:', error);
      res.status(500).json({ message: "Error al obtener la consulta" });
    }
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      // Datos de la consulta con fecha actual
      const inquiryData = {
        ...req.body,
        status: req.body.status || "pendiente", // Estado por defecto
        createdAt: new Date()
      };

      console.log('Creating inquiry with data:', inquiryData);
      
      // Auto-create client if they don't exist (for property inquiries, chats, etc.)
      const { name, email, phone, agentId } = inquiryData;
      if (email && agentId) {
        try {
          // Check if client already exists by email
          const existingClient = await storage.getClientByEmail(email);
          
          if (!existingClient) {
            // Create new client linked to the agent
            const clientData = {
              name: name || "Cliente",
              surname: "", // Will be populated if/when client registers
              email,
              phone: phone || "",
              status: "Nuevo",
              agentId: agentId,
              notes: "Cliente creado automáticamente desde consulta de propiedad",
              propertyInterest: null,
              budget: null,
              password: null,
              source: "property_inquiry",
            };
            const newClient = await storage.createClient(clientData);
            console.log('Auto-created client from inquiry:', newClient.id, newClient.email);
          } else if (!existingClient.agentId) {
            // Client exists but not assigned to an agent - assign to this agent
            await storage.updateClient(existingClient.id, {
              ...existingClient,
              agentId: agentId,
            });
            console.log('Linked existing client to agent:', existingClient.id, agentId);
          }
          // If client exists and already has an agent, we don't change their assignment
        } catch (clientError) {
          // Log but don't fail the inquiry creation
          console.error('Error auto-creating client:', clientError);
        }
      }
      
      const newInquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(newInquiry);
    } catch (error) {
      console.error('Error creating inquiry:', error);
      res.status(500).json({ message: "Error al crear la consulta" });
    }
  });

  app.patch("/api/inquiries/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "El estado es requerido" });
      }

      const updatedInquiry = await storage.updateInquiryStatus(id, status);
      res.json(updatedInquiry);
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      res.status(500).json({ message: "Error al actualizar el estado de la consulta" });
    }
  });

  app.get("/api/agents/:identifier/reviews", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agentId;
      if (isNaN(id)) {
        // It's a slug, lookup the agent first to get the ID
        const agent = await storage.getAgentBySlug(identifier);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
        agentId = agent.id;
      } else {
        agentId = id;
      }

      const reviews = await storage.getAgentReviews(agentId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error getting agent reviews:', error);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.get("/api/agencies/:identifier/reviews", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agencyId;
      if (isNaN(id)) {
        // It's a slug, lookup the agency first to get the ID
        const agency = await storage.getAgencyBySlug(identifier);
        if (!agency) {
          return res.status(404).json({ message: "Agency not found" });
        }
        agencyId = agency.id;
      } else {
        agencyId = id;
      }

      const reviews = await storage.getAgencyReviews(agencyId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error getting agency reviews:', error);
      res.status(500).json({ message: "Failed to get agency reviews" });
    }
  });

  // Ruta para enviar mensaje de contacto a un agente
  app.post("/api/agents/:identifier/contact", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agent;
      if (isNaN(id)) {
        // It's a slug, lookup the agent
        agent = await storage.getAgentBySlug(identifier);
      } else {
        agent = await storage.getAgentById(id);
      }

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const { name, phone, email, message } = req.body;

      // Validar campos requeridos
      if (!name || !phone || !email || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Auto-create client if they don't exist
      try {
        const existingClient = await storage.getClientByEmail(email);
        if (!existingClient) {
          const clientData = {
            name: name || "Cliente",
            surname: "",
            email,
            phone: phone || "",
            status: "Nuevo",
            agentId: agent.id,
            notes: "Cliente creado automáticamente desde contacto directo con agente",
            propertyInterest: null,
            budget: null,
            password: null,
            source: "agent_contact",
          };
          const newClient = await storage.createClient(clientData);
          console.log('Auto-created client from agent contact:', newClient.id, newClient.email);
        } else if (!existingClient.agentId) {
          await storage.updateClient(existingClient.id, {
            ...existingClient,
            agentId: agent.id,
          });
          console.log('Linked existing client to agent:', existingClient.id, agent.id);
        }
      } catch (clientError) {
        console.error('Error auto-creating client from agent contact:', clientError);
      }

      // Enviar email al agente
      const agentName = `${agent.name || ''} ${agent.surname || ''}`.trim() || 'Agente';
      const emailSent = await sendAgentContactEmail(
        agent.email,
        agentName,
        { name, phone, email, message }
      );

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send email" });
      }

      res.status(200).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error('Error sending agent contact:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Ruta para enviar mensaje de contacto a una agencia (el owner recibe el email)
  app.post("/api/agencies/:identifier/contact", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agencyBasic;
      if (isNaN(id)) {
        // It's a slug, lookup the agency first to get the ID
        agencyBasic = await storage.getAgencyBySlug(identifier);
      } else {
        agencyBasic = await storage.getAgencyById(id);
      }

      if (!agencyBasic) {
        return res.status(404).json({ message: "Agency not found" });
      }

      // Get full agency details with adminAgentId
      const agency = await storage.getAgency(agencyBasic.id);
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const { name, phone, email, message } = req.body;

      // Validar campos requeridos
      if (!name || !phone || !email || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Obtener el owner de la agencia (admin agent)
      if (!agency.adminAgentId) {
        return res.status(404).json({ message: "Agency owner not found" });
      }

      const owner = await storage.getAgentById(agency.adminAgentId);
      if (!owner) {
        return res.status(404).json({ message: "Agency owner not found" });
      }

      // Auto-create client assigned to agency admin (owner)
      try {
        const existingClient = await storage.getClientByEmail(email);
        if (!existingClient) {
          const clientData = {
            name: name || "Cliente",
            surname: "",
            email,
            phone: phone || "",
            status: "Nuevo",
            agentId: owner.id, // Assign to agency admin
            notes: `Cliente creado automáticamente desde contacto con agencia ${agency.agencyName}`,
            propertyInterest: null,
            budget: null,
            password: null,
            source: "agency_contact",
          };
          const newClient = await storage.createClient(clientData);
          console.log('Auto-created client from agency contact:', newClient.id, newClient.email, 'assigned to admin:', owner.id);
        } else if (!existingClient.agentId) {
          await storage.updateClient(existingClient.id, {
            ...existingClient,
            agentId: owner.id,
          });
          console.log('Linked existing client to agency admin:', existingClient.id, owner.id);
        }
      } catch (clientError) {
        console.error('Error auto-creating client from agency contact:', clientError);
      }

      // Enviar email al owner de la agencia
      const ownerName = `${owner.name || ''} ${owner.surname || ''}`.trim() || 'Propietario';
      const emailSent = await sendAgencyContactEmail(
        owner.email,
        ownerName,
        agency.agencyName,
        { name, phone, email, message }
      );

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send email" });
      }

      res.status(200).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error('Error sending agency contact:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Endpoint para solicitar reseña a un cliente
  app.post("/api/agents/:identifier/review-request", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agent;
      if (isNaN(id)) {
        agent = await storage.getAgentBySlug(identifier);
      } else {
        agent = await storage.getAgentById(id);
      }

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const { clientEmail, clientName } = req.body;

      if (!clientEmail) {
        return res.status(400).json({ message: "Email del cliente es requerido" });
      }

      const agentName = `${agent.name || ''} ${agent.surname || ''}`.trim() || 'Tu agente';
      
      // Get agent's agency info
      const agentRole = await storage.getAgentRole(agent.id);
      let agencyName = 'la agencia';
      let agencySlug = '';
      if (agentRole.agencyId) {
        const agency = await storage.getAgencyById(agentRole.agencyId);
        if (agency) {
          agencyName = agency.agencyName;
          agencySlug = agency.slug || agency.uuid;
        }
      }
      
      // Build profile URLs
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://realista.homes';
      const agentProfileUrl = `${baseUrl}/agentes/${agent.slug || agent.uuid}`;
      const agencyProfileUrl = agencySlug ? `${baseUrl}/agencias/${agencySlug}` : baseUrl;

      // Enviar email de solicitud de reseña
      const emailSent = await sendReviewRequest(
        clientEmail, 
        clientName || 'Cliente', 
        agentName,
        agencyName,
        agentProfileUrl,
        agencyProfileUrl
      );

      if (!emailSent) {
        return res.status(500).json({ message: "Error al enviar la solicitud de reseña" });
      }

      const { clientId } = req.body;
      if (clientId) {
        await storage.updateClientProfile(clientId, { reviewRequestSentAt: new Date() });
      }

      res.status(200).json({ success: true, message: "Solicitud de reseña enviada correctamente" });
    } catch (error) {
      console.error('Error sending review request:', error);
      res.status(500).json({ message: "Error al enviar la solicitud de reseña" });
    }
  });

  app.post("/api/agents/:identifier/reviews", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agent;
      if (isNaN(id)) {
        agent = await storage.getAgentBySlug(identifier);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
      } else {
        agent = await storage.getAgentById(id);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
      }

      const confirmationToken = randomUUID();
      const reviewerEmail = req.body.email;
      const reviewerName = req.body.author || '';

      const review = await storage.createAgentReview({
        ...req.body,
        targetId: agent.id,
        targetType: "agent",
        confirmed: false,
        confirmationToken,
        reviewerEmail,
        date: new Date()
      });

      const agentName = `${agent.name || ''} ${agent.surname || ''}`.trim() || 'Agente';
      await sendReviewConfirmationEmail(
        reviewerEmail,
        reviewerName,
        agentName,
        'agent',
        confirmationToken
      );

      res.status(201).json({ ...review, emailSent: true });
    } catch (error) {
      console.error('Error creating agent review:', error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.post("/api/agencies/:identifier/reviews", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      const id = parseInt(identifier);

      let agency;
      if (isNaN(id)) {
        agency = await storage.getAgencyBySlug(identifier);
        if (!agency) {
          return res.status(404).json({ message: "Agency not found" });
        }
      } else {
        agency = await storage.getAgencyById(id);
        if (!agency) {
          return res.status(404).json({ message: "Agency not found" });
        }
      }

      const confirmationToken = randomUUID();
      const reviewerEmail = req.body.email;
      const reviewerName = req.body.author || '';

      const review = await storage.createAgentReview({
        ...req.body,
        targetId: agency.id,
        targetType: "agency",
        confirmed: false,
        confirmationToken,
        reviewerEmail,
        date: new Date()
      });

      await sendReviewConfirmationEmail(
        reviewerEmail,
        reviewerName,
        agency.agencyName,
        'agency',
        confirmationToken
      );

      res.status(201).json({ ...review, emailSent: true });
    } catch (error) {
      console.error('Error creating agency review:', error);
      res.status(500).json({ message: "Failed to create agency review" });
    }
  });

  // Endpoint para confirmar reseñas vía token de email
  app.get("/api/reviews/confirm/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Token de confirmación requerido" });
      }

      const existingReview = await storage.getReviewByToken(token);
      
      if (!existingReview) {
        return res.status(404).json({ message: "Enlace de confirmación no válido o expirado" });
      }

      if (existingReview.confirmed) {
        return res.status(200).json({ 
          message: "Esta reseña ya ha sido confirmada", 
          alreadyConfirmed: true,
          review: existingReview 
        });
      }

      const confirmedReview = await storage.confirmReviewByToken(token);
      
      if (!confirmedReview) {
        return res.status(500).json({ message: "Error al confirmar la reseña" });
      }

      console.log(`Reseña ${confirmedReview.id} confirmada exitosamente`);
      res.status(200).json({ 
        message: "¡Tu reseña ha sido publicada exitosamente!", 
        confirmed: true,
        review: confirmedReview 
      });
    } catch (error) {
      console.error('Error confirming review:', error);
      res.status(500).json({ message: "Error al confirmar la reseña" });
    }
  });

  // Ruta para obtener las reseñas que un usuario debe gestionar (tanto como agente como sus agencias)
  app.get("/api/reviews/manage", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }

      // Obtener información del usuario
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Obtener reseñas del agente
      const agentReviews = await storage.getAgentReviews(userId);

      let agencyReviews: any[] = [];
      let managedAgencies: any[] = [];

      // Si el usuario es administrador, obtener también las reseñas de sus agencias
      if (user.isAdmin) {
        managedAgencies = await storage.getAgenciesByAdmin(userId);

        // Para cada agencia, obtener sus reseñas
        const agencyReviewsPromises = managedAgencies.map(agency => 
          storage.getAgencyReviews(agency.id)
        );

        const agencyReviewsResults = await Promise.all(agencyReviewsPromises);
        agencyReviews = agencyReviewsResults.flat();
      }

      // Enriquecer las reseñas con información adicional
      const allReviews = [...agentReviews, ...agencyReviews];

      const enhancedReviewsPromises = allReviews.map(async (review) => {
        // Dependiendo del tipo de objetivo, obtener información adicional
        let targetName = '';
        let targetAvatar = '';

        if (review.targetType === 'agent') {
          const agent = await storage.getUser(review.targetId);
          if (agent) {
            targetName = `${agent.name || ''} ${agent.surname || ''}`.trim();
            targetAvatar = agent.avatar || '';
          }
        } else if (review.targetType === 'agency') {
          const agency = await storage.getAgencyById(review.targetId);
          if (agency) {
            targetName = agency.agencyName || '';
            targetAvatar = agency.agencyLogo || '';
          }
        }

        // Si hay una propiedad relacionada, obtener su información
        let propertyTitle = '';
        let propertyAddress = '';

        if (review.propertyId) {
          const property = await storage.getProperty(review.propertyId);
          if (property) {
            propertyTitle = property.title || '';
            propertyAddress = property.address || '';
          }
        }

        return {
          ...review,
          targetName,
          targetAvatar,
          propertyTitle,
          propertyAddress
        };
      });

      const enhancedReviews = await Promise.all(enhancedReviewsPromises);

      // Ordenar reseñas por fecha (más recientes primero)
      const sortedReviews = enhancedReviews.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      res.json(sortedReviews);
    } catch (error) {
      console.error('Error obteniendo reseñas para gestionar:', error);
      res.status(500).json({ message: "Error al obtener las reseñas" });
    }
  });

  // Ruta para responder a una reseña
  app.post("/api/reviews/:id/respond", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { response } = req.body;

      if (!response || typeof response !== 'string') {
        return res.status(400).json({ message: "La respuesta no puede estar vacía" });
      }

      // Actualizar la reseña con la respuesta
      const updatedReview = await storage.respondToReview(reviewId, response);

      res.json(updatedReview);
    } catch (error) {
      console.error('Error respondiendo a la reseña:', error);
      res.status(500).json({ message: "Error al guardar la respuesta" });
    }
  });

  // Ruta para destacar/quitar destaque de una reseña
  app.post("/api/reviews/:id/pin", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { pinned } = req.body;

      if (typeof pinned !== 'boolean') {
        return res.status(400).json({ message: "El campo 'pinned' debe ser un booleano" });
      }

      // Actualizar la reseña con el estado de destacado
      const updatedReview = await storage.pinReview(reviewId, pinned);

      res.json(updatedReview);
    } catch (error) {
      console.error('Error actualizando el estado de la reseña:', error);
      res.status(500).json({ message: "Error al actualizar el estado de la reseña" });
    }
  });

  // API para agencias múltiples
  app.get("/api/admin/agencies", async (req, res) => {
    try {
      const adminAgentId = req.query.adminAgentId ? parseInt(req.query.adminAgentId as string) : undefined;

      if (!adminAgentId) {
        return res.status(400).json({ message: "Missing adminAgentId parameter" });
      }

      const agencies = await storage.getAgenciesByAdmin(adminAgentId);
      res.json(agencies);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      res.status(500).json({ message: "Failed to fetch agencies" });
    }
  });

  app.post("/api/admin/agencies", async (req, res) => {
    try {
      console.log('Creating agency with data:', req.body);
      const agencyData = {
        ...req.body,
        adminAgentId: parseInt(req.body.adminAgentId),
      };
      const result = await storage.createAgency(agencyData);
      console.log('Agency created successfully:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating agency:', error);
      res.status(400).json({ message: "Invalid agency data" });
    }
  });

  app.patch("/api/admin/agencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Updating agency ${id} with data:`, req.body);
      const result = await storage.updateAgency(id, req.body);
      console.log('Agency updated successfully:', result);
      res.json(result);
    } catch (error) {
      console.error('Error updating agency:', error);
      res.status(500).json({ message: "Failed to update agency" });
    }
  });

  app.delete("/api/admin/agencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Deleting agency ${id}`);
      await storage.deleteAgency(id);
      res.status(200).json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error('Error deleting agency:', error);
      res.status(500).json({ message: "Failed to delete agency" });
    }
  });

  // Rutas para gestión multi-agencia desde el frontend
  app.get("/api/agencies", requireAuth, authorize({ allowAdmin: true }), async (req, res) => {
    try {
      const adminAgentId = req.query.adminAgentId ? parseInt(req.query.adminAgentId as string) : req.user!.id;

      // Security: Only allow fetching own agencies unless admin
      if (adminAgentId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "No autorizado para ver estas agencias" });
      }

      const agencies = await storage.getAgenciesByAdmin(adminAgentId);
      console.log(`Retrieved ${agencies.length} agencies for admin ${adminAgentId}`);
      res.json(agencies);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      res.status(500).json({ message: "Failed to fetch agencies" });
    }
  });

  app.post("/api/agencies", requireAuth, authorize({ allowAdmin: true }), async (req, res) => {
    try {
      console.log('Creating agency with data:', req.body);

      // Security: Force adminAgentId to be the current user
      const agencyData = {
        ...req.body,
        adminAgentId: req.user!.id
      };

      const result = await storage.createAgency(agencyData);
      console.log('Agency created successfully:', result);
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating agency:', error);
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid agency data" 
      });
    }
  });

  app.patch("/api/agencies/:id", 
    requireAuth,
    authorize({
      custom: async (user, req) => {
        const agencyId = parseInt(req.params.id);
        const agency = await storage.getAgency(agencyId);
        return agency !== undefined && isAgencyAdmin(user, agencyId);
      }
    }),
    async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Updating agency ${id} with data:`, req.body);
      const result = await storage.updateAgency(id, req.body);
      console.log('Agency updated successfully:', result);
      res.json(result);
    } catch (error) {
      console.error('Error updating agency:', error);
      res.status(500).json({ message: "Failed to update agency" });
    }
  });

  app.delete("/api/agencies/:id",
    requireAuth,
    authorize({
      custom: async (user, req) => {
        const agencyId = parseInt(req.params.id);
        const agency = await storage.getAgency(agencyId);
        return agency !== undefined && isAgencyAdmin(user, agencyId);
      }
    }),
    async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Deleting agency ${id}`);
      await storage.deleteAgency(id);
      res.status(200).json({ message: "Agency deleted successfully" });
    } catch (error) {
      console.error('Error deleting agency:', error);
      res.status(500).json({ message: "Failed to delete agency" });
    }
  });

  // Upgrade agency subscription plan via Stripe checkout
  // SECURITY: Plan upgrade only happens via Stripe webhook after successful payment
  app.patch("/api/agencies/:id/upgrade-plan", 
    requireAuth,
    authorize({
      custom: async (user, req) => {
        const agencyId = parseInt(req.params.id);
        const agency = await storage.getAgency(agencyId);
        return agency !== undefined && isAgencyAdmin(user, agencyId);
      }
    }),
    async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      const sessionUser = req.user as any;

      // Validate request body with Zod
      const upgradeSchema = z.object({
        plan: z.enum(['pequeña', 'mediana', 'lider']),
        isYearlyBilling: z.boolean().default(false)
      });

      const parseResult = upgradeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { plan, isYearlyBilling } = parseResult.data;

      // Get the agency
      const agency = await storage.getAgency(agencyId);
      if (!agency) {
        return res.status(404).json({ message: "Agencia no encontrada" });
      }

      // Prevent upgrading to same plan
      if (agency.subscriptionPlan === plan) {
        return res.status(400).json({ message: "Ya tienes este plan activo" });
      }

      const { stripeService } = await import("./stripeService");

      // Helper function to get base URL with reliable fallback
      const getBaseUrl = (): string => {
        const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
        if (replitDomain) return `https://${replitDomain}`;
        
        const forwardedHost = req.get('x-forwarded-host');
        if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
          return `https://${forwardedHost}`;
        }
        
        // Fallback for development: use request host with protocol
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        return `${protocol}://${host}`;
      };

      const baseUrl = getBaseUrl();

      // If agency already has an active Stripe subscription, redirect to Customer Portal
      if (agency.stripeSubscriptionId && agency.stripeCustomerId) {
        console.log(`Agency ${agencyId} has existing subscription, redirecting to Customer Portal`);
        
        const portalSession = await stripeService.createCustomerPortalSession(
          agency.stripeCustomerId,
          `${baseUrl}/gestionar/${sessionUser.uuid}/facturacion`
        );
        
        return res.json({ 
          checkoutUrl: portalSession.url,
          type: 'portal',
          message: 'Redirigiendo al portal de facturación para cambiar de plan'
        });
      }

      // Price IDs for Agency plans
      const AGENCY_PRICES: Record<string, { monthly: string; yearly: string }> = {
        'pequeña': {
          monthly: 'price_1SXWwjLUOluRoTfmCcc8t3Zi',
          yearly: 'price_1SXWwjLUOluRoTfmgw3QbEg3'
        },
        'mediana': {
          monthly: 'price_1SXWwjLUOluRoTfmpEjIb3YL',
          yearly: 'price_1SXWwjLUOluRoTfmoXkDt8Ft'
        },
        'lider': {
          monthly: 'price_1SXWwkLUOluRoTfmeva2XNzr',
          yearly: 'price_1SXWwkLUOluRoTfmnYJ35KxC'
        }
      };

      const planPrices = AGENCY_PRICES[plan];
      const priceId = isYearlyBilling ? planPrices.yearly : planPrices.monthly;

      // Create or get Stripe customer for the agency
      let customerId = agency.stripeCustomerId;
      
      if (!customerId) {
        // Get admin agent to use their email
        const adminAgent = await storage.getUser(agency.adminAgentId);
        if (!adminAgent) {
          return res.status(404).json({ message: "No se encontró el administrador de la agencia" });
        }
        
        const customer = await stripeService.createCustomer(
          adminAgent.email,
          agency.agencyName,
          'agency',
          agencyId
        );
        customerId = customer.id;
        
        // Save customer ID to agency
        await stripeService.updateCustomerId('agency', agencyId, customerId);
      }

      // Create Stripe checkout session (baseUrl already defined above)
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/gestionar/${sessionUser.uuid}/facturacion?payment=success&plan=${plan}`,
        `${baseUrl}/gestionar/${sessionUser.uuid}/facturacion?payment=cancelled`,
        'agency',
        agencyId,
        plan,
        isYearlyBilling ? 'yearly' : 'monthly'
      );

      console.log(`Stripe checkout session created for agency upgrade: ${agencyId} to ${plan}, priceId: ${priceId}`);
      
      res.json({ 
        checkoutUrl: session.url,
        type: 'checkout',
        message: 'Redirigiendo a Stripe para completar el pago'
      });
    } catch (error) {
      console.error('Error upgrading agency plan:', error);
      res.status(500).json({ message: "Error al mejorar el plan" });
    }
  });

  // API para gestionar agentes en agencias
  app.get("/api/agency-agents/:agencyId", async (req, res) => {
    try {
      const agencyId = parseInt(req.params.agencyId);
      console.log(`Getting agents for agency ${agencyId}`);
      const agents = await storage.getAgencyAgents(agencyId);
      res.json(agents);
    } catch (error) {
      console.error('Error fetching agency agents:', error);
      res.status(500).json({ message: "Failed to fetch agency agents" });
    }
  });

  app.post("/api/agency-agents", async (req, res) => {
    try {
      console.log('Creating agency agent with data:', req.body);

      // Validar los datos con el esquema
      const agentData = insertAgencyAgentSchema.parse(req.body);

      const result = await storage.createAgencyAgent(agentData);
      console.log('Agency agent created successfully:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating agency agent:', error);
      res.status(400).json({ message: "Invalid agency agent data" });
    }
  });

  app.delete("/api/agency-agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Deleting agency agent ${id}`);
      await storage.deleteAgencyAgent(id);
      res.status(200).json({ message: "Agency agent deleted successfully" });
    } catch (error) {
      console.error('Error deleting agency agent:', error);
      res.status(500).json({ message: "Failed to delete agency agent" });
    }
  });

  // API para solicitar reseñas
  app.post("/api/review-requests", async (req, res) => {
    try {
      const { clientId, agentId } = req.body;
      
      // Obtener datos del cliente y agente
      const client = await storage.getClient(clientId);
      const agent = await storage.getUser(agentId);
      
      if (!client || !agent) {
        return res.status(404).json({ message: "Cliente o agente no encontrado" });
      }
      
      const agentName = `${agent.name || ''} ${agent.surname || ''}`.trim() || 'Tu agente';
      
      // Get agent's agency info
      const agentRole = await storage.getAgentRole(agent.id);
      let agencyName = 'la agencia';
      let agencySlug = '';
      if (agentRole.agencyId) {
        const agency = await storage.getAgencyById(agentRole.agencyId);
        if (agency) {
          agencyName = agency.agencyName;
          agencySlug = agency.slug || agency.uuid;
        }
      }
      
      // Build profile URLs
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://realista.homes';
      const agentProfileUrl = `${baseUrl}/agentes/${agent.slug || agent.uuid}`;
      const agencyProfileUrl = agencySlug ? `${baseUrl}/agencias/${agencySlug}` : baseUrl;
      
      // Enviar email de solicitud de reseña
      const success = await sendReviewRequest(
        client.email, 
        client.name, 
        agentName,
        agencyName,
        agentProfileUrl,
        agencyProfileUrl
      );
      
      if (success) {
        console.log(`Solicitud de reseña enviada de ${agent.name} para ${client.name}`);
        res.json({ message: "Solicitud de reseña enviada exitosamente" });
      } else {
        res.status(500).json({ message: "Error al enviar la solicitud de reseña" });
      }
    } catch (error) {
      console.error('Error sending review request:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Conversational Messages API
  app.get("/api/conversations/agent/:agentId", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      
      // Get inquiries and transform them into conversations
      const inquiries = await storage.getInquiriesByAgent(agentId);
      
      // Transform inquiries into conversations format with actual message history
      const conversations = await Promise.all(inquiries.map(async inquiry => {
        // Get the full message history for this conversation
        const messageHistory = await storage.getConversationMessages(inquiry.id);
        
        // Try to find the actual client by email
        const actualClient = await storage.getClientByEmail(inquiry.email);
        
        let messages = [];
        
        if (messageHistory.length > 0) {
          // Use the persisted message history
          messages = messageHistory.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderType: msg.senderType,
            content: msg.content,
            timestamp: msg.createdAt,
            isRead: true,
            status: msg.status || 'sent'
          }));
        } else {
          // If no persisted messages, create the initial message from the inquiry
          const clientId = actualClient?.id || inquiry.id;
          messages = [{
            id: 1,
            senderId: clientId,
            senderName: inquiry.name,
            senderType: 'client',
            content: inquiry.message || `Consulta sobre la propiedad en ${inquiry.property?.address || 'esta dirección'}.`,
            timestamp: inquiry.createdAt,
            isRead: true,
            status: 'sent'
          }];
        }

        // Get the last message for display
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        // Use actual client ID if found, otherwise fall back to inquiry ID
        const clientId = actualClient?.id || null;
        const clientName = actualClient ? `${actualClient.name} ${actualClient.surname || ''}`.trim() : inquiry.name;
        
        return {
          id: inquiry.id,
          clientId: clientId, // Using actual client ID from clients table
          clientName: clientName,
          clientEmail: inquiry.email,
          clientPhone: inquiry.phone,
          propertyId: inquiry.propertyId,
          propertyTitle: inquiry.property?.title || "Sin título",
          propertyAddress: inquiry.property?.address || "Dirección no disponible",
          lastMessage: lastMessage ? lastMessage.content : inquiry.message,
          lastMessageTime: lastMessage ? lastMessage.timestamp : inquiry.createdAt,
          unreadCount: inquiry.status === 'pendiente' ? 1 : 0,
          status: inquiry.status === 'finalizado' ? 'closed' : 'active',
          messages: messages
        };
      }));
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: "Error al cargar conversaciones" });
    }
  });

  app.get("/api/conversations/client/:clientEmail", async (req, res) => {
    try {
      const clientEmail = req.params.clientEmail;
      
      // Get inquiries sent by this client and transform them into conversations
      const inquiries = await storage.getInquiriesByClient(clientEmail);
      
      // Transform inquiries into conversations format from client perspective with actual message history
      const conversations = await Promise.all(inquiries.map(async inquiry => {
        // Get the full message history for this conversation
        const messageHistory = await storage.getConversationMessages(inquiry.id);
        
        let messages = [];
        
        if (messageHistory.length > 0) {
          // Use the persisted message history
          messages = messageHistory.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderType: msg.senderType,
            content: msg.content,
            timestamp: msg.createdAt,
            isRead: true,
            status: msg.status || 'sent'
          }));
        } else {
          // If no persisted messages, create the initial message from the inquiry
          messages = [{
            id: 1,
            senderId: inquiry.id,
            senderName: inquiry.name,
            senderType: 'client',
            content: inquiry.message || `Consulta sobre la propiedad en ${inquiry.property?.address || 'esta dirección'}.`,
            timestamp: inquiry.createdAt,
            isRead: true,
            status: 'sent'
          }];
        }

        // Get the last message for display
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          id: inquiry.id,
          agentId: inquiry.agentId,
          agentName: inquiry.agent?.name && inquiry.agent?.surname 
            ? `${inquiry.agent.name} ${inquiry.agent.surname}` 
            : "Agente",
          agentAvatar: inquiry.agent?.avatar,
          propertyId: inquiry.propertyId,
          propertyTitle: inquiry.property?.title || "Sin título",
          propertyAddress: inquiry.property?.address || "Dirección no disponible",
          lastMessage: lastMessage ? lastMessage.content : inquiry.message,
          lastMessageTime: lastMessage ? lastMessage.timestamp : inquiry.createdAt,
          status: inquiry.status,
          messages: messages
        };
      }));
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching client conversations:', error);
      res.status(500).json({ message: "Error al cargar conversaciones del cliente" });
    }
  });

  app.post("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const { content, senderType } = req.body;
      
      // Get the inquiry to extract sender information
      const inquiry = await storage.getInquiryById(conversationId);
      if (!inquiry) {
        return res.status(404).json({ message: "Conversación no encontrada" });
      }
      
      let senderId: number;
      let senderName: string;
      
      if (senderType === 'agent') {
        senderId = inquiry.agentId;
        const agent = await storage.getAgentById(inquiry.agentId);
        senderName = agent ? `${agent.name} ${agent.surname}`.trim() : 'Agente';
      } else {
        // For client messages, we'll use the inquiry ID as a temporary client ID
        senderId = conversationId;
        senderName = inquiry.name;
      }
      
      // Save the message to the database with 'delivered' status
      // (message reached the server, so it's delivered)
      const messageData = {
        inquiryId: conversationId,
        senderType,
        senderId,
        senderName,
        content,
        status: 'delivered' as const, // Message is delivered when it reaches the server
      };
      
      const savedMessage = await storage.createConversationMessage(messageData);
      
      // Update inquiry status to 'contactado' when agent sends first message
      if (senderType === 'agent') {
        try {
          await storage.updateInquiryStatus(conversationId, 'contactado');
        } catch (error) {
          console.error('Error updating inquiry status:', error);
        }
      }
      
      // Return the message in the expected format
      const responseMessage = {
        id: savedMessage.id,
        senderId: savedMessage.senderId,
        senderName: savedMessage.senderName,
        senderType: savedMessage.senderType,
        content: savedMessage.content,
        timestamp: savedMessage.createdAt,
        isRead: false,
        status: savedMessage.status || 'sent'
      };
      
      res.json(responseMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: "Error al enviar mensaje" });
    }
  });

  app.patch("/api/conversations/:conversationId/read", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const { readerType } = req.body; // 'client' or 'agent'
      
      // Mark inquiry as read (update status if needed)
      await storage.updateInquiryStatus(conversationId, 'contactado');
      
      // Mark messages from the opposite sender as 'read'
      if (readerType === 'client' || readerType === 'agent') {
        await storage.markMessagesAsRead(conversationId, readerType);
      }
      
      res.json({ message: "Conversación marcada como leída" });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ message: "Error al marcar como leída" });
    }
  });

  // Pin a conversation
  app.post("/api/conversations/:inquiryId/pin", async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.inquiryId);
      const { userType, userId, userEmail } = req.body;

      const pinnedConversation = await storage.pinConversation(
        userType,
        userId,
        userEmail,
        inquiryId
      );

      res.json(pinnedConversation);
    } catch (error) {
      console.error("Error pinning conversation:", error);
      if (error.message === "Cannot pin more than 3 conversations") {
        res.status(400).json({ error: "No puedes fijar más de 3 conversaciones" });
      } else {
        res.status(500).json({ error: "Error al fijar conversación" });
      }
    }
  });

  // Unpin a conversation
  app.delete("/api/conversations/:inquiryId/pin", async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.inquiryId);
      const { userType, userId, userEmail } = req.body;

      await storage.unpinConversation(userType, userId, userEmail, inquiryId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unpinning conversation:", error);
      res.status(500).json({ error: "Error al desfijar conversación" });
    }
  });

  // Get pinned conversations for a user
  app.get("/api/conversations/pinned", async (req, res) => {
    try {
      const { userType, userId, userEmail } = req.query;

      const pinnedInquiryIds = await storage.getPinnedConversations(
        userType as string,
        parseInt(userId as string),
        userEmail as string | null
      );

      res.json(pinnedInquiryIds);
    } catch (error) {
      console.error("Error getting pinned conversations:", error);
      res.status(500).json({ error: "Error al obtener conversaciones fijadas" });
    }
  });

  // Check if a conversation is pinned
  app.get("/api/conversations/:inquiryId/pin-status", async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.inquiryId);
      const { userType, userId, userEmail } = req.query;

      const isPinned = await storage.isConversationPinned(
        userType as string,
        parseInt(userId as string),
        userEmail as string | null,
        inquiryId
      );

      res.json({ isPinned });
    } catch (error) {
      console.error("Error checking pin status:", error);
      res.status(500).json({ error: "Error al verificar estado de fijado" });
    }
  });

  // AI Description Generation
  app.post("/api/generate-description", async (req, res) => {
    try {
      if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ 
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
      });

      const {
        propertyType,
        operationType,
        neighborhood,
        bedrooms,
        bathrooms,
        size,
        price,
        features
      } = req.body;

      // Improved prompt for GPT-4o-mini
      const prompt = `Escribe una descripción de máximo 400 caracteres para: ${propertyType} en ${operationType} en ${neighborhood}, ${bedrooms || 0} habitaciones, ${bathrooms || 0} baños, ${size || 0}m², ${price}€. Características: ${features && features.length > 0 ? features.join(', ') : 'ninguna'}. Usa español profesional y atractivo.`;

      console.log("Generating description with prompt:", prompt);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un agente inmobiliario. Escribe descripciones breves y atractivas en español."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
      });

      console.log("AI Response:", JSON.stringify(response, null, 2));

      let description = response.choices[0].message.content?.trim() || "";

      // If AI returns empty, create a fallback description
      if (!description || description.length === 0) {
        console.warn("AI returned empty description, using fallback");
        
        const featuresText = features && features.length > 0 
          ? ` Cuenta con ${features.slice(0, 3).join(', ')}.` 
          : '';
        
        description = `${propertyType} en ${operationType} ubicado en ${neighborhood}. ` +
          `Dispone de ${bedrooms || 0} habitaciones y ${bathrooms || 0} baños, con ${size || 0}m² de superficie.` +
          featuresText +
          ` Precio: ${price}€. ¡Ideal para su nuevo hogar!`;
      }

      // Ensure the description doesn't exceed 500 characters
      if (description.length > 500) {
        description = description.substring(0, 497) + "...";
      }

      console.log("Final description:", description);

      res.json({ description });
    } catch (error) {
      console.error("Error generating description:", error);
      res.status(500).json({ error: "Error al generar la descripción" });
    }
  });

  // Fix geocoding for existing properties
  app.post("/api/admin/fix-geocoding", async (req, res) => {
    try {
      console.log("Starting property geocoding fix...");
      await fixPropertyGeocodingData();
      res.json({ 
        success: true, 
        message: "Property geocoding fix completed successfully" 
      });
    } catch (error) {
      console.error("Error fixing property geocoding:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fix property geocoding", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Object Storage Routes for Property Images

  // Serve public property images
  app.get("/property-images/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(`property-images/${filePath}`);
      if (!file) {
        return res.status(404).json({ error: "Image not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving property image:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get upload URL for property images
  app.post("/api/property-images/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPropertyImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Direct upload for property images (avoids CORS issues) - Using multer
  app.post("/api/property-images/upload-direct", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Use multer parsed file data
      let fileBuffer = req.file.buffer;
      const originalFileName = req.file.originalname || `image_${Date.now()}.jpg`;
      let mimeType = req.file.mimetype;

      console.log(`Received image: ${originalFileName}, type: ${mimeType}, size: ${fileBuffer.length} bytes`);

      // Server-side compression as backup (ensures images are always under 1MB)
      const compressionResult = await compressImageToTarget(fileBuffer, mimeType);
      
      if (compressionResult.wasCompressed) {
        fileBuffer = compressionResult.buffer;
        mimeType = compressionResult.mimeType;
        console.log(`Image compressed server-side: ${originalFileName} -> ${fileBuffer.length} bytes (format: ${compressionResult.format})`);
      }

      // Generate new filename with correct extension based on final format
      const extensionMap: Record<string, string> = {
        'jpeg': '.jpg',
        'webp': '.webp',
        'gif': '.gif',
        'png': '.png',
        'original': originalFileName.substring(originalFileName.lastIndexOf('.'))
      };
      const extension = extensionMap[compressionResult.format] || originalFileName.substring(originalFileName.lastIndexOf('.'));
      const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || 'image';
      const fileName = `${baseName}_${Date.now()}${extension}`;

      console.log(`Uploading image: ${fileName}, type: ${mimeType}, size: ${fileBuffer.length} bytes`);

      // Upload directly to object storage
      const imageUrl = await objectStorageService.uploadPropertyImageDirect(fileBuffer, fileName, mimeType);
      
      console.log(`Image uploaded successfully: ${imageUrl}`);
      
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ error: "Failed to process upload" });
    }
  });

  // Update property with new image URL after upload
  app.put("/api/properties/:id/add-image", async (req, res) => {
    try {
      const propertyId = req.params.id;
      const { imageURL } = req.body;
      
      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      // Get current property
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Add the new image URL to the imageUrls array
      const currentImageUrls = property.imageUrls || [];
      const updatedImageUrls = [...currentImageUrls, imageURL];

      // Update property with new image URL
      const updatedProperty = await storage.updateProperty(propertyId, {
        ...property,
        imageUrls: updatedImageUrls,
      });

      res.json(updatedProperty);
    } catch (error) {
      console.error("Error adding image to property:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve property documents (requires authentication)
  app.get("/property-documents/:filePath(*)", requireAuth, async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(`property-documents/${filePath}`);
      if (!file) {
        return res.status(404).json({ error: "Document not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving property document:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Direct upload for property documents
  app.post("/api/property-documents/upload-direct", requireAuth, documentUpload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const objectStorageService = new ObjectStorageService();
      const fileBuffer = req.file.buffer;
      const originalFileName = req.file.originalname || `document_${Date.now()}`;
      const mimeType = req.file.mimetype;

      console.log(`Uploading document: ${originalFileName}, type: ${mimeType}, size: ${fileBuffer.length} bytes`);

      const fileUrl = await objectStorageService.uploadDocumentDirect(fileBuffer, originalFileName, mimeType);
      const fileSize = fileBuffer.length < 1024 * 1024
        ? `${(fileBuffer.length / 1024).toFixed(1)} KB`
        : `${(fileBuffer.length / (1024 * 1024)).toFixed(1)} MB`;

      console.log(`Document uploaded successfully: ${fileUrl}`);

      res.json({ fileUrl, fileName: originalFileName, fileSize });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // ===============================
  // STRIPE SUBSCRIPTION ROUTES
  // Reference: connection:conn_stripe_01KAYT26YTNSFF1S0A9Q4FE38R
  // ===============================

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe key" });
    }
  });

  // Get subscription products for agencies
  app.get("/api/stripe/products/agency", async (req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const products = await stripeService.listProductsWithPrices('agency');
      res.json({ products });
    } catch (error) {
      console.error("Error getting agency products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  // Get subscription products for independent agents
  app.get("/api/stripe/products/agent", async (req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const products = await stripeService.listProductsWithPrices('agent');
      res.json({ products });
    } catch (error) {
      console.error("Error getting agent products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  // Get subscription products for networks
  app.get("/api/stripe/products/network", async (req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const products = await stripeService.listProductsWithPrices('network');
      res.json({ products });
    } catch (error) {
      console.error("Error getting network products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  // Create checkout session for subscription
  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { priceId, entityType, entityId } = req.body;
      
      if (!priceId || !entityType || !entityId) {
        return res.status(400).json({ error: "priceId, entityType, and entityId are required" });
      }

      const { stripeService } = await import("./stripeService");

      // Get the entity (agency, agent, or network) to get email for customer
      let email: string;
      let name: string;
      
      if (entityType === 'agency') {
        const agency = await storage.getAgencyById(entityId);
        if (!agency) {
          return res.status(404).json({ error: "Agency not found" });
        }
        email = agency.agencyEmailToDisplay || '';
        name = agency.agencyName;
      } else if (entityType === 'network') {
        const network = await storage.getNetworkById(entityId);
        if (!network) {
          return res.status(404).json({ error: "Network not found" });
        }
        email = network.email || '';
        name = network.name;
      } else {
        const agent = await storage.getAgentById(entityId);
        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }
        email = agent.email;
        name = agent.name || agent.email;
      }

      // Check if customer already exists
      let customerId = await stripeService.getCustomerByEntity(entityType, entityId);
      
      if (!customerId) {
        // Create new customer in Stripe
        const customer = await stripeService.createCustomer(email, name, entityType, entityId);
        customerId = customer.id;
        
        // Save customer ID to our database
        await stripeService.updateCustomerId(entityType, entityId, customerId);
      }
      
      // Create checkout session
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/realista-pro?success=true`,
        `${baseUrl}/realista-pro?cancelled=true`,
        entityType,
        entityId
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Create customer portal session for managing subscription
  app.post("/api/stripe/portal", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ error: "customerId is required" });
      }

      const { stripeService } = await import("./stripeService");
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripeService.createCustomerPortalSession(
        customerId,
        `${baseUrl}/realista-pro`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // Get subscription status for an agency or agent
  app.get("/api/stripe/subscription/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      // Query subscriptions from stripe schema by metadata
      const result = await db.execute(
        sql`SELECT * FROM stripe.subscriptions 
            WHERE metadata->>'entityType' = ${entityType}
            AND metadata->>'entityId' = ${entityId}
            ORDER BY created DESC
            LIMIT 1`
      );
      
      if (result.rows.length === 0) {
        return res.json({ subscription: null });
      }
      
      res.json({ subscription: result.rows[0] });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Sync subscription status from Stripe to our database
  app.post("/api/stripe/sync-subscription", async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ error: "subscriptionId is required" });
      }

      const { stripeService } = await import("./stripeService");
      await stripeService.syncSubscriptionStatus(subscriptionId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error syncing subscription:", error);
      res.status(500).json({ error: "Failed to sync subscription" });
    }
  });

  // Create checkout session for plan upgrade (from billing tab dropdown)
  app.post("/api/stripe/checkout-plan", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId, planId, isYearly } = req.body;
      
      if (!entityType || !entityId || !planId) {
        return res.status(400).json({ error: "entityType, entityId, and planId are required" });
      }

      // Price mappings
      const AGENCY_PRICES: Record<string, { monthly: string; yearly: string }> = {
        'pequeña': {
          monthly: 'price_1SXWwjLUOluRoTfmCcc8t3Zi',
          yearly: 'price_1SXWwjLUOluRoTfmgw3QbEg3'
        },
        'mediana': {
          monthly: 'price_1SXWwkLUOluRoTfmEJilorxX',
          yearly: 'price_1SXWwkLUOluRoTfm27nDYDzB'
        },
        'lider': {
          monthly: 'price_1SXWwkLUOluRoTfmeva2XNzr',
          yearly: 'price_1SXWwkLUOluRoTfmrqNVpOwU'
        }
      };

      const AGENT_PRICES: Record<string, { monthly: string; yearly: string }> = {
        'lider': {
          monthly: 'price_1SXWwkLUOluRoTfmsG0VnAfx', // Agent Líder 20€/month
          yearly: 'price_1SXWwkLUOluRoTfmPpDrXNtN'   // Agent Líder 200€/year
        }
      };

      const priceMapping = entityType === 'agency' ? AGENCY_PRICES : AGENT_PRICES;
      const planPrices = priceMapping[planId];

      if (!planPrices) {
        return res.status(400).json({ error: `Invalid plan: ${planId}` });
      }

      const priceId = isYearly ? planPrices.yearly : planPrices.monthly;
      const { stripeService } = await import("./stripeService");

      // Get entity info for customer creation
      let email: string;
      let name: string;
      
      if (entityType === 'agency') {
        const agency = await storage.getAgency(entityId);
        if (!agency) {
          return res.status(404).json({ error: "Agency not found" });
        }
        const adminAgent = await storage.getAgentById(agency.adminAgentId);
        if (!adminAgent) {
          return res.status(404).json({ error: "Admin agent not found" });
        }
        email = adminAgent.email;
        name = agency.agencyName;
      } else {
        const agent = await storage.getAgentById(entityId);
        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }
        email = agent.email;
        name = `${agent.name} ${agent.surname}`;
      }

      // Get or create Stripe customer
      let customerId = await stripeService.getCustomerByEntity(entityType, entityId);
      
      if (!customerId) {
        const customer = await stripeService.createCustomer(email, name, entityType, entityId);
        customerId = customer.id;
        await stripeService.updateCustomerId(entityType, entityId, customerId);
      }
      
      // Build return URL
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      // Create checkout session with metadata for the intended plan
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/gestionar?success=true&plan=${encodeURIComponent(planId)}`,
        `${baseUrl}/gestionar?cancelled=true`,
        entityType,
        entityId
      );

      console.log('Created checkout session for plan change:', { entityType, entityId, planId, priceId });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session for plan:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Activate free tier for agency or agent (no Stripe payment needed)
  app.post("/api/stripe/activate-free-tier", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.body;
      
      if (!entityType || !entityId) {
        return res.status(400).json({ error: "entityType and entityId are required" });
      }

      const { stripeService } = await import("./stripeService");
      await stripeService.activateFreeTier(entityType, entityId);
      
      res.json({ success: true, plan: entityType === 'agency' ? 'basica' : 'basico' });
    } catch (error) {
      console.error("Error activating free tier:", error);
      res.status(500).json({ error: "Failed to activate free tier" });
    }
  });

  // Get billing info (current plan, customer ID, subscription) for entity
  app.get("/api/stripe/billing/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      let entity: any;
      if (entityType === 'agency') {
        entity = await storage.getAgencyById(parseInt(entityId));
      } else {
        entity = await storage.getAgentById(parseInt(entityId));
      }

      if (!entity) {
        return res.status(404).json({ error: "Entity not found" });
      }

      // Get subscription from stripe schema if exists
      let subscription = null;
      if (entity.stripeSubscriptionId) {
        const { stripeService } = await import("./stripeService");
        subscription = await stripeService.getSubscription(entity.stripeSubscriptionId);
      }

      res.json({
        currentPlan: entity.subscriptionPlan || (entityType === 'agency' ? 'basica' : 'basico'),
        isYearlyBilling: entity.isYearlyBilling || false,
        stripeCustomerId: entity.stripeCustomerId || null,
        stripeSubscriptionId: entity.stripeSubscriptionId || null,
        seatsLimit: entity.seatsLimit || (entityType === 'agency' ? 1 : undefined),
        activePropertiesLimit: entity.activePropertiesLimit || 5,
        subscriptionStartDate: entity.subscriptionStartDate || null,
        subscription,
      });
    } catch (error) {
      console.error("Error getting billing info:", error);
      res.status(500).json({ error: "Failed to get billing info" });
    }
  });

  // Get invoices for entity from Stripe
  app.get("/api/stripe/invoices/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      let entity: any;
      if (entityType === 'agency') {
        entity = await storage.getAgencyById(parseInt(entityId));
      } else {
        entity = await storage.getAgentById(parseInt(entityId));
      }

      if (!entity) {
        return res.status(404).json({ error: "Entity not found" });
      }

      if (!entity.stripeCustomerId) {
        return res.json([]);
      }

      const { stripeService } = await import("./stripeService");
      const invoices = await stripeService.getCustomerInvoices(entity.stripeCustomerId);
      
      res.json(invoices);
    } catch (error) {
      console.error("Error getting invoices:", error);
      res.status(500).json({ error: "Failed to get invoices" });
    }
  });

  // =============================================================================
  // NETWORK (FRANCHISE) MANAGEMENT ROUTES
  // =============================================================================

  // Get network by identifier (UUID or slug)
  app.get("/api/networks/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Try UUID first, then slug
      let network = await storage.getNetworkByUuid(identifier);
      if (!network) {
        network = await storage.getNetworkBySlug(identifier);
      }
      
      if (!network) {
        return res.status(404).json({ error: "Red no encontrada" });
      }
      
      // Remove sensitive data
      const { stripeCustomerId, stripeSubscriptionId, ...publicNetwork } = network;
      res.json(publicNetwork);
    } catch (error) {
      console.error("Error getting network:", error);
      res.status(500).json({ error: "Error al obtener la red" });
    }
  });

  // Get network stats
  app.get("/api/networks/:identifier/stats", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      let network = await storage.getNetworkByUuid(identifier);
      if (!network) {
        network = await storage.getNetworkBySlug(identifier);
      }
      
      if (!network) {
        return res.status(404).json({ error: "Red no encontrada" });
      }
      
      const stats = await storage.getNetworkStats(network.id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting network stats:", error);
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  });

  // Get agencies in network
  app.get("/api/networks/:identifier/agencies", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      let network = await storage.getNetworkByUuid(identifier);
      if (!network) {
        network = await storage.getNetworkBySlug(identifier);
      }
      
      if (!network) {
        return res.status(404).json({ error: "Red no encontrada" });
      }
      
      const networkAgencies = await storage.getAgenciesByNetwork(network.id);
      res.json(networkAgencies);
    } catch (error) {
      console.error("Error getting network agencies:", error);
      res.status(500).json({ error: "Error al obtener agencias" });
    }
  });

  // Get agents in network
  app.get("/api/networks/:identifier/agents", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      let network = await storage.getNetworkByUuid(identifier);
      if (!network) {
        network = await storage.getNetworkBySlug(identifier);
      }
      
      if (!network) {
        return res.status(404).json({ error: "Red no encontrada" });
      }
      
      const networkAgents = await storage.getAgentsByNetwork(network.id);
      
      // Remove sensitive data from agents
      const safeAgents = networkAgents.map(({ password, ...agent }) => agent);
      res.json(safeAgents);
    } catch (error) {
      console.error("Error getting network agents:", error);
      res.status(500).json({ error: "Error al obtener agentes" });
    }
  });

  // Update network (network admin only)
  app.patch("/api/networks/:id", requireAuth, async (req, res) => {
    try {
      const networkId = parseInt(req.params.id);
      const user = req.user;
      
      // Verify user is network admin with access to this network
      if (!user || user.agentType !== 'network_admin' || user.networkId !== networkId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }
      
      const updatedNetwork = await storage.updateNetwork(networkId, req.body);
      res.json(updatedNetwork);
    } catch (error) {
      console.error("Error updating network:", error);
      res.status(500).json({ error: "Error al actualizar la red" });
    }
  });

  // Attach agency to network (network admin only)
  app.post("/api/networks/:id/agencies/:agencyId", requireAuth, async (req, res) => {
    try {
      const networkId = parseInt(req.params.id);
      const agencyId = parseInt(req.params.agencyId);
      const user = req.user;
      
      // Verify user is network admin with access to this network
      if (!user || user.agentType !== 'network_admin' || user.networkId !== networkId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }
      
      // Verify agency exists
      const agency = await storage.getAgencyById(agencyId);
      if (!agency) {
        return res.status(404).json({ error: "Agencia no encontrada" });
      }
      
      // Check if agency already belongs to a network
      if (agency.networkId) {
        return res.status(400).json({ error: "Esta agencia ya pertenece a una red" });
      }
      
      const updatedAgency = await storage.attachAgencyToNetwork(agencyId, networkId);
      res.json(updatedAgency);
    } catch (error) {
      console.error("Error attaching agency to network:", error);
      res.status(500).json({ error: "Error al vincular la agencia" });
    }
  });

  // Detach agency from network (network admin only)
  app.delete("/api/networks/:id/agencies/:agencyId", requireAuth, async (req, res) => {
    try {
      const networkId = parseInt(req.params.id);
      const agencyId = parseInt(req.params.agencyId);
      const user = req.user;
      
      // Verify user is network admin with access to this network
      if (!user || user.agentType !== 'network_admin' || user.networkId !== networkId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }
      
      // Verify agency belongs to this network
      const agency = await storage.getAgencyById(agencyId);
      if (!agency || agency.networkId !== networkId) {
        return res.status(404).json({ error: "Agencia no encontrada en esta red" });
      }
      
      const updatedAgency = await storage.detachAgencyFromNetwork(agencyId);
      res.json(updatedAgency);
    } catch (error) {
      console.error("Error detaching agency from network:", error);
      res.status(500).json({ error: "Error al desvincular la agencia" });
    }
  });

  // Update agency plan (network admin only)
  app.patch("/api/networks/:id/agencies/:agencyId/plan", requireAuth, async (req, res) => {
    try {
      const networkId = parseInt(req.params.id);
      const agencyId = parseInt(req.params.agencyId);
      const { plan } = req.body;
      const user = req.user;
      
      // Validate plan
      const validPlans = ['basica', 'pequeña', 'mediana', 'lider'];
      if (!plan || !validPlans.includes(plan.toLowerCase())) {
        return res.status(400).json({ error: "Plan inválido" });
      }
      
      // Verify user is network admin with access to this network
      if (!user || user.agentType !== 'network_admin' || user.networkId !== networkId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }
      
      // Verify agency belongs to this network
      const agency = await storage.getAgencyById(agencyId);
      if (!agency || agency.networkId !== networkId) {
        return res.status(404).json({ error: "Agencia no encontrada en esta red" });
      }
      
      // Update agency plan
      const updatedAgency = await storage.updateAgencyPlan(agencyId, plan);
      res.json(updatedAgency);
    } catch (error) {
      console.error("Error updating agency plan:", error);
      res.status(500).json({ error: "Error al actualizar el plan de la agencia" });
    }
  });

  // Create new agency under network (network admin only)
  app.post("/api/network-admin/agencies", requireAuth, async (req, res) => {
    try {
      const sessionUser = req.user;
      
      if (!sessionUser || sessionUser.agentType !== 'network_admin' || !sessionUser.networkId) {
        return res.status(403).json({ error: "No eres administrador de red" });
      }
      
      // Fetch full user for networkId (session has it now)
      const networkId = sessionUser.networkId;
      
      const { name, city, plan } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "El nombre de la agencia es obligatorio" });
      }
      
      // Validate plan
      const validPlans = ['basica', 'pequeña', 'mediana', 'lider'];
      const normalizedPlan = (plan || 'basica').toLowerCase();
      if (!validPlans.includes(normalizedPlan)) {
        return res.status(400).json({ error: "Plan inválido" });
      }
      
      // Determine limits based on plan
      const planLimits: Record<string, { seats: number | null; properties: number | null }> = {
        'basica': { seats: 1, properties: 2 },
        'pequeña': { seats: 2, properties: 10 },
        'mediana': { seats: 6, properties: 30 },
        'lider': { seats: null, properties: null },
      };
      
      const limits = planLimits[normalizedPlan];
      
      // Generate a unique slug
      const baseSlug = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      while (await storage.getAgencyBySlug(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // Create the agency
      const newAgency = await storage.createAgency({
        agencyName: name.trim(),
        city: city?.trim() || null,
        slug,
        networkId: networkId,
        subscriptionPlan: normalizedPlan,
        seatsLimit: limits.seats,
        activePropertiesLimit: limits.properties,
      });
      
      res.status(201).json(newAgency);
    } catch (error) {
      console.error("Error creating agency:", error);
      res.status(500).json({ error: "Error al crear la agencia" });
    }
  });

  // Get network admin's network data (for dashboard)
  app.get("/api/network-admin/network", requireAuth, async (req, res) => {
    try {
      const sessionUser = req.user;
      
      if (!sessionUser || sessionUser.agentType !== 'network_admin' || !sessionUser.networkId) {
        return res.status(403).json({ error: "No eres administrador de red" });
      }
      
      const network = await storage.getNetworkById(sessionUser.networkId);
      if (!network) {
        return res.status(404).json({ error: "Red no encontrada" });
      }
      
      const stats = await storage.getNetworkStats(network.id);
      const networkAgencies = await storage.getAgenciesByNetwork(network.id);
      
      res.json({
        network,
        stats,
        agencies: networkAgencies
      });
    } catch (error) {
      console.error("Error getting network admin data:", error);
      res.status(500).json({ error: "Error al obtener datos de la red" });
    }
  });

  // Get network management data by networkId (combines network info, agencies, stats)
  app.get("/api/networks/:networkId/management", requireAuth, async (req, res) => {
    try {
      const networkId = parseInt(req.params.networkId);
      const user = req.user;
      
      // Verify user has access to this network
      if (!user || user.agentType !== 'network_admin' || user.networkId !== networkId) {
        console.log('Network management access denied:', { 
          userId: user?.id, 
          agentType: user?.agentType, 
          networkId: user?.networkId, 
          requestedNetworkId: networkId 
        });
        return res.status(403).json({ error: "Acceso denegado" });
      }
      
      const network = await storage.getNetworkById(networkId);
      if (!network) {
        return res.status(404).json({ error: "Red no encontrada" });
      }
      
      const stats = await storage.getNetworkStats(network.id);
      const agencies = await storage.getAgenciesByNetwork(network.id);
      
      // Add agent and property counts to each agency
      const agenciesWithCounts = await Promise.all(
        agencies.map(async (agency) => {
          const agentCount = await storage.getAgencyAgentCount(agency.id);
          const propertyCount = await storage.getAgencyPropertyCount(agency.id);
          return {
            ...agency,
            agentCount,
            propertyCount
          };
        })
      );
      
      // Transform stats to match frontend expectations
      res.json({
        ...network,
        agencies: agenciesWithCounts,
        stats: {
          totalAgencies: stats.agencies,
          totalAgents: stats.agents,
          totalProperties: stats.properties,
          totalClients: stats.totalClients
        }
      });
    } catch (error) {
      console.error("Error getting network management data:", error);
      res.status(500).json({ error: "Error al obtener datos de gestión de la red" });
    }
  });

  // Search for agencies not in any network (for adding to network)
  app.get("/api/networks/available-agencies/:query", requireAuth, async (req, res) => {
    try {
      const { query } = req.params;
      const user = req.user;
      
      // Only network admins can search for available agencies
      if (!user || user.agentType !== 'network_admin') {
        return res.status(403).json({ error: "Acceso denegado" });
      }
      
      // Search for agencies without a network
      const agencies = await storage.searchAgenciesWithoutNetwork(query);
      res.json(agencies);
    } catch (error) {
      console.error("Error searching available agencies:", error);
      res.status(500).json({ error: "Error al buscar agencias disponibles" });
    }
  });

  // ===== Property Management Routes =====

  // 1. Property Management Status
  app.patch("/api/properties/:uuid/management-status", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { status } = req.body;
      const validStatuses = ["Creada", "Activa", "Reservada", "Alquilada", "Inactiva", "Vendida", "En reforma"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Estado no válido" });
      }

      const property = await storage.getPropertyByUuid(uuid);
      if (!property) return res.status(404).json({ error: "Propiedad no encontrada" });

      const oldStatus = property.managementStatus;
      const updated = await storage.updatePropertyManagementStatus(uuid, status);

      await storage.createPropertyHistory({
        propertyUuid: uuid,
        eventType: "status_change",
        title: "Cambio de estado",
        description: `De "${oldStatus}" a "${status}"`,
        performedBy: req.user?.name || "Usuario Actual",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating management status:", error);
      res.status(500).json({ error: "Error al actualizar el estado" });
    }
  });

  // 2. Property Contracts CRUD
  app.get("/api/properties/:uuid/contracts", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const contracts = await storage.getPropertyContracts(uuid);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Error al obtener los contratos" });
    }
  });

  app.get("/api/properties/:uuid/contracts/active", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const contract = await storage.getActivePropertyContract(uuid);
      res.json(contract || null);
    } catch (error) {
      console.error("Error fetching active contract:", error);
      res.status(500).json({ error: "Error al obtener el contrato activo" });
    }
  });

  app.post("/api/properties/:uuid/contracts", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { tenantName, tenantEmail, tenantPhone, tenantId, duration, startDate, endDate, rentPrice, guarantee } = req.body;

      if (!tenantName || !duration || !startDate || !endDate || rentPrice === undefined) {
        return res.status(400).json({ error: "Faltan campos obligatorios: tenantName, duration, startDate, endDate, rentPrice" });
      }

      const contract = await storage.createPropertyContract({
        propertyUuid: uuid,
        tenantName,
        tenantEmail: tenantEmail || null,
        tenantPhone: tenantPhone || null,
        tenantId: tenantId || null,
        duration,
        startDate,
        endDate,
        rentPrice,
        guarantee: guarantee || null,
        isActive: true,
      });

      await storage.createPropertyHistory({
        propertyUuid: uuid,
        eventType: "contract",
        title: "Contrato de alquiler configurado",
        description: `Inquilino: ${tenantName}, Duración: ${duration}`,
        performedBy: req.user?.name || "Usuario Actual",
      });

      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Error al crear el contrato" });
    }
  });

  app.patch("/api/properties/:uuid/contracts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updatePropertyContract(parseInt(id), req.body);
      if (!updated) return res.status(404).json({ error: "Contrato no encontrado" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ error: "Error al actualizar el contrato" });
    }
  });

  // 3. Property Payments CRUD
  app.get("/api/properties/:uuid/payments", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const payments = await storage.getPropertyPayments(uuid);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Error al obtener los pagos" });
    }
  });

  app.post("/api/properties/:uuid/payments", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { concept, amount, status, addToHistory, paymentDate, contractId } = req.body;

      if (!concept || amount === undefined || !status) {
        return res.status(400).json({ error: "Faltan campos obligatorios: concept, amount, status" });
      }

      const payment = await storage.createPropertyPayment({
        propertyUuid: uuid,
        concept,
        amount,
        status,
        addToHistory: addToHistory || false,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        contractId: contractId || null,
      });

      if (addToHistory) {
        await storage.createPropertyHistory({
          propertyUuid: uuid,
          eventType: "payment",
          title: concept,
          description: `${amount}€ - ${status}`,
          performedBy: req.user?.name || "Usuario Actual",
        });
      }

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Error al crear el pago" });
    }
  });

  app.patch("/api/properties/:uuid/payments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updatePropertyPayment(parseInt(id), req.body);
      if (!updated) return res.status(404).json({ error: "Pago no encontrado" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ error: "Error al actualizar el pago" });
    }
  });

  app.delete("/api/properties/:uuid/payments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePropertyPayment(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ error: "Error al eliminar el pago" });
    }
  });

  // 4. Property Documents CRUD
  app.get("/api/properties/:uuid/documents", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const documents = await storage.getPropertyDocuments(uuid);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Error al obtener los documentos" });
    }
  });

  app.post("/api/properties/:uuid/documents", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { documentType, fileName, fileUrl } = req.body;

      if (!documentType || !fileName || !fileUrl) {
        return res.status(400).json({ error: "Faltan campos obligatorios: documentType, fileName, fileUrl" });
      }

      const { fileSize, uploadDate } = req.body;
      const document = await storage.createPropertyDocument({
        propertyUuid: uuid,
        documentType,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        uploadDate: uploadDate || new Date().toISOString().split('T')[0],
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Error al crear el documento" });
    }
  });

  app.delete("/api/properties/:uuid/documents/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePropertyDocument(parseInt(id));
      if (!deleted) return res.status(404).json({ error: "Documento no encontrado" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Error al eliminar el documento" });
    }
  });

  // 5. Property Incidents CRUD
  app.get("/api/properties/:uuid/incidents", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const incidents = await storage.getPropertyIncidents(uuid);
      const incidentsWithLastUpdate = await Promise.all(
        incidents.map(async (incident) => {
          const updates = await storage.getIncidentUpdates(incident.id);
          const lastUpdate = updates.length > 0 ? updates[0] : null;
          return { ...incident, lastUpdate };
        })
      );
      res.json(incidentsWithLastUpdate);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ error: "Error al obtener las incidencias" });
    }
  });

  app.post("/api/properties/:uuid/incidents", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { title, status, priority, description } = req.body;

      if (!title || !status || !priority) {
        return res.status(400).json({ error: "Faltan campos obligatorios: title, status, priority" });
      }
      const incident = await storage.createPropertyIncident({
        propertyUuid: uuid,
        title,
        status,
        priority,
        description: description || null,
      });

      await storage.createPropertyHistory({
        propertyUuid: uuid,
        eventType: "incident",
        title,
        description: `${status} - Prioridad: ${priority}`,
        performedBy: req.user?.name || "Usuario Actual",
      });

      res.status(201).json(incident);
    } catch (error) {
      console.error("Error creating incident:", error);
      res.status(500).json({ error: "Error al crear la incidencia" });
    }
  });

  app.patch("/api/properties/:uuid/incidents/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updatePropertyIncident(parseInt(id), req.body);
      if (!updated) return res.status(404).json({ error: "Incidencia no encontrada" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(500).json({ error: "Error al actualizar la incidencia" });
    }
  });

  app.delete("/api/properties/:uuid/incidents/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePropertyIncident(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ error: "Error al eliminar la incidencia" });
    }
  });

  app.get("/api/incidents/:id/updates", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = await storage.getIncidentUpdates(parseInt(id));
      res.json(updates);
    } catch (error) {
      console.error("Error fetching incident updates:", error);
      res.status(500).json({ error: "Error al obtener las actualizaciones" });
    }
  });

  app.post("/api/incidents/:id/updates", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { comment, newStatus, newPriority } = req.body;

      if (!comment || comment.trim().length < 5) {
        return res.status(400).json({ error: "El comentario debe tener al menos 5 caracteres" });
      }

      const updateData: any = {
        incidentId: parseInt(id),
        comment: comment.trim(),
        performedBy: req.user?.name || "Usuario Actual",
      };
      if (newStatus) updateData.newStatus = newStatus;
      if (newPriority) updateData.newPriority = newPriority;

      const update = await storage.createIncidentUpdate(updateData);

      const incidentPatch: any = {};
      if (newStatus) incidentPatch.status = newStatus;
      if (newPriority) incidentPatch.priority = newPriority;
      if (Object.keys(incidentPatch).length > 0) {
        await storage.updatePropertyIncident(parseInt(id), incidentPatch);
      }

      res.status(201).json(update);
    } catch (error) {
      console.error("Error creating incident update:", error);
      res.status(500).json({ error: "Error al crear la actualización" });
    }
  });

  // 6. Property Communications CRUD
  app.get("/api/properties/:uuid/communications", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const communications = await storage.getPropertyCommunications(uuid);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ error: "Error al obtener las comunicaciones" });
    }
  });

  app.post("/api/properties/:uuid/communications", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { title, communicationType, relevantDate, addToHistory, addToCalendar, description, agentId } = req.body;

      if (!title || !communicationType || !relevantDate) {
        return res.status(400).json({ error: "Faltan campos obligatorios: title, communicationType, relevantDate" });
      }
      const communication = await storage.createPropertyCommunication({
        propertyUuid: uuid,
        title,
        communicationType,
        relevantDate,
        description: description || null,
        addToCalendar: addToCalendar || false,
        addToHistory: addToHistory || false,
        agentId: agentId || null,
      });

      if (addToHistory) {
        await storage.createPropertyHistory({
          propertyUuid: uuid,
          eventType: "communication",
          title: "Nueva comunicación registrada",
          description: title,
          performedBy: req.user?.name || "Usuario Actual",
        });
      }

      if (addToCalendar) {
        const property = await storage.getPropertyByUuid(uuid);
        if (property) {
          await storage.createAgentEvent({
            agentId: property.agentId,
            eventType: communicationType,
            eventDate: relevantDate,
            eventTime: "09:00",
            comments: `${title}${description ? ' - ' + description : ''}`,
            propertyUuid: uuid,
          });
        }
      }

      res.status(201).json(communication);
    } catch (error) {
      console.error("Error creating communication:", error);
      res.status(500).json({ error: "Error al crear la comunicación" });
    }
  });

  app.patch("/api/properties/:uuid/communications/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updatePropertyCommunication(parseInt(id), req.body);
      if (!updated) return res.status(404).json({ error: "Comunicación no encontrada" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating communication:", error);
      res.status(500).json({ error: "Error al actualizar la comunicación" });
    }
  });

  // 7. Property History
  app.get("/api/properties/:uuid/history", requireAuth, async (req, res) => {
    try {
      const { uuid } = req.params;
      const history = await storage.getPropertyHistory(uuid);
      res.json(history);
    } catch (error) {
      console.error("Error fetching property history:", error);
      res.status(500).json({ error: "Error al obtener el historial" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}