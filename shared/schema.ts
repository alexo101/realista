import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  squareMeters: integer("square_meters").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // apartment, house, etc
  images: text("images").array().notNull(),
  features: text("features").array().notNull(),
  agentId: integer("agent_id").notNull(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  photo: text("photo").notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  userId: text("user_id").notNull(), // Using session ID for simplicity
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export const insertAgentSchema = createInsertSchema(agents).omit({ id: true });
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true });

export type Property = typeof properties.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
