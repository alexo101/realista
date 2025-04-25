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
    const [updatedUser] = await db
      .update(agents)
      .set(userData)
      .where(eq(agents.id, id))
      .returning();
    return updatedUser;
  }

  // Agents
  async searchAgents(query: string): Promise<User[]> {
    // Versión simplificada para probar la conexión
    return await db.select().from(agents).limit(10);
  }

  async searchAgencies(query: string): Promise<User[]> {
    // Versión simplificada para probar la conexión
    return await db.select().from(agents).limit(10);
  }

  async getAgentById(id: number): Promise<User | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAgencyById(id: number): Promise<User | undefined> {
    // Como tenemos compatibilidad hacia atrás con User = Agent
    // convertimos la agencia a formato agente para devolver
    const [agency] = await db.select().from(agencies).where(eq(agencies.id, id));
    if (!agency) return undefined;
    
    // Convertir formato agencia a agente para mantener compatibilidad
    const agentFormat = {
      id: agency.id,
      email: "agency@example.com", // Dummy email para cumplir con el tipo
      password: "", // Dummy password para cumplir con el tipo
      name: agency.agencyName,
      description: agency.agencyDescription,
      avatar: agency.agencyLogo
      // Otros campos requeridos por el tipo
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
    return await db.select()
      .from(properties)
      .where(eq(properties.agentId, agentId))
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