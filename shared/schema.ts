import { pgTable, text, serial, integer, boolean, jsonb, timestamp, decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  surname: text("surname"),
  description: text("description"),
  avatar: text("avatar"),
  isAgent: boolean("is_agent").notNull().default(false),
  // Barrios de influencia para agentes
  influenceNeighborhoods: text("influence_neighborhoods").array(),
  // Agency details
  agencyName: text("agency_name"),
  agencyAddress: text("agency_address"),
  agencyDescription: text("agency_description"),
  agencyPhone: text("agency_phone"),
  agencyWebsite: text("agency_website"),
  agencySocialMedia: jsonb("agency_social_media"),
  agencyLogo: text("agency_logo"),
  // Barrios de influencia para agencias
  agencyInfluenceNeighborhoods: text("agency_influence_neighborhoods").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  type: text("type").notNull(),
  operationType: text("operation_type").notNull(), // "Venta" or "Alquiler"
  description: text("description").notNull(),
  price: integer("price").notNull(),
  neighborhood: text("neighborhood").notNull(),
  images: text("images").array(),
  title: text("title"),
  agentId: integer("agent_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  agentId: integer("agent_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const neighborhoodRatings = pgTable("neighborhood_ratings", {
  id: serial("id").primaryKey(),
  neighborhood: text("neighborhood").notNull(),
  security: decimal("security").notNull(),
  parking: decimal("parking").notNull(),
  familyFriendly: decimal("family_friendly").notNull(),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertNeighborhoodRatingSchema = createInsertSchema(neighborhoodRatings).omit({ id: true, createdAt: true });
export const insertAgencyAgentSchema = createInsertSchema(agencyAgents).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NeighborhoodRating = typeof neighborhoodRatings.$inferSelect;
export type AgencyAgent = typeof agencyAgents.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertNeighborhoodRating = z.infer<typeof insertNeighborhoodRatingSchema>;
export type InsertAgencyAgent = z.infer<typeof insertAgencyAgentSchema>;