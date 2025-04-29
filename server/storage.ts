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

    let query = db.select().from(agencies) // Corrected table name
      .where(eq(agencies.agencyName.valueIsNotNull(), true)); //Simplified where clause

    // Filtrar por nombre de agencia si se proporciona
    if (agencyName && agencyName.trim() !== '') {
      query = query.where(sql`agencies.agencyName LIKE ${`%${agencyName}%`}`); //Corrected table name
    }

    // Filtrar por barrios de influencia si se proporcionan
    if (neighborhoodsStr && neighborhoodsStr.trim() !== '') {
      const neighborhoods = neighborhoodsStr.split(',');

      // Aplicamos un filtro más estricto para que solo devuelva agencias
      // que tengan explícitamente los barrios seleccionados en su array de influencia
      query = query.where(
        or(...neighborhoods.map(neighborhood => 
          sql`agencies.agencyNeighborhoods LIKE ${`%"${neighborhood}"%`}` //Corrected table name and field name. Assumes agencyNeighborhoods is a stringified array or contains the neighborhood as a substring.  Adjust as needed based on your database schema.
        ))
      );
    }

    // Ejecutamos la consulta
    const agencies = await query;

    // Verificación adicional para filtrar resultados  (This is redundant given the where clause above. Remove if agencyNeighborhoods is a properly formatted array in the database)
    // if (neighborhoodsStr && neighborhoodsStr.trim() !== '') {
    //   const neighborhoods = neighborhoodsStr.split(',');
    //   // Filtramos manualmente para asegurar que solo se muestran agencias con el barrio seleccionado
    //   return agencies.filter(agency => {
    //     if (!agency.agencyNeighborhoods) return false;
    //     return neighborhoods.some(n => 
    //       agency.agencyNeighborhoods.includes(n) //Assumes agencyNeighborhoods is an array. Adjust if it's a different format.
    //     );
    //   });
    // }

    return agencies;
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
  private parseArrayField(value: string | null | undefined): string[] {
    if (!value) return [];

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
      return value ? [value] : [];
    }
  }

  // Función auxiliar para procesar campos JSON en formato string
  private parseJsonField(value: string | null | undefined): any {
    if (!value) return {};

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
    const neighborhoods = this.parseArrayField(agency.agencyNeighborhoods);
    const languages = this.parseArrayField(agency.agencySupportedLanguages);
    const socialMedia = this.parseJsonField(agency.agencySocialMedia);

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
      // ID de administrador de la agencia
      agencyId: agency.adminAgentId,
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

  async getMostViewedProperties(limit: number = 6): Promise<Property[]> {
    return await db.select()
      .from(properties)
      .orderBy(sql`${properties.viewCount} DESC`)
      .limit(limit);
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
    // Versión simplificada para probar la conexión
    return await db.select().from(properties).limit(10);
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
    const [newRating] = await db.insert(neighborhoodRatings).values(rating).returning();
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