import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Environment validation for production
function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === "production";
  const missingVars = [];

  if (isProduction) {
    if (!process.env.OPENAI_API_KEY) {
      missingVars.push("OPENAI_API_KEY");
    }
    if (!process.env.SESSION_SECRET) {
      missingVars.push("SESSION_SECRET");
    }
  }

  if (missingVars.length > 0) {
    log(`Warning: Missing environment variables: ${missingVars.join(", ")}`);
    if (isProduction) {
      log("These variables are required for production deployment");
    }
  }

  return { isValid: missingVars.length === 0 || !isProduction, missingVars };
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate environment variables
  const envCheck = validateEnvironment();
  if (!envCheck.isValid) {
    log("Environment validation failed. Some features may not work correctly.");
  }

  const server = await registerRoutes(app);

  // Add root endpoint for deployment health checks (only for production)
  // In development, this will be overridden by Vite's catch-all
  if (process.env.NODE_ENV === "production") {
    app.get("/", (req, res) => {
      res.status(200).json({ 
        message: "Customer Service AI Assistant",
        status: "running",
        version: "1.0.0",
        health: "/api/health"
      });
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error for debugging
    log(`Error ${status}: ${message}`);
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const serverInstance = server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    log(`Received ${signal}. Starting graceful shutdown...`);
    serverInstance.close(() => {
      log('Server closed successfully');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      log('Forcing server close');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

})().catch((error) => {
  log(`Failed to start server: ${error.message}`);
  process.exit(1);
});
