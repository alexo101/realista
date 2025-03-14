import {
  type Property,
  type Agent,
  type Inquiry,
  type Favorite,
  type InsertProperty,
  type InsertAgent,
  type InsertInquiry,
  type InsertFavorite,
} from "@shared/schema";

export interface IStorage {
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
  
  // Favorites
  getFavorites(userId: string): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private properties: Map<number, Property>;
  private agents: Map<number, Agent>;
  private inquiries: Map<number, Inquiry>;
  private favorites: Map<number, Favorite>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.properties = new Map();
    this.agents = new Map();
    this.inquiries = new Map();
    this.favorites = new Map();
    this.currentIds = {
      property: 1,
      agent: 1,
      inquiry: 1,
      favorite: 1,
    };

    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Add mock agents
    const mockAgents: InsertAgent[] = [
      {
        name: "Sarah Johnson",
        email: "sarah.j@realista.com",
        phone: "+1 (555) 123-4567",
        photo: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
      },
      // Add more mock agents...
    ];

    mockAgents.forEach(agent => this.createAgent(agent));

    // Add mock properties
    const mockProperties: InsertProperty[] = [
      {
        title: "Modern Downtown Apartment",
        description: "Luxurious apartment with stunning city views",
        price: 450000,
        bedrooms: 2,
        bathrooms: 2,
        squareMeters: 85,
        location: "Downtown",
        type: "apartment",
        images: [
          "https://images.unsplash.com/photo-1626127587640-88cc66a25c67",
          "https://images.unsplash.com/photo-1625438961829-5a1c8f1dc742"
        ],
        features: ["Elevator", "Parking", "Air Conditioning"],
        agentId: 1
      },
      // Add more mock properties...
    ];

    mockProperties.forEach(property => this.createProperty(property));
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async searchProperties(query: string, filters: any): Promise<Property[]> {
    let properties = Array.from(this.properties.values());
    
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      properties = properties.filter(p => 
        p.title.toLowerCase().includes(lowercaseQuery) ||
        p.location.toLowerCase().includes(lowercaseQuery)
      );
    }

    if (filters) {
      if (filters.minPrice) properties = properties.filter(p => p.price >= filters.minPrice);
      if (filters.maxPrice) properties = properties.filter(p => p.price <= filters.maxPrice);
      if (filters.bedrooms) properties = properties.filter(p => p.bedrooms >= filters.bedrooms);
      if (filters.type) properties = properties.filter(p => p.type === filters.type);
    }

    return properties;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.currentIds.property++;
    const newProperty = { ...property, id };
    this.properties.set(id, newProperty);
    return newProperty;
  }

  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.currentIds.agent++;
    const newAgent = { ...agent, id };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  // Inquiry methods
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.currentIds.inquiry++;
    const newInquiry = { ...inquiry, id };
    this.inquiries.set(id, newInquiry);
    return newInquiry;
  }

  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values());
  }

  // Favorite methods
  async getFavorites(userId: string): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(f => f.userId === userId);
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentIds.favorite++;
    const newFavorite = { ...favorite, id };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }

  async deleteFavorite(id: number): Promise<void> {
    this.favorites.delete(id);
  }
}

export const storage = new MemStorage();
