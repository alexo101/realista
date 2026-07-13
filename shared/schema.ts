import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
  decimal,
  primaryKey,
  check,
  uniqueIndex,
  uuid,
  index,
  real,
  varchar,
  json,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sentinel value for "all zones" selection
export const ALL_ZONES = "Todas las zonas";

// Networks table - franchise networks like Remax, Century 21, etc.
export const networks = pgTable("networks", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").notNull().unique().defaultRandom(),
  slug: text("slug").unique(), // SEO-friendly URL slug
  name: text("name").notNull(), // Network name (e.g., "Remax", "Century 21")
  logo: text("logo"), // Logo URL
  description: text("description"), // Network description
  // Branding
  primaryColor: text("primary_color"), // Primary brand color (hex)
  secondaryColor: text("secondary_color"), // Secondary brand color (hex)
  // Contact info
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"), // Headquarters address
  city: text("city"),
  country: text("country"),
  socialMedia: jsonb("social_media"), // Social media links
  // Billing mode: "network" = network pays for all agencies, "agency" = each agency pays individually
  billingMode: text("billing_mode").notNull().default("agency"), // "network" or "agency"
  // Network-level subscription (when billingMode = "network")
  subscriptionPlan: text("subscription_plan"), // "red_agencias"
  isYearlyBilling: boolean("is_yearly_billing").default(false),
  // Limits (apply when billingMode = "network")
  agenciesLimit: integer("agencies_limit"), // Max agencies in network
  totalSeatsLimit: integer("total_seats_limit"), // Total agents across all agencies
  totalActivePropertiesLimit: integer("total_active_properties_limit"), // Total properties across all agencies
  // Stripe integration fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Soft delete support
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNetworkSchema = createInsertSchema(networks).omit({
  id: true,
  uuid: true,
  createdAt: true,
  deletedAt: true,
});

export type Network = typeof networks.$inferSelect;
export type InsertNetwork = z.infer<typeof insertNetworkSchema>;

// Agency table with agency-level subscription
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").notNull().unique().defaultRandom(), // Public-facing UUID for security
  slug: text("slug").unique(), // SEO-friendly URL slug (nullable initially, will be populated)
  agencyName: text("agency_name").notNull(),
  agencyAddress: text("agency_address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  agencyDescription: text("agency_description"),
  agencyLogo: text("agency_logo"),
  agencyPhone: text("agency_phone"),
  agencyActiveSince: text("agency_active_since"),
  city: text("city"),
  agencyInfluenceNeighborhoods: text("agencyInfluenceNeighborhoods").array(),
  agencySupportedLanguages: text("agency_supported_languages").array(),
  agencyWebsite: text("agency_website"),
  agencySocialMedia: jsonb("agency_social_media"),
  // Network affiliation (nullable - agencies can be independent or part of a network)
  networkId: integer("network_id").references(() => networks.id, { onDelete: "set null" }),
  // Agency-level subscription (NOT tied to individual agent)
  // Note: When agency belongs to a network with billingMode="network", this is inherited from network
  subscriptionPlan: text("subscription_plan"), // "basica", "pequeña", "mediana", "lider"
  isYearlyBilling: boolean("is_yearly_billing").default(false),
  seatsLimit: integer("seats_limit"), // Max agents based on plan
  activePropertiesLimit: integer("active_properties_limit"), // Max active properties based on plan
  // Paused subscription tracking (when joining a network-billed franchise)
  pausedSubscriptionPlan: text("paused_subscription_plan"),
  pausedIsYearlyBilling: boolean("paused_is_yearly_billing"),
  pausedAt: timestamp("paused_at"),
  // Stripe integration fields
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for billing
  stripeSubscriptionId: text("stripe_subscription_id"), // Current active subscription ID
  subscriptionStartDate: timestamp("subscription_start_date"), // When the current subscription started (for renewal calculation)
  // Soft delete support
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  networkIdIdx: index("agencies_network_id_idx").on(table.networkId),
}));

