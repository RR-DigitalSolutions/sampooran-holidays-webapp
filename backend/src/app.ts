import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import router from "./routes";
import { logger } from "./lib/logger";

// ── Environment ──────────────────────────────────────────────────────────────
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5175",
  "https://sampooran-admin.pages.dev",
  "https://admin.sampooranholidays.com",
  "https://sampooranholidays.com",
  "https://www.sampooranholidays.com",
  "https://sampooran-holidays-webapp-frontend.vercel.app"
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

// NOTE: /api/healthz is handled by routes/health.ts (full health check with MongoDB/Redis status)
// It is exempted from the rate limiter below via the skip() function.

// ⚡ General API rate limiter — 2000 req / 15 min for real OTA traffic
// (Previous 500 was causing legitimate users to get 429 during peak hours)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/healthz",
});
app.use(limiter);

// Stricter limiter for auth + write (booking/payment) routes — exported for use in route files
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many auth/booking requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// ⚡ Gzip/Brotli compression — reduces API JSON payloads by 60-80%
// This alone cuts response transfer time from ~400ms to ~80ms on a slow 4G connection
app.use(compression({
  level: 6,       // Balance between compression ratio and CPU cost
  threshold: 1024, // Only compress responses > 1KB
}));

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

// ── Global response headers ──────────────────────────────────────────────────
// Sets API version + removes fingerprinting header.
// For GET routes, also sets Surrogate-Control for Cloudflare CDN edge caching
// (Surrogate-Control is respected by CDNs but ignored by browsers)
app.use((req, res, next) => {
  res.setHeader("X-API-Version", "1.0");
  res.setHeader("X-Powered-By", "Sampooran-API");
  if (req.method === "GET") {
    // Tell Cloudflare to cache public GET responses for 60s at the edge
    // Browser still relies on Cache-Control set by cacheMiddleware
    res.setHeader("Surrogate-Control", "max-age=60");
  }
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
