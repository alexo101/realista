import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInquirySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth
  app.get("/api/users/check-email", async (req, res) => {
    try {
      const { email } = req.query;
      const user = await storage.getUserByEmail(email as string);
      res.json({ exists: !!user, name: user?.name });
    } catch (error) {
      res.status(500).json({ message: "Failed to check email" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      const { query, ...filters } = req.query;
      const properties = await storage.searchProperties(query as string, filters);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Agents
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(parseInt(req.params.id));
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // Inquiries
  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquiry = insertInquirySchema.parse(req.body);
      const result = await storage.createInquiry(inquiry);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid inquiry data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}