// Agents table - supports independent agents, agency members, and network admins
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").notNull().unique().defaultRandom(), // Public-facing UUID for security
  slug: text("slug").unique(), // SEO-friendly URL slug (nullable initially, will be populated)
  email: text("email").notNull().unique(),
  password: text("password"), // Nullable for pending invited agents (set on acceptance)
  name: text("name"),
  surname: text("surname"),
  phone: text("phone"), // Contact phone number
  description: text("description"),
  avatar: text("avatar"),
  city: text("city"),
  influenceNeighborhoods: text("influence_neighborhoods").array(),
  yearsOfExperience: integer("years_of_experience"),
  languagesSpoken: text("languages_spoken").array(),
  socialMedia: jsonb("social_media"),
  // Agent type: "independent", "agency_member", or "network_admin"
  agentType: text("agent_type").notNull().default("independent"),
  // Network admin affiliation (only for network_admin type)
  networkId: integer("network_id").references(() => networks.id, { onDelete: "set null" }),
  // Personal subscription (ONLY active for independent agents)
  subscriptionPlan: text("subscription_plan"), // "basica", "pequeña", "mediana", "lider"
  isYearlyBilling: boolean("is_yearly_billing").default(false),
  // Paused subscription tracking (when joining agency)
  pausedSubscriptionPlan: text("paused_subscription_plan"),
  pausedIsYearlyBilling: boolean("paused_is_yearly_billing"),
  pausedAt: timestamp("paused_at"),
  // Stripe integration fields (for independent agents only)
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for billing
  stripeSubscriptionId: text("stripe_subscription_id"), // Current active subscription ID
  subscriptionStartDate: timestamp("subscription_start_date"), // When the current subscription started (for renewal calculation)
  // Invitation tracking (for agents invited to join agencies)
  invitationStatus: text("invitation_status"), // "pending" or "active" (null for non-invited agents)
  invitationToken: text("invitation_token"), // Token for validating invitation acceptance
  invitationExpiresAt: timestamp("invitation_expires_at"), // When the invitation expires
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  // Soft delete support
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  networkIdIdx: index("agents_network_id_idx").on(table.networkId),
  isActiveIdx: index("agents_is_active_idx").on(table.isActive),
  lastLoginAtIdx: index("agents_last_login_at_idx").on(table.lastLoginAt),
}));

export const properties = pgTable("properties", {
  uuid: uuid("uuid").primaryKey().defaultRandom(), // UUID as primary key
  slug: text("slug").unique(), // SEO-friendly URL slug (nullable initially, will be populated)
  reference: text("reference"), // Nuevo campo de referencia para identificación interna
  // Address fields
  locality: text("locality"), // City/town input (Madrid, Barcelona, etc)
  streetName: text("street_name"), // Street name input
  streetNumber: text("street_number"), // Street number input
  address: text("address").notNull(), // Formatted address from Google
  latitude: real("latitude"), // Latitude coordinate
  longitude: real("longitude"), // Longitude coordinate
  hideAddress: boolean("hide_address").default(true).notNull(), // Hide address from public profile (default: hidden)
  // Campos adicionales de dirección (privados, no se muestran públicamente)
  escalera: text("escalera"), // Escalera: A, B, C
  planta: text("planta"), // Planta: 1-20
  puerta: text("puerta"), // Puerta: 1-12, A-J
  type: text("type").notNull(),
  operationType: text("operation_type").notNull(), // "Venta" or "Alquiler"
  // Nuevos campos
  housingType: text("housing_type"), // Tipo de vivienda (piso, chalet, etc)
  housingStatus: text("housing_status"), // Situación legal (disponible, ocupada, etc)
  propertyCondition: text("property_condition"), // Estado de conservación (obra nueva, buen estado, a reformar, reformado)
  floor: text("floor"), // Planta (última planta, planta intermedia, etc)
  features: text("features").array(), // Array de características
  availability: text("availability"), // Disponibilidad
  availabilityDate: timestamp("availability_date"), // Fecha de disponibilidad
  previousPrice: integer("previous_price"), // Precio anterior (para calcular bajadas)
  // Campos existentes
  description: text("description").notNull(),
  price: integer("price").notNull(),
  city: text("city"),
  district: text("district"),
  neighborhood: text("neighborhood").notNull(),
  bedrooms: integer("bedrooms"), // Number of bedrooms
  bathrooms: integer("bathrooms"), // Number of bathrooms
  superficie: integer("superficie"), // Area in square meters
  imageUrls: text("image_urls").array(), // Cloud storage URLs for images
  mainImageIndex: integer("main_image_index").default(0),
  title: text("title").notNull(), // Title is required
  viewCount: integer("view_count").default(0).notNull(), // Contador de visualizaciones
  agentId: integer("agent_id").notNull(), // ID del agente que publicó la propiedad
  agencyId: integer("agency_id"), // ID de la agencia a la que pertenece la propiedad (opcional)
  isActive: boolean("is_active").default(true).notNull(), // Para activar/desactivar la visibilidad de la propiedad
  isDraft: boolean("is_draft").default(true).notNull(), // Borrador: true hasta completar todos los pasos
  fraudCount: integer("fraud_count").default(0).notNull(), // Contador de reportes de fraude
  moderationStatus: text("moderation_status").default("pending").notNull(), // pending, approved, rejected
  moderatedBy: integer("moderated_by").references(() => agents.id, { onDelete: "set null" }),
  moderatedAt: timestamp("moderated_at"),
  moderationReason: text("moderation_reason"),
  expiresAt: timestamp("expires_at"),
  managementStatus: text("management_status").default("Creada").notNull(), // Creada, Activa, Reservada, Alquilada, Inactiva, Vendida, En reforma
  hasCedulaHabitabilidad: boolean("has_cedula_habitabilidad").default(false).notNull(), // Whether the property has a cédula de habitabilidad
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  neighborhoodIdx: index("properties_neighborhood_idx").on(table.neighborhood),
  cityIdx: index("properties_city_idx").on(table.city),
  agentIdIdx: index("properties_agent_id_idx").on(table.agentId),
  agencyIdIdx: index("properties_agency_id_idx").on(table.agencyId),
  operationTypeIdx: index("properties_operation_type_idx").on(table.operationType),
  isActiveIdx: index("properties_is_active_idx").on(table.isActive),
  // Composite indexes for common query patterns
  neighborhoodOperationIdx: index("properties_neighborhood_operation_idx").on(table.neighborhood, table.operationType),
  agentActiveIdx: index("properties_agent_active_idx").on(table.agentId, table.isActive),
  agencyActiveIdx: index("properties_agency_active_idx").on(table.agencyId, table.isActive),
  moderationStatusIdx: index("properties_moderation_status_idx").on(table.moderationStatus),
  expiresAtIdx: index("properties_expires_at_idx").on(table.expiresAt),
  // Index for sorting by view count (most viewed properties)
  viewCountIdx: index("properties_view_count_idx").on(table.viewCount),
}));

