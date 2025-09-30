import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertMessageSchema, insertConversationSchema, insertKnowledgeBaseSchema } from "@shared/schema";
import { 
  generateSmartCompose, 
  generateSmartSuggestions, 
  generateSmartReplies, 
  generateConversationSummary,
  classifyMessageIntent 
} from "./services/openai";
import { parsePDFToQA } from "./services/pdf-parser";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment
  app.get("/api/health", async (req, res) => {
    try {
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        services: {
          storage: "operational",
          openai: process.env.OPENAI_API_KEY ? "configured" : "not_configured"
        }
      };

      // Test storage connection
      try {
        await storage.getConversations();
        health.services.storage = "operational";
      } catch (error) {
        health.services.storage = "error";
        health.status = "degraded";
      }

      const statusCode = health.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed"
      });
    }
  });

  // Root endpoint for health checks (must be outside /api prefix for deployment health checks)
  app.get("/api/status", (req, res) => {
    res.status(200).json({ 
      message: "Customer Service AI Assistant API",
      status: "running",
      version: "1.0.0"
    });
  });

  // Readiness check endpoint
  app.get("/api/ready", async (req, res) => {
    try {
      // Test critical dependencies
      await storage.getConversations();
      
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        error: "Service dependencies not ready"
      });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get specific conversation
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(400).json({ error: "Invalid conversation data" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messageData = { ...req.body, conversationId: req.params.id };
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      
      // Update conversation timestamp
      await storage.updateConversation(req.params.id, { updatedAt: new Date() });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Smart compose endpoint
  app.post("/api/smart-compose", async (req, res) => {
    try {
      const { prompt, conversationId } = req.body;
      const messages = await storage.getMessages(conversationId);
      const conversationHistory = messages.map(m => `${m.isAgent ? 'Agent' : 'Customer'}: ${m.text}`);
      
      // Get knowledge base for context
      const knowledgeBase = await storage.getKnowledgeBase();
      
      const suggestion = await generateSmartCompose(prompt, conversationHistory, knowledgeBase);
      res.json({ suggestion });
    } catch (error) {
      console.error("Smart compose error:", error);
      res.status(500).json({ error: "Failed to generate smart compose suggestion" });
    }
  });

  // Smart suggestions endpoint
  app.post("/api/smart-suggestions", async (req, res) => {
    try {
      const { userMessage, conversationId } = req.body;
      const knowledgeBase = await storage.getKnowledgeBase();
      
      // Get conversation history for better context
      let conversationHistory: any[] = [];
      if (conversationId) {
        const messages = await storage.getMessages(conversationId);
        conversationHistory = messages.slice(-5); // Last 5 messages for context
      }
      
      const suggestions = await generateSmartSuggestions(userMessage, knowledgeBase, conversationHistory);
      res.json({ suggestions });
    } catch (error) {
      console.error("Smart suggestions error:", error);
      res.status(500).json({ error: "Failed to generate smart suggestions" });
    }
  });

  // Smart replies endpoint
  app.post("/api/smart-replies", async (req, res) => {
    try {
      const { messageText } = req.body;
      const intent = await classifyMessageIntent(messageText);
      const replies = await generateSmartReplies(intent);
      
      res.json({ replies });
    } catch (error) {
      console.error("Smart replies error:", error);
      res.status(500).json({ error: "Failed to generate smart replies" });
    }
  });

  // Conversation summary endpoint
  app.post("/api/conversations/:id/summary", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      const summary = await generateConversationSummary(messages);
      
      res.json({ summary });
    } catch (error) {
      console.error("Summary generation error:", error);
      res.status(500).json({ error: "Failed to generate conversation summary" });
    }
  });

  // Get templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Upload and parse PDF
  app.post("/api/upload-pdf", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const qaData = await parsePDFToQA(req.file.path);
      
      // Store in knowledge base
      for (const qa of qaData) {
        await storage.createKnowledgeBase({
          question: qa.question,
          answer: qa.answer,
          source: qa.source
        });
      }

      res.json({ message: "PDF processed successfully", itemsAdded: qaData.length });
    } catch (error) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  // Search knowledge base
  app.get("/api/knowledge-base/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const results = await storage.searchKnowledgeBase(q);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search knowledge base" });
    }
  });

  // Initialize knowledge base from attached PDF
  app.post("/api/initialize-pdf-knowledge", async (req, res) => {
    try {
      const pdfPath = "attached_assets/digital faq_1753866693805.pdf";
      const qaData = await parsePDFToQA(pdfPath);
      
      let addedCount = 0;
      for (const qa of qaData) {
        try {
          await storage.createKnowledgeBase({
            question: qa.question,
            answer: qa.answer,
            source: qa.source
          });
          addedCount++;
        } catch (error) {
          // Skip duplicates or errors
          console.log(`Skipping Q&A: ${qa.question.substring(0, 50)}...`);
        }
      }

      res.json({ 
        message: "PDF knowledge base initialized successfully", 
        itemsAdded: addedCount,
        totalItems: qaData.length 
      });
    } catch (error) {
      console.error("PDF initialization error:", error);
      res.status(500).json({ error: "Failed to initialize PDF knowledge base" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
