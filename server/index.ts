import "dotenv/config";
import cors from "cors"; // Import CORS
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes"; // this now registers auth + onboarding
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";



const app = express();
const httpServer = createServer(app);
const MemoryStoreSession = MemoryStore(session);


app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // true allows all origins, or set specific origin(s)
  credentials: true, // Allow cookies/sessions to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());


// session middleware (your existing setup)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-session-secret-do-not-use-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({ checkPeriod: 86400000 }),
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));

// body parsers
app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: false }));

// static assets
const assetsPath = path.resolve(process.cwd(), "attached_assets");
app.use("/assets", express.static(assetsPath));

// logging middleware (your existing setup)
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      console.log(logLine);
    }
  });
  next();
});

(async () => {
  // 🔗 Register auth + onboarding routes
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  await registerRoutes(httpServer, app);

  // error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // vite or production static serve
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // listen
  const port = parseInt(process.env.PORT || "3003", 10);
  httpServer.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port}`));
})();