export type ClientPropertyPreferences = {
  operationType?: string | null;
  propertyType?: string | null;
  housingType?: string | null;
  city?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  floor?: string | null;
  propertyCondition?: string | null;
  availability?: string | null;
  availabilityDate?: string | null;
  features?: string[];
};

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").notNull().unique().defaultRandom(), // Public-facing UUID for security
  name: text("name").notNull(),
  surname: text("surname"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("Nuevo"), // Client status: Nuevo, Contactado, En seguimiento, etc.
  clientType: text("client_type"), // Buyer, tenant, seller, or landlord
  tags: text("tags").array(), // Type-specific CRM tags
  propertyPreferences: jsonb("property_preferences").$type<ClientPropertyPreferences | null>(),
  password: text("password"), // Contraseña para clientes auto-registrados
  propertyInterest: text("property_interest"), // Tipo de propiedad de interés
  budget: integer("budget"), // Presupuesto
  notes: text("notes"), // Notas adicionales
  agentId: integer("agent_id"), // Ahora opcional para clientes auto-registrados
  source: text("source"), // Where the client came from: "property_inquiry", "agent_contact", "agency_contact", "self_registered", "manual"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  
  // New client profile fields
  avatar: text("avatar"), // Photo upload field
  employmentStatus: text("employment_status"), // "Jornada completa", "Jornada parcial", "Autónomo", "Desempleado", "Estudiante", "Pensionista"
  position: text("position"), // Position text field
  yearsAtPosition: integer("years_at_position"), // Years of permanence
  monthlyIncome: integer("monthly_income"), // Monthly income in euros
  
  // Housing questions
  numberOfPeople: integer("number_of_people"), // Number of people living in property
  relationship: text("relationship"), // "Amigos", "Familia", "Otra"
  hasMinors: boolean("has_minors").default(false), // Niños (0-12 años)
  hasAdolescents: boolean("has_adolescents").default(false), // Adolescentes (13-17 años)
  petsStatus: text("pets_status"), // "No tengo mascota", "Tengo mascota"
  petsDescription: text("pets_description"), // Description of pets if they have any
  moveInTiming: text("move_in_timing"), // "Lo antes posible", "Tengo flexibilidad", "Fecha exacta"
  moveInDate: timestamp("move_in_date"), // Specific date if "Fecha exacta" is selected
  
  reviewRequestSentAt: timestamp("review_request_sent_at"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),

  // Contact history timeline
  contactHistory: jsonb("contact_history").default(sql`'[]'::jsonb`), // Array of {id, status, timestamp, note}
}, (table) => ({
  // Index for querying clients by agent
  agentIdIdx: index("clients_agent_id_idx").on(table.agentId),
  // Index for email lookups (login, etc)
  emailIdx: index("clients_email_idx").on(table.email),
  isActiveIdx: index("clients_is_active_idx").on(table.isActive),
  lastLoginAtIdx: index("clients_last_login_at_idx").on(table.lastLoginAt),
}));

