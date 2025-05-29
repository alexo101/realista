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
  agencyActiveSince: text("agency_active_since"),
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
  // Barrios de influencia para agentes
  influence_neighborhoods: text("influence_neighborhoods").array(),
  // Detalles específicos del agente
  yearsOfExperience: integer("years_of_experience"), // Años de experiencia del agente
  languagesSpoken: text("languages_spoken").array(), // Idiomas que habla el agente
  // Relación con la agencia
  agencyId: text("agency_id"), // ID de la agencia a la que pertenece
  isAdmin: boolean("is_admin").notNull().default(false), // Indica si es un agente administrador
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  reference: text("reference"), // Nuevo campo de referencia para identificación interna
  address: text("address").notNull(),
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
  neighborhood: text("neighborhood").notNull(),
  bedrooms: integer("bedrooms"), // Number of bedrooms
  bathrooms: integer("bathrooms"), // Number of bathrooms
  superficie: integer("superficie"), // Area in square meters
  images: text("images").array(),
  mainImageIndex: integer("main_image_index").default(0),
  title: text("title"),
  viewCount: integer("view_count").default(0).notNull(), // Contador de visualizaciones
  agentId: integer("agent_id").notNull(), // ID del agente que publicó la propiedad
  agencyId: integer("agency_id"), // ID de la agencia a la que pertenece la propiedad (opcional)
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
});

export const neighborhoodRatings = pgTable("neighborhood_ratings", {
  id: serial("id").primaryKey(),
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

// Tipos de selección
export type Agent = typeof agents.$inferSelect;
export type Agency = typeof agencies.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NeighborhoodRating = typeof neighborhoodRatings.$inferSelect;
export type AgencyAgent = typeof agencyAgents.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;

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

// Mantener compatibilidad con código antiguo
export type User = Agent;

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").notNull(), // Puede ser un id de agente o agencia
  targetType: text("target_type"), // Tipo de objetivo: 'agent' o 'agency'
  propertyId: integer("property_id"),
  verified: boolean("verified").notNull().default(false),
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
