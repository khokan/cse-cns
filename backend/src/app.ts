import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { envVars } from "./app/config/env.js";
import qs from "qs";
import { auth } from "./app/lib/auth.js";
import cookieParser from "cookie-parser";
import { IndexRoutes } from "./app/routes/index.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import { correlationIdMiddleware } from "./app/middleware/correlationId.js";
import { requestLogger } from "./app/utils/logger.js";
import Sentry, { captureException } from "./app/lib/sentry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const app: Application = express();


// CORS - Allow everything in development
// app.use(cors({
//   origin: true,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// Correlation ID middleware
app.use(correlationIdMiddleware);
// Request logging middleware
app.use(requestLogger);

app.use(
  cors({
    origin: [envVars.FRONTEND_URL || "http://localhost:3000", envVars.BETTER_AUTH_URL || "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Enable URL-encoded form data, JSON, and cookie parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Better Auth handler
app.use("/api/auth", toNodeHandler(auth));

// Serve generated report files as static (dev convenience)
// Files are under: <backend>/uploads/reports/<userId>/<jobId>.<ext>
app.use(
    "/uploads",
    express.static(path.resolve(__dirname, "..", "uploads"))
);

// Application v1 API routes (/api/v1/auth/login, etc.)
app.use("/api/v1", IndexRoutes);

// Basic health check route
app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "CSE-CNS Backend is working",
  });
});

app.get("/debug/sentry", (_req, res) => {
  const error = new Error("Sentry debug route");
  captureException(error);
  res.json({ success: true, message: "Sentry event sent (if DSN configured)" });
});

// Global error handler & 404 handler
app.use(globalErrorHandler);
app.use(notFound);

export default app;