export const neighborhoodRatings = pgTable("neighborhood_ratings", {
  id: serial("id").primaryKey(),
  city: text("city"),
  district: text("district"),
  neighborhood: text("neighborhood").notNull(),
  security: decimal("security").notNull(),
  parking: decimal("parking").notNull(),
  familyFriendly: decimal("family_friendly").notNull(),
  publicTransport: decimal("public_transport").notNull(),
  greenSpaces: decimal("green_spaces").notNull(),
  services: decimal("services").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Junction table for agent-agency relationships with role enforcement
export const agencyAgents = pgTable("agency_agents", {
  id: serial("id").primaryKey(),
  // Integer foreign keys (will be removed after UUID migration)
  agencyId: integer("agency_id").references(() => agencies.id),
  agentId: integer("agent_id").references(() => agents.id),
  // UUID foreign keys (primary relationship identifiers) - nullable during migration, will be NOT NULL after backfill
  agencyUuid: uuid("agency_uuid").references(() => agencies.uuid),
  agentUuid: uuid("agent_uuid").references(() => agents.uuid),
  role: text("role").notNull(), // "admin" or "member"
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  leftAt: timestamp("left_at"), // For soft delete when agent leaves
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // CHECK constraint: role must be 'admin' or 'member'
  roleCheck: check("role_check", sql`${table.role} IN ('admin', 'member')`),
  // Partial unique index: Agent can only be active member of ONE agency at a time (UUID-based)
  uniqueActiveAgentUuid: uniqueIndex("unique_active_agent_uuid").on(table.agentUuid).where(sql`${table.leftAt} IS NULL`),
  // Partial unique index: Only ONE admin per agency (UUID-based)
  uniqueActiveAdminUuid: uniqueIndex("unique_active_admin_uuid").on(table.agencyUuid).where(sql`${table.role} = 'admin' AND ${table.leftAt} IS NULL`),
  // Indexes for UUID-based lookups
  agencyUuidIdx: index("agency_agents_agency_uuid_idx").on(table.agencyUuid),
  agentUuidIdx: index("agency_agents_agent_uuid_idx").on(table.agentUuid),
}));

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  agentId: integer("agent_id").notNull(),
  type: text("type").notNull(), // "Visita" o "Llamada"
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  propertyUuid: uuid("property_uuid").references(() => properties.uuid), // Solo se requiere para visitas
  comments: text("comments"), // Ya no es obligatorio
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  agentId: integer("agent_id").notNull(), // ID del agente asociado a la propiedad
  status: text("status").notNull().default("pendiente"), // "pendiente", "contactado", "finalizado"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").notNull(), // References the original inquiry/conversation
  senderType: text("sender_type").notNull(), // "client" or "agent"
  senderId: integer("sender_id").notNull(), // Client ID or Agent ID based on sender type
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("sent"), // "sent", "delivered", "read"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pinnedConversations = pgTable("pinned_conversations", {
  id: serial("id").primaryKey(),
  userType: text("user_type").notNull(), // "agent" or "client"
  userId: integer("user_id").notNull(), // Agent ID or Client ID (using email for clients)
  userEmail: text("user_email"), // For client identification since we use email
  inquiryId: integer("inquiry_id").notNull(), // The conversation/inquiry being pinned
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Esquemas de inserción
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
});
export const insertAgencySchema = createInsertSchema(agencies).omit({
  id: true,
});
export const insertPropertySchema = createInsertSchema(properties).omit({
  uuid: true,
  createdAt: true,
}).extend({
  // Accept date strings from JSON and convert to Date objects
  availabilityDate: z.union([
    z.date(),
    z.string().transform((val) => new Date(val)),
  ]).optional().nullable(),
  // Explicitly include new fields to ensure they're not stripped by Zod parsing
  // These fields are optional AND nullable to support multi-step draft creation
  propertyCondition: z.string().optional().nullable(),
  housingStatus: z.string().optional().nullable(),
  housingType: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
});
const dateCoerce = z.union([z.date(), z.string().transform((s) => new Date(s))]).optional().nullable();
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
}).extend({
  clientType: z.string().refine(
    (value) => ["buyer", "tenant", "seller", "landlord"].includes(value),
    { message: "Invalid client type" },
  ).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  propertyPreferences: z.object({
    operationType: z.string().nullable().optional(),
    propertyType: z.string().nullable().optional(),
    housingType: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    minPrice: z.number().nullable().optional(),
    maxPrice: z.number().nullable().optional(),
    bedrooms: z.number().nullable().optional(),
    bathrooms: z.number().nullable().optional(),
    minArea: z.number().nullable().optional(),
    maxArea: z.number().nullable().optional(),
    floor: z.string().nullable().optional(),
    propertyCondition: z.string().nullable().optional(),
    availability: z.string().nullable().optional(),
    availabilityDate: z.string().nullable().optional(),
    features: z.array(z.string()).optional(),
  }).nullable().optional(),
  reviewRequestSentAt: dateCoerce,
  moveInDate: dateCoerce,
  lastLoginAt: dateCoerce,
});
// Para valoraciones, usamos un esquema personalizado para asegurar que los valores sean numéricos
export const insertNeighborhoodRatingSchema = z.object({
  city: z.string().optional().default('Barcelona'),
  district: z.string().optional(),
  neighborhood: z.string(),
  security: z.number().min(1).max(10),
  parking: z.number().min(1).max(10),
  familyFriendly: z.number().min(1).max(10),
  publicTransport: z.number().min(1).max(10),
  greenSpaces: z.number().min(1).max(10),
  services: z.number().min(1).max(10),
  userId: z.number().int(), // Permitimos IDs negativos para usuarios anónimos
});
export const insertAgencyAgentSchema = createInsertSchema(agencyAgents).omit({
  id: true,
  createdAt: true,
});
export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});
export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});
export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({
  id: true,
  createdAt: true,
});
export const insertPinnedConversationSchema = createInsertSchema(pinnedConversations).omit({
  id: true,
  createdAt: true,
});

