import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

// ── Environment ──────────────────────────────────────────────────────────────
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5175",
  "https://sampooran-admin.pages.dev",
  "https://sampooranholidays.com",
  "https://www.sampooranholidays.com"
];

const userOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...userOrigins]));

const isDev = process.env.NODE_ENV !== "production";

const app: Express = express();

// ── Trust proxy (for correct IP behind Render/Nginx/Cloudflare) ───────────────
app.set("trust proxy", 1);

// ── Secure HTTP headers (Helmet) ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // tighten after audit
      imgSrc: ["'self'", "data:", "https:", "*.cloudinary.com", "*.unsplash.com", "*.neon.tech"],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
      upgradeInsecureRequests: isDev ? null : [],
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for Cloudinary images
}));

// ── Health check BEFORE rate limiter ──────────────────────────────────
// Render pings /api/healthz every ~5 seconds.  With 150 req / 15 min
// the health check alone (180 calls) would exceed the quota, returning
// 429 and causing Render to think the service is down → restart loop.
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ── General API rate limiter ──────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/healthz",
});
app.use(limiter);

// ── CORS (restricted to allowed origins) ─────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests (no origin header) and health probes
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (isDev) return callback(null, true); // Permissive in dev only
    
    logger.warn({ origin, allowedOrigins: ALLOWED_ORIGINS }, "CORS request rejected: Origin not allowed");
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ── API version header ────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-API-Version", "1.0");
  res.setHeader("X-Powered-By", "Sampooran-API"); // Override Express default
  next();
});

app.use("/api", router);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error({ 
    err: err.message, 
    stack: err.stack,
    method: req.method,
    url: req.url 
  }, "Unhandled request error");
  
  res.status(err.status || 500).json({ 
    error: err.message || "Internal Server Error" 
  });
});

export default app;
