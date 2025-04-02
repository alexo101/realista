import { db } from "./db";
import { eq, sql, and, gte, lte, arrayOverlaps, not, isNull } from "drizzle-orm";
import {
  users,
  properties,
  clients,
  neighborhoodRatings,
  agencyAgents,
  appointments,
  type User,
  type Property,
  type Client,
  type NeighborhoodRating,
  type AgencyAgent,
  type Appointment,
  type InsertUser,
  type InsertProperty,
  type InsertClient,
  type InsertNeighborhoodRating,
  type InsertAgencyAgent,
  type InsertAppointment,
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
  getPropertiesByAgent(agentId: number): Promise<Property[]>;
  searchProperties(filters: any): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: InsertProperty): Promise<Property>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientsByAgent(agentId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client>;

  // Neighborhood Ratings
  getNeighborhoodRatings(neighborhood: string): Promise<NeighborhoodRating[]>;
  createNeighborhoodRating(rating: InsertNeighborhoodRating): Promise<NeighborhoodRating>;
  
  // Appointments
  getAppointmentsByClient(clientId: number): Promise<Appointment[]>;
  getAppointmentsByAgent(agentId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
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

    console.log('SearchAgents - searchTerm:', searchTerm);
    console.log('SearchAgents - neighborhoods:', neighborhoods);

    // Buscar tanto agentes regulares como agentes administrativos
    // Los agentes administrativos son aquellos que tienen agencyName
    let conditionsRegularAgents = [eq(users.isAgent, true)];
    let conditionsAdminAgents = [not(isNull(users.agencyName))];
    
    // Añadir condición de búsqueda por nombre si existe y no está vacío
    if (searchTerm && searchTerm.trim() !== '') {
      const nameCondition = sql`(${users.name} ILIKE ${'%' + searchTerm + '%'} OR 
          ${users.surname} ILIKE ${'%' + searchTerm + '%'} OR 
          ${users.email} ILIKE ${'%' + searchTerm + '%'})`;
      
      conditionsRegularAgents.push(nameCondition);
      conditionsAdminAgents.push(nameCondition);
    }
    
    // Añadir condición de búsqueda por barrios si existen
    if (neighborhoods.length > 0) {
      conditionsRegularAgents.push(
        arrayOverlaps(users.influenceNeighborhoods, neighborhoods)
      );
      conditionsAdminAgents.push(
        arrayOverlaps(users.agencyInfluenceNeighborhoods, neighborhoods)
      );
    }
    
    // Si no hay término de búsqueda ni barrios, mostrar todos los agentes solo si explícitamente
    // se ha solicitado (para autocompletado)
    if (searchTerm.trim() === '' && neighborhoods.length === 0 && !params.get('showAll')) {
      return [];
    }
    
    // Consulta para obtener agentes regulares
    const regularAgentsQuery = db.select()
      .from(users)
      .where(and(...conditionsRegularAgents));
      
    // Consulta para obtener agentes administrativos
    const adminAgentsQuery = db.select()
      .from(users)
      .where(and(...conditionsAdminAgents));
      
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
    
    return uniqueAgents;
  }

  async searchAgencies(query: string): Promise<User[]> {
    // Parsear los parámetros si query es una URL query string
    const params = new URLSearchParams(query);
    const searchTerm = params.get('agencyName') || '';
    const neighborhoodsStr = params.get('neighborhoods');
    const neighborhoods = neighborhoodsStr ? neighborhoodsStr.split(',') : [];

    console.log('SearchAgencies - searchTerm:', searchTerm);
    console.log('SearchAgencies - neighborhoods:', neighborhoods);
    
    // Importante: Buscar solo los usuarios que son agencias (no agentes)
    // Una agencia es un usuario que tiene agencyName no nulo y no es un agente
    let conditions = [
      sql`${users.agencyName} IS NOT NULL`,
      eq(users.isAgent, false)
    ];
    
    // Añadir condición de búsqueda por nombre si existe y no está vacío
    if (searchTerm && searchTerm.trim() !== '') {
      conditions.push(
        sql`${users.agencyName} ILIKE ${'%' + searchTerm + '%'}`
      );
    }
    
    // Añadir condición de búsqueda por barrios si existen
    if (neighborhoods.length > 0) {
      // Debug agencia con barrios de influencia
      console.log('Buscando agencias con barrios:', neighborhoods);
      
      // Modificamos para manejar valores nulos - si agencyInfluenceNeighborhoods es null, 
      // asegurarnos de que se siga evaluando correctamente
      conditions.push(
        sql`${users.agencyInfluenceNeighborhoods} && ${neighborhoods}`
      );
    }
    
    // Si no hay término de búsqueda ni barrios, mostrar todas las agencias solo si explícitamente
    // se ha solicitado (para autocompletado)
    if (searchTerm.trim() === '' && neighborhoods.length === 0 && !params.get('showAll')) {
      return [];
    }
    
    const result = await db.select()
      .from(users)
      .where(and(...conditions));
      
    console.log('SearchAgencies - query conditions:', conditions);
    console.log('SearchAgencies - result count:', result.length);
    
    return result;
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
    return property;
  }

  async getPropertiesByAgent(agentId: number): Promise<Property[]> {
    return db.select().from(properties).where(eq(properties.agentId, agentId));
  }

  async searchProperties(filters: any): Promise<Property[]> {
    let conditions = [] as any[];

    if (filters.neighborhood) {
      conditions.push(eq(properties.neighborhood, filters.neighborhood));
    }
    if (filters.type) {
      conditions.push(eq(properties.type, filters.type));
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

  async createNeighborhoodRating(rating: InsertNeighborhoodRating): Promise<NeighborhoodRating> {
    const [newRating] = await db.insert(neighborhoodRatings).values(rating).returning();
    return newRating;
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
}

export const storage = new DatabaseStorage();