// Tipos de selección
export type Agent = typeof agents.$inferSelect;
export type Agency = typeof agencies.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Client = typeof clients.$inferSelect;

// Contact history entry type
export type ContactHistoryEntry = {
  id: string;
  status: string;
  timestamp: string;
  note: string;
};

export type NeighborhoodRating = typeof neighborhoodRatings.$inferSelect;
export type AgencyAgent = typeof agencyAgents.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type PinnedConversation = typeof pinnedConversations.$inferSelect;

// Tipos de inserción
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertNeighborhoodRating = z.infer<
  typeof insertNeighborhoodRatingSchema
>;
export type InsertAgencyAgent = z.infer<typeof insertAgencyAgentSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type InsertPinnedConversation = z.infer<typeof insertPinnedConversationSchema>;

// Mantener compatibilidad con código antiguo
export type User = Agent;

// Extended User type with review statistics
export type UserWithReviews = User & {
  reviewCount?: number;
  reviewAverage?: number;
};

// DTO types for enriched objects with joined/computed data
// Agency DTO - includes agency data formatted for routes
export type AgencyDTO = {
  id: number;
  uuid: string;
  slug: string | null;
  name: string | null; // Maps to agencyName
  agencyName: string; // Original field
  agencyAddress: string | null;
  agencyDescription: string | null;
  agencyLogo: string | null;
  agencyPhone: string | null;
  phone: string | null; // Alias for agencyPhone
  agencyActiveSince: string | null;
  city: string | null;
  agencyInfluenceNeighborhoods: string[] | null;
  agencySupportedLanguages: string[] | null;
  agencyWebsite: string | null;
  agencySocialMedia: any;
  subscriptionPlan: string | null;
  isYearlyBilling: boolean | null;
  seatsLimit: number | null;
  activePropertiesLimit: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  reviewCount?: number;
  reviewAverage?: number;
};

// AgencyAgent with enriched agent details
export type AgencyAgentWithDetails = AgencyAgent & {
  agentName?: string;
  agentEmail?: string;
  agentAvatar?: string | null;
};

// Inquiry with joined property and agent data
export type InquiryWithDetails = Inquiry & {
  property?: Property;
  agent?: Agent;
};

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(), // Puede ser un id de agente o agencia
  targetType: text("target_type"), // Tipo de objetivo: 'agent' o 'agency'
  propertyUuid: uuid("property_uuid").references(() => properties.uuid),
  verified: boolean("verified").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false), // Nueva columna para marcar reseñas destacadas
  confirmed: boolean("confirmed").notNull().default(false), // Email confirmado
  confirmationToken: text("confirmation_token"), // Token único para confirmar email
  reviewerEmail: text("reviewer_email"), // Email del autor para confirmación
  reviewerProfile: text("reviewer_profile"), // Perfil del autor: 'vendedor', 'comprador', 'arrendador', 'arrendatario'
  comment: text("comment"), // Campo para los comentarios
  agentResponse: text("agent_response"), // Respuesta del agente a la reseña
  responseDate: timestamp("response_date"), // Fecha en que el agente respondió
  areaKnowledge: decimal("area_knowledge", {
    precision: 2,
    scale: 1,
  }).notNull(),
  priceNegotiation: decimal("price_negotiation", {
    precision: 2,
    scale: 1,
  }).notNull(),
  treatment: decimal("treatment", { precision: 2, scale: 1 }).notNull(),
  punctuality: decimal("punctuality", { precision: 2, scale: 1 }).notNull(),
  propertyKnowledge: decimal("property_knowledge", {
    precision: 2,
    scale: 1,
  }).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  author: text("author"),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  date: true,
});
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Client favorite agents table
export const clientFavoriteAgents = pgTable("client_favorite_agents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientFavoriteAgentSchema = createInsertSchema(clientFavoriteAgents).omit({
  id: true,
  createdAt: true,
});
export type ClientFavoriteAgent = typeof clientFavoriteAgents.$inferSelect;
export type InsertClientFavoriteAgent = z.infer<typeof insertClientFavoriteAgentSchema>;

