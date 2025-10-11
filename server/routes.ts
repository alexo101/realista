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
import { sendWelcomeEmail, sendReviewRequest } from "./emailService";
import { expandNeighborhoodSearch, isCityWideSearch, getCities, getDistrictsByCity, getNeighborhoodsByDistrict } from "./utils/neighborhoods";
import { cache } from "./cache";
import { fixPropertyGeocodingData } from "./utils/fix-property-geocoding";
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as Buffer
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
        agentId: null // Los clientes auto-registrados no tienen agente asignado inicialmente
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

      // Responder con éxito (sin incluir datos sensibles)
      res.status(201).json({
        message: "Cuenta creada exitosamente",
        clientId: newClient.id
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

      // Enviar email de bienvenida
      const userName = user.name || 'Usuario';
      const isAgentOrAgency = true; // En este punto todos son agentes

      try {
        await sendWelcomeEmail(user.email, userName, isAgentOrAgency);
        console.log('Email de bienvenida enviado a:', user.email);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
        // No interrumpimos el flujo si falla el envío de email
      }

      res.status(201).json(user);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  // Agency registration with subscription plan
  app.post("/api/auth/register-agency", async (req, res) => {
    try {
      console.log('Agency Registration - Datos recibidos:', req.body);
      const { email, password, subscriptionPlan, isYearlyBilling } = req.body;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe una cuenta con este correo electrónico" 
        });
      }

      // Determine seat limit based on plan
      const seatLimits: Record<string, number> = {
        'basica': 1,
        'pequeña': 5,
        'mediana': 15,
        'lider': 50
      };

      // Create agency with subscription
      const agencyData = {
        agencyName: `Agencia ${email.split('@')[0]}`, // Default name, can be updated later
        city: 'Barcelona',
        subscriptionPlan,
        isYearlyBilling: isYearlyBilling || false,
        seatsLimit: seatLimits[subscriptionPlan] || 1,
      };

      const agency = await storage.createAgency(agencyData);
      console.log('Agency created:', agency.id);

      // Create admin agent (agency_member type)
      const adminAgentData = {
        email,
        password,
        agentType: 'agency_member',
        city: 'Barcelona'
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

      // Create session
      (req as any).session.userId = adminAgent.id;
      (req as any).session.email = adminAgent.email;
      (req as any).session.agencyId = agency.id;
      (req as any).session.role = 'admin';
      
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

      // Return user data without password
      const { password: _, ...userResponse } = adminAgent;
      res.status(201).json({ 
        ...userResponse, 
        agencyId: agency.id,
        agencyName: agency.agencyName,
        role: 'admin',
        subscriptionPlan: agency.subscriptionPlan,
        isYearlyBilling: agency.isYearlyBilling
      });
    } catch (error) {
      console.error('Error registering agency:', error);
      res.status(500).json({ message: "Error al registrar la agencia" });
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

      // Create independent agent with personal subscription
      const agentData = {
        email,
        password,
        agentType: 'independent',
        subscriptionPlan,
        isYearlyBilling: isYearlyBilling || false,
        city: 'Barcelona'
      };

      const agent = await storage.createUser(agentData);
      console.log('Agent created:', agent.id);

      // Create session
      (req as any).session.userId = agent.id;
      (req as any).session.email = agent.email;
      (req as any).session.agentType = 'independent';
      
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

      // Return user data without password
      const { password: _, ...userResponse } = agent;
      res.status(201).json(userResponse);
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
  app.post("/api/agents/invite", async (req, res) => {
    try {
      console.log('Creating agent invitation - Received data:', req.body);

      const { name, surname, email, agencyId } = req.body;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Ya existe un usuario con este correo electrónico" 
        });
      }

      // Get agency information if provided
      let agencyName = 'Realista';
      if (agencyId) {
        const agency = await storage.getAgencyById(parseInt(agencyId));
        if (agency) {
          agencyName = agency.agencyName || 'Realista';
        }
      }

      // Send invitation email
      try {
        await sendWelcomeEmail(email, `${name} ${surname}`, true);
        console.log('Invitation email sent to:', email);
        
        // Log the invitation for tracking (in a real app, you'd store this in a database)
        console.log(`
-----------------------------------
ENVIANDO EMAIL DE INVITACIÓN:
Para: ${email}
Asunto: Invitación para unirse a ${agencyName} en Realista

Contenido:
Hola ${name} ${surname},

Has sido invitado/a a unirte a ${agencyName} en la plataforma Realista.

Para completar tu registro y acceder a tu cuenta, visita:
${process.env.FRONTEND_URL || 'http://localhost:5000'}/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&surname=${encodeURIComponent(surname)}

¡Bienvenido/a al equipo!
-----------------------------------
`);

        res.status(200).json({ 
          message: "Invitación enviada exitosamente",
          email: email,
          name: `${name} ${surname}`
        });
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
      let isClient = false;

      // Si no se encuentra en agentes, buscar en clientes
      if (!user) {
        const clients = await storage.getClients();
        const client = clients.find(c => c.email === email);

        if (client && client.password === password) {
          // Convertir cliente a formato de usuario para compatibilidad
          user = {
            id: client.id,
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

      console.log('Login - Usuario encontrado:', user ? 'Sí' : 'No', isClient ? '(Cliente)' : '(Agente)');

      if (!user || (!isClient && user.password !== password)) {
        console.log('Login - Credenciales inválidas');
        return res.status(401).json({ message: "El nombre de usuario o la contraseña que has introducido no son correctos. Comprueba tus datos e inténtalo de nuevo" });
      }

      console.log('Login - Éxito, devolviendo usuario:', {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isClient: isClient
      });

      // Store user data in session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        isAdmin: user.isAdmin,
        isClient: isClient,
        phone: user.phone
      };

      // Remover la contraseña antes de enviar la respuesta
      const { password: _, ...userResponse } = user;
      res.json({ ...userResponse, isClient });
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

  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser) {
        return res.status(401).json({ message: "No hay sesión activa" });
      }
      res.json(sessionUser);
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
      await storage.deleteProperty(parseInt(id));
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

      const updatedProperty = await storage.togglePropertyStatus(parseInt(id), isActive);
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
      const result = await storage.updateProperty(parseInt(req.params.id), property);
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

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Incrementar el contador de vistas
      await storage.incrementPropertyViewCount(id);

      // Retornar la propiedad con la vista ya incrementada
      const updatedProperty = await storage.getProperty(id);
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
      const client = insertClientSchema.parse(req.body);
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

  app.get("/api/clients", async (req, res) => {
    try {
      const agentId = parseInt(req.query.agentId as string);
      const clients = await storage.getClientsByAgent(agentId);
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Get clients by agent ID (for event form)
  app.get("/api/agents/:agentId/clients", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const clients = await storage.getClientsByAgent(agentId);
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients for agent:', error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Client favorite agents endpoints
  app.post("/api/clients/favorites/agents/:agentId", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const { clientId } = req.body;

      if (!clientId) {
        return res.status(401).json({ message: "Client ID is required" });
      }

      const isFavorite = await storage.toggleFavoriteAgent(clientId, agentId);

      res.status(200).json({ 
        message: isFavorite ? "Agente agregado a favoritos" : "Agente eliminado de favoritos",
        isFavorite: isFavorite,
        agentId: agentId
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

  app.get("/api/clients/:clientId/favorites/agents/:agentId/status", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const agentId = parseInt(req.params.agentId);
      const isFavorite = await storage.isFavoriteAgent(clientId, agentId);
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
  app.post("/api/clients/favorites/agencies/:agencyId", async (req, res) => {
    try {
      const agencyId = parseInt(req.params.agencyId);
      const { clientId } = req.body;

      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }

      if (isNaN(agencyId)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }

      const isFavorite = await storage.toggleFavoriteAgency(clientId, agencyId);
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

  app.get("/api/clients/:clientId/favorites/agencies/:agencyId/status", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const agencyId = parseInt(req.params.agencyId);
      const isFavorite = await storage.isFavoriteAgency(clientId, agencyId);
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
      const propertyId = parseInt(req.params.propertyId);
      const { clientId } = req.body;

      console.log('Toggle property favorite request:', { propertyId, clientId, body: req.body });

      if (!clientId) {
        console.log('Missing clientId in request body');
        return res.status(400).json({ message: "Client ID is required" });
      }

      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
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
      const propertyId = parseInt(req.params.propertyId);
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

      const propertyIds = propertyIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
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

  app.get("/api/agents/:agentId/visit-requests", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
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
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

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
        propertyId,
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
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

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

  app.get("/api/agents/:agentId/events", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
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
  app.put("/api/clients/:clientId/profile", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Authentication check - ensure user is logged in
      const sessionUser = (req as any).session?.user;
      if (!sessionUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if client exists first
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Authorization check - only allow updates if:
      // 1. User is the client owner (logged in as client with matching ID)
      // 2. User is the assigned agent for this client
      // 3. User is an admin
      let isAuthorized = false;
      
      if (sessionUser.isClient && sessionUser.id === clientId) {
        // Client updating their own profile
        isAuthorized = true;
      } else if (!sessionUser.isClient && sessionUser.isAdmin) {
        // Admin can update any client profile
        isAuthorized = true;
      } else if (!sessionUser.isClient && existingClient.agentId === sessionUser.id) {
        // Agent updating their assigned client's profile
        isAuthorized = true;
      }
      
      if (!isAuthorized) {
        return res.status(403).json({ 
          message: "You are not authorized to update this client profile" 
        });
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
  app.get("/api/agencies/:id/agents", async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
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

        // Si es búsqueda a nivel de ciudad, mostramos todas las agencias
        if (isCityWideSearch(neighborhood)) {
          console.log('Búsqueda para toda Barcelona - mostrando todas las agencias');
          updatedQuery.showAll = 'true';
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
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      const agent = await storage.getAgentById(id);
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
  app.get("/api/agents/:id/properties", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      console.log(`Fetching properties for agent ID: ${id} from route handler`);
      const properties = await storage.getPropertiesByAgent(id);
      console.log(`Returning ${properties.length} properties for agent ID: ${id}`);
      res.json(properties);
    } catch (error) {
      console.error('Error getting agent properties:', error);
      res.status(500).json({ message: "Failed to get agent properties" });
    }
  });

  app.get("/api/agencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }

      const agency = await storage.getAgencyById(id);
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
  app.get("/api/agencies/:id/properties", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }

      const properties = await storage.getPropertiesByAgency(id);
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
      res.json(updatedUser);
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

  app.get("/api/agents/:id/reviews", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const reviews = await storage.getAgentReviews(agentId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error getting agent reviews:', error);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.get("/api/agencies/:id/reviews", async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      const reviews = await storage.getAgencyReviews(agencyId);
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error getting agency reviews:', error);
      res.status(500).json({ message: "Failed to get agency reviews" });
    }
  });

  app.post("/api/agents/:id/reviews", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const review = await storage.createAgentReview({
        ...req.body,
        targetId: agentId,
        targetType: "agent",
        date: new Date()
      });
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating agent review:', error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.post("/api/agencies/:id/reviews", async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      const review = await storage.createAgentReview({
        ...req.body,
        targetId: agencyId,
        targetType: "agency",
        date: new Date()
      });
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating agency review:', error);
      res.status(500).json({ message: "Failed to create agency review" });
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
  app.get("/api/agencies", async (req, res) => {
    try {
      const adminAgentId = req.query.adminAgentId ? parseInt(req.query.adminAgentId as string) : undefined;

      // Si se proporciona adminAgentId, obtener solo las agencias de ese administrador
      const agencies = adminAgentId 
        ? await storage.getAgenciesByAdmin(adminAgentId)
        : await storage.getAgenciesByAdmin(req.user?.id || 0);

      console.log(`Retrieved ${agencies.length} agencies for admin ${adminAgentId || req.user?.id}`);
      res.json(agencies);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      res.status(500).json({ message: "Failed to fetch agencies" });
    }
  });

  app.post("/api/agencies", async (req, res) => {
    try {
      console.log('Creating agency with data:', req.body);
      if (!req.body.adminAgentId && !req.user?.id) {
        return res.status(400).json({ message: "Missing adminAgentId" });
      }

      const agencyData = {
        ...req.body,
        adminAgentId: req.body.adminAgentId || req.user?.id
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

  app.patch("/api/agencies/:id", async (req, res) => {
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

  app.delete("/api/agencies/:id", async (req, res) => {
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
      
      // Enviar email de solicitud de reseña
      const success = await sendReviewRequest(
        client.email, 
        client.name, 
        agent.name || "Agente"
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
            isRead: true
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
            isRead: true
          }];
        }

        // Get the last message for display
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          id: inquiry.id,
          clientId: inquiry.id, // Using inquiry ID as client reference
          clientName: inquiry.name,
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
            isRead: true
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
            isRead: true
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
      
      // Save the message to the database
      const messageData = {
        inquiryId: conversationId,
        senderType,
        senderId,
        senderName,
        content,
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
        isRead: false
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
      
      // Mark inquiry as read (update status if needed)
      await storage.updateInquiryStatus(conversationId, 'contactado');
      
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
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

      // Create a descriptive prompt in Spanish
      const prompt = `Genera una descripción atractiva y profesional para una propiedad inmobiliaria en Barcelona con las siguientes características:

Tipo de propiedad: ${propertyType}
Operación: ${operationType}
Barrio: ${neighborhood}
Habitaciones: ${bedrooms || 'No especificado'}
Baños: ${bathrooms || 'No especificado'}
Superficie: ${size ? `${size} m²` : 'No especificada'}
Precio: ${price ? `${price}€` : 'A consultar'}
Características: ${features && features.length > 0 ? features.join(', ') : 'No especificadas'}

La descripción debe:
- Ser profesional y atractiva para potenciales compradores/inquilinos
- Destacar las mejores características de la propiedad
- Mencionar el barrio y sus ventajas
- Tener MÁXIMO 500 caracteres (incluye espacios y puntuación)
- Estar escrita en español
- Usar un tono persuasivo pero honesto
- Ser concisa y directa

Responde solo con la descripción, sin introducción ni explicaciones adicionales.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini (nano) which is more widely available
        messages: [
          {
            role: "system",
            content: "Eres un experto en marketing inmobiliario especializado en Barcelona. Generas descripciones atractivas y profesionales para propiedades. SIEMPRE respeta el límite de 500 caracteres."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150, // Reduced to limit response length
        temperature: 0.7,
      });

      let description = response.choices[0].message.content || "";

      // Ensure the description doesn't exceed 500 characters
      if (description.length > 500) {
        description = description.substring(0, 497) + "...";
      }

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
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname || `image_${Date.now()}.jpg`;
      const mimeType = req.file.mimetype;

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
      const propertyId = parseInt(req.params.id);
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

  const httpServer = createServer(app);
  return httpServer;
}