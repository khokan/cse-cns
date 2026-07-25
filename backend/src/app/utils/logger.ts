import { envVars } from "../config/env";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogPayload {
  message: string;
  level?: LogLevel;
  meta?: Record<string, unknown>;
  error?: unknown;
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>, error?: unknown) {
    const timestamp = new Date().toISOString();
    
    if (envVars.NODE_ENV === "production") {
      // Structured JSON logging for aggregators (Datadog, CloudWatch, ELK)
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...(meta ? { meta } : {}),
        ...(error instanceof Error ? { error: { message: error.message, stack: error.stack } } : error ? { error } : {}),
      });
    }

    // Human-readable dev output
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return { prefix, message, meta, error };
  }

  info(message: string, meta?: Record<string, unknown>) {
    const formatted = this.formatLog("info", message, meta);
    if (typeof formatted === "string") {
      console.log(formatted);
    } else {
      console.log(`${formatted.prefix} ${formatted.message}`, meta || "");
    }
  }

  warn(message: string, meta?: Record<string, unknown>) {
    const formatted = this.formatLog("warn", message, meta);
    if (typeof formatted === "string") {
      console.warn(formatted);
    } else {
      console.warn(`${formatted.prefix} ${formatted.message}`, meta || "");
    }
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const formatted = this.formatLog("error", message, meta, error);
    if (typeof formatted === "string") {
      console.error(formatted);
    } else {
      console.error(`${formatted.prefix} ${formatted.message}`, error || "", meta || "");
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (envVars.NODE_ENV === "development") {
      const formatted = this.formatLog("debug", message, meta);
      if (typeof formatted === "string") {
        console.debug(formatted);
      } else {
        console.debug(`${formatted.prefix} ${formatted.message}`, meta || "");
      }
    }
  }
}

export const logger = new Logger();
