import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPropertySchema,
  insertClientSchema,
  insertNeighborhoodRatingSchema,
  insertAgencyAgentSchema,
  insertAppointmentSchema
} from "@shared/schema";
import { sendWelcomeEmail } from "./emailService";
import { expandNeighborhoodSearch, isCityWideSearch } from "./utils/neighborhoods";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth
  app.get("/api/users/check-email", async (req, res) => {
    try {
      const { email } = req.query;
      const user = await storage.getUserByEmail(email as string);
      res.json({ exists: !!user, name: user?.name });
    } catch (error) {
      console.error('Error checking email:', error);
      res.status(500).json({ message: "Failed to check email" });
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
        isAgent: req.body.isAgent === true
      };
      
      console.log('Registro - Datos procesados:', userData);
      
      const user = await storage.createUser(userData);
      console.log('Usuario creado:', user);
      
      // Enviar email de bienvenida
      const userName = user.name || user.agencyName || 'Usuario';
      const isAgentOrAgency = user.isAgent || !!user.agencyName;
      
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

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login - Datos recibidos:', req.body);
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      console.log('Login - Usuario encontrado:', user);

      if (!user || user.password !== password) {
        console.log('Login - Credenciales inválidas');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log('Login - Éxito, devolviendo usuario:', {
        id: user.id,
        email: user.email,
        name: user.name,
        isAgent: user.isAgent
      });

      res.json(user);
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Properties
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
      const mostViewed = req.query.mostViewed === 'true';
      
      let properties;
      if (mostViewed) {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
        const operationType = req.query.operationType as string | undefined;
        properties = await storage.getMostViewedProperties(limit, operationType);
      } else if (agentId) {
        properties = await storage.getPropertiesByAgent(agentId);
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
      const agencies = await storage.searchAgencies(queryString);
      console.log('Search agencies results:', agencies.length);
      res.json(agencies);
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
      const agents = await storage.searchAgents(queryString);
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

  const httpServer = createServer(app);
  return httpServer;
}