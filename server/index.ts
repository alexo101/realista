import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { runMigrations } from 'stripe-replit-sync';
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initEmailService } from "./emailService";
import { getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";

const app = express();

// CRITICAL: Stripe webhook route MUST be registered BEFORE express.json()
// This ensures the raw body is available for signature verification
app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Now apply JSON middleware for all other routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session configuration with PostgreSQL store
const PgSession = connectPgSimple(session);

// Detect production environment
const isProduction = process.env.NODE_ENV === 'production' || 
                     (process.env.REPL_SLUG !== undefined && !process.env.REPLIT_DEV_DOMAIN);

// Trust the reverse proxy in production (required for secure cookies behind HTTPS termination)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Session secret: required in production, has development-only fallback
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? '' : 'realista-dev-session-secret');
if (!sessionSecret) {
  throw new Error('FATAL: SESSION_SECRET environment variable is required in production. Please set it in your production secrets.');
}

app.use(session({
  store: new PgSession({
    pool: pool as any,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: isProduction, // Trust the reverse proxy in production
  cookie: {
    secure: isProduction, // Require HTTPS in production
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax', // Strict in production for CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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
  try {
    // Inicializar el servicio de email
    await initEmailService();

    // Initialize Stripe schema and sync data
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      try {
        console.log('Initializing Stripe schema...');
        await runMigrations({ 
          databaseUrl,
          schema: 'stripe'
        });
        console.log('Stripe schema ready');

        // Get StripeSync instance and set up managed webhook
        const stripeSync = await getStripeSync();
        
        console.log('Setting up managed webhook...');
        // Use PUBLIC_BASE_URL for production, fall back to REPLIT_DOMAINS for development
        const baseUrl = process.env.PUBLIC_BASE_URL || 
                       (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : null);
        
        if (!baseUrl) {
          console.warn('WARNING: Neither PUBLIC_BASE_URL nor REPLIT_DOMAINS is set. Stripe webhooks will not work.');
        } else {
          const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
            `${baseUrl}/api/stripe/webhook`,
            {
              enabled_events: ['*'],
              description: 'Realista subscription webhook',
            }
          );
          console.log(`Stripe webhook configured: ${webhook.url} (UUID: ${uuid})`);
        }

        // Sync all existing Stripe data in the background
        stripeSync.syncBackfill()
          .then(async () => {
            console.log('Stripe data synced');
            const { stripeService } = await import('./stripeService');
            await stripeService.syncProductDescriptions();
          })
          .catch((err: any) => console.error('Error syncing Stripe data:', err));
      } catch (stripeError) {
        console.error('Warning: Could not initialize Stripe:', stripeError);
        // Continue without Stripe - free features will still work
      }
    } else {
      console.log('DATABASE_URL not set - Stripe integration disabled');
    }

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Server error:', err);
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

    const port = parseInt(process.env.PORT || "5000");
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });

    // Handle graceful shutdown  
    process.on('SIGINT', () => {
      console.log('Server shutting down gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();