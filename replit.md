# Customer Service AI Assistant

## Overview

This is a full-stack customer service AI assistant application built with React, TypeScript, Express, and Drizzle ORM. The application provides AI-powered features for customer service agents including smart compose, smart suggestions, smart replies, conversation summarization, and knowledge base integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 6, 2025)

### Deployment Health Check Fixes
- Added comprehensive health check endpoints for Cloud Run deployment
- Implemented `/api/health` endpoint with service status monitoring
- Added `/api/ready` endpoint for readiness checks
- Added `/api/status` and production root endpoint for basic health verification
- Implemented graceful shutdown handling for production deployments
- Added environment variable validation with warnings for missing secrets
- Enhanced error handling and logging throughout the application
- Fixed routing issues to ensure health endpoints work in both development and production

### Previous Changes (January 30, 2025)
- Fixed layout to create proper two-column design without overlaps
- Conversation app takes full left side of screen with complete functionality
- Chat widget positioned as dedicated right column (320px width, full height)
- Removed floating/overlay positioning to eliminate overlap issues
- Maintained all AI features: Smart Compose, Smart Suggestions, Smart Replies, AI Summary
- Both interfaces work independently with shared message state through React Context

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Custom component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React Context API with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **AI Integration**: OpenAI GPT-4o for natural language processing
- **File Processing**: PDF parsing capabilities for knowledge base ingestion
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Frontend Components
- **Chat Interface**: Main conversation window with real-time messaging
- **AI-Powered Features**:
  - Smart Compose: Auto-completion suggestions as agents type
  - Smart Suggestions: Context-aware response recommendations
  - Smart Replies: Quick reply options based on customer messages
  - AI Summary: Automatic conversation summarization
- **Template System**: Pre-built message templates for common responses
- **Floating Widget**: Customer-facing chat widget with responsive design

### Backend Services
- **OpenAI Service**: Handles all AI-powered features including text generation and intent classification
- **PDF Parser**: Processes PDF documents to extract Q&A pairs for knowledge base
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **API Routes**: RESTful endpoints for conversations, messages, templates, and knowledge base

### Database Schema
- **Users**: Agent authentication and profile management
- **Conversations**: Customer conversation metadata and status tracking
- **Messages**: Individual messages with sender identification and timestamps
- **Knowledge Base**: Q&A pairs with optional embeddings for semantic search
- **Templates**: Reusable message templates categorized by type

## Data Flow

1. **Customer Interaction**: Messages flow through the floating chat widget
2. **Agent Interface**: Agents receive messages in the main conversation window
3. **AI Processing**: User messages trigger AI services for suggestions and replies
4. **Knowledge Base**: AI services query the knowledge base for relevant information
5. **Response Generation**: Agents can use AI suggestions, templates, or compose custom responses
6. **Real-time Updates**: All participants see updates through the React Query cache

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for cloud-hosted database
- **AI Services**: OpenAI API for GPT-4o language model
- **File Processing**: PDF parsing libraries for knowledge base ingestion
- **UI Components**: Radix UI for accessible component primitives

### Development Tools
- **Type Safety**: TypeScript with strict configuration
- **Validation**: Zod schemas for runtime type checking
- **Code Quality**: ESLint and TypeScript compiler checks
- **Build Process**: Vite with esbuild for production optimization

## Deployment Strategy

### Development Environment
- **Development Server**: Vite dev server with HMR for frontend
- **Backend Server**: tsx for TypeScript execution with hot reload
- **Database**: Environment variable configuration for database URL
- **Replit Integration**: Special plugins and configurations for Replit environment

### Production Build
- **Frontend**: Static asset generation with Vite build
- **Backend**: Bundled with esbuild for single executable
- **Database**: Drizzle migrations for schema management
- **Environment**: Node.js production server with static file serving

### Configuration Management
- **Environment Variables**: Database URL, OpenAI API key configuration
- **Build Scripts**: Separate development and production workflows
- **Asset Management**: Tailwind CSS compilation and optimization
- **Type Generation**: Drizzle schema to TypeScript type generation

### Health Check Endpoints (For Cloud Run Deployment)
- **`/api/health`**: Comprehensive health check with service status monitoring
  - Returns HTTP 200 for healthy status, 503 for unhealthy/degraded
  - Includes uptime, environment, and service status information
  - Tests storage connection and OpenAI API key configuration
- **`/api/ready`**: Readiness check for container orchestration
  - Returns HTTP 200 when all dependencies are ready
  - Tests critical services before accepting traffic
- **`/api/status`**: Basic status endpoint for quick health verification
- **`/`** (Production only): Root endpoint for basic deployment verification
  - Only active in production to avoid conflicts with Vite development server

### Required Environment Variables for Production
- **`OPENAI_API_KEY`**: Required for AI-powered features
- **`SESSION_SECRET`**: Required for secure session management
- **`DATABASE_URL`**: PostgreSQL connection string (automatically configured in Replit)
- **`PORT`**: Application port (defaults to 5000, automatically set by deployment platform)

The application is designed for scalability with clear separation of concerns, type safety throughout the stack, and a robust AI integration layer that can be extended with additional language models or services.