// Client favorite agencies table
export const clientFavoriteAgencies = pgTable("client_favorite_agencies", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientFavoriteAgencySchema = createInsertSchema(clientFavoriteAgencies).omit({
  id: true,
  createdAt: true,
});
export type ClientFavoriteAgency = typeof clientFavoriteAgencies.$inferSelect;
export type InsertClientFavoriteAgency = z.infer<typeof insertClientFavoriteAgencySchema>;

// Client favorite properties table
export const clientFavoriteProperties = pgTable("client_favorite_properties", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientFavoritePropertySchema = createInsertSchema(clientFavoriteProperties).omit({
  id: true,
  createdAt: true,
});
export type ClientFavoriteProperty = typeof clientFavoriteProperties.$inferSelect;
export type InsertClientFavoriteProperty = z.infer<typeof insertClientFavoritePropertySchema>;

// Property visit requests table
export const propertyVisitRequests = pgTable("property_visit_requests", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  requestedDate: timestamp("requested_date").notNull(),
  requestedTime: text("requested_time").notNull(), // Store time as string like "10:00"
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  clientNotes: text("client_notes"),
  agentNotes: text("agent_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyVisitRequestSchema = createInsertSchema(propertyVisitRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PropertyVisitRequest = typeof propertyVisitRequests.$inferSelect;
export type InsertPropertyVisitRequest = z.infer<typeof insertPropertyVisitRequestSchema>;

// Agent Calendar Events
export const agentEvents = pgTable("agent_events", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id),
  clientId: integer("client_id").references(() => clients.id),
  propertyUuid: uuid("property_uuid").references(() => properties.uuid),
  eventType: text("event_type").notNull(), // 'Llamada', 'Visita', or 'Seguimiento'
  eventDate: text("event_date").notNull(), // YYYY-MM-DD format
  eventTime: text("event_time").notNull(), // HH:MM format
  comments: text("comments"),
  status: text("status").default("scheduled").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentEventSchema = createInsertSchema(agentEvents).omit({
  id: true,
  createdAt: true,
});

export type AgentEvent = typeof agentEvents.$inferSelect;
export type InsertAgentEvent = z.infer<typeof insertAgentEventSchema>;

// Fraud reports table
export const fraudReports = pgTable("fraud_reports", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  reporterIp: text("reporter_ip"), // IP address to prevent spam
  reporterAgent: text("reporter_agent"), // User agent string for additional tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFraudReportSchema = createInsertSchema(fraudReports).omit({
  id: true,
  createdAt: true,
});

export type FraudReport = typeof fraudReports.$inferSelect;
export type InsertFraudReport = z.infer<typeof insertFraudReportSchema>;

// Agent favorite properties table
export const agentFavoriteProperties = pgTable("agent_favorite_properties", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentFavoritePropertySchema = createInsertSchema(agentFavoriteProperties).omit({
  id: true,
  createdAt: true,
});
export type AgentFavoriteProperty = typeof agentFavoriteProperties.$inferSelect;
export type InsertAgentFavoriteProperty = z.infer<typeof insertAgentFavoritePropertySchema>;

// Subscription events audit table - tracks all subscription state changes
export const subscriptionEvents = pgTable("subscription_events", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "agency" or "agent"
  entityId: integer("entity_id").notNull(), // Agency ID or Agent ID
  eventType: text("event_type").notNull(), // "created", "paused", "resumed", "cancelled", "plan_changed", "admin_transferred"
  previousState: jsonb("previous_state"), // State before change
  newState: jsonb("new_state"), // State after change
  triggeredBy: integer("triggered_by"), // Agent ID who triggered the change
  reason: text("reason"), // Human-readable reason
  metadata: jsonb("metadata"), // Additional context (seat count, transfer details, etc.)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents).omit({
  id: true,
  createdAt: true,
});
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
export type InsertSubscriptionEvent = z.infer<typeof insertSubscriptionEventSchema>;

// Session storage table managed by connect-pg-simple. Declared here so
// drizzle-kit recognises it as an existing table and does not propose
// renaming it whenever a new table is added to the schema.
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6, mode: "date" }).notNull(),
}, (table) => ({
  expireIdx: index("IDX_session_expire").on(table.expire),
}));

// App settings table - key/value config storage for platform-wide settings
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedBy: integer("updated_by").references(() => agents.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  keyIdx: index("app_settings_key_idx").on(table.key),
}));

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;

// Administrative audit logs for privileged actions
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => agents.id, { onDelete: "set null" }),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  metadata: jsonb("metadata"),
  requestId: text("request_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  actorIdIdx: index("admin_audit_logs_actor_id_idx").on(table.actorId),
  actionIdx: index("admin_audit_logs_action_idx").on(table.action),
  targetTypeIdx: index("admin_audit_logs_target_type_idx").on(table.targetType),
  createdAtIdx: index("admin_audit_logs_created_at_idx").on(table.createdAt),
}));

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs).omit({
  id: true,
  createdAt: true,
});
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

