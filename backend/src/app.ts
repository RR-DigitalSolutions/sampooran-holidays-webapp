import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Secure HTTP headers
app.use(helmet());

// ── Health check BEFORE rate limiter ──────────────────────────────────
// Render pings /api/healthz every ~5 seconds.  With 150 req / 15 min
// the health check alone (180 calls) would exceed the quota, returning
// 429 and causing Render to think the service is down → restart loop.
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// Apply rate limiting to all OTHER requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks (belt-and-suspenders)
  skip: (req) => req.path === "/api/healthz",
});
app.use(limiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
