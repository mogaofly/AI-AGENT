import { type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage, type KnowledgeBase, type InsertKnowledgeBase, type Template, type InsertTemplate } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  getKnowledgeBase(): Promise<KnowledgeBase[]>;
  createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  searchKnowledgeBase(query: string): Promise<KnowledgeBase[]>;
  
  getTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message[]>;
  private knowledgeBase: Map<string, KnowledgeBase>;
  private templates: Map<string, Template>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.knowledgeBase = new Map();
    this.templates = new Map();
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Initialize with default conversation and templates
    const defaultConversation: Conversation = {
      id: "default-conv",
      customerName: "Harry He",
      customerEmail: "harry.he@talkdesk.com",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set("default-conv", defaultConversation);
    
    // Initialize with default templates
    const defaultTemplates: Template[] = [
      {
        id: "welcome",
        title: "Welcome Message",
        content: "Thank you for contacting Talkdesk support. I'll be happy to help you with your questions about our digital engagement features.",
        category: "greeting",
        createdAt: new Date()
      },
      {
        id: "routing-rec",
        title: "Routing Recommendation",
        content: "Based on your requirements, I recommend using Studio flows for more complex routing scenarios that require custom logic and conditional branching.",
        category: "technical",
        createdAt: new Date()
      },
      {
        id: "follow-up",
        title: "Follow-up Question",
        content: "Is there anything else I can help you with regarding Talkdesk Digital Engagement? I'm here to assist you with any additional questions.",
        category: "followup",
        createdAt: new Date()
      }
    ];
    
    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    // Initialize with sample messages
    const defaultMessages: Message[] = [
      {
        id: "msg-1",
        conversationId: "default-conv",
        text: "What can I help you today?",
        isAgent: true,
        timestamp: new Date(Date.now() - 600000) // 10 minutes ago
      }
    ];
    this.messages.set("default-conv", defaultMessages);

    // Initialize knowledge base with default PDF data
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    const defaultKnowledge: KnowledgeBase[] = [
      {
        id: "kb-1",
        question: "What is Talkdesk Digital Engagement?",
        answer: "Talkdesk Digital Engagement™ empowers your contact center to quickly identify, route, and respond to customer service needs across multiple digital channels, making it easy for agents to meet customers in their preferred channel.",
        source: "Talkdesk Digital Engagement FAQ",
        embedding: null,
        createdAt: new Date()
      },
      {
        id: "kb-2",
        question: "What are some key features of Talkdesk Digital Engagement?",
        answer: "Key features include: Talkdesk Agent Workspace™ for seamless customer support across any channel, unified interface for all engagement channels on a single screen, centralized queue management, unified reporting within Talkdesk Explore™, flexible routing and presence options, and integrations with Zendesk, Salesforce, Slack, Gmail, and other systems.",
        source: "Talkdesk Digital Engagement FAQ",
        embedding: null,
        createdAt: new Date()
      },
      {
        id: "kb-3",
        question: "What digital channels are currently available for Talkdesk?",
        answer: "Currently, customers can have the following digital channels: SMS, Chat, Email, Digital Connect, and Social Messaging, which includes Facebook Messenger and WhatsApp Business.",
        source: "Talkdesk Digital Engagement FAQ",
        embedding: null,
        createdAt: new Date()
      },
      {
        id: "kb-4",
        question: "What types of routing can I configure for my digital channels?",
        answer: "All digital channels except Chat have Simplified Routing and Studio routing options. Simplified Routing allows admins to select queues for each touchpoint. Studio provides more complex routing rules with manual or auto-acceptance. SMS also has a Dedicated Agent option. Chat only has Studio routing due to its priority and synchronous nature.",
        source: "Talkdesk Digital Engagement FAQ",
        embedding: null,
        createdAt: new Date()
      },
      {
        id: "kb-5",
        question: "How do I set an occupancy limit for agents and for each channel?",
        answer: "Go to Admin > Channels > 'Global Settings' to define Conversation weight. Weight is measured by points, with each agent having a maximum capacity of 100 points. Voice conversation weight is fixed at 51 points, and you can define different weights for each digital channel with the available points.",
        source: "Talkdesk Digital Engagement FAQ",
        embedding: null,
        createdAt: new Date()
      },
      {
        id: "kb-6",
        question: "Does Talkdesk Digital Engagement have templates?",
        answer: "Yes, templates are pre-written messages that help agents be more efficient. They can be grouped into collections like 'Sales' or 'Support'. You can create, edit, and manage collections and templates through Admin > Channels > 'Templates' tab. Templates are available for Email, SMS, Chat, and Digital Connect channels.",
        source: "Talkdesk Digital Engagement FAQ",
        embedding: null,
        createdAt: new Date()
      }
    ];

    defaultKnowledge.forEach(kb => {
      this.knowledgeBase.set(kb.id, kb);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      customerEmail: insertConversation.customerEmail || null,
      status: insertConversation.status || "active",
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(id, conversation);
    this.messages.set(id, []);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messages.get(conversationId) || [];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      conversationId: insertMessage.conversationId || null,
      isAgent: insertMessage.isAgent || false,
      id,
      timestamp: new Date()
    };
    
    const conversationMessages = this.messages.get(insertMessage.conversationId || "") || [];
    conversationMessages.push(message);
    this.messages.set(insertMessage.conversationId || "", conversationMessages);
    
    return message;
  }

  async getKnowledgeBase(): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBase.values());
  }

  async createKnowledgeBase(insertKb: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = randomUUID();
    const kb: KnowledgeBase = {
      ...insertKb,
      source: insertKb.source || null,
      embedding: insertKb.embedding || null,
      id,
      createdAt: new Date()
    };
    this.knowledgeBase.set(id, kb);
    return kb;
  }

  async searchKnowledgeBase(query: string): Promise<KnowledgeBase[]> {
    const allKb = Array.from(this.knowledgeBase.values());
    return allKb.filter(kb => 
      kb.question.toLowerCase().includes(query.toLowerCase()) ||
      kb.answer.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = randomUUID();
    const template: Template = {
      ...insertTemplate,
      category: insertTemplate.category || "general",
      id,
      createdAt: new Date()
    };
    this.templates.set(id, template);
    return template;
  }
}

export const storage = new MemStorage();
