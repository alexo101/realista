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
  ne,
  isNull,
  isNotNull,
  desc,
  inArray,
  count,
} from "drizzle-orm";
import { generateAgentSlug, generateAgencySlug, generatePropertySlug } from "@shared/slug-utils";
import {
  agents,
  agencies,
  networks,
  properties,
  clients,
  neighborhoodRatings,
  agencyAgents,
  appointments,
  inquiries,
  reviews,
  conversationMessages,
  pinnedConversations,
  subscriptionEvents,
  type User,
  type UserWithReviews,
  type Agent,
  type Agency,
  type Network,
  type Property,
  type Client,
  type NeighborhoodRating,
  type AgencyAgent,
  type Appointment,
  type Inquiry,
  type Review,
  type ConversationMessage,
  type PinnedConversation,
  type SubscriptionEvent,
  type InsertAgent,
  type InsertAgency,
  type InsertNetwork,
  type InsertProperty,
  type InsertClient,
  type InsertNeighborhoodRating,
  type InsertAgencyAgent,
  type InsertAppointment,
  type InsertInquiry,
  type InsertReview,
  type InsertConversationMessage,
  type InsertPinnedConversation,
  type InsertSubscriptionEvent,
  clientFavoriteAgents,
  clientFavoriteAgencies,
  clientFavoriteProperties,
  propertyVisitRequests,
  type ClientFavoriteAgent,
  type InsertClientFavoriteAgent,
  type ClientFavoriteAgency,
  type InsertClientFavoriteAgency,
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
  savedSearches,
  type SavedSearch,
  type InsertSavedSearch,
  agentInvitations,
  type AgentInvitation,
  type InsertAgentInvitation,
  propertyContracts,
  type PropertyContract,
  type InsertPropertyContract,
  propertyPayments,
  type PropertyPayment,
  type InsertPropertyPayment,
  propertyDocuments,
  type PropertyDocument,
  type InsertPropertyDocument,
  propertyIncidents,
  type PropertyIncident,
  type InsertPropertyIncident,
  incidentUpdates,
  type IncidentUpdate,
  type InsertIncidentUpdate,
  propertyCommunications,
  type PropertyCommunication,
  type InsertPropertyCommunication,
  propertyHistory,
  type PropertyHistoryEntry,
  type InsertPropertyHistory,
  appSettings,
  type AppSetting,
  type InsertAppSetting,
  adminAuditLogs,
  type AdminAuditLog,
  type InsertAdminAuditLog,
  workSessions,
  type WorkSession,
  type InsertWorkSession,
  type WorkBreak,
  absenceRequests,
  type AbsenceRequest,
  type AbsenceReason,
  type AbsenceStatus,
} from "@shared/schema";
import { hashPassword, isPasswordHashed } from "./security/password";

