import { db } from "./db";
import { eq, sql, and, or, gte, lte, arrayOverlaps, not, isNull } from "drizzle-orm";
import {
  agents,
  agencies,
  properties,
  clients,
  neighborhoodRatings,
  agencyAgents,
  appointments,
  inquiries,
  reviews,
  type User,
  type Agent,
  type Agency,
  type Property,
  type Client,
  type NeighborhoodRating,
  type AgencyAgent,
  type Appointment,
  type Inquiry,
  type Review,
  type InsertAgent,
  type InsertAgency,
  type InsertProperty,
  type InsertClient,
  type InsertNeighborhoodRating,
  type InsertAgencyAgent,
  type InsertAppointment,
  type InsertInquiry,
  type InsertReview
} from "@shared/schema";

export interface IStorage {
  // Users/Agents
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertAgent): Promise<User>;
  updateUser(id: number, userData: Partial<InsertAgent>): Promise<User>;

  // Agents/Agencies Search & Profiles
  searchAgents(query: string): Promise<User[]>;
  searchAgencies(query: string): Promise<User[]>;
  getAgentById(id: number): Promise<User | undefined>; 
  getAgencyById(id: number): Promise<User | undefined>; 
  createAgentReview(review: InsertReview): Promise<Review>;
  getAgentReviews(agentId: number): Promise<Review[]>; // Obtener las reseñas de un agente
  getAgencyReviews(agencyId: number): Promise<Review[]>; // Obtener las reseñas de una agencia
  
  // Multi-agency management
  getAgenciesByAdmin(adminAgentId: number): Promise<Agency[]>; // Obtener todas las agencias de un administrador
  createAgency(agency: Partial<InsertAgency>): Promise<Agency>; // Crear una nueva agencia
  updateAgency(id: number, agency: Partial<InsertAgency>): Promise<Agency>; // Actualizar una agencia existente
  deleteAgency(id: number): Promise<void>; // Eliminar una agencia

  // Agency Agents
  getAgencyAgents(agencyId: number): Promise<AgencyAgent[]>;
  createAgencyAgent(agentData: InsertAgencyAgent): Promise<AgencyAgent>;
  deleteAgencyAgent(id: number): Promise<void>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getMostViewedProperties(limit?: number): Promise<Property[]>;
  getPropertiesByAgent(agentId: number): Promise<Property[]>;
  getPropertiesByAgency(agencyId: number): Promise<Property[]>;
  searchProperties(filters: any): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: InsertProperty): Promise<Property>;
  incrementPropertyViewCount(id: number): Promise<void>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientsByAgent(agentId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client>;

  // Neighborhood Ratings
  getNeighborhoodRatings(neighborhood: string): Promise<NeighborhoodRating[]>;
  getNeighborhoodRatingsAverage(neighborhood: string): Promise<Record<string, number>>;
  createNeighborhoodRating(rating: InsertNeighborhoodRating): Promise<NeighborhoodRating>;

  // Appointments
  getAppointmentsByClient(clientId: number): Promise<Appointment[]>;
  getAppointmentsByAgent(agentId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  // Inquiries (Consultas de propiedad)
  getInquiriesByAgent(agentId: number): Promise<Inquiry[]>;
  getInquiryById(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(agents).where(eq(agents.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(agents).where(eq(agents.email, email));
    return user;
  }

  async createUser(user: InsertAgent): Promise<User> {
    const [newUser] = await db.insert(agents).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertAgent>): Promise<User> {
    try {
      // Create a clean copy of userData without reserved SQL keywords
      const cleanedUserData: Record<string, any> = {};

      // Only copy over fields that are not SQL reserved words
      for (const key in userData) {
        if (key !== 'where' && key !== 'from' && key !== 'select' && 
            key !== 'order' && key !== 'group' && key !== 'having' && 
            key !== 'limit' && key !== 'join') {
          cleanedUserData[key] = userData[key as keyof typeof userData];
        }
      }

      console.log('Updating user with cleaned data:', Object.keys(cleanedUserData));

      const [updatedUser] = await db
        .update(agents)
        .set(cleanedUserData)
        .where(eq(agents.id, id))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error in updateUser SQL:', error);
      throw error;
    }
  }

  // Agents
  async searchAgents(query: string): Promise<User[]> {
    // Versión simplificada para probar la conexión
    return await db.select().from(agents).limit(10);
  }

  async searchAgencies(queryString: string): Promise<User[]> {
    // Parseamos los parámetros de la URL
    const params = new URLSearchParams(queryString);
    const showAll = params.get('showAll') === 'true';
    const agencyName = params.get('agencyName');
    const neighborhoodsStr = params.get('neighborhoods');

    console.log(`Buscando agencias con params: showAll=${showAll}, agencyName=${agencyName}, neighborhoods=${neighborhoodsStr}`);

    let query = db.select().from(agencies)
      .where(eq(agencies.agencyName.valueIsNotNull(), true)) as any;

    // Filtrar por nombre de agencia si se proporciona
    if (agencyName && agencyName.trim() !== '') {
      query = query.where(sql`agencies.agency_name ILIKE ${`%${agencyName}%`}`);
    }

    // Filtrar por barrios de influencia si se proporcionan
    if (neighborhoodsStr && neighborhoodsStr.trim() !== '') {
      console.log(`Filtrando por barrios: ${neighborhoodsStr}`);
      const neighborhoods = neighborhoodsStr.split(',');

      try {
        // For each neighborhood, check if it's in the agency's neighborhood list
        // We need to check in the agency_neighborhoods column which is a text field in PostgreSQL format
        // The format looks like: {"La Sagrera","Sant Andreu del Palomar"}
        query = query.where(
          or(...neighborhoods.map(neighborhood => 
            sql`agencies.agency_influence_neighborhoods::text LIKE ${`%${neighborhood}%`}`
          ))
        );
      } catch (error) {
        console.error('Error building neighborhood filter:', error);
        // If there's an error with the filter, continue without it
      }
    }

    // Ejecutamos la consulta
    console.log(`Ejecutando búsqueda de agencias...`);
    const agencyResults = await query;
    console.log(`Found ${agencyResults.length} agencies in the database`);

    return agencyResults;
  }

  async getAgentById(id: number): Promise<User | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    if (!agent) return undefined;

    // Añadimos propiedades adicionales para identificar que es un agente
    return {
      ...agent,
      isAgent: true,
      isAgency: false
    } as User;
  }

  // Función auxiliar para procesar campos de array en formato PostgreSQL
  private parseArrayField(value: string | string[] | null | undefined): string[] {
    // Si es null o undefined, devolver array vacío
    if (!value) return [];
    
    // Si ya es un array, simplemente devolverlo
    if (Array.isArray(value)) return value;

    // Quitar las llaves { } y dividir por comas
    try {
      // Eliminar las llaves { } externas
      const cleanedValue = value.replace(/^\{|\}$/g, '');

      // Dividir por comas, pero respetando las comillas
      const result: string[] = [];
      let currentItem = '';
      let inQuotes = false;

      for (let i = 0; i < cleanedValue.length; i++) {
        const char = cleanedValue[i];

        if (char === '"' && (i === 0 || cleanedValue[i-1] !== '\\')) {
          inQuotes = !inQuotes;
          // No añadimos el caracter de comillas al item
        } else if (char === ',' && !inQuotes) {
          result.push(currentItem.trim());
          currentItem = '';
        } else {
          currentItem += char;
        }
      }

      if (currentItem) {
        result.push(currentItem.trim());
      }

      // Eliminar comillas restantes
      return result.map(item => 
        item.startsWith('"') && item.endsWith('"') 
          ? item.substring(1, item.length - 1) 
          : item
      );
    } catch (error) {
      console.error('Error al parsear campo de array:', error);
      return typeof value === 'string' ? [value] : [];
    }
  }

  // Función auxiliar para procesar campos JSON en formato string o objeto
  private parseJsonField(value: string | object | null | undefined): any {
    // Si es null o undefined, devolver objeto vacío
    if (!value) return {};
    
    // Si ya es un objeto, simplemente devolverlo
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('Error al parsear campo JSON:', error);
      return {};
    }
  }

  async getAgencyById(id: number): Promise<User | undefined> {
    // Como tenemos compatibilidad hacia atrás con User = Agent
    // convertimos la agencia a formato agente para devolver
    const [agency] = await db.select().from(agencies).where(eq(agencies.id, id));
    if (!agency) return undefined;

    // Procesar los campos que deberían ser arrays
    const neighborhoods = this.parseArrayField(agency.agencyInfluenceNeighborhoods);
    const languages = this.parseArrayField(agency.agencySupportedLanguages);
    
    // Asegurarnos de que agencySocialMedia sea un objeto o string antes de procesarlo
    const socialMedia = agency.agencySocialMedia ? this.parseJsonField(agency.agencySocialMedia as object | string) : {};

    // Convertir formato agencia a agente para mantener compatibilidad
    const agentFormat = {
      id: agency.id,
      email: agency.agencyEmailToDisplay || "agency@example.com", // Email público de la agencia
      password: "", // Campo requerido por el tipo pero no se usa
      name: agency.agencyName,
      surname: null, // Las agencias no tienen apellidos
      description: agency.agencyDescription,
      avatar: agency.agencyLogo,
      createdAt: new Date(), // Fecha actual como aproximación si no existe
      // Barrios de actuación de la agencia
      influenceNeighborhoods: neighborhoods,
      // Campos específicos de agentes que no son relevantes para agencias
      yearsOfExperience: null,
      // Idiomas soportados
      languagesSpoken: languages,
      // ID de administrador de la agencia (casteado a string para mantener compatibilidad)
      agencyId: String(agency.adminAgentId),
      isAdmin: false,
      // Campos adicionales específicos de agencias para frontend
      agencyName: agency.agencyName,
      agencyWebsite: agency.agencyWebsite,
      agencySocialMedia: socialMedia,
      agencyActiveSince: agency.agencyActiveSince,
      agencyAddress: agency.agencyAddress,
      // Flag para diferenciar agentes de agencias
      isAgent: false,
      isAgency: true
    } as User;

    return agentFormat;
  }

  async createAgentReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getAgentReviews(agentId: number): Promise<Review[]> {
    try {
      const result = await db.select()
        .from(reviews)
        .where(and(
          eq(reviews.targetId, agentId),
          eq(reviews.targetType, "agent")
        ))
        .orderBy(sql`${reviews.date} DESC`);
      return result;
    } catch (error) {
      console.error('Error obteniendo reseñas del agente:', error);
      return [];
    }
  }

  async getAgencyReviews(agencyId: number): Promise<Review[]> {
    try {
      const result = await db.select()
        .from(reviews)
        .where(and(
          eq(reviews.targetId, agencyId),
          eq(reviews.targetType, "agency")
        ))
        .orderBy(sql`${reviews.date} DESC`);
      return result;
    } catch (error) {
      console.error('Error obteniendo reseñas de la agencia:', error);
      return [];
    }
  }
  
  // Multi-agency management methods
  async getAgenciesByAdmin(adminAgentId: number): Promise<Agency[]> {
    try {
      console.log(`Fetching agencies for admin with ID: ${adminAgentId}`);
      
      const result = await db.select()
        .from(agencies)
        .where(eq(agencies.adminAgentId, adminAgentId))
        .orderBy(agencies.agencyName);
        
      console.log(`Found ${result.length} agencies for admin ${adminAgentId}`);
      return result;
    } catch (error) {
      console.error('Error fetching agencies by admin:', error);
      return [];
    }
  }
  
  async createAgency(agencyData: Partial<InsertAgency>): Promise<Agency> {
    try {
      console.log('Creating agency with data:', agencyData);
      
      // Validamos que tengamos un adminAgentId
      if (!agencyData.adminAgentId) {
        throw new Error('Missing required adminAgentId field');
      }
      
      // Aseguramos que el nombre de agencia existe
      if (!agencyData.agencyName) {
        throw new Error('Missing required agencyName field');
      }
      
      // Insertamos la agencia
      const [newAgency] = await db.insert(agencies)
        .values({
          agencyName: agencyData.agencyName,
          agencyAddress: agencyData.agencyAddress || null,
          agencyDescription: agencyData.agencyDescription || null,
          agencyLogo: agencyData.agencyLogo || null,
          agencyInfluenceNeighborhoods: agencyData.agencyInfluenceNeighborhoods || [],
          agencySupportedLanguages: agencyData.agencySupportedLanguages || [],
          adminAgentId: agencyData.adminAgentId,
          agencyWebsite: agencyData.agencyWebsite || null,
          agencySocialMedia: agencyData.agencySocialMedia || null,
          agencyEmailToDisplay: agencyData.agencyEmailToDisplay || null,
          agencyActiveSince: agencyData.agencyActiveSince || null,
        })
        .returning();
      
      console.log('Agency created successfully:', newAgency);
      return newAgency;
    } catch (error) {
      console.error('Error creating agency:', error);
      throw new Error(`Failed to create agency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async updateAgency(id: number, agencyData: Partial<InsertAgency>): Promise<Agency> {
    try {
      console.log(`Updating agency ${id} with data:`, agencyData);
      
      // Creamos un objeto con solo los campos que queremos actualizar
      const updateData: Record<string, any> = {};
      
      // Solo copiamos los campos que están definidos en el input
      for (const [key, value] of Object.entries(agencyData)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }
      
      // Actualizamos la agencia
      const [updatedAgency] = await db.update(agencies)
        .set(updateData)
        .where(eq(agencies.id, id))
        .returning();
      
      if (!updatedAgency) {
        throw new Error(`Agency with ID ${id} not found`);
      }
      
      console.log('Agency updated successfully:', updatedAgency);
      return updatedAgency;
    } catch (error) {
      console.error('Error updating agency:', error);
      throw new Error(`Failed to update agency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async deleteAgency(id: number): Promise<void> {
    try {
      console.log(`Deleting agency ${id}`);
      
      // Verificamos que la agencia existe
      const [agency] = await db.select()
        .from(agencies)
        .where(eq(agencies.id, id));
      
      if (!agency) {
        throw new Error(`Agency with ID ${id} not found`);
      }
      
      // Eliminamos la agencia
      await db.delete(agencies)
        .where(eq(agencies.id, id));
      
      console.log(`Agency ${id} deleted successfully`);
    } catch (error) {
      console.error('Error deleting agency:', error);
      throw new Error(`Failed to delete agency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Agency Agents
  async getAgencyAgents(agencyId: number): Promise<AgencyAgent[]> {
    const result = await db.select()
      .from(agencyAgents)
      .where(eq(agencyAgents.agencyId, agencyId))
      .orderBy(agencyAgents.agentName);

    return result;
  }

  async createAgencyAgent(agentData: InsertAgencyAgent): Promise<AgencyAgent> {
    const [newAgent] = await db.insert(agencyAgents).values(agentData).returning();
    return newAgent;
  }

  async deleteAgencyAgent(id: number): Promise<void> {
    await db.delete(agencyAgents).where(eq(agencyAgents.id, id));
  }

  // Properties
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getMostViewedProperties(limit: number = 6, operationType?: string): Promise<Property[]> {
    // Construir la consulta base
    let query = db.select()
      .from(properties)
      .orderBy(sql`${properties.viewCount} DESC`);
    
    // Si se especifica un tipo de operación, añadir el filtro
    if (operationType) {
      console.log(`Filtrando propiedades más vistas por tipo de operación: ${operationType}`);
      query = query.where(eq(properties.operationType, operationType));
    }
    
    // Aplicar el límite y ejecutar la consulta
    return await query.limit(limit);
  }

  async incrementPropertyViewCount(id: number): Promise<void> {
    await db.update(properties)
      .set({ viewCount: sql`${properties.viewCount} + 1` })
      .where(eq(properties.id, id));
  }

  async getPropertiesByAgent(agentId: number): Promise<Property[]> {
    console.log(`Fetching properties for agent ID: ${agentId}`);
    const result = await db.select()
      .from(properties)
      .where(eq(properties.agentId, agentId))
      .orderBy(sql`${properties.createdAt} DESC`);

    console.log(`Found ${result.length} properties for agent ID: ${agentId}`);
    return result;
  }

  async getPropertiesByAgency(agencyId: number): Promise<Property[]> {
    return await db.select()
      .from(properties)
      .where(eq(properties.agencyId, agencyId))
      .orderBy(sql`${properties.createdAt} DESC`);
  }

  async searchProperties(filters: any): Promise<Property[]> {
    console.log("Filtros recibidos:", filters);
    
    // Construir la consulta base
    let query = db.select().from(properties);
    
    // Aplicar filtros si están definidos
    if (filters) {
      // Filtrar por tipo de operación (Venta o Alquiler)
      if (filters.operationType) {
        console.log(`Filtrando por tipo de operación: ${filters.operationType}`);
        query = query.where(eq(properties.operationType, filters.operationType));
      }
      
      // Filtrar por barrio(s)
      if (filters.neighborhoods) {
        const neighborhoods = Array.isArray(filters.neighborhoods) 
          ? filters.neighborhoods 
          : [filters.neighborhoods];
          
        console.log(`Filtrando por barrios: ${neighborhoods.join(', ')}`);
        
        // Si hay múltiples barrios, usamos OR
        if (neighborhoods.length > 1) {
          query = query.where(
            or(...neighborhoods.map(n => eq(properties.neighborhood, n)))
          );
        } else {
          // Si es solo un barrio
          query = query.where(eq(properties.neighborhood, neighborhoods[0]));
        }
      }
      
      // Filtrar por precio mínimo si está definido
      if (filters.priceMin !== undefined && filters.priceMin !== null) {
        console.log(`Filtrando por precio mínimo: ${filters.priceMin}`);
        query = query.where(gte(properties.price, Number(filters.priceMin)));
      }
      
      // Filtrar por precio máximo si está definido
      if (filters.priceMax !== undefined && filters.priceMax !== null) {
        console.log(`Filtrando por precio máximo: ${filters.priceMax}`);
        query = query.where(lte(properties.price, Number(filters.priceMax)));
      }
      
      // Filtrar por número de habitaciones si está definido
      if (filters.bedrooms !== undefined && filters.bedrooms !== null) {
        console.log(`Filtrando por habitaciones: ${filters.bedrooms}`);
        query = query.where(gte(properties.bedrooms, Number(filters.bedrooms)));
      }
      
      // Filtrar por número de baños si está definido
      if (filters.bathrooms !== undefined && filters.bathrooms !== null) {
        console.log(`Filtrando por baños: ${filters.bathrooms}`);
        query = query.where(gte(properties.bathrooms, Number(filters.bathrooms)));
      }
      
      // Filtrar por características si están definidas
      if (filters.features) {
        const features = Array.isArray(filters.features) 
          ? filters.features 
          : filters.features.split(',');
          
        if (features.length > 0) {
          console.log(`Filtrando por características: ${features.join(', ')}`);
          // Para cada característica, verificamos que esté en el array de la propiedad
          features.forEach(feature => {
            // Esto asume que 'features' es un array en PostgreSQL
            query = query.where(sql`${properties.features} @> ARRAY[${feature}]::text[]`);
          });
        }
      }
      
      // Ordenar por precio (por defecto)
      query = query.orderBy(properties.price);
    }
    
    console.log("Ejecutando consulta de propiedades con filtros");
    return await query;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async updateProperty(id: number, property: InsertProperty): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientsByAgent(agentId: number): Promise<Client[]> {
    return await db.select()
      .from(clients)
      .where(eq(clients.agentId, agentId))
      .orderBy(clients.name);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, client: InsertClient): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  // Neighborhood Ratings
  async getNeighborhoodRatings(neighborhood: string): Promise<NeighborhoodRating[]> {
    return await db.select()
      .from(neighborhoodRatings)
      .where(eq(neighborhoodRatings.neighborhood, neighborhood));
  }

  async getNeighborhoodRatingsAverage(neighborhood: string): Promise<Record<string, number>> {
    // Versión simplificada
    return {
      security: 7.5,
      parking: 6.8,
      familyFriendly: 8.2,
      publicTransport: 7.0,
      greenSpaces: 6.5,
      services: 8.0
    };
  }

  async createNeighborhoodRating(rating: InsertNeighborhoodRating): Promise<NeighborhoodRating> {
    // Convertir números a strings para los campos decimal
    const convertedRating = {
      neighborhood: rating.neighborhood,
      security: String(rating.security),
      parking: String(rating.parking),
      familyFriendly: String(rating.familyFriendly),
      publicTransport: String(rating.publicTransport),
      greenSpaces: String(rating.greenSpaces),
      services: String(rating.services),
      userId: rating.userId
    };
    
    const [newRating] = await db.insert(neighborhoodRatings).values(convertedRating).returning();
    return newRating;
  }

  // Appointments
  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(sql`${appointments.date} DESC, ${appointments.time} DESC`);
  }

  async getAppointmentsByAgent(agentId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(eq(appointments.agentId, agentId))
      .orderBy(sql`${appointments.date} DESC, ${appointments.time} DESC`);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Inquiries
  async getInquiriesByAgent(agentId: number): Promise<Inquiry[]> {
    return await db.select()
      .from(inquiries)
      .where(eq(inquiries.agentId, agentId))
      .orderBy(sql`${inquiries.createdAt} DESC`);
  }

  async getInquiryById(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }
}

export const storage: IStorage = new DatabaseStorage();