// Saved searches table for clients
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Mi búsqueda 1", "Mi búsqueda 2", etc.
  city: text("city"),
  district: text("district"),
  neighborhood: text("neighborhood"),
  operationType: text("operation_type"), // "Venta" or "Alquiler"
  minPrice: integer("min_price"),
  maxPrice: integer("max_price"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  characteristics: text("characteristics").array(), // Array of characteristics
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
});
export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;

// Agent invitations table for secure invitation flow
export const agentInvitations = pgTable("agent_invitations", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(), // Unique token for validation
  email: text("email").notNull(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  invitedBy: integer("invited_by").notNull().references(() => agents.id, { onDelete: "cascade" }),
  consumedAt: timestamp("consumed_at"), // null = not yet used
  expiresAt: timestamp("expires_at").notNull(), // Invitation expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentInvitationSchema = createInsertSchema(agentInvitations).omit({
  id: true,
  createdAt: true,
});
export type AgentInvitation = typeof agentInvitations.$inferSelect;
export type InsertAgentInvitation = z.infer<typeof insertAgentInvitationSchema>;

// Subscription plan limits configuration
// Note: null = unlimited
export const SUBSCRIPTION_LIMITS = {
  basica: {
    seats: 1,
    activeProperties: 2,
    reviewRequests: 0, // No review requests allowed
  },
  pequeña: {
    seats: 2,
    activeProperties: 10,
    reviewRequests: null, // null = unlimited
  },
  mediana: {
    seats: 6,
    activeProperties: 30,
    reviewRequests: null, // null = unlimited
  },
  lider: {
    seats: null, // null = unlimited
    activeProperties: null, // null = unlimited
    reviewRequests: null, // null = unlimited
  },
} as const;