export interface IStorage {
  // Users/Agents
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertAgent): Promise<User>;
  updateUser(id: number, userData: Partial<InsertAgent>): Promise<User>;

  // Agents/Agencies Search & Profiles
  searchAgents(query: string): Promise<UserWithReviews[]>;
  searchAgencies(query: string): Promise<Agency[]>;
  getAgentById(id: number): Promise<User | undefined>;
  getAgentByUuid(uuid: string): Promise<User | undefined>;
  getAgentBySlug(slug: string): Promise<User | undefined>;
  getAgencyById(id: number): Promise<Agency | undefined>;
  getAgencyByUuid(uuid: string): Promise<Agency | undefined>;
  getAgencyBySlug(slug: string): Promise<Agency | undefined>;
  createAgentReview(review: InsertReview): Promise<Review>;
  getAgentReviews(agentId: number): Promise<Review[]>; // Obtener las reseñas de un agente
  getAgencyReviews(agencyId: number): Promise<Review[]>; // Obtener las reseñas de una agencia
  confirmReviewByToken(token: string): Promise<Review | null>; // Confirmar una reseña por token
  getReviewByToken(token: string): Promise<Review | null>; // Obtener una reseña por token
  respondToReview(reviewId: number, response: string): Promise<Review>; // Responder a una reseña
  pinReview(reviewId: number, pinned: boolean): Promise<Review>; // Destacar/quitar destaque de una reseña

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
  getProperty(uuid: string): Promise<Property | undefined>;
  getPropertyByUuid(uuid: string): Promise<Property | undefined>;
  getPropertyBySlug(slug: string): Promise<Property | undefined>;
  getMostViewedProperties(limit?: number): Promise<Property[]>;
  getPropertiesByAgent(agentId: number): Promise<Property[]>;
  getAllPropertiesByAgent(agentId: number, limit?: number, offset?: number): Promise<Property[]>;
  getPropertiesByAgency(agencyId: number): Promise<Property[]>;
  getActivePropertiesCount(agencyId: number): Promise<number>;
  searchProperties(filters: any): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(uuid: string, property: InsertProperty): Promise<Property>;
  updatePropertyAddress(uuid: string, address: string, lat?: number, lng?: number): Promise<Property>;
  deleteProperty(uuid: string): Promise<void>;
  togglePropertyStatus(uuid: string, isActive: boolean): Promise<Property>;
  incrementPropertyViewCount(uuid: string): Promise<void>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  getClientsByAgent(agentId: number): Promise<Client[]>;
  getClientsByAgency(agencyId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client>;
  updateClientProfile(id: number, profileData: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<void>;

  // Neighborhood Ratings
  getNeighborhoodRatings(neighborhood: string, city?: string, district?: string): Promise<NeighborhoodRating[]>;
  getNeighborhoodRatingsAverage(
    neighborhood: string,
    city?: string, 
    district?: string
  ): Promise<Record<string, number>>;
  getAllNeighborhoodsWithRatings(): Promise<string[]>;
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
  getInquiriesByClient(clientEmail: string): Promise<Inquiry[]>;
  getInquiryById(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry>;

  // Conversation Messages
  createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage>;
  getConversationMessages(inquiryId: number): Promise<ConversationMessage[]>;
  markMessagesAsRead(inquiryId: number, readerType: 'client' | 'agent'): Promise<void>;

  // Pinned Conversations
  pinConversation(userType: string, userId: number, userEmail: string | null, inquiryId: number): Promise<PinnedConversation>;
  unpinConversation(userType: string, userId: number, userEmail: string | null, inquiryId: number): Promise<void>;
  getPinnedConversations(userType: string, userId: number, userEmail: string | null): Promise<number[]>;
  isConversationPinned(userType: string, userId: number, userEmail: string | null, inquiryId: number): Promise<boolean>;

  // Client favorite agents
  getFavoriteAgentsByClient(clientId: number): Promise<User[]>;
  toggleFavoriteAgent(clientId: number, agentId: number): Promise<boolean>;
  isFavoriteAgent(clientId: number, agentId: number): Promise<boolean>;
  getBatchFavoriteAgentStatus(clientId: number, agentIds: number[]): Promise<{ [key: number]: boolean }>;

  // Client favorite agencies
  getFavoriteAgenciesByClient(clientId: number): Promise<User[]>;
  toggleFavoriteAgency(clientId: number, agencyId: number): Promise<boolean>;
  isFavoriteAgency(clientId: number, agencyId: number): Promise<boolean>;
  getBatchFavoriteAgencyStatus(clientId: number, agencyIds: number[]): Promise<{ [key: number]: boolean }>;

  // Client favorite properties
  getFavoritePropertiesByClient(clientId: number): Promise<Property[]>;
  toggleFavoriteProperty(clientId: number, propertyUuid: string): Promise<boolean>;
  isFavoriteProperty(clientId: number, propertyUuid: string): Promise<boolean>;
  getBatchFavoritePropertyStatus(clientId: number, propertyUuids: string[]): Promise<{ [key: string]: boolean }>;

  // Property visit requests
  createPropertyVisitRequest(visitRequest: InsertPropertyVisitRequest): Promise<PropertyVisitRequest>;
  getPropertyVisitRequestsByClient(clientId: number): Promise<PropertyVisitRequest[]>;
  getPropertyVisitRequestsByAgent(agentId: number): Promise<PropertyVisitRequest[]>;
  updatePropertyVisitRequestStatus(id: number, status: string, agentNotes?: string): Promise<PropertyVisitRequest>;

  // Agent Calendar Events
  createAgentEvent(eventData: InsertAgentEvent): Promise<AgentEvent>;
  getAgentEvents(agentId: number, startDate?: string, endDate?: string): Promise<AgentEvent[]>;
  getAllAgentEventsPaginated(agentId: number, page: number, limit: number): Promise<{ events: AgentEvent[], total: number }>;
  updateAgentEvent(id: number, eventData: Partial<InsertAgentEvent>): Promise<AgentEvent>;
  deleteAgentEvent(id: number): Promise<void>;

  // Fraud Reporting
  createFraudReport(reportData: InsertFraudReport): Promise<FraudReport>;
  checkRecentFraudReport(propertyUuid: string, reporterIp: string): Promise<boolean>;
  incrementPropertyFraudCount(propertyUuid: string): Promise<Property | undefined>;
  getPropertyById(propertyUuid: string): Promise<Property | undefined>;

  // Subscription Operations
  checkAgencySeatsAvailable(agencyId: number): Promise<{ available: boolean; current: number; limit: number }>;
  pauseAgentSubscription(agentId: number, reason: string, triggeredBy: number): Promise<void>;
  resumeAgentSubscription(agentId: number, reason: string, triggeredBy: number): Promise<void>;
  transferAgencyAdmin(agencyId: number, currentAdminId: number, newAdminId: number, triggeredBy: number): Promise<void>;
  recordSubscriptionEvent(eventData: InsertSubscriptionEvent): Promise<SubscriptionEvent>;
  getAgentRole(agentId: number): Promise<{ agencyId: number | null; role: string | null; agentType: string }>;
  getAgencySubscription(agencyId: number): Promise<{ subscriptionPlan: string | null; isYearlyBilling: boolean | null; seatsLimit: number | null }>;
  addAgentToAgencyAtomic(agencyId: number, agentId: number, role: 'admin' | 'member', triggeredBy: number): Promise<AgencyAgent>;

  // Saved Searches
  createSavedSearch(searchData: InsertSavedSearch): Promise<SavedSearch>;
  getSavedSearchesByClient(clientId: number): Promise<SavedSearch[]>;
  updateSavedSearchName(id: number, name: string): Promise<SavedSearch>;
  deleteSavedSearch(id: number): Promise<void>;

  // Agent Invitations
  createInvitation(invitationData: InsertAgentInvitation): Promise<AgentInvitation>;
  getInvitationByToken(token: string): Promise<AgentInvitation | undefined>;
  consumeInvitation(token: string): Promise<AgentInvitation | undefined>;
  cleanupExpiredInvitations(): Promise<void>;
  
  // Pending Invited Agents (new flow: agent record created immediately when invited)
  createPendingInvitedAgent(agentData: { email: string; name: string; surname: string; invitationToken: string; invitationExpiresAt: Date; agencyId: number; invitedBy: number }): Promise<User>;
  getAgentByInvitationToken(token: string): Promise<User | undefined>;
  activateInvitedAgent(agentId: number, hashedPassword: string): Promise<User>;

  // Networks (Franchises)
  getNetworkById(id: number): Promise<Network | undefined>;
  getNetworkByUuid(uuid: string): Promise<Network | undefined>;
  getNetworkBySlug(slug: string): Promise<Network | undefined>;
  createNetwork(network: InsertNetwork): Promise<Network>;
  updateNetwork(id: number, network: Partial<InsertNetwork>): Promise<Network>;
  deleteNetwork(id: number): Promise<void>;
  getAgenciesByNetwork(networkId: number): Promise<Agency[]>;
  getAgentsByNetwork(networkId: number): Promise<User[]>;
  attachAgencyToNetwork(agencyId: number, networkId: number): Promise<Agency>;
  detachAgencyFromNetwork(agencyId: number): Promise<Agency>;
  updateAgencyPlan(agencyId: number, plan: string): Promise<Agency>;
  getNetworkStats(networkId: number): Promise<{ agencies: number; agents: number; properties: number; totalClients: number }>;
  getAgencyAgentCount(agencyId: number): Promise<number>;
  getAgencyPropertyCount(agencyId: number): Promise<number>;
  searchAgenciesWithoutNetwork(query: string): Promise<Agency[]>;

  // Property Management
  getPropertyContracts(propertyUuid: string): Promise<PropertyContract[]>;
  getActivePropertyContract(propertyUuid: string): Promise<PropertyContract | undefined>;
  createPropertyContract(contract: InsertPropertyContract): Promise<PropertyContract>;
  updatePropertyContract(id: number, data: Partial<InsertPropertyContract>): Promise<PropertyContract | undefined>;
  
  getPropertyPayments(propertyUuid: string): Promise<PropertyPayment[]>;
  createPropertyPayment(payment: InsertPropertyPayment): Promise<PropertyPayment>;
  updatePropertyPayment(id: number, data: Partial<InsertPropertyPayment>): Promise<PropertyPayment | undefined>;
  deletePropertyPayment(id: number): Promise<void>;
  
  getPropertyDocuments(propertyUuid: string): Promise<PropertyDocument[]>;
  createPropertyDocument(doc: InsertPropertyDocument): Promise<PropertyDocument>;
  deletePropertyDocument(id: number): Promise<PropertyDocument | undefined>;
  
  getPropertyIncidents(propertyUuid: string): Promise<PropertyIncident[]>;
  createPropertyIncident(incident: InsertPropertyIncident): Promise<PropertyIncident>;
  updatePropertyIncident(id: number, data: Partial<InsertPropertyIncident>): Promise<PropertyIncident | undefined>;
  deletePropertyIncident(id: number): Promise<void>;
  getIncidentUpdates(incidentId: number): Promise<IncidentUpdate[]>;
  createIncidentUpdate(update: InsertIncidentUpdate): Promise<IncidentUpdate>;
  
  getPropertyCommunications(propertyUuid: string): Promise<PropertyCommunication[]>;
  createPropertyCommunication(comm: InsertPropertyCommunication): Promise<PropertyCommunication>;
  updatePropertyCommunication(id: number, data: Partial<InsertPropertyCommunication>): Promise<PropertyCommunication | undefined>;
  deletePropertyCommunication(id: number): Promise<boolean>;
  
  getPropertyHistory(propertyUuid: string): Promise<PropertyHistoryEntry[]>;
  createPropertyHistory(entry: InsertPropertyHistory): Promise<PropertyHistoryEntry>;
  deletePropertyHistory(id: number): Promise<boolean>;
  
  updatePropertyManagementStatus(uuid: string, status: string): Promise<Property | undefined>;

  // Super admin back office
  getSuperAdminDashboardStats(): Promise<{
    totalUsers: number;
    totalAgents: number;
    totalClients: number;
    totalAgencies: number;
    totalListings: number;
    pendingListings: number;
    flaggedListings: number;
  }>;
  getSuperAdminUsers(filters: {
    role?: string;
    status?: string;
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<{
      id: number;
      name: string | null;
      email: string;
      role: string;
      agency: string | null;
      status: "active" | "inactive";
      lastLoginAt: Date | null;
      kind: "agent" | "client";
    }>;
    total: number;
  }>;
  setUserActiveStatus(params: { kind: "agent" | "client"; id: number; isActive: boolean }): Promise<void>;
  updateAgentRole(agentId: number, agentType: string): Promise<User | undefined>;
  getSuperAdminListings(filters: {
    moderationStatus?: string;
    operationType?: string;
    location?: string;
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<Property & {
      agentName: string | null;
      agencyName: string | null;
    }>;
    total: number;
  }>;
  updatePropertyModeration(params: {
    propertyUuid: string;
    moderationStatus: "pending" | "approved" | "rejected";
    moderationReason?: string | null;
    moderatorId: number;
  }): Promise<Property | undefined>;
  getSuperAdminAgencies(filters: {
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<Agency & { adminEmail: string | null; agentCount: number; activeProperties: number }>;
    total: number;
  }>;
  updateSuperAdminAgencyPlan(params: {
    agencyId: number;
    plan: "basica" | "pequeña" | "mediana" | "lider";
  }): Promise<Agency>;
  getAppSettings(): Promise<AppSetting[]>;
  upsertAppSetting(params: {
    key: string;
    value: any;
    updatedBy: number | null;
  }): Promise<AppSetting>;
  createAdminAuditLog(logData: InsertAdminAuditLog): Promise<AdminAuditLog>;

  // Work sessions (Control de jornada)
  getWorkSessionForDate(agentId: number, workDate: string): Promise<WorkSession | undefined>;
  clockInWorkSession(agentId: number, workDate: string, now: Date): Promise<WorkSession>;
  startWorkSessionBreak(agentId: number, workDate: string, now: Date): Promise<WorkSession>;
  endWorkSessionBreak(agentId: number, workDate: string, now: Date): Promise<WorkSession>;
  clockOutWorkSession(agentId: number, workDate: string, now: Date): Promise<WorkSession>;
  getTeamWorkSessionsForDate(agencyId: number, workDate: string): Promise<Array<{
    agent: { id: number; name: string | null; surname: string | null; email: string };
    session: WorkSession | null;
  }>>;

  // Absence requests (Control de ausencias)
  createAbsenceRequest(data: {
    agentId: number;
    agencyId: number | null;
    startDate: string;
    endDate: string;
    reason: AbsenceReason;
  }): Promise<AbsenceRequest>;
  getAbsenceRequestsByAgent(agentId: number): Promise<AbsenceRequest[]>;
  getAbsenceRequestById(id: number): Promise<AbsenceRequest | undefined>;
  updateAbsenceRequestStatus(id: number, status: AbsenceStatus, reviewerId: number): Promise<AbsenceRequest>;
  getPendingTeamAbsenceRequests(agencyId: number): Promise<Array<{
    request: AbsenceRequest;
    agent: { id: number; name: string | null; surname: string | null; email: string };
  }>>;
  getApprovedTeamAbsenceRequests(agencyId: number, fromDate: string, toDate: string): Promise<Array<{
    request: AbsenceRequest;
    agent: { id: number; name: string | null; surname: string | null; email: string };
  }>>;

  superAdminGlobalSearch(params: {
    query: string;
    entity?: "users" | "listings" | "agencies";
    role?: string;
    status?: string;
    location?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    users: Array<{ id: number; name: string | null; email: string; role: string; status: string; kind: "agent" | "client" }>;
    listings: Array<{ uuid: string; title: string; moderationStatus: string; city: string | null; agencyName: string | null; agentName: string | null }>;
    agencies: Array<{ id: number; agencyName: string; city: string | null; subscriptionPlan: string | null }>;
  }>;
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
    const normalizedPassword =
      user.password && !isPasswordHashed(user.password)
        ? await hashPassword(user.password)
        : user.password;

    const userWithSlug = {
      ...user,
      password: normalizedPassword,
      slug: user.name && user.surname ? generateAgentSlug(user.name, user.surname) : undefined
    };
    
    const [newUser] = await db.insert(agents).values(userWithSlug).returning();
    
    if (newUser.name && newUser.surname && !newUser.slug) {
      const finalSlug = generateAgentSlug(newUser.name, newUser.surname, newUser.id);
      const [updatedUser] = await db
        .update(agents)
        .set({ slug: finalSlug })
        .where(eq(agents.id, newUser.id))
        .returning();
      return updatedUser;
    }
    
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

      if (cleanedUserData.password && !isPasswordHashed(cleanedUserData.password)) {
        cleanedUserData.password = await hashPassword(cleanedUserData.password);
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

      // Collect all WHERE conditions first (like searchAgencies)
      const conditions: any[] = [];

      // Filtrar por nombre o apellido de agente si se proporciona
      if (agentName && agentName.trim() !== "") {
        conditions.push(
          or(
            sql`${agents.name} ILIKE ${`%${agentName}%`}`,
            sql`${agents.surname} ILIKE ${`%${agentName}%`}`
          )
        );
      }

      // Filtrar por barrios si se proporcionan
      if (neighborhoodsStr && neighborhoodsStr.trim() !== "") {
        console.log(`Filtrando agentes por barrios: ${neighborhoodsStr}`);

        // CRITICAL: Always exclude agents with NULL or empty influenceNeighborhoods when neighborhood filter is applied
        conditions.push(
          sql`cardinality(coalesce(${agents.influenceNeighborhoods}, ARRAY[]::text[])) > 0`
        );

        // Import ALL_ZONES constant
        const { ALL_ZONES } = await import('../shared/schema.js');

        let expandedNeighborhoods: string[] = [];
        
        // CRITICAL FIX: Check if this is already a comma-separated list (from routes.ts expansion)
        // If it contains commas but NOT the hierarchical format, treat as pre-expanded list
        const isPreExpanded = neighborhoodsStr.includes(',') && 
                              !neighborhoodsStr.match(/^[^,]+,\s*[^,]+$/); // Not "District, City" format
        
        if (isPreExpanded) {
          // Already expanded by routes.ts - use directly
          expandedNeighborhoods = neighborhoodsStr.split(',').map(n => n.trim()).filter(Boolean);
          console.log(`Using pre-expanded neighborhoods (${expandedNeighborhoods.length}): ${expandedNeighborhoods.join(', ')}`);
        } else {
          // Not pre-expanded - perform expansion here
          const { parseNeighborhoodDisplayName, expandNeighborhoodSearch } = await import('./utils/neighborhoods.js');
          const parsed = parseNeighborhoodDisplayName(neighborhoodsStr);
          
          if (parsed) {
            let { neighborhood, district, city } = parsed;
            
            // Handle district-level search: when neighborhood is empty, use district as the search term
            if (!neighborhood || neighborhood.trim() === "") {
              neighborhood = district;
              console.log(`District-level search detected, using district: ${neighborhood}`);
            }
            
            console.log(`Parsed: neighborhood=${neighborhood}, district=${district}, city=${city}`);
            
            // Expand the search hierarchically
            expandedNeighborhoods = expandNeighborhoodSearch(neighborhood, city);
          } else {
            // Fallback: try expanding with the raw string (handles simple inputs like "Gràcia")
            console.log(`Could not parse neighborhood display name, trying raw expansion: ${neighborhoodsStr}`);
            expandedNeighborhoods = expandNeighborhoodSearch(neighborhoodsStr);
          }
          
          console.log(`Expanded neighborhoods (${expandedNeighborhoods.length}): ${expandedNeighborhoods.join(', ')}`);
        }

        if (expandedNeighborhoods.length > 0) {
          // Use PostgreSQL array overlap operator with OR condition for ALL_ZONES
          // Agents with ALL_ZONES should match any neighborhood search
          conditions.push(
            or(
              sql`${sql`${ALL_ZONES}`} = ANY(${agents.influenceNeighborhoods})`,
              sql`${agents.influenceNeighborhoods}::text[] && ARRAY[${sql.join(expandedNeighborhoods.map(n => sql`${n}`), sql`, `)}]::text[]`
            )
          );
        } else {
          // Fail closed: if expansion returns empty, return no results
          console.log(`WARNING: Neighborhood expansion returned empty array for: ${neighborhoodsStr}`);
          return [];
        }
      }

      // Build the query with all conditions combined
      let dbQuery = db.select().from(agents);
      
      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions));
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

  async searchAgencies(queryString: string): Promise<Agency[]> {
    try {
      // Parseamos los parámetros de la URL
      const params = new URLSearchParams(queryString);
      const showAll = params.get("showAll") === "true";
      const agencyName = params.get("agencyName");
      const neighborhoodsStr = params.get("neighborhoods");
      const city = params.get("city");

      console.log(`Buscando agencias con params: showAll=${showAll}, agencyName=${agencyName}, neighborhoods=${neighborhoodsStr}, city=${city}`);

      // Collect all WHERE conditions first
      const conditions: any[] = [];

      // Filter by city if provided
      if (city && city.trim() !== "") {
        console.log(`Filtrando agencias por ciudad: ${city}`);
        conditions.push(eq(agencies.city, city));
      }

      // Filtrar por nombre si se proporciona
      if (agencyName && agencyName.trim() !== "") {
        conditions.push(
          sql`${agencies.agencyName} ILIKE ${`%${agencyName}%`}`
        );
      }

      // Filtrar por barrios si se proporcionan
      if (neighborhoodsStr && neighborhoodsStr.trim() !== "") {
        console.log(`Filtrando agencias por barrios: ${neighborhoodsStr}`);

        // CRITICAL: Always exclude agencies with NULL or empty influenceNeighborhoods when neighborhood filter is applied
        conditions.push(
          sql`cardinality(coalesce(${agencies.agencyInfluenceNeighborhoods}, ARRAY[]::text[])) > 0`
        );

        // Import ALL_ZONES constant
        const { ALL_ZONES } = await import('../shared/schema.js');

        // Check if any agencies have ALL_ZONES - they should match ALL neighborhood searches
        // We'll use an OR condition: either agency has ALL_ZONES, or it overlaps with the search
        let expandedNeighborhoods: string[] = [];
        
        // CRITICAL FIX: Check if this is already a comma-separated list (from routes.ts expansion)
        // If it contains commas but NOT the hierarchical format, treat as pre-expanded list
        const isPreExpanded = neighborhoodsStr.includes(',') && 
                              !neighborhoodsStr.match(/^[^,]+,\s*[^,]+$/); // Not "District, City" format
        
        if (isPreExpanded) {
          // Already expanded by routes.ts - use directly
          expandedNeighborhoods = neighborhoodsStr.split(',').map(n => n.trim()).filter(Boolean);
          console.log(`Using pre-expanded neighborhoods (${expandedNeighborhoods.length}): ${expandedNeighborhoods.join(', ')}`);
        } else {
          // Not pre-expanded - perform expansion here
          const { parseNeighborhoodDisplayName, expandNeighborhoodSearch } = await import('./utils/neighborhoods.js');
          const parsed = parseNeighborhoodDisplayName(neighborhoodsStr);
          
          if (parsed) {
            let { neighborhood, district, city } = parsed;
            
            // Handle district-level search: when neighborhood is empty, use district as the search term
            // Format: ", Sant Andreu, Barcelona" means we're searching at district level
            if (!neighborhood || neighborhood.trim() === "") {
              neighborhood = district;
              console.log(`District-level search detected, using district: ${neighborhood}`);
            }
            
            console.log(`Parsed: neighborhood=${neighborhood}, district=${district}, city=${city}`);
            
            // Expand the search hierarchically
            expandedNeighborhoods = expandNeighborhoodSearch(neighborhood, city);
          } else {
            // Fallback: try expanding with the raw string (handles simple inputs like "Gràcia")
            console.log(`Could not parse neighborhood display name, trying raw expansion: ${neighborhoodsStr}`);
            expandedNeighborhoods = expandNeighborhoodSearch(neighborhoodsStr);
          }
          
          console.log(`Expanded neighborhoods (${expandedNeighborhoods.length}): ${expandedNeighborhoods.join(', ')}`);
        }

        if (expandedNeighborhoods.length > 0) {
          // Use PostgreSQL array overlap operator with OR condition for ALL_ZONES
          // Agencies with ALL_ZONES should match any neighborhood search
          conditions.push(
            or(
              sql`${sql`${ALL_ZONES}`} = ANY(${agencies.agencyInfluenceNeighborhoods})`,
              sql`${agencies.agencyInfluenceNeighborhoods}::text[] && ARRAY[${sql.join(expandedNeighborhoods.map(n => sql`${n}`), sql`, `)}]::text[]`
            )
          );
        } else {
          // Fail closed: if expansion returns empty, return no results
          console.log(`WARNING: Neighborhood expansion returned empty array for: ${neighborhoodsStr}`);
          return [];
        }
      }

      // Build the query with all conditions combined
      let dbQuery = db.select().from(agencies);
      
      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions));
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
          // Get direct agency reviews with last review date
          // Only count reviews WITH a property for rating calculation
          const agencyReviewStats = await db
            .select({
              reviewCount: sql<number>`count(*)::integer`,
              reviewAverage: sql<number>`COALESCE(ROUND(AVG(${reviews.rating}), 2), 0)::float`,
              lastReviewDate: sql<string>`MAX(${reviews.date})`,
            })
            .from(reviews)
            .where(
              and(
                eq(reviews.targetId, agency.id),
                eq(reviews.targetType, 'agency'),
                eq(reviews.confirmed, true),
                isNotNull(reviews.propertyUuid)
              )
            );

          const agencyStats = agencyReviewStats[0];
          const agencyScore = Number(agencyStats?.reviewAverage) || 0;
          const agencyReviewCount = Number(agencyStats?.reviewCount) || 0;
          const agencyLastReviewDate = agencyStats?.lastReviewDate || null;

          // Get reviews from linked agents (matching agency profile logic) with last review date
          const linkedAgentReviews = await db.execute(
            sql`SELECT COUNT(r.*)::integer as agent_review_count, 
                       COALESCE(ROUND(AVG(r.rating), 2), 0)::float as agent_review_average,
                       MAX(r.date) as agent_last_review_date
                FROM reviews r 
                JOIN agency_agents aa ON r.target_id = aa.agent_id 
                WHERE aa.agency_id = ${agency.id} 
                  AND aa.left_at IS NULL 
                  AND r.target_type = 'agent'`
          );

          const agentReviewCount = linkedAgentReviews.rows[0]?.agent_review_count || 0;
          const agentReviewAverage = linkedAgentReviews.rows[0]?.agent_review_average || 0;
          const agentLastReviewDate = linkedAgentReviews.rows[0]?.agent_last_review_date || null;

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

          // Determine the most recent review date (from agency or agent reviews)
          let lastReviewDate: string | null = null;
          if (agencyLastReviewDate && agentLastReviewDate) {
            lastReviewDate = new Date(agencyLastReviewDate) > new Date(agentLastReviewDate) 
              ? agencyLastReviewDate 
              : agentLastReviewDate;
          } else {
            lastReviewDate = agencyLastReviewDate || agentLastReviewDate;
          }

          // Return the agency with review statistics
          return {
            ...agency,
            reviewCount: totalReviews,
            rating: finalScore,
            lastReviewDate,
          };
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
    // Gracefully degrade if reviews table doesn't exist yet
    let reviewCount = 0;
    let reviewAverage = 0;
    try {
      const reviewResults = await db.execute(
        sql`SELECT COUNT(*)::integer as count, COALESCE(ROUND(AVG(rating), 2), 0)::float as average 
            FROM reviews 
            WHERE target_id = ${id} AND target_type = 'agent'`
      );
      const row = reviewResults.rows[0] as any;
      reviewCount = row?.count || 0;
      reviewAverage = row?.average || 0;
    } catch (error: any) {
      // Only gracefully degrade if reviews table doesn't exist (42P01)
      // Re-throw all other errors so they're visible
      if (error?.code === '42P01') {
        console.log('Reviews table not yet created - skipping review stats for agent');
      } else {
        console.error('Error fetching review stats for agent:', error);
        throw error;
      }
    }

    // Get agency information by joining with agency_agents (UUID-based)
    let agencyName = null;
    let agencyId = null;
    let agencySlug = null;
    let networkInfo: { networkId: number; networkName: string; networkSlug: string; networkLogo: string | null } | null = null;
    
    const [agencyRelationship] = await db
      .select({
        agencyId: agencies.id,
        agencyName: agencies.agencyName,
        agencySlug: agencies.slug,
        networkId: agencies.networkId
      })
      .from(agencyAgents)
      .leftJoin(agencies, eq(agencyAgents.agencyUuid, agencies.uuid))
      .where(
        and(
          eq(agencyAgents.agentUuid, agent.uuid),
          isNull(agencyAgents.leftAt)
        )
      )
      .limit(1);

    if (agencyRelationship) {
      agencyName = agencyRelationship.agencyName;
      agencyId = agencyRelationship.agencyId;
      agencySlug = agencyRelationship.agencySlug;
      
      // Get network information if agency belongs to a network
      if (agencyRelationship.networkId) {
        const [network] = await db
          .select({
            id: networks.id,
            name: networks.name,
            slug: networks.slug,
            logo: networks.logo,
          })
          .from(networks)
          .where(eq(networks.id, agencyRelationship.networkId));
        
        if (network) {
          networkInfo = {
            networkId: network.id,
            networkName: network.name,
            networkSlug: network.slug,
            networkLogo: network.logo,
          };
        }
      }
    }

    // Get pinned review for this agent
    // Gracefully degrade if reviews table doesn't exist yet
    let pinnedReview = null;
    try {
      const [pinnedReviewData] = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          author: reviews.author,
          date: reviews.date
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.targetId, id),
            eq(reviews.targetType, 'agent'),
            eq(reviews.pinned, true)
          )
        )
        .limit(1);

      if (pinnedReviewData) {
        pinnedReview = pinnedReviewData;
      }
    } catch (error: any) {
      // Only gracefully degrade if reviews table doesn't exist (42P01)
      // Re-throw all other errors so they're visible
      if (error?.code === '42P01') {
        console.log('Reviews table not yet created - skipping pinned review for agent');
      } else {
        console.error('Error fetching pinned review for agent:', error);
        throw error;
      }
    }

    // Return agent with review statistics, agency information, network info, and pinned review
    return {
      ...agent,
      isAgent: true,
      isAgency: false,
      reviewCount: Number(reviewCount),
      reviewAverage: Number(reviewAverage),
      agencyName: agencyName,
      agencyId: agencyId,
      agencySlug: agencySlug,
      pinnedReview: pinnedReview,
      ...(networkInfo || {}),
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

  async getAgencyById(id: number): Promise<Agency | undefined> {
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, id));
    
    if (!agency) return undefined;

    // Get review statistics for this agency
    // Only count reviews WITH a property for the average (reviews without property don't count toward rating)
    let reviewCount = 0;
    let reviewAverage = 0;
    try {
      const reviewResults = await db.execute(
        sql`SELECT COUNT(*)::integer as count, COALESCE(ROUND(AVG(rating), 2), 0)::float as average 
            FROM reviews 
            WHERE target_id = ${id} AND target_type = 'agency' AND confirmed = true AND property_uuid IS NOT NULL`
      );
      const row = reviewResults.rows[0] as any;
      reviewCount = row?.count || 0;
      reviewAverage = row?.average || 0;
    } catch (error: any) {
      if (error?.code === '42P01') {
        console.log('Reviews table not yet created - skipping review stats for agency');
      } else {
        console.error('Error fetching review stats for agency:', error);
      }
    }

    // Get network information if agency belongs to a network
    let networkInfo: { networkId: number; networkName: string; networkSlug: string; networkLogo: string | null } | null = null;
    if (agency.networkId) {
      const [network] = await db
        .select({
          id: networks.id,
          name: networks.name,
          slug: networks.slug,
          logo: networks.logo,
        })
        .from(networks)
        .where(eq(networks.id, agency.networkId));
      
      if (network) {
        networkInfo = {
          networkId: network.id,
          networkName: network.name,
          networkSlug: network.slug,
          networkLogo: network.logo,
        };
      }
    }

    return {
      ...agency,
      reviewCount: Number(reviewCount),
      reviewAverage: Number(reviewAverage),
      ...(networkInfo || {}),
    } as any;
  }

  async getAgentByUuid(uuid: string): Promise<User | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.uuid, uuid));
    if (!agent) return undefined;

    return this.getAgentById(agent.id);
  }

  async getAgentBySlug(slug: string): Promise<User | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.slug, slug));
    if (!agent) return undefined;

    return this.getAgentById(agent.id);
  }

  async getAgencyByUuid(uuid: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.uuid, uuid));
    if (!agency) return undefined;

    return this.getAgencyById(agency.id);
  }

  async getAgencyBySlug(slug: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.slug, slug));
    if (!agency) return undefined;

    return this.getAgencyById(agency.id);
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
          and(
            eq(reviews.targetId, agentId), 
            eq(reviews.targetType, "agent"),
            eq(reviews.confirmed, true)
          ),
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
      // Return all confirmed reviews. Reviews without a property (propertyUuid IS NULL)
      // are displayed but should not count toward the agency average rating calculation.
      const result = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.targetId, agencyId), 
            eq(reviews.targetType, "agency"),
            eq(reviews.confirmed, true)
          ),
        )
        .orderBy(sql`${reviews.date} DESC`);
      return result;
    } catch (error) {
      console.error("Error obteniendo reseñas de la agencia:", error);
      return [];
    }
  }

  async getReviewByToken(token: string): Promise<Review | null> {
    try {
      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.confirmationToken, token));
      return review || null;
    } catch (error) {
      console.error("Error obteniendo reseña por token:", error);
      return null;
    }
  }

  async confirmReviewByToken(token: string): Promise<Review | null> {
    try {
      const [updatedReview] = await db
        .update(reviews)
        .set({ confirmed: true })
        .where(
          and(
            eq(reviews.confirmationToken, token),
            eq(reviews.confirmed, false)
          )
        )
        .returning();
      return updatedReview || null;
    } catch (error) {
      console.error("Error confirmando reseña:", error);
      return null;
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

  // Método para destacar/quitar destaque de una reseña
  async pinReview(reviewId: number, pinned: boolean): Promise<Review> {
    try {
      console.log(`${pinned ? 'Destacando' : 'Quitando destaque de'} reseña ${reviewId}`);

      // Primero obtenemos la reseña para conocer su targetId y targetType
      const [currentReview] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, reviewId));

      if (!currentReview) {
        throw new Error(`No se encontró la reseña con ID ${reviewId}`);
      }

      // Si estamos destacando la reseña, primero quitamos el destaque de todas las otras reseñas del mismo target
      if (pinned) {
        await db
          .update(reviews)
          .set({ pinned: false })
          .where(
            and(
              eq(reviews.targetId, currentReview.targetId),
              eq(reviews.targetType, currentReview.targetType),
              not(eq(reviews.id, reviewId))
            )
          );
      }

      // Ahora actualizamos la reseña actual
      const [updatedReview] = await db
        .update(reviews)
        .set({ pinned })
        .where(eq(reviews.id, reviewId))
        .returning();

      if (!updatedReview) {
        throw new Error(`No se pudo actualizar la reseña con ID ${reviewId}`);
      }

      return updatedReview;
    } catch (error) {
      console.error(`Error al actualizar el estado de la reseña ${reviewId}:`, error);
      throw new Error(`No se pudo actualizar la reseña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // Multi-agency management methods
  async getAgenciesByAdmin(adminAgentId: number): Promise<Agency[]> {
    try {
      console.log(`Fetching agencies for admin with ID: ${adminAgentId}`);

      const result = await db
        .select({
          id: agencies.id,
          uuid: agencies.uuid,
          slug: agencies.slug,
          agencyName: agencies.agencyName,
          agencyAddress: agencies.agencyAddress,
          agencyDescription: agencies.agencyDescription,
          agencyLogo: agencies.agencyLogo,
          agencyPhone: agencies.agencyPhone,
          agencyActiveSince: agencies.agencyActiveSince,
          city: agencies.city,
          agencyInfluenceNeighborhoods: agencies.agencyInfluenceNeighborhoods,
          agencySupportedLanguages: agencies.agencySupportedLanguages,
          agencyWebsite: agencies.agencyWebsite,
          agencySocialMedia: agencies.agencySocialMedia,
          subscriptionPlan: agencies.subscriptionPlan,
          isYearlyBilling: agencies.isYearlyBilling,
          seatsLimit: agencies.seatsLimit,
          activePropertiesLimit: agencies.activePropertiesLimit,
          deletedAt: agencies.deletedAt,
          createdAt: agencies.createdAt,
        })
        .from(agencies)
        .innerJoin(
          agencyAgents,
          and(
            eq(agencyAgents.agencyId, agencies.id),
            eq(agencyAgents.agentId, adminAgentId),
            eq(agencyAgents.role, 'admin'),
            isNull(agencyAgents.leftAt)
          )
        )
        .orderBy(agencies.agencyName);

      console.log(`Found ${result.length} agencies for admin ${adminAgentId}`);
      return result;
    } catch (error) {
      console.error("Error fetching agencies by admin:", error);
      return [];
    }
  }

  async getAgency(agencyId: number): Promise<(Agency & { adminAgentId: number }) | null> {
    try {
      const [result] = await db
        .select({
          id: agencies.id,
          uuid: agencies.uuid,
          slug: agencies.slug,
          agencyName: agencies.agencyName,
          agencyAddress: agencies.agencyAddress,
          agencyDescription: agencies.agencyDescription,
          agencyLogo: agencies.agencyLogo,
          agencyPhone: agencies.agencyPhone,
          agencyActiveSince: agencies.agencyActiveSince,
          city: agencies.city,
          agencyInfluenceNeighborhoods: agencies.agencyInfluenceNeighborhoods,
          agencySupportedLanguages: agencies.agencySupportedLanguages,
          agencyWebsite: agencies.agencyWebsite,
          agencySocialMedia: agencies.agencySocialMedia,
          subscriptionPlan: agencies.subscriptionPlan,
          isYearlyBilling: agencies.isYearlyBilling,
          seatsLimit: agencies.seatsLimit,
          activePropertiesLimit: agencies.activePropertiesLimit,
          deletedAt: agencies.deletedAt,
          createdAt: agencies.createdAt,
          adminAgentId: agencyAgents.agentId,
        })
        .from(agencies)
        .innerJoin(
          agencyAgents,
          and(
            eq(agencyAgents.agencyId, agencies.id),
            eq(agencyAgents.role, 'admin'),
            isNull(agencyAgents.leftAt)
          )
        )
        .where(eq(agencies.id, agencyId))
        .limit(1);

      return result || null;
    } catch (error) {
      console.error(`Error fetching agency ${agencyId}:`, error);
      return null;
    }
  }

  async createAgency(agencyData: Partial<InsertAgency>): Promise<Agency> {
    try {
      console.log("Creating agency with data:", agencyData);

      // Aseguramos que el nombre de agencia existe
      if (!agencyData.agencyName) {
        throw new Error("Missing required agencyName field");
      }

      // Import ALL_ZONES constant for default influence neighborhoods
      const { ALL_ZONES } = await import('../shared/schema.js');

      // Insertamos la agencia (admin relationship handled via agency_agents table)
      const [newAgency] = await db
        .insert(agencies)
        .values({
          agencyName: agencyData.agencyName,
          slug: generateAgencySlug(agencyData.agencyName),
          agencyAddress: agencyData.agencyAddress || null,
          agencyDescription: agencyData.agencyDescription || null,
          agencyLogo: agencyData.agencyLogo || null,
          agencyInfluenceNeighborhoods:
            agencyData.agencyInfluenceNeighborhoods && agencyData.agencyInfluenceNeighborhoods.length > 0
              ? agencyData.agencyInfluenceNeighborhoods
              : [ALL_ZONES],
          agencySupportedLanguages: agencyData.agencySupportedLanguages || [],
          agencyWebsite: agencyData.agencyWebsite || null,
          agencySocialMedia: agencyData.agencySocialMedia || null,
          agencyActiveSince: agencyData.agencyActiveSince || null,
          agencyPhone: agencyData.agencyPhone || null,
          city: agencyData.city || 'Barcelona',
          subscriptionPlan: agencyData.subscriptionPlan || null,
          isYearlyBilling: agencyData.isYearlyBilling || false,
          seatsLimit: agencyData.seatsLimit || null,
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

      // Preparar los datos de actualización con mapeo de campos
      const updates: any = {};

      // Mapear campos individuales
      if (agencyData.agencyName !== undefined) updates.agencyName = agencyData.agencyName;
      if (agencyData.agencyAddress !== undefined) updates.agencyAddress = agencyData.agencyAddress;
      if (agencyData.agencyDescription !== undefined) updates.agencyDescription = agencyData.agencyDescription;
      if (agencyData.agencyLogo !== undefined) updates.agencyLogo = agencyData.agencyLogo;
      if (agencyData.agencyPhone !== undefined) updates.agencyPhone = agencyData.agencyPhone;
      if (agencyData.city !== undefined) updates.city = agencyData.city;
      if (agencyData.agencyWebsite !== undefined) updates.agencyWebsite = agencyData.agencyWebsite;
      if (agencyData.agencySocialMedia !== undefined) updates.agencySocialMedia = agencyData.agencySocialMedia;
      
      // Campos adicionales
      if (agencyData.agencySupportedLanguages !== undefined) updates.agencySupportedLanguages = agencyData.agencySupportedLanguages;
      if (agencyData.agencyInfluenceNeighborhoods !== undefined) updates.agencyInfluenceNeighborhoods = agencyData.agencyInfluenceNeighborhoods;
      if (agencyData.agencyActiveSince !== undefined) updates.agencyActiveSince = agencyData.agencyActiveSince;
      
      // Subscription fields
      if (agencyData.subscriptionPlan !== undefined) updates.subscriptionPlan = agencyData.subscriptionPlan;
      if (agencyData.seatsLimit !== undefined) updates.seatsLimit = agencyData.seatsLimit;
      if (agencyData.activePropertiesLimit !== undefined) updates.activePropertiesLimit = agencyData.activePropertiesLimit;
      if (agencyData.isYearlyBilling !== undefined) updates.isYearlyBilling = agencyData.isYearlyBilling;

      console.log('Final update object:', updates);

      // Actualizamos la agencia
      const [updatedAgency] = await db
        .update(agencies)
        .set(updates)
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
      console.log(`Hard deleting agency ${id} with cascade to admin agents and properties`);

      // Verificamos que la agencia existe
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, id));

      if (!agency) {
        throw new Error(`Agency with ID ${id} not found`);
      }

      // Get all ACTIVE admin agents linked to this agency
      const adminAgents = await db
        .select({ agentId: agencyAgents.agentId })
        .from(agencyAgents)
        .where(and(
          eq(agencyAgents.agencyId, id),
          eq(agencyAgents.role, 'admin'),
          isNull(agencyAgents.leftAt)
        ));

      const adminAgentIds = adminAgents.map(a => a.agentId);
      console.log(`Found ${adminAgentIds.length} admin agents to hard delete for agency ${id}`);

      // Get all properties owned by this agency
      const agencyProperties = await db
        .select({ uuid: properties.uuid })
        .from(properties)
        .where(eq(properties.agencyId, id));

      const propertyUuids = agencyProperties.map(p => p.uuid);
      console.log(`Found ${propertyUuids.length} properties to delete for agency ${id}`);

      // Use a transaction to ensure all operations succeed or fail together
      await db.transaction(async (tx) => {
        // 1. Delete all admin agents' related data
        if (adminAgentIds.length > 0) {
          // Delete admin agents' appointments
          await tx
            .delete(appointments)
            .where(inArray(appointments.agentId, adminAgentIds));

          // Delete admin agents' inquiries
          await tx
            .delete(inquiries)
            .where(inArray(inquiries.agentId, adminAgentIds));

          // Delete admin agents' conversation messages
          await tx
            .delete(conversationMessages)
            .where(and(
              eq(conversationMessages.senderType, 'agent'),
              inArray(conversationMessages.senderId, adminAgentIds)
            ));

          // Delete admin agents' pinned conversations
          await tx
            .delete(pinnedConversations)
            .where(and(
              eq(pinnedConversations.userType, 'agent'),
              inArray(pinnedConversations.userId, adminAgentIds)
            ));

          // Delete admin agents' reviews
          await tx
            .delete(reviews)
            .where(and(
              eq(reviews.targetType, 'agent'),
              inArray(reviews.targetId, adminAgentIds)
            ));

          // Delete admin agents' events
          await tx
            .delete(agentEvents)
            .where(inArray(agentEvents.agentId, adminAgentIds));

          // Delete admin agents' favorite relationships
          await tx
            .delete(clientFavoriteAgents)
            .where(inArray(clientFavoriteAgents.agentId, adminAgentIds));

          console.log(`Deleted related data for ${adminAgentIds.length} admin agents`);
        }

        // 2. Delete agency properties and their related data
        if (propertyUuids.length > 0) {
          // Delete property visit requests
          await tx
            .delete(propertyVisitRequests)
            .where(inArray(propertyVisitRequests.propertyUuid, propertyUuids));

          // Delete property favorites
          await tx
            .delete(clientFavoriteProperties)
            .where(inArray(clientFavoriteProperties.propertyUuid, propertyUuids));

          // Delete property fraud reports
          await tx
            .delete(fraudReports)
            .where(inArray(fraudReports.propertyUuid, propertyUuids));

          // Delete property inquiries
          await tx
            .delete(inquiries)
            .where(inArray(inquiries.propertyUuid, propertyUuids));

          // Delete properties
          await tx
            .delete(properties)
            .where(inArray(properties.uuid, propertyUuids));

          console.log(`Deleted ${propertyUuids.length} properties and their related data`);
        }

        // 3. Delete agency reviews
        await tx
          .delete(reviews)
          .where(and(
            eq(reviews.targetType, 'agency'),
            eq(reviews.targetId, id)
          ));

        // 4. Delete agency favorites
        await tx
          .delete(clientFavoriteAgencies)
          .where(eq(clientFavoriteAgencies.agencyId, id));

        // 5. Delete subscription events
        await tx
          .delete(subscriptionEvents)
          .where(eq(subscriptionEvents.agencyId, id));

        // 6. Delete all agency_agents relationships
        await tx
          .delete(agencyAgents)
          .where(eq(agencyAgents.agencyId, id));

        // 7. Delete admin agents
        if (adminAgentIds.length > 0) {
          await tx
            .delete(agents)
            .where(and(
              inArray(agents.id, adminAgentIds),
              eq(agents.agentType, 'agency_member')
            ));
          
          console.log(`Hard deleted ${adminAgentIds.length} admin agents: ${adminAgentIds.join(', ')}`);
        }

        // 8. Finally, delete the agency itself
        await tx
          .delete(agencies)
          .where(eq(agencies.id, id));
      });

      console.log(`Agency ${id}, its admin agents, and all related data deleted successfully`);
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

      // Select agents through the agency_agents junction table
      const result = await db
        .select({
          id: agents.id,
          email: agents.email,
          password: agents.password,
          name: agents.name,
          surname: agents.surname,
          description: agents.description,
          avatar: agents.avatar,
          city: agents.city,
          influenceNeighborhoods: agents.influenceNeighborhoods,
          yearsOfExperience: agents.yearsOfExperience,
          languagesSpoken: agents.languagesSpoken,
          agentType: agents.agentType,
          subscriptionPlan: agents.subscriptionPlan,
          isYearlyBilling: agents.isYearlyBilling,
          pausedSubscriptionPlan: agents.pausedSubscriptionPlan,
          pausedIsYearlyBilling: agents.pausedIsYearlyBilling,
          pausedAt: agents.pausedAt,
          deletedAt: agents.deletedAt,
          createdAt: agents.createdAt,
          invitationStatus: agents.invitationStatus, // For team table display
        })
        .from(agents)
        .innerJoin(
          agencyAgents,
          and(
            eq(agencyAgents.agentId, agents.id),
            eq(agencyAgents.agencyId, agencyId),
            isNull(agencyAgents.leftAt)
          )
        )
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
    // Fetch UUIDs for agent and agency before inserting
    const [agent] = await db.select({ uuid: agents.uuid }).from(agents).where(eq(agents.id, agentData.agentId));
    const [agency] = await db.select({ uuid: agencies.uuid }).from(agencies).where(eq(agencies.id, agentData.agencyId));
    
    if (!agent) throw new Error('Agent not found');
    if (!agency) throw new Error('Agency not found');
    
    const [newAgent] = await db
      .insert(agencyAgents)
      .values({
        ...agentData,
        agentUuid: agent.uuid,
        agencyUuid: agency.uuid,
      })
      .returning();
    return newAgent;
  }

  async deleteAgencyAgent(id: number): Promise<void> {
    await db.delete(agencyAgents).where(eq(agencyAgents.id, id));
  }

  // Properties
  async getProperties(limit: number = 100): Promise<Property[]> {
    // Apply default pagination limit to prevent unbounded queries
    // Clamp limit to max 1000 to prevent abuse
    const clampedLimit = Math.min(Math.max(1, limit), 1000);
    const query = db
      .select()
      .from(properties)
      .orderBy(sql`${properties.createdAt} DESC`)
      .limit(clampedLimit);
    return await query;
  }

  async getProperty(uuid: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.uuid, uuid));
    return property;
  }

  async getPropertyByUuid(uuid: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.uuid, uuid));
    return property;
  }

  async getPropertyBySlug(slug: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.slug, slug));
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
          uuid: properties.uuid,
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
          imageUrls: properties.imageUrls,
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
        imageUrls: this.parseArrayField(property.imageUrls),
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

  async incrementPropertyViewCount(uuid: string): Promise<void> {
    await db
      .update(properties)
      .set({ viewCount: sql`${properties.viewCount} + 1` })
      .where(eq(properties.uuid, uuid));
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

  async getAllPropertiesByAgent(agentId: number, limit?: number, offset?: number): Promise<Property[]> {
    console.log(`Fetching all properties (active and inactive) for agent ID: ${agentId}, limit: ${limit}, offset: ${offset}`);
    
    // Lean projection with all required fields (never undefined)
    const baseFields = {
      uuid: properties.uuid,
      slug: properties.slug, // SEO-friendly URL slug
      reference: properties.reference,
      // Address fields
      locality: properties.locality, // City/town input for address editing
      streetName: properties.streetName, // Street name input for address editing
      streetNumber: properties.streetNumber, // Street number input for address editing
      address: properties.address,
      hideAddress: properties.hideAddress, // Hide address from public display
      latitude: properties.latitude, // For map display
      longitude: properties.longitude, // For map display
      escalera: properties.escalera,
      planta: properties.planta,
      puerta: properties.puerta,
      type: properties.type,
      operationType: properties.operationType,
      housingType: properties.housingType,
      housingStatus: properties.housingStatus,
      floor: properties.floor,
      features: properties.features,
      availability: properties.availability,
      availabilityDate: properties.availabilityDate,
      previousPrice: properties.previousPrice,
      price: properties.price,
      city: properties.city, // For filtering/display
      district: properties.district, // For filtering/display
      neighborhood: properties.neighborhood,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      superficie: properties.superficie,
      mainImageIndex: properties.mainImageIndex,
      viewCount: properties.viewCount,
      agentId: properties.agentId,
      agencyId: properties.agencyId,
      isActive: properties.isActive,
      isDraft: properties.isDraft, // For form routing decision
      fraudCount: properties.fraudCount, // For fraud reporting
      createdAt: properties.createdAt,
      title: properties.title,
      imageUrls: properties.imageUrls, // Cloud storage URLs for images
      // Exclude only description field for performance
    };

    let query = db
      .select(baseFields)
      .from(properties)
      .where(eq(properties.agentId, agentId))
      .orderBy(sql`${properties.createdAt} DESC`);

    // Add pagination if specified
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.offset(offset);
    }

    const result = await query;
    console.log(`Found ${result.length} total properties for agent ID: ${agentId} (lean projection with pagination)`);
    
    // Compatibility layer: ensure imageUrls is always an array
    return result.map(property => ({
      ...property,
      imageUrls: property.imageUrls ?? [],
    }));
  }

  async getPropertiesByAgency(agencyId: number): Promise<Property[]> {
    try {
      console.log(`Obteniendo propiedades para la agencia ${agencyId}`);

      // Get agency agents first to build the query
      const agencyAgents = await this.getAgencyAgents(agencyId);
      const agentIds = agencyAgents.map(agent => agent.id);
      console.log(`Encontrados ${agencyAgents.length} agentes vinculados a la agencia ${agencyId}`);

      // Fixed N+1 query: Use a single query instead of mapping over agents
      // Get all properties in one query using OR condition:
      // - Properties directly linked to agency (agencyId matches), OR
      // - Properties belonging to agency agents (agentId in agency agents list)
      let whereCondition;
      if (agentIds.length > 0) {
        whereCondition = and(
          sql`(${properties.agencyId} = ${agencyId} OR ${properties.agentId} IN (${sql.join(agentIds.map(id => sql`${id}`), sql`, `)}))`,
          eq(properties.isActive, true)
        );
      } else {
        whereCondition = and(
          eq(properties.agencyId, agencyId),
          eq(properties.isActive, true)
        );
      }

      // Execute single query to get all properties (avoids N+1 problem)
      const allProperties = await db
        .select()
        .from(properties)
        .where(whereCondition)
        .orderBy(sql`${properties.createdAt} DESC`);

      console.log(`Total de propiedades para la agencia ${agencyId}: ${allProperties.length} (optimized single query)`);

      return allProperties;
    } catch (error) {
      console.error(`Error al obtener propiedades para la agencia ${agencyId}:`, error);
      return [];
    }
  }

  async getActivePropertiesCount(agencyId: number): Promise<number> {
    try {
      // Get agency agents
      const agencyAgents = await this.getAgencyAgents(agencyId);
      const agentIds = agencyAgents.map(agent => agent.id);

      // Count distinct active properties that are either:
      // 1. Directly linked to the agency (agencyId matches), OR
      // 2. Belong to agency agents
      // This avoids double-counting properties that have both agencyId and agentId set
      let whereCondition;
      if (agentIds.length > 0) {
        whereCondition = and(
          sql`(${properties.agencyId} = ${agencyId} OR ${properties.agentId} IN (${sql.join(agentIds.map(id => sql`${id}`), sql`, `)}))`,
          eq(properties.isActive, true)
        );
      } else {
        whereCondition = and(
          eq(properties.agencyId, agencyId),
          eq(properties.isActive, true)
        );
      }

      const result = await db
        .select({ count: sql<number>`count(DISTINCT ${properties.uuid})::int` })
        .from(properties)
        .where(whereCondition);

      const totalCount = result[0]?.count ?? 0;
      console.log(`Active properties count for agency ${agencyId}: ${totalCount} (distinct count, no duplicates)`);
      
      return totalCount;
    } catch (error) {
      console.error(`Error counting active properties for agency ${agencyId}:`, error);
      return 0;
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
    
    // Always filter by isActive = true for public-facing searches
    whereConditions.push(eq(properties.isActive, true));

    // Aplicar filtros si están definidos
    if (filters) {
      // Filtrar por tipo de operación (Venta o Alquiler)
      if (filters.operationType) {
        console.log(
          `Filtrando por tipo de operación: ${filters.operationType}`,
        );
        whereConditions.push(eq(properties.operationType, filters.operationType));
      }

      // Filtrar por tipo de inmueble (Vivienda, Oficinas, etc.)
      if (filters.propertyType) {
        console.log(
          `Filtrando por tipo de inmueble: ${filters.propertyType}`,
        );
        whereConditions.push(eq(properties.type, filters.propertyType));
      }

      // Filtrar por barrio(s)
      if (filters.neighborhoods) {
        let neighborhoods;
        if (Array.isArray(filters.neighborhoods)) {
          neighborhoods = filters.neighborhoods;
        } else if (typeof filters.neighborhoods === 'string' && filters.neighborhoods.includes(',')) {
          // Split comma-separated string into array of neighborhoods
          neighborhoods = filters.neighborhoods.split(',').map((n: string) => n.trim());
        } else {
          neighborhoods = [filters.neighborhoods];
        }

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

    // Build query with all conditions using defined fields
    const searchFields = {
      uuid: properties.uuid,
      reference: properties.reference,
      address: properties.address,
      hideAddress: properties.hideAddress,
      escalera: properties.escalera,
      planta: properties.planta,
      puerta: properties.puerta,
      type: properties.type,
      operationType: properties.operationType,
      housingType: properties.housingType,
      housingStatus: properties.housingStatus,
      floor: properties.floor,
      features: properties.features,
      availability: properties.availability,
      availabilityDate: properties.availabilityDate,
      previousPrice: properties.previousPrice,
      price: properties.price,
      neighborhood: properties.neighborhood,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      superficie: properties.superficie,
      mainImageIndex: properties.mainImageIndex,
      viewCount: properties.viewCount,
      agentId: properties.agentId,
      agencyId: properties.agencyId,
      isActive: properties.isActive,
      createdAt: properties.createdAt,
      title: properties.title,
      imageUrls: properties.imageUrls, // Include URL-based images (lean performance)
      // Exclude description for performance
    };

    let query = db.select(searchFields).from(properties);
    
    if (whereConditions.length > 0) {
      console.log(`Aplicando ${whereConditions.length} condiciones WHERE con AND`);
      query = query.where(and(...whereConditions));
    }

    // Ordenar por precio (por defecto)
    query = query.orderBy(properties.price);
    
    // Apply pagination limit to prevent unbounded queries (max 500 results)
    const maxResults = 500;
    query = query.limit(maxResults);

    console.log("Ejecutando consulta de propiedades con filtros");
    const result = await query;
    console.log(`Consulta completada. Encontradas ${result.length} propiedades que coinciden con los filtros.`);
    
    // Compatibility layer: ensure imageUrls is always an array
    const compatibleResult = result.map(property => ({
      ...property,
      imageUrls: property.imageUrls ?? [],
    }));
    
    // Cache the results for 5 minutes for fast tab switching
    cache.set(cacheKey, compatibleResult, 300);
    
    return compatibleResult;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const propertyWithSlug = {
      ...property,
      slug: property.title && property.neighborhood 
        ? generatePropertySlug(property.title, property.neighborhood, property.reference)
        : undefined
    };
    
    const [newProperty] = await db
      .insert(properties)
      .values(propertyWithSlug)
      .returning();
    
    if (newProperty.title && newProperty.neighborhood && !newProperty.slug) {
      const finalSlug = generatePropertySlug(
        newProperty.title, 
        newProperty.neighborhood, 
        newProperty.reference, 
        newProperty.uuid
      );
      const [updatedProperty] = await db
        .update(properties)
        .set({ slug: finalSlug })
        .where(eq(properties.uuid, newProperty.uuid))
        .returning();
      
      // Clear property caches so new property appears in searches immediately
      cache.clearPropertyCaches();
      return updatedProperty;
    }
    
    // Clear property caches so new property appears in searches immediately
    cache.clearPropertyCaches();
    return newProperty;
  }

  async updateProperty(
    uuid: string,
    property: InsertProperty,
  ): Promise<Property> {
    // Get current property to track price changes
    const currentProperty = await this.getPropertyByUuid(uuid);
    
    // Build update object, only including defined fields
    const propertyToUpdate: Record<string, any> = {};
    for (const [key, value] of Object.entries(property)) {
      if (value !== undefined) {
        propertyToUpdate[key] = value;
      }
    }
    
    // Handle price change tracking: only when price is explicitly provided
    if (currentProperty && propertyToUpdate.price !== undefined) {
      const newPrice = propertyToUpdate.price as number;
      const currentPrice = currentProperty.price;
      
      if (newPrice < currentPrice) {
        // Price decreased - save old price as previousPrice
        propertyToUpdate.previousPrice = currentPrice;
      } else if (newPrice > currentPrice) {
        // Price increased - clear previousPrice (no longer a price drop)
        propertyToUpdate.previousPrice = null;
      }
      // If price unchanged, don't modify previousPrice (preserve existing value)
    }
    
    const [updatedProperty] = await db
      .update(properties)
      .set(propertyToUpdate)
      .where(eq(properties.uuid, uuid))
      .returning();
    
    // Clear property caches so updated property reflects in searches immediately
    cache.clearPropertyCaches();
    return updatedProperty;
  }

  async updatePropertyAddress(uuid: string, address: string, lat?: number, lng?: number): Promise<Property> {
    const updateData: any = { address };
    if (lat !== undefined && lng !== undefined) {
      updateData.lat = lat;
      updateData.lng = lng;
    }
    
    const [updatedProperty] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.uuid, uuid))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(uuid: string): Promise<void> {
    await db.delete(properties).where(eq(properties.uuid, uuid));
    // Clear property caches so deleted property is removed from searches immediately
    cache.clearPropertyCaches();
  }

  async togglePropertyStatus(uuid: string, isActive: boolean): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ isActive })
      .where(eq(properties.uuid, uuid))
      .returning();
    
    // Clear property caches so status change reflects in searches immediately
    cache.clearPropertyCaches();
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

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client;
  }

  async getClientsByAgent(agentId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.agentId, agentId))
      .orderBy(clients.name);
  }

  async getClientsByAgency(agencyId: number): Promise<Client[]> {
    const agencyAgentsList = await db
      .select({ agentId: agents.id })
      .from(agencyAgents)
      .innerJoin(agents, eq(agencyAgents.agentUuid, agents.uuid))
      .innerJoin(agencies, eq(agencyAgents.agencyUuid, agencies.uuid))
      .where(and(eq(agencies.id, agencyId), isNull(agencyAgents.leftAt)));

    const agentIds = agencyAgentsList.map(a => a.agentId);
    if (agentIds.length === 0) return [];

    return await db
      .select()
      .from(clients)
      .where(inArray(clients.agentId, agentIds))
      .orderBy(clients.name);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const normalizedPassword =
      client.password && !isPasswordHashed(client.password)
        ? await hashPassword(client.password)
        : client.password;

    const [newClient] = await db
      .insert(clients)
      .values({ ...client, password: normalizedPassword })
      .returning();
    return newClient;
  }

  async updateClient(id: number, client: InsertClient): Promise<Client> {
    const normalizedPassword =
      client.password && !isPasswordHashed(client.password)
        ? await hashPassword(client.password)
        : client.password;

    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, password: normalizedPassword })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async updateClientProfile(id: number, profileData: Partial<Client>): Promise<Client | undefined> {
    try {
      const normalizedProfileData = { ...profileData };
      if (
        normalizedProfileData.password &&
        !isPasswordHashed(normalizedProfileData.password)
      ) {
        normalizedProfileData.password = await hashPassword(normalizedProfileData.password);
      }

      const [updatedClient] = await db
        .update(clients)
        .set(normalizedProfileData)
        .where(eq(clients.id, id))
        .returning();
      return updatedClient;
    } catch (error) {
      console.error('Error updating client profile:', error);
      return undefined;
    }
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Neighborhood Ratings
  async getNeighborhoodRatings(
    neighborhood: string,
    city: string = 'Barcelona',
    district?: string
  ): Promise<NeighborhoodRating[]> {
    const conditions = [
      eq(neighborhoodRatings.neighborhood, neighborhood),
      eq(neighborhoodRatings.city, city)
    ];
    
    if (district) {
      conditions.push(eq(neighborhoodRatings.district, district));
    }
    
    return await db
      .select()
      .from(neighborhoodRatings)
      .where(and(...conditions));
  }

  async getNeighborhoodRatingsAverage(
    neighborhood: string,
    city: string = 'Barcelona',
    district?: string
  ): Promise<Record<string, number>> {
    try {
      // Check cache first to dramatically improve tab switching performance
      const cacheKey = `neighborhood_ratings_${city}_${district || 'all'}_${neighborhood}`;
      const cached = cache.get<Record<string, number>>(cacheKey);
      if (cached) {
        console.log(`Cache hit for neighborhood ratings: ${neighborhood}`);
        return cached;
      }

      console.log(`Calculating averages for neighborhood: ${neighborhood}`);

      // Build conditions for hierarchical filtering
      const conditions = [
        eq(neighborhoodRatings.neighborhood, neighborhood),
        eq(neighborhoodRatings.city, city)
      ];
      
      if (district) {
        conditions.push(eq(neighborhoodRatings.district, district));
      }

      // Query the database for actual ratings
      const ratings = await db
        .select()
        .from(neighborhoodRatings)
        .where(and(...conditions));

      if (!ratings || ratings.length === 0) {
        console.log(`No ratings found for neighborhood: ${neighborhood}`);
        const result = { count: 0 };
        // Cache for 5 minutes to reduce database load even for empty results
        cache.set(cacheKey, result, 300);
        return result;
      }

      console.log(`Found ${ratings.length} ratings for ${neighborhood}`);

      // Calculate averages
      const averages = {
        count: ratings.length,
        security: Number((ratings.reduce((sum, r) => sum + Number(r.security), 0) / ratings.length).toFixed(1)),
        parking: Number((ratings.reduce((sum, r) => sum + Number(r.parking), 0) / ratings.length).toFixed(1)),
        familyFriendly: Number((ratings.reduce((sum, r) => sum + Number(r.familyFriendly), 0) / ratings.length).toFixed(1)),
        publicTransport: Number((ratings.reduce((sum, r) => sum + Number(r.publicTransport), 0) / ratings.length).toFixed(1)),
        greenSpaces: Number((ratings.reduce((sum, r) => sum + Number(r.greenSpaces), 0) / ratings.length).toFixed(1)),
        services: Number((ratings.reduce((sum, r) => sum + Number(r.services), 0) / ratings.length).toFixed(1)),
      };

      console.log(`Calculated averages for ${neighborhood}:`, averages);

      // Cache for 10 minutes to eliminate repeated API calls
      cache.set(cacheKey, averages, 600);
      
      return averages;
    } catch (error) {
      console.error(`Error calculating averages for neighborhood ${neighborhood}:`, error);
      // Return empty result on error
      return { count: 0 };
    }
  }

  // Get all Barcelona neighborhoods (for consistency with property search)
  async getAllNeighborhoodsWithRatings(): Promise<string[]> {
    // Import the shared neighborhood list to avoid duplication
    const { BARCELONA_NEIGHBORHOODS } = await import('./utils/neighborhoods');
    return [...BARCELONA_NEIGHBORHOODS].sort();
  }

  async createNeighborhoodRating(
    rating: InsertNeighborhoodRating,
  ): Promise<NeighborhoodRating> {
    // Convertir números a strings para los campos decimal
    const convertedRating = {
      neighborhood: rating.neighborhood,
      city: rating.city || 'Barcelona',
      district: rating.district,
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
    
    // Invalidate the cache for this neighborhood so new ratings appear immediately
    const city = rating.city || 'Barcelona';
    const cacheKey = `neighborhood_ratings_${city}_${rating.district || 'all'}_${rating.neighborhood}`;
    cache.delete(cacheKey);
    console.log(`Cache invalidated for neighborhood ratings: ${rating.neighborhood}`);
    
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
        propertyUuid: inquiries.propertyUuid,
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
      .leftJoin(properties, eq(inquiries.propertyUuid, properties.uuid))
      .where(eq(inquiries.agentId, agentId))
      .orderBy(sql`${inquiries.createdAt} DESC`);
    
    return results as Inquiry[];
  }

  async getInquiriesByClient(clientEmail: string): Promise<Inquiry[]> {
    const results = await db
      .select({
        id: inquiries.id,
        name: inquiries.name,
        email: inquiries.email,
        phone: inquiries.phone,
        message: inquiries.message,
        propertyUuid: inquiries.propertyUuid,
        agentId: inquiries.agentId,
        status: inquiries.status,
        createdAt: inquiries.createdAt,
        property: {
          title: properties.title,
          address: properties.address,
          reference: properties.reference,
        },
        agent: {
          id: agents.id,
          name: agents.name,
          surname: agents.surname,
          avatar: agents.avatar,
        },
      })
      .from(inquiries)
      .leftJoin(properties, eq(inquiries.propertyUuid, properties.uuid))
      .leftJoin(agents, eq(inquiries.agentId, agents.id))
      .where(eq(inquiries.email, clientEmail))
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

  // Conversation Messages
  async createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage> {
    const [newMessage] = await db
      .insert(conversationMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getConversationMessages(inquiryId: number): Promise<ConversationMessage[]> {
    return await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.inquiryId, inquiryId))
      .orderBy(conversationMessages.createdAt);
  }

  async markMessagesAsRead(inquiryId: number, readerType: 'client' | 'agent'): Promise<void> {
    // Mark messages from the opposite sender as read
    // If client is reading, mark agent's messages as read
    // If agent is reading, mark client's messages as read
    const senderToMark = readerType === 'client' ? 'agent' : 'client';
    
    await db
      .update(conversationMessages)
      .set({ status: 'read' })
      .where(
        and(
          eq(conversationMessages.inquiryId, inquiryId),
          eq(conversationMessages.senderType, senderToMark),
          ne(conversationMessages.status, 'read')
        )
      );
  }

  // Pinned Conversations methods
  async pinConversation(userType: string, userId: number, userEmail: string | null, inquiryId: number): Promise<PinnedConversation> {
    // First check if user already has 3 pinned conversations
    const existingPinned = await db
      .select()
      .from(pinnedConversations)
      .where(
        and(
          eq(pinnedConversations.userType, userType),
          userType === "agent" 
            ? eq(pinnedConversations.userId, userId)
            : eq(pinnedConversations.userEmail, userEmail!)
        )
      );

    if (existingPinned.length >= 3) {
      throw new Error("Cannot pin more than 3 conversations");
    }

    // Check if already pinned
    const alreadyPinned = existingPinned.find(p => p.inquiryId === inquiryId);
    if (alreadyPinned) {
      return alreadyPinned;
    }

    const [pinnedConversation] = await db
      .insert(pinnedConversations)
      .values({
        userType,
        userId,
        userEmail,
        inquiryId
      })
      .returning();

    return pinnedConversation;
  }

  async unpinConversation(userType: string, userId: number, userEmail: string | null, inquiryId: number): Promise<void> {
    await db
      .delete(pinnedConversations)
      .where(
        and(
          eq(pinnedConversations.userType, userType),
          userType === "agent" 
            ? eq(pinnedConversations.userId, userId)
            : eq(pinnedConversations.userEmail, userEmail!),
          eq(pinnedConversations.inquiryId, inquiryId)
        )
      );
  }

  async getPinnedConversations(userType: string, userId: number, userEmail: string | null): Promise<number[]> {
    const pinnedList = await db
      .select({ inquiryId: pinnedConversations.inquiryId })
      .from(pinnedConversations)
      .where(
        and(
          eq(pinnedConversations.userType, userType),
          userType === "agent" 
            ? eq(pinnedConversations.userId, userId)
            : eq(pinnedConversations.userEmail, userEmail!)
        )
      )
      .orderBy(desc(pinnedConversations.createdAt));

    return pinnedList.map(p => p.inquiryId);
  }

  async isConversationPinned(userType: string, userId: number, userEmail: string | null, inquiryId: number): Promise<boolean> {
    const pinned = await db
      .select()
      .from(pinnedConversations)
      .where(
        and(
          eq(pinnedConversations.userType, userType),
          userType === "agent" 
            ? eq(pinnedConversations.userId, userId)
            : eq(pinnedConversations.userEmail, userEmail!),
          eq(pinnedConversations.inquiryId, inquiryId)
        )
      )
      .limit(1);

    return pinned.length > 0;
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

  async getFavoriteAgenciesByClient(clientId: number): Promise<User[]> {
    const favorites = await db
      .select({
        id: agencies.id,
        uuid: agencies.uuid,
        slug: agencies.slug,
        agencyName: agencies.agencyName,
        agencyWebsite: agencies.agencyWebsite,
        agencySocialMedia: agencies.agencySocialMedia,
        agencyActiveSince: agencies.agencyActiveSince,
        agencyAddress: agencies.agencyAddress,
        agencyInfluenceNeighborhoods: agencies.agencyInfluenceNeighborhoods,
        agencyLogo: agencies.agencyLogo,
        createdAt: agencies.createdAt,
        isAdmin: sql<boolean>`false`.as('isAdmin'),
        isAgent: sql<boolean>`false`.as('isAgent'),
        isAgency: sql<boolean>`true`.as('isAgency'),
        reviewCount: sql<number>`COALESCE((SELECT COUNT(*) FROM reviews WHERE reviews.target_id = ${agencies.id} AND reviews.target_type = 'agency' AND confirmed = true AND property_uuid IS NOT NULL), 0)::integer`.as('reviewCount'),
        reviewAverage: sql<number>`COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviews.target_id = ${agencies.id} AND reviews.target_type = 'agency' AND confirmed = true AND property_uuid IS NOT NULL), 0)::float`.as('reviewAverage'),
      })
      .from(clientFavoriteAgencies)
      .innerJoin(agencies, eq(agencies.id, clientFavoriteAgencies.agencyId))
      .where(eq(clientFavoriteAgencies.clientId, clientId));

    return favorites;
  }

  async toggleFavoriteAgency(clientId: number, agencyId: number): Promise<boolean> {
    // Check if already favorited
    const existing = await db
      .select()
      .from(clientFavoriteAgencies)
      .where(
        and(
          eq(clientFavoriteAgencies.clientId, clientId),
          eq(clientFavoriteAgencies.agencyId, agencyId)
        )
      );

    if (existing.length > 0) {
      // Remove from favorites
      await db
        .delete(clientFavoriteAgencies)
        .where(
          and(
            eq(clientFavoriteAgencies.clientId, clientId),
            eq(clientFavoriteAgencies.agencyId, agencyId)
          )
        );
      return false;
    } else {
      // Add to favorites
      await db
        .insert(clientFavoriteAgencies)
        .values({ clientId, agencyId });
      return true;
    }
  }

  async isFavoriteAgency(clientId: number, agencyId: number): Promise<boolean> {
    const favorite = await db
      .select()
      .from(clientFavoriteAgencies)
      .where(
        and(
          eq(clientFavoriteAgencies.clientId, clientId),
          eq(clientFavoriteAgencies.agencyId, agencyId)
        )
      );

    return favorite.length > 0;
  }

  async getBatchFavoriteAgencyStatus(clientId: number, agencyIds: number[]): Promise<{ [key: number]: boolean }> {
    if (agencyIds.length === 0) return {};
    
    const favorites = await db
      .select({ agencyId: clientFavoriteAgencies.agencyId })
      .from(clientFavoriteAgencies)
      .where(
        and(
          eq(clientFavoriteAgencies.clientId, clientId),
          inArray(clientFavoriteAgencies.agencyId, agencyIds)
        )
      );

    const result: { [key: number]: boolean } = {};
    agencyIds.forEach(id => {
      result[id] = favorites.some(fav => fav.agencyId === id);
    });
    
    return result;
  }

  async getFavoritePropertiesByClient(clientId: number): Promise<Property[]> {
    const favorites = await db
      .select({
        uuid: properties.uuid,
        title: properties.title,
        description: properties.description,
        price: properties.price,
        address: properties.address,
        neighborhood: properties.neighborhood,
        superficie: properties.superficie,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        imageUrls: properties.imageUrls,
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
      .innerJoin(properties, eq(clientFavoriteProperties.propertyUuid, properties.uuid))
      .where(eq(clientFavoriteProperties.clientId, clientId));

    return favorites;
  }

  async toggleFavoriteProperty(clientId: number, propertyUuid: string): Promise<boolean> {
    // Check if already favorited
    const existing = await db
      .select()
      .from(clientFavoriteProperties)
      .where(
        and(
          eq(clientFavoriteProperties.clientId, clientId),
          eq(clientFavoriteProperties.propertyUuid, propertyUuid)
        )
      );

    if (existing.length > 0) {
      // Remove from favorites
      await db
        .delete(clientFavoriteProperties)
        .where(
          and(
            eq(clientFavoriteProperties.clientId, clientId),
            eq(clientFavoriteProperties.propertyUuid, propertyUuid)
          )
        );
      return false;
    } else {
      // Add to favorites
      await db
        .insert(clientFavoriteProperties)
        .values({ clientId, propertyUuid });
      return true;
    }
  }

  async isFavoriteProperty(clientId: number, propertyUuid: string): Promise<boolean> {
    const favorite = await db
      .select()
      .from(clientFavoriteProperties)
      .where(
        and(
          eq(clientFavoriteProperties.clientId, clientId),
          eq(clientFavoriteProperties.propertyUuid, propertyUuid)
        )
      );

    return favorite.length > 0;
  }

  async getBatchFavoritePropertyStatus(clientId: number, propertyUuids: string[]): Promise<{ [key: string]: boolean }> {
    if (propertyUuids.length === 0) return {};
    
    const favorites = await db
      .select({ propertyUuid: clientFavoriteProperties.propertyUuid })
      .from(clientFavoriteProperties)
      .where(
        and(
          eq(clientFavoriteProperties.clientId, clientId),
          inArray(clientFavoriteProperties.propertyUuid, propertyUuids)
        )
      );

    const result: { [key: string]: boolean } = {};
    propertyUuids.forEach(uuid => {
      result[uuid] = favorites.some(fav => fav.propertyUuid === uuid);
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

  async getAllAgentEventsPaginated(agentId: number, page: number, limit: number): Promise<{ events: AgentEvent[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(agentEvents)
      .where(eq(agentEvents.agentId, agentId));
    
    // Get paginated events
    const events = await db
      .select()
      .from(agentEvents)
      .where(eq(agentEvents.agentId, agentId))
      .orderBy(desc(agentEvents.eventDate), desc(agentEvents.eventTime))
      .limit(limit)
      .offset(offset);
    
    return {
      events,
      total: totalResult.count
    };
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

  async checkRecentFraudReport(propertyUuid: string, reporterIp: string): Promise<boolean> {
    // Check for reports from the same IP within the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [report] = await db
      .select()
      .from(fraudReports)
      .where(
        and(
          eq(fraudReports.propertyUuid, propertyUuid),
          eq(fraudReports.reporterIp, reporterIp),
          gte(fraudReports.createdAt, twentyFourHoursAgo)
        )
      )
      .limit(1);
    
    return !!report;
  }

  async incrementPropertyFraudCount(propertyUuid: string): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set({
        fraudCount: sql`COALESCE(${properties.fraudCount}, 0) + 1`
      })
      .where(eq(properties.uuid, propertyUuid))
      .returning();
    
    return updatedProperty;
  }

  async getPropertyById(propertyUuid: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.uuid, propertyUuid));
    
    return property;
  }

  // Subscription Operations
  async checkAgencySeatsAvailable(agencyId: number): Promise<{ available: boolean; current: number; limit: number }> {
    const [agency] = await db
      .select({ seatsLimit: agencies.seatsLimit })
      .from(agencies)
      .where(eq(agencies.id, agencyId));
    
    if (!agency || !agency.seatsLimit) {
      return { available: false, current: 0, limit: 0 };
    }

    const [result] = await db
      .select({ count: count() })
      .from(agencyAgents)
      .where(
        and(
          eq(agencyAgents.agencyId, agencyId),
          isNull(agencyAgents.leftAt)
        )
      );

    const currentSeats = result.count;
    return {
      available: currentSeats < agency.seatsLimit,
      current: currentSeats,
      limit: agency.seatsLimit
    };
  }

  async pauseAgentSubscription(agentId: number, reason: string, triggeredBy: number): Promise<void> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!agent) throw new Error('Agent not found');

    await db.update(agents).set({
      pausedSubscriptionPlan: agent.subscriptionPlan,
      pausedIsYearlyBilling: agent.isYearlyBilling,
      pausedAt: new Date(),
      subscriptionPlan: null,
      isYearlyBilling: null
    }).where(eq(agents.id, agentId));

    await this.recordSubscriptionEvent({
      entityType: 'agent',
      entityId: agentId,
      eventType: 'paused',
      previousState: { subscriptionPlan: agent.subscriptionPlan, isYearlyBilling: agent.isYearlyBilling },
      newState: { subscriptionPlan: null, isYearlyBilling: null },
      triggeredBy,
      reason
    });
  }

  async resumeAgentSubscription(agentId: number, reason: string, triggeredBy: number): Promise<void> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!agent) throw new Error('Agent not found');

    await db.update(agents).set({
      subscriptionPlan: agent.pausedSubscriptionPlan,
      isYearlyBilling: agent.pausedIsYearlyBilling,
      pausedSubscriptionPlan: null,
      pausedIsYearlyBilling: null,
      pausedAt: null
    }).where(eq(agents.id, agentId));

    await this.recordSubscriptionEvent({
      entityType: 'agent',
      entityId: agentId,
      eventType: 'resumed',
      previousState: { subscriptionPlan: null, isYearlyBilling: null },
      newState: { subscriptionPlan: agent.pausedSubscriptionPlan, isYearlyBilling: agent.pausedIsYearlyBilling },
      triggeredBy,
      reason
    });
  }

  async transferAgencyAdmin(agencyId: number, currentAdminId: number, newAdminId: number, triggeredBy: number): Promise<void> {
    // Update current admin to member
    await db.update(agencyAgents).set({ role: 'member' })
      .where(
        and(
          eq(agencyAgents.agencyId, agencyId),
          eq(agencyAgents.agentId, currentAdminId),
          isNull(agencyAgents.leftAt)
        )
      );

    // Update new agent to admin
    await db.update(agencyAgents).set({ role: 'admin' })
      .where(
        and(
          eq(agencyAgents.agencyId, agencyId),
          eq(agencyAgents.agentId, newAdminId),
          isNull(agencyAgents.leftAt)
        )
      );

    await this.recordSubscriptionEvent({
      entityType: 'agency',
      entityId: agencyId,
      eventType: 'admin_transferred',
      previousState: { adminId: currentAdminId },
      newState: { adminId: newAdminId },
      triggeredBy,
      reason: 'Admin role transferred',
      metadata: { from: currentAdminId, to: newAdminId }
    });
  }

  async recordSubscriptionEvent(eventData: InsertSubscriptionEvent): Promise<SubscriptionEvent> {
    const [event] = await db.insert(subscriptionEvents).values(eventData).returning();
    return event;
  }

  async getAgentRole(agentId: number): Promise<{ agencyId: number | null; role: string | null; agentType: string }> {
    const [agent] = await db.select({ agentType: agents.agentType }).from(agents).where(eq(agents.id, agentId));
    if (!agent) throw new Error('Agent not found');

    const [agencyAgent] = await db
      .select({ agencyId: agencyAgents.agencyId, role: agencyAgents.role })
      .from(agencyAgents)
      .where(
        and(
          eq(agencyAgents.agentId, agentId),
          isNull(agencyAgents.leftAt)
        )
      );

    return {
      agencyId: agencyAgent?.agencyId || null,
      role: agencyAgent?.role || null,
      agentType: agent.agentType
    };
  }

  async getAgencySubscription(agencyId: number): Promise<{ subscriptionPlan: string | null; isYearlyBilling: boolean | null; seatsLimit: number | null }> {
    const [agency] = await db
      .select({
        subscriptionPlan: agencies.subscriptionPlan,
        isYearlyBilling: agencies.isYearlyBilling,
        seatsLimit: agencies.seatsLimit
      })
      .from(agencies)
      .where(eq(agencies.id, agencyId));

    if (!agency) throw new Error('Agency not found');
    return agency;
  }

  async addAgentToAgencyAtomic(agencyId: number, agentId: number, role: 'admin' | 'member', triggeredBy: number): Promise<AgencyAgent> {
    // Use transaction with row locking to prevent race conditions
    const result = await db.transaction(async (tx) => {
      // Lock the agency row for update to prevent concurrent seat checks
      const [agency] = await tx
        .select({
          id: agencies.id,
          uuid: agencies.uuid,
          seatsLimit: agencies.seatsLimit,
          subscriptionPlan: agencies.subscriptionPlan
        })
        .from(agencies)
        .where(eq(agencies.id, agencyId))
        .for('update');

      if (!agency) {
        throw new Error('Agency not found');
      }

      // Fetch agent data (including UUID) BEFORE the insert
      const [agent] = await tx.select().from(agents).where(eq(agents.id, agentId));
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Only check seat limits if seatsLimit is set (NULL means unlimited seats)
      if (agency.seatsLimit !== null) {
        // Count current active members (no lock needed - agency row is already locked)
        const [seatCount] = await tx
          .select({ count: count() })
          .from(agencyAgents)
          .where(
            and(
              eq(agencyAgents.agencyId, agencyId),
              isNull(agencyAgents.leftAt)
            )
          );

        if (seatCount.count >= agency.seatsLimit) {
          throw new Error(`Agency seat limit reached (${agency.seatsLimit} seats)`);
        }
      }

      // Add agent to agency with both integer IDs and UUIDs
      const [agencyAgent] = await tx
        .insert(agencyAgents)
        .values({
          agencyId,
          agentId,
          agencyUuid: agency.uuid,
          agentUuid: agent.uuid,
          role,
        })
        .returning();

      // If agent was independent, pause their subscription
      if (agent.subscriptionPlan) {
        await tx.update(agents).set({
          pausedSubscriptionPlan: agent.subscriptionPlan,
          pausedIsYearlyBilling: agent.isYearlyBilling,
          pausedAt: new Date(),
          subscriptionPlan: null,
          isYearlyBilling: null
        }).where(eq(agents.id, agentId));
      }

      // Record subscription event
      await tx.insert(subscriptionEvents).values({
        entityType: 'agent',
        entityId: agentId,
        eventType: 'joined_agency',
        previousState: { agencyId: null, role: null },
        newState: { agencyId, role },
        triggeredBy,
        reason: `Agent joined agency as ${role}`,
        metadata: { agencyId, agencyName: agency.subscriptionPlan }
      });

      return agencyAgent;
    });

    return result;
  }

  // Saved Searches methods
  async createSavedSearch(searchData: InsertSavedSearch): Promise<SavedSearch> {
    const [savedSearch] = await db.insert(savedSearches).values(searchData).returning();
    return savedSearch;
  }

  async getSavedSearchesByClient(clientId: number): Promise<SavedSearch[]> {
    const searches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.clientId, clientId))
      .orderBy(desc(savedSearches.createdAt));
    return searches;
  }

  async updateSavedSearchName(id: number, name: string): Promise<SavedSearch> {
    const [updatedSearch] = await db
      .update(savedSearches)
      .set({ name })
      .where(eq(savedSearches.id, id))
      .returning();
    
    if (!updatedSearch) {
      throw new Error('Saved search not found');
    }
    
    return updatedSearch;
  }

  async deleteSavedSearch(id: number): Promise<void> {
    await db.delete(savedSearches).where(eq(savedSearches.id, id));
  }

  // Agent Invitations methods
  async createInvitation(invitationData: InsertAgentInvitation): Promise<AgentInvitation> {
    const [invitation] = await db.insert(agentInvitations).values(invitationData).returning();
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<AgentInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(agentInvitations)
      .where(and(
        eq(agentInvitations.token, token),
        isNull(agentInvitations.consumedAt), // Only get unconsumed invitations
        gte(agentInvitations.expiresAt, new Date()) // Only get non-expired invitations
      ));
    return invitation;
  }

  async consumeInvitation(token: string): Promise<AgentInvitation | undefined> {
    const [consumed] = await db
      .update(agentInvitations)
      .set({ consumedAt: new Date() })
      .where(eq(agentInvitations.token, token))
      .returning();
    return consumed;
  }

  async cleanupExpiredInvitations(): Promise<void> {
    // Delete invitations that are expired and unconsumed after 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await db
      .delete(agentInvitations)
      .where(and(
        isNull(agentInvitations.consumedAt),
        lte(agentInvitations.expiresAt, thirtyDaysAgo)
      ));
  }

  // Pending Invited Agents (new flow: agent record created immediately when invited)
  async createPendingInvitedAgent(agentData: { 
    email: string; 
    name: string; 
    surname: string; 
    invitationToken: string; 
    invitationExpiresAt: Date; 
    agencyId: number; 
    invitedBy: number 
  }): Promise<User> {
    // Fetch agency UUID first
    const [agency] = await db.select({ uuid: agencies.uuid }).from(agencies).where(eq(agencies.id, agentData.agencyId));
    if (!agency) throw new Error('Agency not found');
    
    // Generate slug for the agent
    const baseSlug = generateAgentSlug(agentData.name, agentData.surname);
    
    // Create the agent with pending status (no password)
    const [newAgent] = await db.insert(agents).values({
      email: agentData.email,
      name: agentData.name,
      surname: agentData.surname,
      password: null, // Will be set when they accept the invitation
      agentType: 'agency_member',
      invitationStatus: 'pending',
      invitationToken: agentData.invitationToken,
      invitationExpiresAt: agentData.invitationExpiresAt,
      slug: baseSlug
    }).returning();
    
    // Ensure unique slug with ID suffix if needed
    if (newAgent.name && newAgent.surname && newAgent.slug === baseSlug) {
      const finalSlug = generateAgentSlug(newAgent.name, newAgent.surname, newAgent.id);
      await db
        .update(agents)
        .set({ slug: finalSlug })
        .where(eq(agents.id, newAgent.id));
    }
    
    // Link agent to agency as member (include required UUIDs)
    await db.insert(agencyAgents).values({
      agencyId: agentData.agencyId,
      agencyUuid: agency.uuid,
      agentId: newAgent.id,
      agentUuid: newAgent.uuid,
      role: 'member',
      addedBy: agentData.invitedBy
    });
    
    return newAgent;
  }

  async getAgentByInvitationToken(token: string): Promise<User | undefined> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(
        eq(agents.invitationToken, token),
        eq(agents.invitationStatus, 'pending'),
        gte(agents.invitationExpiresAt, new Date()) // Only get non-expired invitations
      ));
    return agent;
  }

  async activateInvitedAgent(agentId: number, hashedPassword: string): Promise<User> {
    const [activatedAgent] = await db
      .update(agents)
      .set({ 
        password: hashedPassword,
        invitationStatus: 'active',
        invitationToken: null, // Clear the token after activation
        invitationExpiresAt: null
      })
      .where(eq(agents.id, agentId))
      .returning();
    
    if (!activatedAgent) {
      throw new Error('Agent not found');
    }
    
    return activatedAgent;
  }

  // Network (Franchise) methods
  async getNetworkById(id: number): Promise<Network | undefined> {
    const [network] = await db.select().from(networks).where(eq(networks.id, id));
    return network;
  }

  async getNetworkByUuid(uuid: string): Promise<Network | undefined> {
    const [network] = await db.select().from(networks).where(eq(networks.uuid, uuid));
    return network;
  }

  async getNetworkBySlug(slug: string): Promise<Network | undefined> {
    const [network] = await db.select().from(networks).where(eq(networks.slug, slug));
    return network;
  }

  async createNetwork(networkData: InsertNetwork): Promise<Network> {
    // Generate slug from network name
    const baseSlug = networkData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check for existing slugs and add suffix if needed
    let finalSlug = baseSlug;
    let suffix = 1;
    while (true) {
      const existingNetwork = await this.getNetworkBySlug(finalSlug);
      if (!existingNetwork) break;
      finalSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    
    const [network] = await db
      .insert(networks)
      .values({ ...networkData, slug: finalSlug })
      .returning();
    return network;
  }

  async updateNetwork(id: number, networkData: Partial<InsertNetwork>): Promise<Network> {
    const [updated] = await db
      .update(networks)
      .set(networkData)
      .where(eq(networks.id, id))
      .returning();
    
    if (!updated) {
      throw new Error('Network not found');
    }
    
    return updated;
  }

  async deleteNetwork(id: number): Promise<void> {
    // Soft delete by setting deletedAt timestamp
    await db
      .update(networks)
      .set({ deletedAt: new Date() })
      .where(eq(networks.id, id));
  }

  async getAgenciesByNetwork(networkId: number): Promise<Agency[]> {
    const networkAgencies = await db
      .select()
      .from(agencies)
      .where(and(
        eq(agencies.networkId, networkId),
        isNull(agencies.deletedAt)
      ))
      .orderBy(desc(agencies.createdAt));
    return networkAgencies;
  }

  async getAgentsByNetwork(networkId: number): Promise<User[]> {
    // Get all agents that are either:
    // 1. Network admins directly associated with the network
    // 2. Agents in agencies that belong to this network
    const networkAgencies = await this.getAgenciesByNetwork(networkId);
    const agencyIds = networkAgencies.map(a => a.id);
    
    // Get network admins
    const networkAdmins = await db
      .select()
      .from(agents)
      .where(and(
        eq(agents.networkId, networkId),
        eq(agents.agentType, 'network_admin')
      ));
    
    // Get all agents in network agencies
    let agencyMembers: User[] = [];
    if (agencyIds.length > 0) {
      const agencyAgentRows = await db
        .select()
        .from(agencyAgents)
        .where(inArray(agencyAgents.agencyId, agencyIds));
      
      const memberIds = agencyAgentRows.map(aa => aa.agentId);
      if (memberIds.length > 0) {
        agencyMembers = await db
          .select()
          .from(agents)
          .where(inArray(agents.id, memberIds));
      }
    }
    
    // Combine and deduplicate
    const allAgents = [...networkAdmins, ...agencyMembers];
    const uniqueAgents = allAgents.filter((agent, index, self) =>
      index === self.findIndex(a => a.id === agent.id)
    );
    
    return uniqueAgents;
  }

  async attachAgencyToNetwork(agencyId: number, networkId: number): Promise<Agency> {
    const [updated] = await db
      .update(agencies)
      .set({ networkId })
      .where(eq(agencies.id, agencyId))
      .returning();
    
    if (!updated) {
      throw new Error('Agency not found');
    }
    
    return updated;
  }

  async detachAgencyFromNetwork(agencyId: number): Promise<Agency> {
    const [updated] = await db
      .update(agencies)
      .set({ networkId: null })
      .where(eq(agencies.id, agencyId))
      .returning();
    
    if (!updated) {
      throw new Error('Agency not found');
    }
    
    return updated;
  }

  async updateAgencyPlan(agencyId: number, plan: string): Promise<Agency> {
    // Define plan limits
    const planLimits: Record<string, { seatsLimit: number; activePropertiesLimit: number }> = {
      'basica': { seatsLimit: 1, activePropertiesLimit: 2 },
      'pequeña': { seatsLimit: 2, activePropertiesLimit: 10 },
      'mediana': { seatsLimit: 6, activePropertiesLimit: 30 },
      'lider': { seatsLimit: 9999, activePropertiesLimit: 9999 }
    };
    
    const limits = planLimits[plan.toLowerCase()];
    if (!limits) {
      throw new Error('Invalid plan');
    }
    
    const [updated] = await db
      .update(agencies)
      .set({
        subscriptionPlan: plan.toLowerCase(),
        seatsLimit: limits.seatsLimit,
        activePropertiesLimit: limits.activePropertiesLimit
      })
      .where(eq(agencies.id, agencyId))
      .returning();
    
    if (!updated) {
      throw new Error('Agency not found');
    }
    
    return updated;
  }

  async getNetworkStats(networkId: number): Promise<{ agencies: number; agents: number; properties: number; totalClients: number }> {
    // Count agencies in network
    const networkAgencies = await this.getAgenciesByNetwork(networkId);
    const agencyIds = networkAgencies.map(a => a.id);
    
    // Count agents in network
    const networkAgentsList = await this.getAgentsByNetwork(networkId);
    
    // Count properties across all network agencies
    let propertiesCount = 0;
    if (agencyIds.length > 0) {
      const [result] = await db
        .select({ count: count() })
        .from(properties)
        .where(and(
          inArray(properties.agencyId, agencyIds),
          eq(properties.isDraft, false),
          eq(properties.isActive, true)
        ));
      propertiesCount = result?.count || 0;
    }
    
    // Count clients across all network agents
    const agentIds = networkAgentsList.map(a => a.id);
    let clientsCount = 0;
    if (agentIds.length > 0) {
      const [result] = await db
        .select({ count: count() })
        .from(clients)
        .where(inArray(clients.agentId, agentIds));
      clientsCount = result?.count || 0;
    }
    
    return {
      agencies: networkAgencies.length,
      agents: networkAgentsList.length,
      properties: propertiesCount,
      totalClients: clientsCount
    };
  }

  async getAgencyAgentCount(agencyId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(agencyAgents)
      .where(eq(agencyAgents.agencyId, agencyId));
    return result?.count || 0;
  }

  async getAgencyPropertyCount(agencyId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(properties)
      .where(and(
        eq(properties.agencyId, agencyId),
        eq(properties.isDraft, false),
        eq(properties.isActive, true)
      ));
    return result?.count || 0;
  }

  async searchAgenciesWithoutNetwork(query: string): Promise<Agency[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    const result = await db
      .select()
      .from(agencies)
      .where(and(
        isNull(agencies.networkId),
        isNull(agencies.deletedAt),
        sql`LOWER(${agencies.agencyName}) LIKE ${searchQuery}`
      ))
      .orderBy(agencies.agencyName)
      .limit(10);
    return result;
  }

  // Property Management - Contracts
  async getPropertyContracts(propertyUuid: string): Promise<PropertyContract[]> {
    return db.select().from(propertyContracts).where(eq(propertyContracts.propertyUuid, propertyUuid)).orderBy(desc(propertyContracts.createdAt));
  }

  async getActivePropertyContract(propertyUuid: string): Promise<PropertyContract | undefined> {
    const [contract] = await db.select().from(propertyContracts).where(and(eq(propertyContracts.propertyUuid, propertyUuid), eq(propertyContracts.isActive, true)));
    return contract;
  }

  async createPropertyContract(contract: InsertPropertyContract): Promise<PropertyContract> {
    const [created] = await db.insert(propertyContracts).values(contract).returning();
    return created;
  }

  async updatePropertyContract(id: number, data: Partial<InsertPropertyContract>): Promise<PropertyContract | undefined> {
    const [updated] = await db.update(propertyContracts).set(data).where(eq(propertyContracts.id, id)).returning();
    return updated;
  }

  // Property Management - Payments
  async getPropertyPayments(propertyUuid: string): Promise<PropertyPayment[]> {
    return db.select().from(propertyPayments).where(eq(propertyPayments.propertyUuid, propertyUuid)).orderBy(desc(propertyPayments.createdAt));
  }

  async createPropertyPayment(payment: InsertPropertyPayment): Promise<PropertyPayment> {
    const [created] = await db.insert(propertyPayments).values(payment).returning();
    return created;
  }

  async updatePropertyPayment(id: number, data: Partial<InsertPropertyPayment>): Promise<PropertyPayment | undefined> {
    const [updated] = await db.update(propertyPayments).set(data).where(eq(propertyPayments.id, id)).returning();
    return updated;
  }

  async deletePropertyPayment(id: number): Promise<void> {
    await db.delete(propertyPayments).where(eq(propertyPayments.id, id));
  }

  // Property Management - Documents
  async getPropertyDocuments(propertyUuid: string): Promise<PropertyDocument[]> {
    return db.select().from(propertyDocuments).where(eq(propertyDocuments.propertyUuid, propertyUuid)).orderBy(desc(propertyDocuments.createdAt));
  }

  async createPropertyDocument(doc: InsertPropertyDocument): Promise<PropertyDocument> {
    const [created] = await db.insert(propertyDocuments).values(doc).returning();
    return created;
  }

  async deletePropertyDocument(id: number): Promise<PropertyDocument | undefined> {
    const [deleted] = await db.delete(propertyDocuments).where(eq(propertyDocuments.id, id)).returning();
    return deleted;
  }

  // Property Management - Incidents
  async getPropertyIncidents(propertyUuid: string): Promise<PropertyIncident[]> {
    return db.select().from(propertyIncidents).where(eq(propertyIncidents.propertyUuid, propertyUuid)).orderBy(desc(propertyIncidents.createdAt));
  }

  async createPropertyIncident(incident: InsertPropertyIncident): Promise<PropertyIncident> {
    const [created] = await db.insert(propertyIncidents).values(incident).returning();
    return created;
  }

  async updatePropertyIncident(id: number, data: Partial<InsertPropertyIncident>): Promise<PropertyIncident | undefined> {
    const [updated] = await db.update(propertyIncidents).set(data).where(eq(propertyIncidents.id, id)).returning();
    return updated;
  }

  async deletePropertyIncident(id: number): Promise<void> {
    await db.delete(propertyIncidents).where(eq(propertyIncidents.id, id));
  }

  async getIncidentUpdates(incidentId: number): Promise<IncidentUpdate[]> {
    return db.select().from(incidentUpdates).where(eq(incidentUpdates.incidentId, incidentId)).orderBy(desc(incidentUpdates.createdAt));
  }

  async createIncidentUpdate(update: InsertIncidentUpdate): Promise<IncidentUpdate> {
    const [created] = await db.insert(incidentUpdates).values(update).returning();
    return created;
  }

  // Property Management - Communications
  async getPropertyCommunications(propertyUuid: string): Promise<PropertyCommunication[]> {
    return db.select().from(propertyCommunications).where(eq(propertyCommunications.propertyUuid, propertyUuid)).orderBy(desc(propertyCommunications.createdAt));
  }

  async createPropertyCommunication(comm: InsertPropertyCommunication): Promise<PropertyCommunication> {
    const [created] = await db.insert(propertyCommunications).values(comm).returning();
    return created;
  }

  async updatePropertyCommunication(id: number, data: Partial<InsertPropertyCommunication>): Promise<PropertyCommunication | undefined> {
    const [updated] = await db.update(propertyCommunications).set(data).where(eq(propertyCommunications.id, id)).returning();
    return updated;
  }

  async deletePropertyCommunication(id: number): Promise<boolean> {
    const result = await db.delete(propertyCommunications).where(eq(propertyCommunications.id, id)).returning();
    return result.length > 0;
  }

  // Property Management - History
  async getPropertyHistory(propertyUuid: string): Promise<PropertyHistoryEntry[]> {
    return db.select().from(propertyHistory).where(eq(propertyHistory.propertyUuid, propertyUuid)).orderBy(desc(propertyHistory.createdAt));
  }

  async createPropertyHistory(entry: InsertPropertyHistory): Promise<PropertyHistoryEntry> {
    const [created] = await db.insert(propertyHistory).values(entry).returning();
    return created;
  }

  async deletePropertyHistory(id: number): Promise<boolean> {
    const result = await db.delete(propertyHistory).where(eq(propertyHistory.id, id)).returning();
    return result.length > 0;
  }

  // Property Management - Status Update
  async updatePropertyManagementStatus(uuid: string, status: string): Promise<Property | undefined> {
    const [updated] = await db.update(properties).set({ managementStatus: status }).where(eq(properties.uuid, uuid)).returning();
    return updated;
  }

  // Super admin back office
  async getSuperAdminDashboardStats(): Promise<{
    totalUsers: number;
    totalAgents: number;
    totalClients: number;
    totalAgencies: number;
    totalListings: number;
    pendingListings: number;
    flaggedListings: number;
  }> {
    const [[agentTotals], [clientTotals], [agencyTotals], [listingTotals], [pendingTotals], [flaggedTotals]] = await Promise.all([
      db
        .select({ count: count() })
        .from(agents)
        .where(isNull(agents.deletedAt)),
      db.select({ count: count() }).from(clients),
      db
        .select({ count: count() })
        .from(agencies)
        .where(isNull(agencies.deletedAt)),
      db
        .select({ count: count() })
        .from(properties)
        .where(eq(properties.isDraft, false)),
      db
        .select({ count: count() })
        .from(properties)
        .where(and(eq(properties.isDraft, false), eq(properties.moderationStatus, "pending"))),
      db
        .select({ count: count() })
        .from(properties)
        .where(and(eq(properties.isDraft, false), sql`${properties.fraudCount} > 0`)),
    ]);

    const totalAgents = Number(agentTotals?.count || 0);
    const totalClients = Number(clientTotals?.count || 0);
    return {
      totalUsers: totalAgents + totalClients,
      totalAgents,
      totalClients,
      totalAgencies: Number(agencyTotals?.count || 0),
      totalListings: Number(listingTotals?.count || 0),
      pendingListings: Number(pendingTotals?.count || 0),
      flaggedListings: Number(flaggedTotals?.count || 0),
    };
  }

  async getSuperAdminUsers(filters: {
    role?: string;
    status?: string;
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<{
      id: number;
      name: string | null;
      email: string;
      role: string;
      agency: string | null;
      status: "active" | "inactive";
      lastLoginAt: Date | null;
      kind: "agent" | "client";
    }>;
    total: number;
  }> {
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize || 25)));
    const normalizedQuery = (filters.query || "").trim().toLowerCase();
    const roleFilter = (filters.role || "").trim().toLowerCase();
    const statusFilter = (filters.status || "").trim().toLowerCase();

    const activeAgencyRows = await db
      .select({
        agentId: agencyAgents.agentId,
        agencyName: agencies.agencyName,
        agencyRole: agencyAgents.role,
      })
      .from(agencyAgents)
      .innerJoin(agencies, eq(agencyAgents.agencyId, agencies.id))
      .where(and(isNull(agencyAgents.leftAt), isNull(agencies.deletedAt)));

    const agencyByAgent = new Map<number, { name: string; role: string }>();
    for (const row of activeAgencyRows) {
      if (row.agentId) {
        agencyByAgent.set(row.agentId, {
          name: row.agencyName,
          role: row.agencyRole,
        });
      }
    }

    const rawAgents = await db
      .select({
        id: agents.id,
        email: agents.email,
        name: agents.name,
        surname: agents.surname,
        agentType: agents.agentType,
        isActive: agents.isActive,
        lastLoginAt: agents.lastLoginAt,
      })
      .from(agents)
      .where(isNull(agents.deletedAt));

    const rawClients = await db
      .select({
        id: clients.id,
        email: clients.email,
        name: clients.name,
        surname: clients.surname,
        agentId: clients.agentId,
        isActive: clients.isActive,
        lastLoginAt: clients.lastLoginAt,
      })
      .from(clients);

    const users = [
      ...rawAgents.map((agent) => {
        const agencyData = agencyByAgent.get(agent.id);
        const role =
          agent.agentType === "super_admin"
            ? "super_admin"
            : agent.agentType === "network_admin"
              ? "network_admin"
              : agencyData?.role === "admin"
                ? "agency_admin"
                : "agent";
        return {
          id: agent.id,
          name: [agent.name, agent.surname].filter(Boolean).join(" ") || agent.name || null,
          email: agent.email,
          role,
          agency: agencyData?.name || null,
          status: (agent.isActive ? "active" : "inactive") as "active" | "inactive",
          lastLoginAt: agent.lastLoginAt ?? null,
          kind: "agent" as const,
        };
      }),
      ...rawClients.map((client) => {
        const agencyData = client.agentId ? agencyByAgent.get(client.agentId) : undefined;
        return {
          id: client.id,
          name: [client.name, client.surname].filter(Boolean).join(" ") || client.name || null,
          email: client.email,
          role: "client",
          agency: agencyData?.name || null,
          status: (client.isActive ? "active" : "inactive") as "active" | "inactive",
          lastLoginAt: client.lastLoginAt ?? null,
          kind: "client" as const,
        };
      }),
    ];

    const filtered = users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (statusFilter && user.status !== statusFilter) return false;
      if (normalizedQuery) {
        const haystack = `${user.name || ""} ${user.email} ${user.role} ${user.agency || ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const aLogin = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
      const bLogin = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
      if (aLogin !== bLogin) return bLogin - aLogin;
      return a.email.localeCompare(b.email);
    });

    const offset = (page - 1) * pageSize;
    return {
      items: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
    };
  }

  async setUserActiveStatus(params: { kind: "agent" | "client"; id: number; isActive: boolean }): Promise<void> {
    if (params.kind === "agent") {
      await db
        .update(agents)
        .set({ isActive: params.isActive })
        .where(eq(agents.id, params.id));
      return;
    }

    await db
      .update(clients)
      .set({ isActive: params.isActive })
      .where(eq(clients.id, params.id));
  }

  async updateAgentRole(agentId: number, agentType: string): Promise<User | undefined> {
    const [updated] = await db
      .update(agents)
      .set({ agentType })
      .where(eq(agents.id, agentId))
      .returning();
    return updated;
  }

  async getSuperAdminListings(filters: {
    moderationStatus?: string;
    operationType?: string;
    location?: string;
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<Property & {
      agentName: string | null;
      agencyName: string | null;
    }>;
    total: number;
  }> {
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(properties.isDraft, false)];
    if (filters.moderationStatus) {
      conditions.push(eq(properties.moderationStatus, filters.moderationStatus));
    }
    if (filters.operationType) {
      conditions.push(eq(properties.operationType, filters.operationType));
    }
    if (filters.location) {
      const locationQuery = `%${filters.location.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(COALESCE(${properties.city}, '')) LIKE ${locationQuery}`,
          sql`LOWER(COALESCE(${properties.district}, '')) LIKE ${locationQuery}`,
          sql`LOWER(COALESCE(${properties.neighborhood}, '')) LIKE ${locationQuery}`,
        )!,
      );
    }
    if (filters.query) {
      const textQuery = `%${filters.query.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(COALESCE(${properties.title}, '')) LIKE ${textQuery}`,
          sql`LOWER(COALESCE(${properties.reference}, '')) LIKE ${textQuery}`,
          sql`LOWER(COALESCE(${properties.address}, '')) LIKE ${textQuery}`,
        )!,
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          property: properties,
          agentName: sql<string | null>`NULLIF(TRIM(COALESCE(${agents.name}, '') || ' ' || COALESCE(${agents.surname}, '')), '')`,
          agencyName: agencies.agencyName,
        })
        .from(properties)
        .leftJoin(agents, eq(properties.agentId, agents.id))
        .leftJoin(agencies, eq(properties.agencyId, agencies.id))
        .where(whereClause)
        .orderBy(desc(properties.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: count() })
        .from(properties)
        .where(whereClause),
    ]);

    return {
      items: rows.map((row) => ({
        ...row.property,
        agentName: row.agentName || null,
        agencyName: row.agencyName || null,
      })),
      total: Number(totalRow?.count || 0),
    };
  }

  async updatePropertyModeration(params: {
    propertyUuid: string;
    moderationStatus: "pending" | "approved" | "rejected";
    moderationReason?: string | null;
    moderatorId: number;
  }): Promise<Property | undefined> {
    const updates: Partial<Property> = {
      moderationStatus: params.moderationStatus,
      moderatedBy: params.moderatorId,
      moderatedAt: new Date(),
      moderationReason: params.moderationReason || null,
    };

    if (params.moderationStatus === "approved") {
      updates.isActive = true;
    }
    if (params.moderationStatus === "rejected") {
      updates.isActive = false;
    }

    const [updated] = await db
      .update(properties)
      .set(updates)
      .where(eq(properties.uuid, params.propertyUuid))
      .returning();

    return updated;
  }

  async getSuperAdminAgencies(filters: {
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<Agency & { adminEmail: string | null; agentCount: number; activeProperties: number }>;
    total: number;
  }> {
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions = [isNull(agencies.deletedAt)];
    if (filters.query) {
      const searchQuery = `%${filters.query.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(COALESCE(${agencies.agencyName}, '')) LIKE ${searchQuery}`,
          sql`LOWER(COALESCE(${agencies.city}, '')) LIKE ${searchQuery}`,
        )!,
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [agencyRows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(agencies)
        .where(whereClause)
        .orderBy(desc(agencies.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(agencies).where(whereClause),
    ]);

    const enriched = await Promise.all(
      agencyRows.map(async (agency) => {
        const [adminRow] = await db
          .select({ email: agents.email })
          .from(agencyAgents)
          .innerJoin(agents, eq(agencyAgents.agentId, agents.id))
          .where(
            and(
              eq(agencyAgents.agencyId, agency.id),
              eq(agencyAgents.role, "admin"),
              isNull(agencyAgents.leftAt),
            ),
          );

        const [agentCountRow] = await db
          .select({ count: count() })
          .from(agencyAgents)
          .where(and(eq(agencyAgents.agencyId, agency.id), isNull(agencyAgents.leftAt)));

        const [propertyCountRow] = await db
          .select({ count: count() })
          .from(properties)
          .where(
            and(
              eq(properties.agencyId, agency.id),
              eq(properties.isDraft, false),
              eq(properties.isActive, true),
            ),
          );

        return {
          ...agency,
          adminEmail: adminRow?.email || null,
          agentCount: Number(agentCountRow?.count || 0),
          activeProperties: Number(propertyCountRow?.count || 0),
        };
      }),
    );

    return {
      items: enriched,
      total: Number(totalRow?.count || 0),
    };
  }

  async updateSuperAdminAgencyPlan(params: {
    agencyId: number;
    plan: "basica" | "pequeña" | "mediana" | "lider";
  }): Promise<Agency> {
    return this.updateAgencyPlan(params.agencyId, params.plan);
  }

  async getAppSettings(): Promise<AppSetting[]> {
    return db.select().from(appSettings).orderBy(appSettings.key);
  }

  async upsertAppSetting(params: {
    key: string;
    value: any;
    updatedBy: number | null;
  }): Promise<AppSetting> {
    const [saved] = await db
      .insert(appSettings)
      .values({
        key: params.key,
        value: params.value,
        updatedBy: params.updatedBy,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: params.value,
          updatedBy: params.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return saved;
  }

  async createAdminAuditLog(logData: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const [log] = await db.insert(adminAuditLogs).values(logData).returning();
    return log;
  }

  // Work sessions (Control de jornada)
  async getWorkSessionForDate(agentId: number, workDate: string): Promise<WorkSession | undefined> {
    const [session] = await db
      .select()
      .from(workSessions)
      .where(and(eq(workSessions.agentId, agentId), eq(workSessions.workDate, workDate)));
    return session;
  }

  async clockInWorkSession(agentId: number, workDate: string, now: Date): Promise<WorkSession> {
    const existing = await this.getWorkSessionForDate(agentId, workDate);
    if (existing) {
      throw new Error("Ya has fichado la entrada de hoy");
    }
    const [session] = await db
      .insert(workSessions)
      .values({
        agentId,
        workDate,
        clockInAt: now,
        breaks: [],
      })
      .returning();
    return session;
  }

  async startWorkSessionBreak(agentId: number, workDate: string, now: Date): Promise<WorkSession> {
    const existing = await this.getWorkSessionForDate(agentId, workDate);
    if (!existing) {
      throw new Error("Debes fichar la entrada antes de iniciar una pausa");
    }
    if (existing.clockOutAt) {
      throw new Error("La jornada ya ha finalizado");
    }
    const breaks = (existing.breaks ?? []) as WorkBreak[];
    if (breaks.some((b) => b.endAt === null)) {
      throw new Error("Ya hay una pausa en curso");
    }
    const updatedBreaks: WorkBreak[] = [...breaks, { startAt: now.toISOString(), endAt: null }];
    const [session] = await db
      .update(workSessions)
      .set({ breaks: updatedBreaks })
      .where(eq(workSessions.id, existing.id))
      .returning();
    return session;
  }

  async endWorkSessionBreak(agentId: number, workDate: string, now: Date): Promise<WorkSession> {
    const existing = await this.getWorkSessionForDate(agentId, workDate);
    if (!existing) {
      throw new Error("No hay jornada activa");
    }
    if (existing.clockOutAt) {
      throw new Error("La jornada ya ha finalizado");
    }
    const breaks = (existing.breaks ?? []) as WorkBreak[];
    const openIndex = breaks.findIndex((b) => b.endAt === null);
    if (openIndex === -1) {
      throw new Error("No hay ninguna pausa en curso");
    }
    const updatedBreaks = breaks.map((b, idx) =>
      idx === openIndex ? { startAt: b.startAt, endAt: now.toISOString() } : b,
    );
    const [session] = await db
      .update(workSessions)
      .set({ breaks: updatedBreaks })
      .where(eq(workSessions.id, existing.id))
      .returning();
    return session;
  }

  async clockOutWorkSession(agentId: number, workDate: string, now: Date): Promise<WorkSession> {
    const existing = await this.getWorkSessionForDate(agentId, workDate);
    if (!existing) {
      throw new Error("Debes fichar la entrada antes de fichar la salida");
    }
    if (existing.clockOutAt) {
      throw new Error("Ya has fichado la salida de hoy");
    }
    let breaks = (existing.breaks ?? []) as WorkBreak[];
    // Auto-close any open break when clocking out
    breaks = breaks.map((b) => (b.endAt === null ? { startAt: b.startAt, endAt: now.toISOString() } : b));
    const [session] = await db
      .update(workSessions)
      .set({ clockOutAt: now, breaks })
      .where(eq(workSessions.id, existing.id))
      .returning();
    return session;
  }

  async getTeamWorkSessionsForDate(agencyId: number, workDate: string): Promise<Array<{
    agent: { id: number; name: string | null; surname: string | null; email: string };
    session: WorkSession | null;
  }>> {
    const teamAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
        surname: agents.surname,
        email: agents.email,
      })
      .from(agents)
      .innerJoin(
        agencyAgents,
        and(
          eq(agencyAgents.agentId, agents.id),
          eq(agencyAgents.agencyId, agencyId),
          isNull(agencyAgents.leftAt),
        ),
      )
      .orderBy(agents.name);

    if (teamAgents.length === 0) return [];

    const agentIds = teamAgents.map((a) => a.id);
    const sessions = await db
      .select()
      .from(workSessions)
      .where(and(inArray(workSessions.agentId, agentIds), eq(workSessions.workDate, workDate)));

    const byAgent = new Map<number, WorkSession>();
    for (const s of sessions) byAgent.set(s.agentId, s);

    return teamAgents.map((agent) => ({
      agent,
      session: byAgent.get(agent.id) ?? null,
    }));
  }

  // ============================================================
  // Absence requests (Control de ausencias)
  // ============================================================
  async createAbsenceRequest(data: {
    agentId: number;
    agencyId: number | null;
    startDate: string;
    endDate: string;
    reason: AbsenceReason;
  }): Promise<AbsenceRequest> {
    const [request] = await db
      .insert(absenceRequests)
      .values({
        agentId: data.agentId,
        agencyId: data.agencyId ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      })
      .returning();
    return request;
  }

  async getAbsenceRequestsByAgent(agentId: number): Promise<AbsenceRequest[]> {
    return await db
      .select()
      .from(absenceRequests)
      .where(eq(absenceRequests.agentId, agentId))
      .orderBy(desc(absenceRequests.createdAt));
  }

  async getAbsenceRequestById(id: number): Promise<AbsenceRequest | undefined> {
    const [request] = await db
      .select()
      .from(absenceRequests)
      .where(eq(absenceRequests.id, id));
    return request;
  }

  async updateAbsenceRequestStatus(
    id: number,
    status: AbsenceStatus,
    reviewerId: number,
  ): Promise<AbsenceRequest> {
    const [updated] = await db
      .update(absenceRequests)
      .set({ status, reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(eq(absenceRequests.id, id))
      .returning();
    if (!updated) throw new Error("Solicitud no encontrada");
    return updated;
  }

  async getPendingTeamAbsenceRequests(agencyId: number): Promise<Array<{
    request: AbsenceRequest;
    agent: { id: number; name: string | null; surname: string | null; email: string };
  }>> {
    const rows = await db
      .select({
        request: absenceRequests,
        agent: {
          id: agents.id,
          name: agents.name,
          surname: agents.surname,
          email: agents.email,
        },
      })
      .from(absenceRequests)
      .innerJoin(agents, eq(agents.id, absenceRequests.agentId))
      .innerJoin(
        agencyAgents,
        and(
          eq(agencyAgents.agentId, agents.id),
          eq(agencyAgents.agencyId, agencyId),
          isNull(agencyAgents.leftAt),
        ),
      )
      .where(eq(absenceRequests.status, "pending"))
      .orderBy(desc(absenceRequests.createdAt));
    return rows;
  }

  async getApprovedTeamAbsenceRequests(
    agencyId: number,
    fromDate: string,
    toDate: string,
  ): Promise<Array<{
    request: AbsenceRequest;
    agent: { id: number; name: string | null; surname: string | null; email: string };
  }>> {
    const rows = await db
      .select({
        request: absenceRequests,
        agent: {
          id: agents.id,
          name: agents.name,
          surname: agents.surname,
          email: agents.email,
        },
      })
      .from(absenceRequests)
      .innerJoin(agents, eq(agents.id, absenceRequests.agentId))
      .innerJoin(
        agencyAgents,
        and(
          eq(agencyAgents.agentId, agents.id),
          eq(agencyAgents.agencyId, agencyId),
          isNull(agencyAgents.leftAt),
        ),
      )
      .where(
        and(
          eq(absenceRequests.status, "approved"),
          // Overlap: request.start <= toDate AND request.end >= fromDate
          lte(absenceRequests.startDate, toDate),
          gte(absenceRequests.endDate, fromDate),
        ),
      )
      .orderBy(absenceRequests.startDate);
    return rows;
  }

  async superAdminGlobalSearch(params: {
    query: string;
    entity?: "users" | "listings" | "agencies";
    role?: string;
    status?: string;
    location?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    users: Array<{ id: number; name: string | null; email: string; role: string; status: string; kind: "agent" | "client" }>;
    listings: Array<{ uuid: string; title: string; moderationStatus: string; city: string | null; agencyName: string | null; agentName: string | null }>;
    agencies: Array<{ id: number; agencyName: string; city: string | null; subscriptionPlan: string | null }>;
  }> {
    const scope = params.entity;
    const includeUsers = !scope || scope === "users";
    const includeListings = !scope || scope === "listings";
    const includeAgencies = !scope || scope === "agencies";
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(params.pageSize || 10)));

    const [usersResult, listingResult, agenciesResult] = await Promise.all([
      includeUsers
        ? this.getSuperAdminUsers({
            role: params.role,
            status: params.status,
            query: params.query,
            page,
            pageSize,
          })
        : Promise.resolve({ items: [], total: 0 }),
      includeListings
        ? this.getSuperAdminListings({
            query: params.query,
            location: params.location,
            page,
            pageSize,
          })
        : Promise.resolve({ items: [], total: 0 }),
      includeAgencies
        ? db
            .select({
              id: agencies.id,
              agencyName: agencies.agencyName,
              city: agencies.city,
              subscriptionPlan: agencies.subscriptionPlan,
            })
            .from(agencies)
            .where(
              and(
                isNull(agencies.deletedAt),
                or(
                  sql`LOWER(COALESCE(${agencies.agencyName}, '')) LIKE ${`%${params.query.toLowerCase()}%`}`,
                  sql`LOWER(COALESCE(${agencies.city}, '')) LIKE ${`%${params.query.toLowerCase()}%`}`,
                )!,
              ),
            )
            .orderBy(agencies.agencyName)
            .limit(pageSize)
        : Promise.resolve([]),
    ]);

    return {
      users: usersResult.items.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        kind: user.kind,
      })),
      listings: listingResult.items.map((listing) => ({
        uuid: listing.uuid,
        title: listing.title,
        moderationStatus: listing.moderationStatus,
        city: listing.city,
        agencyName: listing.agencyName || null,
        agentName: listing.agentName || null,
      })),
      agencies: agenciesResult,
    };
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