import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPropertySchema,
  insertClientSchema,
  insertNeighborhoodRatingSchema,
  insertAgencyAgentSchema,
  insertAppointmentSchema,
  insertAgencySchema,
  insertPropertyVisitRequestSchema
} from "@shared/schema";
import { sendWelcomeEmail, sendReviewRequest } from "./emailService";
import { expandNeighborhoodSearch, isCityWideSearch } from "./utils/neighborhoods";
import { cache } from "./cache";
import { fixPropertyGeocodingData } from "./utils/fix-property-geocoding";

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
        return res.status(401).json({ message: "Credenciales inválidas" });
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
        // Use getAllPropertiesByAgent for management purposes when includeInactive is true
        properties = includeInactive 
          ? await storage.getAllPropertiesByAgent(agentId)
          : await storage.getPropertiesByAgent(agentId);
      } else if (agencyId) {
        properties = await storage.getPropertiesByAgency(agencyId);
      } else {
        properties = await storage.searchProperties(req.query);
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
      console.error('Error getting client:', error);
      res.status(500).json({ message: "Failed to get client" });
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
      const ratings = await storage.getNeighborhoodRatings(neighborhood);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching neighborhood ratings:', error);
      res.status(500).json({ message: "Failed to fetch neighborhood ratings" });
    }
  });

  app.get("/api/neighborhoods/ratings/average", async (req, res) => {
    try {
      console.log(`Recibida solicitud para promedios de barrio: ${req.query.neighborhood}`);

      const neighborhood = req.query.neighborhood as string;
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

      console.log(`Obteniendo promedios para barrio: ${neighborhood} a las ${new Date().toISOString()}`);
      const averages = await storage.getNeighborhoodRatingsAverage(neighborhood);
      console.log(`Promedios para ${neighborhood} obtenidos:`, averages);

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
        const neighborhood = filters.neighborhoods;

        // Si es búsqueda a nivel de ciudad, mostramos todas las propiedades
        if (isCityWideSearch(neighborhood)) {
          console.log('Búsqueda para toda Barcelona - mostrando todas las propiedades de venta');
          delete filters.neighborhoods;
        } 
        // Si es un distrito o barrio específico, expandimos la búsqueda
        else {
          // Expandimos el barrio o distrito a una lista de barrios
          const expandedNeighborhoods = expandNeighborhoodSearch(neighborhood);
          console.log(`Búsqueda expandida para ${neighborhood} incluye: ${expandedNeighborhoods.join(', ')}`);

          if (expandedNeighborhoods.length > 0) {
            // Reemplazamos el filtro original con la lista expandida
            filters.neighborhoods = expandedNeighborhoods;
          }
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
        const neighborhood = filters.neighborhoods;

        // Si es búsqueda a nivel de ciudad, mostramos todas las propiedades
        if (isCityWideSearch(neighborhood)) {
          console.log('Búsqueda para toda Barcelona - mostrando todas las propiedades de alquiler');
          delete filters.neighborhoods;
        } 
        // Si es un distrito o barrio específico, expandimos la búsqueda
        else {
          // Expandimos el barrio o distrito a una lista de barrios
          const expandedNeighborhoods = expandNeighborhoodSearch(neighborhood);
          console.log(`Búsqueda expandida para ${neighborhood} incluye: ${expandedNeighborhoods.join(', ')}`);

          if (expandedNeighborhoods.length > 0) {
            // Reemplazamos el filtro original con la lista expandida
            filters.neighborhoods = expandedNeighborhoods;
          }
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
      
      // Transform inquiries into conversations format
      const conversations = inquiries.map(inquiry => ({
        id: inquiry.id,
        clientId: inquiry.id, // Using inquiry ID as client reference
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        clientPhone: inquiry.phone,
        propertyId: inquiry.propertyId,
        propertyTitle: inquiry.property?.title || "Sin título",
        propertyAddress: inquiry.property?.address || "Dirección no disponible",
        lastMessage: inquiry.message,
        lastMessageTime: inquiry.createdAt,
        unreadCount: inquiry.status === 'pendiente' ? 1 : 0,
        status: inquiry.status === 'finalizado' ? 'closed' : 'active',
        messages: [
          {
            id: 1,
            senderId: inquiry.id,
            senderName: inquiry.name,
            senderType: 'client',
            content: `Hola, estoy interesado en la propiedad en ${inquiry.property?.address || 'esta dirección'}. ${inquiry.message}`,
            timestamp: inquiry.createdAt,
            isRead: true
          }
        ]
      }));
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: "Error al cargar conversaciones" });
    }
  });

  app.post("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const { content, senderType } = req.body;
      
      // For now, we'll create a simple message response
      // In a real implementation, you'd save this to a messages table
      const newMessage = {
        id: Date.now(), // Simple ID generation
        senderId: senderType === 'agent' ? conversationId : conversationId,
        senderName: senderType === 'agent' ? 'Agente' : 'Cliente',
        senderType: senderType,
        content: content,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      // Update inquiry status to 'contactado' when agent sends first message
      if (senderType === 'agent') {
        try {
          await storage.updateInquiryStatus(conversationId, 'contactado');
        } catch (error) {
          console.error('Error updating inquiry status:', error);
        }
      }
      
      res.json(newMessage);
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

  const httpServer = createServer(app);
  return httpServer;
}