// Network subscription plan limits
export const NETWORK_SUBSCRIPTION_LIMITS = {
  red_agencias: {
    agencies: null, // null = unlimited agencies
    totalSeats: null, // null = unlimited total agents across all agencies
    totalActiveProperties: null, // null = unlimited total properties
    reviewRequests: null, // null = unlimited
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_LIMITS;
export type NetworkSubscriptionPlan = keyof typeof NETWORK_SUBSCRIPTION_LIMITS;

// Property Management Tables

export const propertyContracts = pgTable("property_contracts", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").references(() => clients.id),
  tenantName: text("tenant_name"),
  tenantEmail: text("tenant_email"),
  tenantPhone: text("tenant_phone"),
  duration: integer("duration").notNull(), // months
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  rentPrice: integer("rent_price").notNull(), // monthly rent in cents
  guarantee: integer("guarantee"), // deposit amount in cents
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyContractSchema = createInsertSchema(propertyContracts).omit({ id: true, createdAt: true });
export type PropertyContract = typeof propertyContracts.$inferSelect;
export type InsertPropertyContract = z.infer<typeof insertPropertyContractSchema>;

export const propertyPayments = pgTable("property_payments", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  contractId: integer("contract_id").references(() => propertyContracts.id, { onDelete: "cascade" }),
  concept: text("concept").notNull(),
  amount: integer("amount").notNull(), // in cents
  status: text("status").notNull().default("Pendiente"), // Pendiente, Pagado
  addToHistory: boolean("add_to_history").default(false).notNull(),
  paymentDate: text("payment_date"), // YYYY-MM-DD
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyPaymentSchema = createInsertSchema(propertyPayments).omit({ id: true, createdAt: true });
export type PropertyPayment = typeof propertyPayments.$inferSelect;
export type InsertPropertyPayment = z.infer<typeof insertPropertyPaymentSchema>;

export const propertyDocuments = pgTable("property_documents", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size"),
  fileUrl: text("file_url").notNull(),
  uploadDate: text("upload_date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyDocumentSchema = createInsertSchema(propertyDocuments).omit({ id: true, createdAt: true });
export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type InsertPropertyDocument = z.infer<typeof insertPropertyDocumentSchema>;

export const propertyIncidents = pgTable("property_incidents", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("Nueva"), // Nueva, Asignada, En espera, Resuelta, Verificada, Cerrada
  priority: text("priority").notNull().default("Media"), // Alta, Media, Baja
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyIncidentSchema = createInsertSchema(propertyIncidents).omit({ id: true, createdAt: true });
export type PropertyIncident = typeof propertyIncidents.$inferSelect;
export type InsertPropertyIncident = z.infer<typeof insertPropertyIncidentSchema>;

export const incidentUpdates = pgTable("incident_updates", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull().references(() => propertyIncidents.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  newStatus: text("new_status"),
  newPriority: text("new_priority"),
  performedBy: text("performed_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIncidentUpdateSchema = createInsertSchema(incidentUpdates).omit({ id: true, createdAt: true });
export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
export type InsertIncidentUpdate = z.infer<typeof insertIncidentUpdateSchema>;

export const propertyCommunications = pgTable("property_communications", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  title: text("title").notNull(),
  communicationType: text("communication_type").notNull(),
  relevantDate: text("relevant_date").notNull(), // YYYY-MM-DD
  description: text("description"),
  addToCalendar: boolean("add_to_calendar").default(false).notNull(),
  addToHistory: boolean("add_to_history").default(false).notNull(),
  agentId: integer("agent_id").references(() => agents.id),
  clientId: integer("client_id").references(() => clients.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyCommunicationSchema = createInsertSchema(propertyCommunications).omit({ id: true, createdAt: true });
export type PropertyCommunication = typeof propertyCommunications.$inferSelect;
export type InsertPropertyCommunication = z.infer<typeof insertPropertyCommunicationSchema>;

export const propertyHistory = pgTable("property_history", {
  id: serial("id").primaryKey(),
  propertyUuid: uuid("property_uuid").notNull().references(() => properties.uuid, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // creation, status_change, contract, payment, incident, communication
  title: text("title").notNull(),
  description: text("description"),
  performedBy: text("performed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyHistorySchema = createInsertSchema(propertyHistory).omit({ id: true, createdAt: true });
export type PropertyHistoryEntry = typeof propertyHistory.$inferSelect;
export type InsertPropertyHistory = z.infer<typeof insertPropertyHistorySchema>;

// Work sessions for "Control de jornada" time tracking
// One row per agent per workDate, tracking clock-in/out and break intervals.
export type WorkBreak = {
  startAt: string; // ISO timestamp
  endAt: string | null; // ISO timestamp or null while break is active
};

export const workSessions = pgTable("work_sessions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  workDate: text("work_date").notNull(), // YYYY-MM-DD (agent local day)
  clockInAt: timestamp("clock_in_at").notNull(),
  clockOutAt: timestamp("clock_out_at"),
  breaks: jsonb("breaks").$type<WorkBreak[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueAgentDate: uniqueIndex("work_sessions_agent_date_unique").on(table.agentId, table.workDate),
  agentIdx: index("work_sessions_agent_idx").on(table.agentId),
  dateIdx: index("work_sessions_date_idx").on(table.workDate),
}));

export const insertWorkSessionSchema = createInsertSchema(workSessions).omit({
  id: true,
  createdAt: true,
});
export type WorkSession = typeof workSessions.$inferSelect;
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;

// Absence requests for "Control de ausencias"
// Whole-day absences with reason and approval workflow.
export const ABSENCE_REASONS = ["vacaciones", "remoto", "baja_laboral"] as const;
export const ABSENCE_STATUSES = ["pending", "approved", "rejected"] as const;
export type AbsenceReason = (typeof ABSENCE_REASONS)[number];
export type AbsenceStatus = (typeof ABSENCE_STATUSES)[number];

export const absenceRequests = pgTable(
  "absence_requests",
  {
    id: serial("id").primaryKey(),
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    agencyId: integer("agency_id").references(() => agencies.id, { onDelete: "set null" }),
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    endDate: text("end_date").notNull(), // YYYY-MM-DD (inclusive)
    reason: text("reason").notNull(), // vacaciones | remoto | baja_laboral
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    reviewedBy: integer("reviewed_by").references(() => agents.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    reasonCheck: check(
      "absence_requests_reason_check",
      sql`${table.reason} IN ('vacaciones', 'remoto', 'baja_laboral')`,
    ),
    statusCheck: check(
      "absence_requests_status_check",
      sql`${table.status} IN ('pending', 'approved', 'rejected')`,
    ),
    rangeCheck: check(
      "absence_requests_range_check",
      sql`${table.startDate} <= ${table.endDate}`,
    ),
    agentIdx: index("absence_requests_agent_idx").on(table.agentId),
    agencyIdx: index("absence_requests_agency_idx").on(table.agencyId),
    statusIdx: index("absence_requests_status_idx").on(table.status),
    rangeIdx: index("absence_requests_range_idx").on(table.startDate, table.endDate),
  }),
);

export const insertAbsenceRequestSchema = createInsertSchema(absenceRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
});
export type AbsenceRequest = typeof absenceRequests.$inferSelect;
export type InsertAbsenceRequest = z.infer<typeof insertAbsenceRequestSchema>;

// Assigns a designated approver for each team member's absence requests.
export const absenceApprovalAssignments = pgTable(
  "absence_approval_assignments",
  {
    id: serial("id").primaryKey(),
    agencyId: integer("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    agentId: integer("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    approverId: integer("approver_id")
      .references(() => agents.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueAgencyAgent: uniqueIndex("absence_approval_assignments_agency_agent_unique").on(
      table.agencyId,
      table.agentId,
    ),
    agencyIdx: index("absence_approval_assignments_agency_idx").on(table.agencyId),
  }),
);

export type AbsenceApprovalAssignment = typeof absenceApprovalAssignments.$inferSelect;
