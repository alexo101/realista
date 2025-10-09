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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Nueva tabla de agencias
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  agencyName: text("agency_name").notNull(),
  agencyAddress: text("agency_address"),
  agencyDescription: text("agency_description"),
  agencyLogo: text("agency_logo"),
  agencyEmailToDisplay: text("agency_email_to_display"),
  agencyPhone: text("agency_phone"),
  agencyActiveSince: text("agency_active_since"),
  // Ciudad donde opera la agencia
  city: text("city").notNull().default('Barcelona'),
  agencyInfluenceNeighborhoods: text("agencyInfluenceNeighborhoods").array(), // Barrios de influencia como array
  agencySupportedLanguages: text("agency_supported_languages").array(), // Idiomas como array
  adminAgentId: integer("admin_agent_id").notNull(), // ID del agente administrador que gestiona esta agencia
  agencyWebsite: text("agency_website"),
  agencySocialMedia: jsonb("agency_social_media"), // Redes sociales como JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tabla de agentes (anteriormente users)
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  surname: text("surname"),
  description: text("description"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Ciudad donde opera el agente
  city: text("city").notNull().default('Barcelona'),
  // Barrios de influencia para agentes
  influenceNeighborhoods: text("influence_neighborhoods").array(),
  // Detalles específicos del agente
  yearsOfExperience: integer("years_of_experience"), // Años de experiencia del agente
  languagesSpoken: text("languages_spoken").array(), // Idiomas que habla el agente
  // Relación con la agencia
  agencyId: text("agency_id"), // ID de la agencia a la que pertenece
  isAdmin: boolean("is_admin").notNull().default(false), // Indica si es un agente administrador
  // Subscription information
  subscriptionPlan: text("subscription_plan"), // Plan: "basica", "pequeña", "mediana", "lider"
  subscriptionType: text("subscription_type"), // "agency" o "agent"
  isYearlyBilling: boolean("is_yearly_billing").default(false), // Facturación anual
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  reference: text("reference"), // Nuevo campo de referencia para identificación interna
  address: text("address").notNull(),
  // Campos adicionales de dirección (privados, no se muestran públicamente)
  escalera: text("escalera"), // Escalera: A, B, C
  planta: text("planta"), // Planta: 1-20
  puerta: text("puerta"), // Puerta: 1-12, A-J
  type: text("type").notNull(),
  operationType: text("operation_type").notNull(), // "Venta" or "Alquiler"
  // Nuevos campos
  housingType: text("housing_type"), // Tipo de vivienda (piso, chalet, etc)
  housingStatus: text("housing_status"), // Situación (obra nueva, a reformar, etc)
  floor: text("floor"), // Planta (última planta, planta intermedia, etc)
  features: text("features").array(), // Array de características
  availability: text("availability"), // Disponibilidad
  availabilityDate: timestamp("availability_date"), // Fecha de disponibilidad
  previousPrice: integer("previous_price"), // Precio anterior (para calcular bajadas)
  // Campos existentes
  description: text("description").notNull(),
  price: integer("price").notNull(),
  city: text("city").notNull().default('Barcelona'),
  district: text("district"),
  neighborhood: text("neighborhood").notNull(),
  bedrooms: integer("bedrooms"), // Number of bedrooms
  bathrooms: integer("bathrooms"), // Number of bathrooms
  superficie: integer("superficie"), // Area in square meters
  images: text("images").array(), // Legacy base64 images (for backward compatibility)
  imageUrls: text("image_urls").array(), // New URL-based images for better performance
  mainImageIndex: integer("main_image_index").default(0),
  title: text("title"),
  viewCount: integer("view_count").default(0).notNull(), // Contador de visualizaciones
  agentId: integer("agent_id").notNull(), // ID del agente que publicó la propiedad
  agencyId: integer("agency_id"), // ID de la agencia a la que pertenece la propiedad (opcional)
  isActive: boolean("is_active").default(true).notNull(), // Para activar/desactivar la visibilidad de la propiedad
  fraudCount: integer("fraud_count").default(0).notNull(), // Contador de reportes de fraude
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  surname: text("surname"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  password: text("password"), // Contraseña para clientes auto-registrados
  propertyInterest: text("property_interest"), // Tipo de propiedad de interés
  budget: integer("budget"), // Presupuesto
  notes: text("notes"), // Notas adicionales
  agentId: integer("agent_id"), // Ahora opcional para clientes auto-registrados
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
});

export const neighborhoodRatings = pgTable("neighborhood_ratings", {
  id: serial("id").primaryKey(),
  city: text("city").notNull().default('Barcelona'),
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

// Tabla para gestionar la relación entre agentes y agencias
export const agencyAgents = pgTable("agency_agents", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull(), // ID del usuario que representa la agencia
  agentName: text("agent_name").notNull(),
  agentSurname: text("agent_surname").notNull(),
  agentEmail: text("agent_email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  agentId: integer("agent_id").notNull(),
  type: text("type").notNull(), // "Visita" o "Llamada"
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  propertyId: integer("property_id"), // Solo se requiere para visitas
  comments: text("comments"), // Ya no es obligatorio
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  propertyId: integer("property_id").notNull(),
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
  id: true,
  createdAt: true,
});
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
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

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(), // Puede ser un id de agente o agencia
  targetType: text("target_type"), // Tipo de objetivo: 'agent' o 'agency'
  propertyId: integer("property_id"),
  verified: boolean("verified").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false), // Nueva columna para marcar reseñas destacadas
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
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
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
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
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
  propertyId: integer("property_id").references(() => properties.id),
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
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
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
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentFavoritePropertySchema = createInsertSchema(agentFavoriteProperties).omit({
  id: true,
  createdAt: true,
});
export type AgentFavoriteProperty = typeof agentFavoriteProperties.$inferSelect;
export type InsertAgentFavoriteProperty = z.infer<typeof insertAgentFavoritePropertySchema>;
