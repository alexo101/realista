import { db } from "./db";
import { cache } from "./cache";
import {
  eq,
  sql,
  and,
  or,
  gte,
  lte,
  arrayOverlaps,
  not,
  isNull,
  desc,
  inArray,
} from "drizzle-orm";
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
  type UserWithReviews,
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
  type InsertReview,
  clientFavoriteAgents,
  clientFavoriteProperties,
  propertyVisitRequests,
  type ClientFavoriteAgent,
  type InsertClientFavoriteAgent,
  type ClientFavoriteProperty,
  type InsertClientFavoriteProperty,
  type PropertyVisitRequest,
  type InsertPropertyVisitRequest,
  agentEvents,
  type AgentEvent,
  type InsertAgentEvent,
  fraudReports,
  type FraudReport,
  type InsertFraudReport,
} from "@shared/schema";

export interface IStorage {
  // Users/Agents
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertAgent): Promise<User>;
  updateUser(id: number, userData: Partial<InsertAgent>): Promise<User>;

  // Agents/Agencies Search & Profiles
  searchAgents(query: string): Promise<UserWithReviews[]>;
  searchAgencies(query: string): Promise<User[]>;
  getAgentById(id: number): Promise<User | undefined>;
  getAgencyById(id: number): Promise<User | undefined>;
  createAgentReview(review: InsertReview): Promise<Review>;
  getAgentReviews(agentId: number): Promise<Review[]>; // Obtener las reseñas de un agente
  getAgencyReviews(agencyId: number): Promise<Review[]>; // Obtener las reseñas de una agencia
  respondToReview(reviewId: number, response: string): Promise<Review>; // Responder a una reseña

  // Multi-agency management
  getAgenciesByAdmin(adminAgentId: number): Promise<Agency[]>; // Obtener todas las agencias de un administrador
  createAgency(agency: Partial<InsertAgency>): Promise<Agency>; // Crear una nueva agencia
  updateAgency(id: number, agency: Partial<InsertAgency>): Promise<Agency>; // Actualizar una agencia existente
  deleteAgency(id: number): Promise<void>; // Eliminar una agencia

  // Agency Agents
  getAgencyAgents(agencyId: number): Promise<User[]>;
  createAgencyAgent(agentData: InsertAgencyAgent): Promise<AgencyAgent>;
  deleteAgencyAgent(id: number): Promise<void>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getMostViewedProperties(limit?: number): Promise<Property[]>;
  getPropertiesByAgent(agentId: number): Promise<Property[]>;
  getAllPropertiesByAgent(agentId: number): Promise<Property[]>;
  getPropertiesByAgency(agencyId: number): Promise<Property[]>;
  searchProperties(filters: any): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: InsertProperty): Promise<Property>;
  updatePropertyAddress(id: number, address: string, lat?: number, lng?: number): Promise<Property>;
  deleteProperty(id: number): Promise<void>;
  togglePropertyStatus(id: number, isActive: boolean): Promise<Property>;
  incrementPropertyViewCount(id: number): Promise<void>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientsByAgent(agentId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client>;

  // Neighborhood Ratings
  getNeighborhoodRatings(neighborhood: string): Promise<NeighborhoodRating[]>;
  getNeighborhoodRatingsAverage(
    neighborhood: string,
  ): Promise<Record<string, number>>;
  createNeighborhoodRating(
    rating: InsertNeighborhoodRating,
  ): Promise<NeighborhoodRating>;

  // Appointments
  getAppointmentsByClient(clientId: number): Promise<Appointment[]>;
  getAppointmentsByAgent(agentId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(
    id: number,
    appointment: Partial<InsertAppointment>,
  ): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  // Inquiries (Consultas de propiedad)
  getInquiriesByAgent(agentId: number): Promise<Inquiry[]>;
  getInquiryById(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry>;

  // Client favorite agents
  getFavoriteAgentsByClient(clientId: number): Promise<User[]>;
  toggleFavoriteAgent(clientId: number, agentId: number): Promise<boolean>;
  isFavoriteAgent(clientId: number, agentId: number): Promise<boolean>;
  getBatchFavoriteAgentStatus(clientId: number, agentIds: number[]): Promise<{ [key: number]: boolean }>;

  // Client favorite properties
  getFavoritePropertiesByClient(clientId: number): Promise<Property[]>;
  toggleFavoriteProperty(clientId: number, propertyId: number): Promise<boolean>;
  isFavoriteProperty(clientId: number, propertyId: number): Promise<boolean>;
  getBatchFavoritePropertyStatus(clientId: number, propertyIds: number[]): Promise<{ [key: number]: boolean }>;

  // Property visit requests
  createPropertyVisitRequest(visitRequest: InsertPropertyVisitRequest): Promise<PropertyVisitRequest>;
  getPropertyVisitRequestsByClient(clientId: number): Promise<PropertyVisitRequest[]>;
  getPropertyVisitRequestsByAgent(agentId: number): Promise<PropertyVisitRequest[]>;
  updatePropertyVisitRequestStatus(id: number, status: string, agentNotes?: string): Promise<PropertyVisitRequest>;

  // Agent Calendar Events
  createAgentEvent(eventData: InsertAgentEvent): Promise<AgentEvent>;
  getAgentEvents(agentId: number, startDate?: string, endDate?: string): Promise<AgentEvent[]>;
  updateAgentEvent(id: number, eventData: Partial<InsertAgentEvent>): Promise<AgentEvent>;
  deleteAgentEvent(id: number): Promise<void>;

  // Fraud Reporting
  createFraudReport(reportData: InsertFraudReport): Promise<FraudReport>;
  checkRecentFraudReport(propertyId: number, reporterIp: string): Promise<boolean>;
  incrementPropertyFraudCount(propertyId: number): Promise<Property | undefined>;
  getPropertyById(propertyId: number): Promise<Property | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(agents).where(eq(agents.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(agents)
      .where(eq(agents.email, email));
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
        if (
          key !== "where" &&
          key !== "from" &&
          key !== "select" &&
          key !== "order" &&
          key !== "group" &&
          key !== "having" &&
          key !== "limit" &&
          key !== "join"
        ) {
          cleanedUserData[key] = userData[key as keyof typeof userData];
        }
      }

      console.log(
        "Updating user with cleaned data:",
        Object.keys(cleanedUserData),
      );
      console.log(
        "Full cleaned user data:",
        JSON.stringify(cleanedUserData, null, 2),
      );

      const [updatedUser] = await db
        .update(agents)
        .set(cleanedUserData)
        .where(eq(agents.id, id))
        .returning();

      console.log(
        "User after update:",
        JSON.stringify(updatedUser, null, 2),
      );

      return updatedUser;
    } catch (error) {
      console.error("Error in updateUser SQL:", error);
      throw error;
    }
  }

  // Agents
  async searchAgents(queryString: string): Promise<UserWithReviews[]> {
    try {
      // Parseamos los parámetros de la URL
      const params = new URLSearchParams(queryString);
      const showAll = params.get("showAll") === "true";
      const agentName = params.get("agentName");
      const neighborhoodsStr = params.get("neighborhoods");

      console.log(`Buscando agentes con params: showAll=${showAll}, agentName=${agentName}, neighborhoods=${neighborhoodsStr}`);

      // First, get the agents with standard filtering
      let dbQuery = db.select().from(agents);

      // Filtrar por nombre o apellido de agente si se proporciona
      if (agentName && agentName.trim() !== "") {
        dbQuery = dbQuery.where(
          or(
            sql`${agents.name} ILIKE ${`%${agentName}%`}`,
            sql`${agents.surname} ILIKE ${`%${agentName}%`}`
          )
        );
      }

      // Filtrar por barrios si se proporcionan
      if (neighborhoodsStr && neighborhoodsStr.trim() !== "") {
        const neighborhoods = neighborhoodsStr.split(",");
        console.log(`Filtrando agentes por barrios: ${neighborhoods.join(', ')}`);

        // Usamos la sintaxis directa de PostgreSQL para arrays
        const arrayQuery = `ARRAY[${neighborhoods.map(n => `'${n.replace(/'/g, "''")}'`).join(',')}]::text[]`;
        
        dbQuery = dbQuery.where(
          sql`${agents.influenceNeighborhoods} && ${sql.raw(arrayQuery)}`
        );
      }

      // Limitamos los resultados para evitar sobrecargar la respuesta
      dbQuery = dbQuery.limit(10);

      console.log(`Ejecutando búsqueda de agentes...`);
      const agentResults = await dbQuery;
      console.log(`Found ${agentResults.length} agents in the database`);

      // Now enhance each agent with review statistics
      const enhancedAgents = await Promise.all(
        agentResults.map(async (agent) => {
          const reviewStats = await db
            .select({
              reviewCount: sql<number>`COUNT(*)`,
              reviewAverage: sql<number>`ROUND(AVG(rating), 2)`,
            })
            .from(reviews)
            .where(
              and(
                eq(reviews.targetId, agent.id),
                eq(reviews.targetType, 'agent')
              )
            );

          const stats = reviewStats[0];
          return {
            ...agent,
            reviewCount: Number(stats?.reviewCount) || 0,
            reviewAverage: Number(stats?.reviewAverage) || 0,
          };
        })
      );

      return enhancedAgents;
    } catch (error) {
      console.error("Error en searchAgents:", error);
      throw error;
    }
  }

  async searchAgencies(queryString: string): Promise<User[]> {
    try {
      // Parseamos los parámetros de la URL
      const params = new URLSearchParams(queryString);
      const showAll = params.get("showAll") === "true";
      const agencyName = params.get("agencyName");
      const neighborhoodsStr = params.get("neighborhoods");

      console.log(`Buscando agencias con params: showAll=${showAll}, agencyName=${agencyName}, neighborhoods=${neighborhoodsStr}`);

      let dbQuery = db.select().from(agencies);

      // Filtrar por nombre o apellido de agente si se proporciona
      if (agencyName && agencyName.trim() !== "") {
        dbQuery = dbQuery.where(
          sql`${agencies.agencyName} ILIKE ${`%${agencyName}%`}`
        );
      }

      // Filtrar por barrios si se proporcionan
      if (neighborhoodsStr && neighborhoodsStr.trim() !== "") {
        const neighborhoods = neighborhoodsStr.split(",");
        console.log(`Filtrando agentes por barrios: ${neighborhoods.join(', ')}`);

        // For now, skip neighborhood filtering since the column might not be properly set up
        // This allows the agencies tab to work while we fix the database structure
        console.log(`Note: Skipping neighborhood filtering for agencies until database is properly configured`);
        // TODO: Fix the agencyInfluenceNeighborhoods column to be a proper text array
      }

      // Limitamos los resultados para evitar sobrecargar la respuesta
      dbQuery = dbQuery.limit(10);

      // Ejecutamos la consulta
      console.log(`Ejecutando búsqueda de agencias...`);
      const agencyResults = await dbQuery;
      console.log(`Found ${agencyResults.length} agencies in the database`);

      // Enrich agencies with review statistics (matching agency profile calculation)
      const enhancedAgencies = await Promise.all(
        agencyResults.map(async (agency) => {
          // Get direct agency reviews
          const agencyReviewStats = await db
            .select({
              reviewCount: sql<number>`count(*)::integer`,
              reviewAverage: sql<number>`COALESCE(ROUND(AVG(${reviews.rating}), 2), 0)::float`,
            })
            .from(reviews)
            .where(
              and(
                eq(reviews.targetId, agency.id),
                eq(reviews.targetType, 'agency')
              )
            );

          const agencyStats = agencyReviewStats[0];
          const agencyScore = Number(agencyStats?.reviewAverage) || 0;
          const agencyReviewCount = Number(agencyStats?.reviewCount) || 0;

          // Get reviews from linked agents (matching agency profile logic)
          const linkedAgentReviews = await db.execute(
            sql`SELECT COUNT(r.*)::integer as agent_review_count, 
                       COALESCE(ROUND(AVG(r.rating), 2), 0)::float as agent_review_average
                FROM reviews r 
                JOIN agents a ON r.target_id = a.id 
                WHERE a.agency_id = ${agency.id.toString()} AND r.target_type = 'agent'`
          );

          const agentReviewCount = linkedAgentReviews.rows[0]?.agent_review_count || 0;
          const agentReviewAverage = linkedAgentReviews.rows[0]?.agent_review_average || 0;

          // Calculate combined score (matching agency profile logic)
          const totalReviews = agencyReviewCount + Number(agentReviewCount);
          let finalScore = 0;
          
          if (totalReviews > 0) {
            if (agencyScore > 0 && agentReviewAverage > 0) {
              finalScore = (agencyScore + Number(agentReviewAverage)) / 2;
            } else if (agencyScore > 0) {
              finalScore = agencyScore;
            } else {
              finalScore = Number(agentReviewAverage);
            }
          }

          const stats = {
            reviewCount: totalReviews,
            reviewAverage: finalScore
          };

          // Procesar los campos que deberían ser arrays
          const neighborhoods = this.parseArrayField(agency.agencyInfluenceNeighborhoods);
          const languages = this.parseArrayField(agency.agencySupportedLanguages);

          // Asegurarnos de que agencySocialMedia sea un objeto
          const socialMedia = agency.agencySocialMedia
            ? this.parseJsonField(agency.agencySocialMedia as object | string)
            : {};

          // Formato compatible con User
          return {
            id: agency.id,
            email: agency.agencyEmailToDisplay || "agency@example.com",
            password: "",
            name: agency.agencyName,
            surname: null,
            description: agency.agencyDescription,
            avatar: agency.agencyLogo,
            agencyLogo: agency.agencyLogo,
            createdAt: agency.createdAt || new Date(),
            influenceNeighborhoods: neighborhoods,
            yearsOfExperience: null,
            languagesSpoken: languages,
            agencyId: String(agency.adminAgentId),
            isAdmin: false,
            agencyName: agency.agencyName,
            agencyWebsite: agency.agencyWebsite,
            agencySocialMedia: socialMedia,
            agencyActiveSince: agency.agencyActiveSince,
            agencyAddress: agency.agencyAddress,
            agencyInfluenceNeighborhoods: neighborhoods,
            // Review statistics
            reviewCount: Number(stats?.reviewCount) || 0,
            reviewAverage: Number(stats?.reviewAverage) || 0,
            isAgent: false,
            isAgency: true,
          } as User;
        })
      );

      return enhancedAgencies;
    } catch (error) {
      console.error("Error en searchAgencies:", error);
      throw error;
    }
  }

  async getAgentById(id: number): Promise<User | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    if (!agent) return undefined;

    // Get review statistics for this agent using a direct query
    const reviewResults = await db.execute(
      sql`SELECT COUNT(*)::integer as count, COALESCE(ROUND(AVG(rating), 2), 0)::float as average 
          FROM reviews 
          WHERE target_id = ${id} AND target_type = 'agent'`
    );

    const reviewCount = reviewResults.rows[0]?.count || 0;
    const reviewAverage = reviewResults.rows[0]?.average || 0;

    // Return agent with review statistics
    return {
      ...agent,
      isAgent: true,
      isAgency: false,
      reviewCount: Number(reviewCount),
      reviewAverage: Number(reviewAverage),
    } as any;
  }

  // Función auxiliar para procesar campos de array en formato PostgreSQL
  private parseArrayField(
    value: string | string[] | null | undefined,
  ): string[] {
    // Si es null o undefined, devolver array vacío
    if (!value) return [];

    // Si ya es un array, simplemente devolverlo
    if (Array.isArray(value)) return value;

    // Quitar las llaves { } y dividir por comas
    try {
      // Eliminar las llaves { } externas
      const cleanedValue = value.replace(/^\{|\}$/g, "");

      // Dividir por comas, pero respetando las comillas
      const result: string[] = [];
      let currentItem = "";
      let inQuotes = false;

      for (let i = 0; i < cleanedValue.length; i++) {
        const char = cleanedValue[i];

        if (char === '"' && (i === 0 || cleanedValue[i - 1] !== "\\")) {
          inQuotes = !inQuotes;
          // No añadimos el caracter de comillas al item
        } else if (char === "," && !inQuotes) {
          result.push(currentItem.trim());
          currentItem = "";
        } else {
          currentItem += char;
        }
      }

      if (currentItem) {
        result.push(currentItem.trim());
      }

      // Eliminar comillas restantes
      return result.map((item) =>
        item.startsWith('"') && item.endsWith('"')
          ? item.substring(1, item.length - 1)
          : item,
      );
    } catch (error) {
      console.error("Error al parsear campo de array:", error);
      return typeof value === "string" ? [value] : [];
    }
  }

  // Función auxiliar para procesar campos JSON en formato string o objeto
  private parseJsonField(value: string | object | null | undefined): any {
    // Si es null o undefined, devolver objeto vacío
    if (!value) return {};

    // Si ya es un objeto, simplemente devolverlo
    if (typeof value === "object") return value;

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error("Error al parsear campo JSON:", error);
      return {};
    }
  }

  async getAgencyById(id: number): Promise<User | undefined> {
    // Como tenemos compatibilidad hacia atrás con User = Agent
    // convertimos la agencia a formato agente para devolver
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, id));
    if (!agency) return undefined;

    // Get review statistics for this agency (matching agency profile calculation)
    // Get direct agency reviews
    const agencyReviewResults = await db.execute(
      sql`SELECT COUNT(*)::integer as count, COALESCE(ROUND(AVG(rating), 2), 0)::float as average 
          FROM reviews 
          WHERE target_id = ${id} AND target_type = 'agency'`
    );

    const agencyReviewCount = agencyReviewResults.rows[0]?.count || 0;
    const agencyScore = agencyReviewResults.rows[0]?.average || 0;

    // Get reviews from linked agents
    const linkedAgentReviews = await db.execute(
      sql`SELECT COUNT(r.*)::integer as agent_review_count, 
                 COALESCE(ROUND(AVG(r.rating), 2), 0)::float as agent_review_average
          FROM reviews r 
          JOIN agents a ON r.target_id = a.id 
          WHERE a.agency_id = ${id.toString()} AND r.target_type = 'agent'`
    );

    const agentReviewCount = linkedAgentReviews.rows[0]?.agent_review_count || 0;
    const agentReviewAverage = linkedAgentReviews.rows[0]?.agent_review_average || 0;

    // Calculate combined score (matching agency profile logic)
    const totalReviews = Number(agencyReviewCount) + Number(agentReviewCount);
    let finalScore = 0;
    
    if (totalReviews > 0) {
      if (agencyScore > 0 && agentReviewAverage > 0) {
        finalScore = (Number(agencyScore) + Number(agentReviewAverage)) / 2;
      } else if (agencyScore > 0) {
        finalScore = Number(agencyScore);
      } else {
        finalScore = Number(agentReviewAverage);
      }
    }

    const reviewCount = totalReviews;
    const reviewAverage = finalScore;

    // Procesar los campos que deberían ser arrays
    const neighborhoods = this.parseArrayField(
      agency.agencyInfluenceNeighborhoods,
    );
    const languages = this.parseArrayField(agency.agencySupportedLanguages);

    // Asegurarnos de que agencySocialMedia sea un objeto o string antes de procesarlo
    const socialMedia = agency.agencySocialMedia
      ? this.parseJsonField(agency.agencySocialMedia as object | string)
      : {};

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
      // Review statistics
      reviewCount: Number(reviewCount),
      reviewAverage: Number(reviewAverage),
      // Flag para diferenciar agentes de agencias
      isAgent: false,
      isAgency: true,
    } as User;

    return agentFormat;
  }

  async createAgentReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getAgentReviews(agentId: number): Promise<Review[]> {
    try {
      const result = await db
        .select()
        .from(reviews)
        .where(
          and(eq(reviews.targetId, agentId), eq(reviews.targetType, "agent")),
        )
        .orderBy(sql`${reviews.date} DESC`);
      return result;
    } catch (error) {
      console.error("Error obteniendo reseñas del agente:", error);
      return [];
    }
  }

  async getAgencyReviews(agencyId: number): Promise<Review[]> {
    try {
      const result = await db
        .select()
        .from(reviews)
        .where(
          and(eq(reviews.targetId, agencyId), eq(reviews.targetType, "agency")),
        )
        .orderBy(sql`${reviews.date} DESC`);
      return result;
    } catch (error) {
      console.error("Error obteniendo reseñas de la agencia:", error);
      return [];
    }
  }

  // Método para responder a una reseña
  async respondToReview(reviewId: number, response: string): Promise<Review> {
    try {
      console.log(`Respondiendo a reseña ${reviewId} con respuesta: ${response}`);

      const [updatedReview] = await db
        .update(reviews)
        .set({
          agentResponse: response,
          responseDate: new Date()
        })
        .where(eq(reviews.id, reviewId))
        .returning();

      if (!updatedReview) {
        throw new Error(`No se encontró la reseña con ID ${reviewId}`);
      }

      return updatedReview;
    } catch (error) {
      console.error(`Error al responder a la reseña ${reviewId}:`, error);
      throw new Error(`No se pudo guardar la respuesta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // Multi-agency management methods
  async getAgenciesByAdmin(adminAgentId: number): Promise<Agency[]> {
    try {
      console.log(`Fetching agencies for admin with ID: ${adminAgentId}`);

      const result = await db
        .select()
        .from(agencies)
        .where(eq(agencies.adminAgentId, adminAgentId))
        .orderBy(agencies.agencyName);

      console.log(`Found ${result.length} agencies for admin ${adminAgentId}`);
      return result;
    } catch (error) {
      console.error("Error fetching agencies by admin:", error);
      return [];
    }
  }

  async createAgency(agencyData: Partial<InsertAgency>): Promise<Agency> {
    try {
      console.log("Creating agency with data:", agencyData);

      // Validamos que tengamos un adminAgentId
      if (!agencyData.adminAgentId) {
        throw new Error("Missing required adminAgentId field");
      }

      // Aseguramos que el nombre de agencia existe
      if (!agencyData.agencyName) {
        throw new Error("Missing required agencyName field");
      }

      // Insertamos la agencia
      const [newAgency] = await db
        .insert(agencies)
        .values({
          agencyName: agencyData.agencyName,
          agencyAddress: agencyData.agencyAddress || null,
          agencyDescription: agencyData.agencyDescription || null,
          agencyLogo: agencyData.agencyLogo || null,
          agencyInfluenceNeighborhoods:
            agencyData.agencyInfluenceNeighborhoods || [],
          agencySupportedLanguages: agencyData.agencySupportedLanguages || [],
          adminAgentId: agencyData.adminAgentId,
          agencyWebsite: agencyData.agencyWebsite || null,
          agencySocialMedia: agencyData.agencySocialMedia || null,
          agencyEmailToDisplay: agencyData.agencyEmailToDisplay || null,
          agencyActiveSince: agencyData.agencyActiveSince || null,
        })
        .returning();

      console.log("Agency created successfully:", newAgency);
      return newAgency;
    } catch (error) {
      console.error("Error creating agency:", error);
      throw new Error(
        `Failed to create agency: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateAgency(
    id: number,
    agencyData: Partial<InsertAgency>,
  ): Promise<Agency> {
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
      const [updatedAgency] = await db
        .update(agencies)
        .set(updateData)
        .where(eq(agencies.id, id))
        .returning();

      if (!updatedAgency) {
        throw new Error(`Agency with ID ${id} not found`);
      }

      console.log("Agency updated successfully:", updatedAgency);
      return updatedAgency;
    } catch (error) {
      console.error("Error updating agency:", error);
      throw new Error(
        `Failed to update agency: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async deleteAgency(id: number): Promise<void> {
    try {
      console.log(`Deleting agency ${id}`);

      // Verificamos que la agencia existe
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, id));

      if (!agency) {
        throw new Error(`Agency with ID ${id} not found`);
      }

      // Eliminamos la agencia
      await db.delete(agencies).where(eq(agencies.id, id));

      console.log(`Agency ${id} deleted successfully`);
    } catch (error) {
      console.error("Error deleting agency:", error);
      throw new Error(
        `Failed to delete agency: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Agency Agents
  async getAgencyAgents(agencyId: number): Promise<User[]> {
    try {
      console.log(`Buscando agentes con agencyId = ${agencyId}`);

      // Convertimos el ID de la agencia a string para la comparación con el campo agencyId
      const agencyIdStr = agencyId.toString();

      // Seleccionamos los agentes que pertenecen a esta agencia
      const result = await db
        .select()
        .from(agents)
        .where(eq(agents.agencyId, agencyIdStr))
        .orderBy(agents.name);

      console.log(`Encontrados ${result.length} agentes vinculados a la agencia ${agencyId}`);

      // Para cada agente, obtenemos su puntuación y número de reseñas
      const agentsWithReviews = await Promise.all(
        result.map(async (agent) => {
          const reviews = await this.getAgentReviews(agent.id);

          // Calculamos el promedio de puntuación si hay reseñas
          let reviewAverage = 0;
          if (reviews.length > 0) {
            const sum = reviews.reduce((acc, review) => acc + Number(review.rating), 0);
            reviewAverage = sum / reviews.length;
          }

          return {
            ...agent,
            reviewCount: reviews.length,
            reviewAverage: reviewAverage
          };
        })
      );

      return agentsWithReviews;
    } catch (error) {
      console.error(`Error al obtener agentes de la agencia ${agencyId}:`, error);
      return [];
    }
  }

  async createAgencyAgent(agentData: InsertAgencyAgent): Promise<AgencyAgent> {
    const [newAgent] = await db
      .insert(agencyAgents)
      .values(agentData)
      .returning();
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
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    return property;
  }

  async getMostViewedProperties(
    limit: number = 6,
    operationType?: string
  ): Promise<Property[]> {
    try {
      // Check cache first to improve performance
      const cacheKey = `most_viewed_properties_${limit}_${operationType || 'all'}`;
      const cached = cache.get<Property[]>(cacheKey);
      if (cached) {
        console.log(`Returning cached most viewed properties for ${operationType || 'all'}`);
        return cached;
      }

      console.log(`Database query for most viewed properties: ${operationType || 'all'}`);
      
      // Construir la consulta base con campos específicos para mejor rendimiento
      let query = db
        .select({
          id: properties.id,
          reference: properties.reference,
          title: properties.title,
          address: properties.address,
          neighborhood: properties.neighborhood,
          type: properties.type,
          operationType: properties.operationType,
          price: properties.price,
          previousPrice: properties.previousPrice,
          superficie: properties.superficie,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          images: properties.images,
          mainImageIndex: properties.mainImageIndex,
          features: properties.features,
          viewCount: properties.viewCount,
          createdAt: properties.createdAt,
          agentId: properties.agentId,
          agencyId: properties.agencyId,
          isActive: properties.isActive,
          housingType: properties.housingType,
          housingStatus: properties.housingStatus,
          floor: properties.floor,
          availability: properties.availability,
          availabilityDate: properties.availabilityDate,
        })
        .from(properties)
        .where(eq(properties.isActive, true))
        .orderBy(desc(properties.viewCount));

      // Si se especifica un tipo de operación, añadir el filtro
      if (operationType) {
        console.log(
          `Filtrando propiedades más vistas por tipo de operación: ${operationType}`,
        );
        query = query.where(
          and(
            eq(properties.isActive, true),
            eq(properties.operationType, operationType)
          )
        );
      }

      // Aplicar el límite y ejecutar la consulta
      const results = await query.limit(limit);
      
      // Procesar los arrays JSON
      const processedResults = results.map((property) => ({
        ...property,
        images: this.parseArrayField(property.images),
        features: this.parseArrayField(property.features),
      }));

      // Cache results for 5 minutes to dramatically improve loading performance
      cache.set(cacheKey, processedResults, 300);
      
      return processedResults;
    } catch (error) {
      console.error('Error al obtener propiedades más vistas:', error);
      return [];
    }
  }

  async incrementPropertyViewCount(id: number): Promise<void> {
    await db
      .update(properties)
      .set({ viewCount: sql`${properties.viewCount} + 1` })
      .where(eq(properties.id, id));
  }

  async getPropertiesByAgent(agentId: number): Promise<Property[]> {
    console.log(`Fetching active properties for agent ID: ${agentId}`);
    const result = await db
      .select()
      .from(properties)
      .where(and(eq(properties.agentId, agentId), eq(properties.isActive, true)))
      .orderBy(sql`${properties.createdAt} DESC`);

    console.log(`Found ${result.length} active properties for agent ID: ${agentId}`);
    return result;
  }

  async getAllPropertiesByAgent(agentId: number): Promise<Property[]> {
    console.log(`Fetching all properties (active and inactive) for agent ID: ${agentId}`);
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.agentId, agentId))
      .orderBy(sql`${properties.createdAt} DESC`);

    console.log(`Found ${result.length} total properties for agent ID: ${agentId}`);
    return result;
  }

  async getPropertiesByAgency(agencyId: number): Promise<Property[]> {
    try {
      console.log(`Obteniendo propiedades para la agencia ${agencyId}`);

      // 1. Obtener propiedades directamente vinculadas a la agencia
      const directProperties = await db
        .select()
        .from(properties)
        .where(and(eq(properties.agencyId, agencyId), eq(properties.isActive, true)))
        .orderBy(sql`${properties.createdAt} DESC`);

      console.log(`Encontradas ${directProperties.length} propiedades directamente vinculadas a la agencia ${agencyId}`);

      // 2. Obtener agentes vinculados a esta agencia
      const agencyAgents = await this.getAgencyAgents(agencyId);
      console.log(`Encontrados ${agencyAgents.length} agentes vinculados a la agencia ${agencyId}`);

      // 3. Obtener propiedades de cada agente
      const agentPropertiesPromises = agencyAgents.map(agent => 
        this.getPropertiesByAgent(agent.id)
      );

      const agentPropertiesArrays = await Promise.all(agentPropertiesPromises);

      // 4. Aplanar el array de arrays de propiedades
      const agentProperties = agentPropertiesArrays.flat();
      console.log(`Encontradas ${agentProperties.length} propiedades de agentes vinculados a la agencia ${agencyId}`);

      // 5. Combinar propiedades directas y de agentes, eliminando duplicados por ID
      const allProperties = [...directProperties];

      // Añadir propiedades de agentes solo si no están ya incluidas
      agentProperties.forEach(agentProperty => {
        if (!allProperties.some(p => p.id === agentProperty.id)) {
          allProperties.push(agentProperty);
        }
      });

      console.log(`Total de propiedades para la agencia ${agencyId}: ${allProperties.length}`);

      // Ordenar por fecha de creación (más recientes primero)
      return allProperties.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error(`Error al obtener propiedades para la agencia ${agencyId}:`, error);
      return [];
    }
  }

  async searchProperties(filters: any): Promise<Property[]> {
    // Check cache first for tab switching optimization
    const cacheKey = `search_properties_${JSON.stringify(filters)}`;
    const cached = cache.get<Property[]>(cacheKey);
    if (cached) {
      console.log("Returning cached property search results for filters:", filters);
      return cached;
    }

    console.log("Database query for property search filters:", filters);

    // Collect all WHERE conditions
    const whereConditions = [];

    // Aplicar filtros si están definidos
    if (filters) {
      // Filtrar por tipo de operación (Venta o Alquiler)
      if (filters.operationType) {
        console.log(
          `Filtrando por tipo de operación: ${filters.operationType}`,
        );
        whereConditions.push(eq(properties.operationType, filters.operationType));
      }

      // Filtrar por barrio(s)
      if (filters.neighborhoods) {
        const neighborhoods = Array.isArray(filters.neighborhoods)
          ? filters.neighborhoods
          : [filters.neighborhoods];

        console.log(`Filtrando por barrios: ${neighborhoods.join(", ")}`);

        // Si hay múltiples barrios, usamos OR
        if (neighborhoods.length > 1) {
          whereConditions.push(
            or(...neighborhoods.map((n: string) => eq(properties.neighborhood, n)))
          );
        } else {
          // Si es solo un barrio
          whereConditions.push(eq(properties.neighborhood, neighborhoods[0]));
        }
      }

      // Filtrar por precio mínimo si está definido
      if (filters.priceMin !== undefined && filters.priceMin !== null) {
        console.log(`Filtrando por precio mínimo: ${filters.priceMin}`);
        whereConditions.push(gte(properties.price, Number(filters.priceMin)));
      }

      // Filtrar por precio máximo si está definido
      if (filters.priceMax !== undefined && filters.priceMax !== null) {
        console.log(`Filtrando por precio máximo: ${filters.priceMax}`);
        whereConditions.push(lte(properties.price, Number(filters.priceMax)));
      }

      // Filtrar por número de habitaciones si está definido
      if (filters.bedrooms !== undefined && filters.bedrooms !== null) {
        console.log(`Filtrando por habitaciones: ${filters.bedrooms}`);
        whereConditions.push(gte(properties.bedrooms, Number(filters.bedrooms)));
      }

      // Filtrar por número de baños si está definido
      if (filters.bathrooms !== undefined && filters.bathrooms !== null) {
        console.log(`Filtrando por baños: ${filters.bathrooms}`);
        whereConditions.push(gte(properties.bathrooms, Number(filters.bathrooms)));
      }

      // Filtrar por características si están definidas
      if (filters.features) {
        const features = Array.isArray(filters.features)
          ? filters.features
          : filters.features.split(",");

        if (features.length > 0) {
          console.log(`Filtrando por características: ${features.join(", ")}`);
          // Para cada característica, verificamos que esté en el array de la propiedad
          features.forEach((feature: string) => {
            whereConditions.push(
              sql`${properties.features} @> ARRAY[${feature}]::text[]`
            );
          });
        }
      }
    }

    // Build query with all conditions
    let query = db.select().from(properties);
    
    if (whereConditions.length > 0) {
      console.log(`Aplicando ${whereConditions.length} condiciones WHERE con AND`);
      query = query.where(and(...whereConditions));
    }

    // Ordenar por precio (por defecto)
    query = query.orderBy(properties.price);

    console.log("Ejecutando consulta de propiedades con filtros");
    const result = await query;
    console.log(`Consulta completada. Encontradas ${result.length} propiedades que coinciden con los filtros.`);
    
    // Cache the results for 5 minutes for fast tab switching
    cache.set(cacheKey, result, 300);
    
    return result;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateProperty(
    id: number,
    property: InsertProperty,
  ): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async updatePropertyAddress(id: number, address: string, lat?: number, lng?: number): Promise<Property> {
    const updateData: any = { address };
    if (lat !== undefined && lng !== undefined) {
      updateData.lat = lat;
      updateData.lng = lng;
    }
    
    const [updatedProperty] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async togglePropertyStatus(id: number, isActive: boolean): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ isActive })
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
    return await db
      .select()
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
  async getNeighborhoodRatings(
    neighborhood: string,
  ): Promise<NeighborhoodRating[]> {
    return await db
      .select()
      .from(neighborhoodRatings)
      .where(eq(neighborhoodRatings.neighborhood, neighborhood));
  }

  async getNeighborhoodRatingsAverage(
    neighborhood: string,
  ): Promise<Record<string, number>> {
    // Check cache first to dramatically improve tab switching performance
    const cacheKey = `neighborhood_ratings_${neighborhood}`;
    const cached = cache.get<Record<string, number>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Versión simplificada
    const ratings = {
      security: 7.5,
      parking: 6.8,
      familyFriendly: 8.2,
      publicTransport: 7.0,
      greenSpaces: 6.5,
      services: 8.0,
    };

    // Cache for 10 minutes to eliminate repeated API calls
    cache.set(cacheKey, ratings, 600);
    
    return ratings;
  }

  async createNeighborhoodRating(
    rating: InsertNeighborhoodRating,
  ): Promise<NeighborhoodRating> {
    // Convertir números a strings para los campos decimal
    const convertedRating = {
      neighborhood: rating.neighborhood,
      security: String(rating.security),
      parking: String(rating.parking),
      familyFriendly: String(rating.familyFriendly),
      publicTransport: String(rating.publicTransport),
      greenSpaces: String(rating.greenSpaces),
      services: String(rating.services),
      userId: rating.userId,
    };

    const [newRating] = await db
      .insert(neighborhoodRatings)
      .values(convertedRating)
      .returning();
    return newRating;
  }

  // Appointments
  async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(sql`${appointments.date} DESC, ${appointments.time} DESC`);
  }

  async getAppointmentsByAgent(agentId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.agentId, agentId))
      .orderBy(sql`${appointments.date} DESC, ${appointments.time} DESC`);
  }

  async createAppointment(
    appointment: InsertAppointment,
  ): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async updateAppointment(
    id: number,
    appointment: Partial<InsertAppointment>,
  ): Promise<Appointment> {
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
    const results = await db
      .select({
        id: inquiries.id,
        name: inquiries.name,
        email: inquiries.email,
        phone: inquiries.phone,
        message: inquiries.message,
        propertyId: inquiries.propertyId,
        agentId: inquiries.agentId,
        status: inquiries.status,
        createdAt: inquiries.createdAt,
        property: {
          title: properties.title,
          address: properties.address,
          reference: properties.reference,
        },
      })
      .from(inquiries)
      .leftJoin(properties, eq(inquiries.propertyId, properties.id))
      .where(eq(inquiries.agentId, agentId))
      .orderBy(sql`${inquiries.createdAt} DESC`);
    
    return results as Inquiry[];
  }

  async getInquiryById(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.id, id));
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

  async getFavoriteAgentsByClient(clientId: number): Promise<User[]> {
    const favorites = await db
      .select({
        id: agents.id,
        email: agents.email,
        password: agents.password,
        name: agents.name,
        surname: agents.surname,
        avatar: agents.avatar,
        createdAt: agents.createdAt,
        yearsOfExperience: agents.yearsOfExperience,
        influenceNeighborhoods: agents.influenceNeighborhoods,
        agencyId: agents.agencyId,
        description: agents.description,
        languagesSpoken: agents.languagesSpoken,
        isAdmin: agents.isAdmin,
      })
      .from(clientFavoriteAgents)
      .innerJoin(agents, eq(clientFavoriteAgents.agentId, agents.id))
      .where(eq(clientFavoriteAgents.clientId, clientId));

    return favorites;
  }

  async toggleFavoriteAgent(clientId: number, agentId: number): Promise<boolean> {
    // Check if already favorited
    const existing = await db
      .select()
      .from(clientFavoriteAgents)
      .where(
        and(
          eq(clientFavoriteAgents.clientId, clientId),
          eq(clientFavoriteAgents.agentId, agentId)
        )
      );

    if (existing.length > 0) {
      // Remove from favorites
      await db
        .delete(clientFavoriteAgents)
        .where(
          and(
            eq(clientFavoriteAgents.clientId, clientId),
            eq(clientFavoriteAgents.agentId, agentId)
          )
        );
      return false;
    } else {
      // Add to favorites
      await db
        .insert(clientFavoriteAgents)
        .values({ clientId, agentId });
      return true;
    }
  }

  async isFavoriteAgent(clientId: number, agentId: number): Promise<boolean> {
    const favorite = await db
      .select()
      .from(clientFavoriteAgents)
      .where(
        and(
          eq(clientFavoriteAgents.clientId, clientId),
          eq(clientFavoriteAgents.agentId, agentId)
        )
      );

    return favorite.length > 0;
  }

  async getBatchFavoriteAgentStatus(clientId: number, agentIds: number[]): Promise<{ [key: number]: boolean }> {
    if (agentIds.length === 0) return {};
    
    const favorites = await db
      .select({ agentId: clientFavoriteAgents.agentId })
      .from(clientFavoriteAgents)
      .where(
        and(
          eq(clientFavoriteAgents.clientId, clientId),
          inArray(clientFavoriteAgents.agentId, agentIds)
        )
      );

    const result: { [key: number]: boolean } = {};
    agentIds.forEach(id => {
      result[id] = favorites.some(fav => fav.agentId === id);
    });
    
    return result;
  }

  async getFavoritePropertiesByClient(clientId: number): Promise<Property[]> {
    const favorites = await db
      .select({
        id: properties.id,
        title: properties.title,
        description: properties.description,
        price: properties.price,
        address: properties.address,
        neighborhood: properties.neighborhood,
        superficie: properties.superficie,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        images: properties.images,
        type: properties.type,
        housingType: properties.housingType,
        housingStatus: properties.housingStatus,
        floor: properties.floor,
        reference: properties.reference,
        operationType: properties.operationType,
        features: properties.features,
        availability: properties.availability,
        availabilityDate: properties.availabilityDate,
        mainImageIndex: properties.mainImageIndex,
        isActive: properties.isActive,
        agentId: properties.agentId,
        viewCount: properties.viewCount,
        createdAt: properties.createdAt,
      })
      .from(clientFavoriteProperties)
      .innerJoin(properties, eq(clientFavoriteProperties.propertyId, properties.id))
      .where(eq(clientFavoriteProperties.clientId, clientId));

    return favorites;
  }

  async toggleFavoriteProperty(clientId: number, propertyId: number): Promise<boolean> {
    // Check if already favorited
    const existing = await db
      .select()
      .from(clientFavoriteProperties)
      .where(
        and(
          eq(clientFavoriteProperties.clientId, clientId),
          eq(clientFavoriteProperties.propertyId, propertyId)
        )
      );

    if (existing.length > 0) {
      // Remove from favorites
      await db
        .delete(clientFavoriteProperties)
        .where(
          and(
            eq(clientFavoriteProperties.clientId, clientId),
            eq(clientFavoriteProperties.propertyId, propertyId)
          )
        );
      return false;
    } else {
      // Add to favorites
      await db
        .insert(clientFavoriteProperties)
        .values({ clientId, propertyId });
      return true;
    }
  }

  async isFavoriteProperty(clientId: number, propertyId: number): Promise<boolean> {
    const favorite = await db
      .select()
      .from(clientFavoriteProperties)
      .where(
        and(
          eq(clientFavoriteProperties.clientId, clientId),
          eq(clientFavoriteProperties.propertyId, propertyId)
        )
      );

    return favorite.length > 0;
  }

  async getBatchFavoritePropertyStatus(clientId: number, propertyIds: number[]): Promise<{ [key: number]: boolean }> {
    if (propertyIds.length === 0) return {};
    
    const favorites = await db
      .select({ propertyId: clientFavoriteProperties.propertyId })
      .from(clientFavoriteProperties)
      .where(
        and(
          eq(clientFavoriteProperties.clientId, clientId),
          inArray(clientFavoriteProperties.propertyId, propertyIds)
        )
      );

    const result: { [key: number]: boolean } = {};
    propertyIds.forEach(id => {
      result[id] = favorites.some(fav => fav.propertyId === id);
    });
    
    return result;
  }

  // Property visit requests
  async createPropertyVisitRequest(visitRequest: InsertPropertyVisitRequest): Promise<PropertyVisitRequest> {
    const [result] = await db
      .insert(propertyVisitRequests)
      .values(visitRequest)
      .returning();
    return result;
  }

  async getPropertyVisitRequestsByClient(clientId: number): Promise<PropertyVisitRequest[]> {
    return await db
      .select()
      .from(propertyVisitRequests)
      .where(eq(propertyVisitRequests.clientId, clientId))
      .orderBy(desc(propertyVisitRequests.createdAt));
  }

  async getPropertyVisitRequestsByAgent(agentId: number): Promise<PropertyVisitRequest[]> {
    return await db
      .select()
      .from(propertyVisitRequests)
      .where(eq(propertyVisitRequests.agentId, agentId))
      .orderBy(desc(propertyVisitRequests.createdAt));
  }

  async updatePropertyVisitRequestStatus(id: number, status: string, agentNotes?: string): Promise<PropertyVisitRequest> {
    const [result] = await db
      .update(propertyVisitRequests)
      .set({ 
        status, 
        agentNotes,
        updatedAt: new Date()
      })
      .where(eq(propertyVisitRequests.id, id))
      .returning();
    return result;
  }

  // Agent Calendar Events
  async createAgentEvent(eventData: InsertAgentEvent): Promise<AgentEvent> {
    const [result] = await db
      .insert(agentEvents)
      .values(eventData)
      .returning();
    return result;
  }

  async getAgentEvents(agentId: number, startDate?: string, endDate?: string): Promise<AgentEvent[]> {
    let query = db
      .select()
      .from(agentEvents)
      .where(eq(agentEvents.agentId, agentId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(agentEvents.agentId, agentId),
          gte(agentEvents.eventDate, startDate),
          lte(agentEvents.eventDate, endDate)
        )
      );
    }
    
    return await query.orderBy(agentEvents.eventDate, agentEvents.eventTime);
  }

  async updateAgentEvent(id: number, eventData: Partial<InsertAgentEvent>): Promise<AgentEvent> {
    const [result] = await db
      .update(agentEvents)
      .set(eventData)
      .where(eq(agentEvents.id, id))
      .returning();
    
    if (!result) {
      throw new Error("Agent event not found");
    }
    
    return result;
  }

  async deleteAgentEvent(id: number): Promise<void> {
    await db.delete(agentEvents).where(eq(agentEvents.id, id));
  }

  // Fraud Reporting methods
  async createFraudReport(reportData: InsertFraudReport): Promise<FraudReport> {
    const [newReport] = await db
      .insert(fraudReports)
      .values(reportData)
      .returning();
    return newReport;
  }

  async checkRecentFraudReport(propertyId: number, reporterIp: string): Promise<boolean> {
    // Check for reports from the same IP within the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [report] = await db
      .select()
      .from(fraudReports)
      .where(
        and(
          eq(fraudReports.propertyId, propertyId),
          eq(fraudReports.reporterIp, reporterIp),
          gte(fraudReports.createdAt, twentyFourHoursAgo)
        )
      )
      .limit(1);
    
    return !!report;
  }

  async incrementPropertyFraudCount(propertyId: number): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set({
        fraudCount: sql`COALESCE(${properties.fraudCount}, 0) + 1`
      })
      .where(eq(properties.id, propertyId))
      .returning();
    
    return updatedProperty;
  }

  async getPropertyById(propertyId: number): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    return property;
  }
}

class DatabaseStorageWithConnection extends DatabaseStorage {
  async testConnection(): Promise<void> {
    try {
      await db.execute(sql`SELECT 1`);
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Database connection failed');
    }
  }
}

export const storage: IStorage = new DatabaseStorageWithConnection();