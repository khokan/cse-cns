/**
 * Centralized logging utility
 * Handles console logging and API-based file persistence
 */

export interface LogContext {
  [key: string]: unknown;
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isBrowser = typeof window !== "undefined";

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    console.log(`[INFO] ${message}`, context || "");
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || "");
  }

  /**
   * Log error message and persist to server
   */
  async error(message: string, context?: LogContext): Promise<void> {
    // Avoid browser console.error to prevent noisy Next.js console error overlays.
    if (!this.isBrowser && this.isDevelopment) {
      console.error(`[ERROR] ${message}`, context || "");
    }

    // Persist error to server for file logging
    await this.persistLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
    });
  }

  /**
   * Persist log entry to server
   */
  private async persistLog(logEntry: LogEntry): Promise<void> {
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntry),
        keepalive: true,
      });

      if (!response.ok) {
        return;
      }
    } catch (error) {
      // Silently fail to avoid surfacing logging transport errors in browser.
      void error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();
