import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users,
  properties,
  agents,
  inquiries,
  type User,
  type Property,
  type Agent,
  type Inquiry,
  type InsertUser,
  type InsertProperty,
  type InsertAgent,
  type InsertInquiry,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  searchProperties(query: string, filters: any): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;

  // Agents
  getAgent(id: number): Promise<Agent | undefined>;
  getAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;

  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiries(): Promise<Inquiry[]>;
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

  async searchProperties(query: string, filters: any): Promise<Property[]> {
    let propertiesQuery = db.select().from(properties);

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      propertiesQuery = propertiesQuery.where(
        eq(properties.location, query)
      );
    }

    const results = await propertiesQuery;
    return results;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  // Agents
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAgents(): Promise<Agent[]> {
    return db.select().from(agents);
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db.insert(agents).values(agent).returning();
    return newAgent;
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async getInquiries(): Promise<Inquiry[]> {
    return db.select().from(inquiries);
  }
}

export const storage = new DatabaseStorage();