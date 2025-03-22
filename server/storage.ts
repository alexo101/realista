import { db } from "./db";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import {
  users,
  properties,
  clients,
  neighborhoodRatings,
  type User,
  type Property,
  type Client,
  type NeighborhoodRating,
  type InsertUser,
  type InsertProperty,
  type InsertClient,
  type InsertNeighborhoodRating,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByAgent(agentId: number): Promise<Property[]>;
  searchProperties(filters: any): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientsByAgent(agentId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;

  // Neighborhood Ratings
  getNeighborhoodRatings(neighborhood: string): Promise<NeighborhoodRating[]>;
  createNeighborhoodRating(rating: InsertNeighborhoodRating): Promise<NeighborhoodRating>;
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
}

export const storage = new DatabaseStorage();