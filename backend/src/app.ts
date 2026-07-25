import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import path from "path";
import cors from "cors";
import { envVars } from "./app/config/env";
import qs from "qs";
import { auth } from "./app/lib/auth";
import cookieParser from "cookie-parser";
import { IndexRoutes } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";

const app: Application = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Enable URL-encoded form data, JSON, and cookie parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Better Auth handler
app.use("/api/auth", toNodeHandler(auth));

// Application v1 API routes (/api/v1/auth/login, etc.)
app.use("/api/v1", IndexRoutes);

// Basic health check route
app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "CSE-CNS Backend is working",
  });
});

// Global error handler & 404 handler
app.use(globalErrorHandler);
app.use(notFound);

export default app;