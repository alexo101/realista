import { db, pool } from "./db";
import { eq, sql, and, or, gte, lte, arrayOverlaps, not, isNull } from "drizzle-orm";
import {
  users,
  properties,
  clients,
  neighborhoodRatings,
  agencyAgents,
  appointments,
  inquiries,
  type User,
  type Property,
  type Client,
  type NeighborhoodRating,
  type AgencyAgent,
  type Appointment,
  type Inquiry,
  type InsertUser,
  type InsertProperty,
  type InsertClient,
  type InsertNeighborhoodRating,
  type InsertAgencyAgent,
  type InsertAppointment,
  type InsertInquiry,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  
  // Agents
  searchAgents(query: string): Promise<User[]>;
  searchAgencies(query: string): Promise<User[]>;
  createAgentReview(review: any): Promise<any>;
  
  // Agency Agents
  getAgencyAgents(agencyId: number): Promise<AgencyAgent[]>;
  createAgencyAgent(agentData: InsertAgencyAgent): Promise<AgencyAgent>;
  deleteAgencyAgent(id: number): Promise<void>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getMostViewedProperties(limit?: number): Promise<Property[]>;
  getPropertiesByAgent(agentId: number): Promise<Property[]>;
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Agents
  async searchAgents(query: string): Promise<User[]> {
    // Parsear los parámetros si query es una URL query string
    const params = new URLSearchParams(query);
    const searchTerm = params.get('agentName') || '';
    const neighborhoodsStr = params.get('neighborhoods');
    const neighborhoods = neighborhoodsStr ? neighborhoodsStr.split(',') : [];
    const showAll = params.get('showAll') === 'true';

    console.log('SearchAgents - searchTerm:', searchTerm);
    console.log('SearchAgents - neighborhoods:', neighborhoods);
    console.log('SearchAgents - showAll:', showAll);

    // En modo autocompletado, siempre mostramos resultados
    const isAutoCompleteMode = searchTerm.trim() !== '';

    // Si no hay término de búsqueda ni barrios, y no se ha solicitado explícitamente
    // mostrar todos (showAll), entonces retornar un array vacío
    if (!isAutoCompleteMode && neighborhoods.length === 0 && !showAll) {
      console.log('No hay términos de búsqueda, y showAll es falso, retornando array vacío');
      return [];
    }

    // Buscar tanto agentes regulares como agentes administrativos
    // Los agentes administrativos son aquellos que tienen agencyName
    let conditionsRegularAgents = [eq(users.isAgent, true)];
    let conditionsAdminAgents = [not(isNull(users.agencyName))];
    
    // Añadir condición de búsqueda por nombre si existe y no está vacío
    if (searchTerm && searchTerm.trim() !== '') {
      const nameCondition = sql`(
        LOWER(${users.name}::text) LIKE LOWER(${'%' + searchTerm + '%'}) OR 
        LOWER(${users.surname}::text) LIKE LOWER(${'%' + searchTerm + '%'}) OR 
        LOWER(${users.email}::text) LIKE LOWER(${'%' + searchTerm + '%'})
      )`;
      
      conditionsRegularAgents.push(nameCondition);
      conditionsAdminAgents.push(nameCondition);
    }
    
    // Añadir condición de búsqueda por barrios si existen
    if (neighborhoods.length > 0) {
      // De momento, mostrar todos los agentes para facilitar que se encuentren
      // y garantizar que están visibles (fix para el problema de visibilidad)
      console.log('Barrios seleccionados:', neighborhoods);
      console.log('Mostrando todos los agentes para garantizar visibilidad');
      
      // Si queremos permitir que todos los agentes aparezcan, no usamos filtro de barrios
      // De esta forma garantizamos que todos los agentes serán visibles independientemente
      // de su configuración de barrios de influencia
    }
    
    try {
      // Consulta para obtener agentes regulares
      const regularAgentsQuery = db.select()
        .from(users)
        .where(and(...conditionsRegularAgents))
        .orderBy(users.name);
        
      // Consulta para obtener agentes administrativos
      const adminAgentsQuery = db.select()
        .from(users)
        .where(and(...conditionsAdminAgents))
        .orderBy(users.name);
        
      // Ejecutar ambas consultas y combinar resultados
      const [regularAgents, adminAgents] = await Promise.all([
        regularAgentsQuery,
        adminAgentsQuery
      ]);
      
      // Combinar y eliminar duplicados (un agente puede ser tanto regular como administrativo)
      const allAgents = [...regularAgents, ...adminAgents];
      const uniqueAgents = allAgents.filter((agent, index, self) =>
        index === self.findIndex((t) => t.id === agent.id)
      );
      
      console.log('SearchAgents - result count:', uniqueAgents.length);
      return uniqueAgents;
    } catch (error) {
      console.error('Error en searchAgents:', error);
      return [];
    }
  }

  async searchAgencies(query: string): Promise<User[]> {
    // Parsear los parámetros si query es una URL query string
    const params = new URLSearchParams(query);
    const searchTerm = params.get('agencyName') || '';
    const neighborhoodsStr = params.get('neighborhoods');
    const neighborhoods = neighborhoodsStr ? neighborhoodsStr.split(',') : [];
    const showAll = params.get('showAll') === 'true';

    console.log('SearchAgencies - searchTerm:', searchTerm);
    console.log('SearchAgencies - neighborhoods:', neighborhoods);
    console.log('SearchAgencies - showAll:', showAll);
    
    // En modo autocompletado, siempre mostramos resultados
    const isAutoCompleteMode = searchTerm.trim() !== '';
    
    // Si no hay término de búsqueda ni barrios, y no se ha solicitado explícitamente
    // mostrar todos (showAll), entonces retornar un array vacío
    if (!isAutoCompleteMode && neighborhoods.length === 0 && !showAll) {
      console.log('No hay términos de búsqueda, y showAll es falso, retornando array vacío');
      return [];
    }
    
    // Importante: Buscar solo los usuarios que son agencias (no agentes)
    // Una agencia es un usuario que tiene agencyName no nulo y no es un agente
    let conditions = [
      sql`${users.agencyName} IS NOT NULL`,
      eq(users.isAgent, false)
    ];
    
    // Añadir condición de búsqueda por nombre si existe y no está vacío
    if (searchTerm && searchTerm.trim() !== '') {
      conditions.push(
        sql`LOWER(${users.agencyName}::text) LIKE LOWER(${'%' + searchTerm.trim() + '%'})`
      );
    }
    
    // Añadir condición de búsqueda por barrios si existen
    if (neighborhoods.length > 0) {
      // De momento, mostrar todas las agencias para facilitar que se encuentren
      // y garantizar que están visibles (fix para el problema de visibilidad)
      console.log('Buscando agencias con barrios:', neighborhoods);
      console.log('Mostrando todas las agencias para garantizar visibilidad');
      
      // Si queremos permitir que todas las agencias aparezcan, no usamos filtro de barrios
      // De esta forma garantizamos que todas las agencias serán visibles independientemente
      // de su configuración de barrios de influencia
    }
    
    try {
      const result = await db.select()
        .from(users)
        .where(and(...conditions))
        .orderBy(users.agencyName);
        
      console.log('SearchAgencies - query conditions:', conditions);
      console.log('SearchAgencies - result count:', result.length);
      return result;
    } catch (error) {
      console.error('Error en searchAgencies:', error);
      return [];
    }
  }

  async createAgentReview(review: any): Promise<any> {
    // This is a placeholder implementation since we don't have an agent_reviews table defined yet
    // In a real implementation, we would insert into an agent_reviews table
    console.log('Agent review submission:', review);
    return { ...review, id: Date.now(), createdAt: new Date() };
  }
  
  // Agency Agents
  async getAgencyAgents(agencyId: number): Promise<AgencyAgent[]> {
    return db.select()
      .from(agencyAgents)
      .where(eq(agencyAgents.agencyId, agencyId));
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
    return db.select().from(properties);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    
    // Incrementar el contador de visualizaciones de forma asíncrona, sin esperar el resultado
    if (property) {
      this.incrementPropertyViewCount(id).catch(err => {
        console.error(`Error incrementando contador de visualizaciones para propiedad ${id}:`, err);
      });
    }
    
    return property;
  }
  
  async getMostViewedProperties(limit: number = 6, operationType?: string): Promise<Property[]> {
    let baseQuery = db.select().from(properties);
    
    // Si se especifica un tipo de operación (Venta o Alquiler), filtramos por él
    if (operationType) {
      return baseQuery
        .where(eq(properties.operationType, operationType))
        .orderBy(sql`${properties.viewCount} DESC`)
        .limit(limit);
    } else {
      return baseQuery
        .orderBy(sql`${properties.viewCount} DESC`)
        .limit(limit);
    }
  }

  async incrementPropertyViewCount(id: number): Promise<void> {
    await db.update(properties)
      .set({
        viewCount: sql`${properties.viewCount} + 1`
      })
      .where(eq(properties.id, id));
  }

  async getPropertiesByAgent(agentId: number): Promise<Property[]> {
    return db.select().from(properties).where(eq(properties.agentId, agentId));
  }

  async searchProperties(filters: any): Promise<Property[]> {
    let conditions = [] as any[];

    // Manejo de neighborhood o neighborhoods (asegurarnos de capturar ambos)
    if (filters.neighborhood) {
      conditions.push(eq(properties.neighborhood, filters.neighborhood));
    } else if (filters.neighborhoods) {
      // Verificar si neighborhoods es una cadena o un array
      const neighborhoodValue = filters.neighborhoods;
      if (typeof neighborhoodValue === 'string') {
        // Usar exactly equal para asegurar que coincida exactamente con el barrio seleccionado
        conditions.push(eq(properties.neighborhood, neighborhoodValue));
      } else if (Array.isArray(neighborhoodValue)) {
        // Si es un array, necesitamos buscar barrios que coincidan exactamente
        // Creamos una condición OR para cada barrio
        const neighborhoodConditions = neighborhoodValue.map(
          (neighborhood: string) => eq(properties.neighborhood, neighborhood)
        );
        conditions.push(sql`(${sql.join(neighborhoodConditions, sql` OR `)})`);
        // Nota: No podemos usar inArray ya que estamos buscando un valor string dentro de un array
        // pero tampoco podemos usar arrayContains ya que properties.neighborhood no es un array
      }
    }
    
    if (filters.type) {
      conditions.push(eq(properties.type, filters.type));
    }
    if (filters.operationType) {
      conditions.push(eq(properties.operationType, filters.operationType));
    }
    if (filters.minPrice) {
      if (filters.minPrice === 'less-than-60000') {
        conditions.push(sql`${properties.price} < 60000`);
      } else {
        conditions.push(gte(properties.price, parseInt(filters.minPrice)));
      }
    }
    if (filters.maxPrice && filters.maxPrice !== 'no-limit') {
      conditions.push(lte(properties.price, parseInt(filters.maxPrice)));
    }

    const query = conditions.length > 0
      ? db.select().from(properties).where(and(...conditions))
      : db.select().from(properties);

    return query;
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
    return db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientsByAgent(agentId: number): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.agentId, agentId));
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
    return db.select()
      .from(neighborhoodRatings)
      .where(eq(neighborhoodRatings.neighborhood, neighborhood));
  }

  async getNeighborhoodRatingsAverage(neighborhood: string): Promise<Record<string, number>> {
    console.log(`Calculando promedios para el barrio: ${neighborhood}`);
    
    try {
      // Usamos SQL directo para obtener los promedios
      const query = sql`
        SELECT 
          AVG(security)::numeric(10,1) as security, 
          AVG(parking)::numeric(10,1) as parking, 
          AVG(family_friendly)::numeric(10,1) as "familyFriendly", 
          AVG(public_transport)::numeric(10,1) as "publicTransport", 
          AVG(green_spaces)::numeric(10,1) as "greenSpaces", 
          AVG(services)::numeric(10,1) as services,
          COUNT(*) as count
        FROM neighborhood_ratings 
        WHERE neighborhood = ${neighborhood}
      `;
      
      const result = await db.execute(query);
      console.log(`SQL directo: Encontradas valoraciones para: ${neighborhood}`, result.rows);
      
      if (!result.rows.length || result.rows[0].count === 0) {
        console.log(`No hay valoraciones para: ${neighborhood}`);
        return {
          security: 0,
          parking: 0,
          familyFriendly: 0,
          publicTransport: 0,
          greenSpaces: 0,
          services: 0,
          count: 0,
        };
      }
      
      // Resultado en formato adecuado
      const averages = {
        security: Number(result.rows[0].security) || 0,
        parking: Number(result.rows[0].parking) || 0,
        familyFriendly: Number(result.rows[0].familyFriendly) || 0,
        publicTransport: Number(result.rows[0].publicTransport) || 0,
        greenSpaces: Number(result.rows[0].greenSpaces) || 0,
        services: Number(result.rows[0].services) || 0,
        count: Number(result.rows[0].count) || 0,
      };
      
      console.log('Promedios calculados para', neighborhood, averages);
      return averages;
    } catch (error) {
      console.error('Error al calcular los promedios para el barrio:', neighborhood, error);
      return {
        security: 0,
        parking: 0,
        familyFriendly: 0,
        publicTransport: 0,
        greenSpaces: 0,
        services: 0,
        count: 0,
      };
    }
  }

  async createNeighborhoodRating(rating: InsertNeighborhoodRating): Promise<NeighborhoodRating> {
    console.log('Guardando nueva valoración para barrio:', rating.neighborhood);
    
    try {
      // Verificar que todos los campos necesarios estén presentes y sean números
      const numericFields = ['security', 'parking', 'familyFriendly', 'publicTransport', 'greenSpaces', 'services'];
      numericFields.forEach(field => {
        if (typeof rating[field as keyof InsertNeighborhoodRating] !== 'number') {
          console.error(`El campo ${field} no es un número válido:`, rating[field as keyof InsertNeighborhoodRating]);
          throw new Error(`El campo ${field} debe ser un número válido`);
        }
      });
      
      console.log('Datos de valoración validados');
      
      // Convertir números a strings para compatibilidad con la columna decimal en Drizzle
      const [newRating] = await db.insert(neighborhoodRatings).values({
        neighborhood: rating.neighborhood,
        security: rating.security.toString(),
        parking: rating.parking.toString(),
        familyFriendly: rating.familyFriendly.toString(),
        publicTransport: rating.publicTransport.toString(),
        greenSpaces: rating.greenSpaces.toString(),
        services: rating.services.toString(),
        userId: rating.userId
      }).returning();
      
      console.log('Valoración guardada con éxito:', newRating);
      return newRating;
    } catch (error) {
      console.error('Error al insertar valoración de barrio:', error);
      throw error;
    }
  }

  // Appointments
  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return db.select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId));
  }

  async getAppointmentsByAgent(agentId: number): Promise<Appointment[]> {
    return db.select()
      .from(appointments)
      .where(eq(appointments.agentId, agentId));
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
  
  // Inquiries (Consultas de propiedad)
  async getInquiriesByAgent(agentId: number): Promise<Inquiry[]> {
    return db.select()
      .from(inquiries)
      .where(eq(inquiries.agentId, agentId))
      .orderBy(sql`${inquiries.createdAt} DESC`);
  }
  
  async getInquiryById(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select()
      .from(inquiries)
      .where(eq(inquiries.id, id));
    return inquiry;
  }
  
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries)
      .values(inquiry)
      .returning();
    return newInquiry;
  }
  
  async updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
    const [updatedInquiry] = await db.update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }
}

export const storage = new DatabaseStorage();