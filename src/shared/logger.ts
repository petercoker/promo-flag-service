/**
 * Structured JSON Logger - Platform Observability Layer.
 * Production-ready logging interface for cloud-native log streaming.
 *
 * Outputs JSON-formatted logs compatible with:
 * - Google Cloud Logging (Stackdriver)
 * - Datadog
 * - Splunk
 * - ELK Stack
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

/**
 * StructuredLogger - Emits JSON logs for cloud streaming.
 *
 * Each log entry is a single JSON object on stdout/stderr,
 * enabling structured parsing by log aggregation systems.
 */
export class StructuredLogger {
  private readonly service: string;
  private readonly environment: string;
  private readonly minLevel: LogLevel;

  private static readonly LEVEL_ORDER: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  constructor(options: {
    service: string;
    environment: string;
    minLevel?: LogLevel;
  }) {
    this.service = options.service;
    this.environment = options.environment;
    this.minLevel = options.minLevel ?? "INFO";
  }

  /**
   * Log a structured message at the specified level.
   * Outputs a single-line JSON object for log aggregation.
   */
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (StructuredLogger.LEVEL_ORDER[level] < StructuredLogger.LEVEL_ORDER[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      environment: this.environment,
      ...metadata,
    };

    // Single-line JSON output for log aggregation
    const output = JSON.stringify(entry);

    // Route to appropriate stream based on level
    if (level === "ERROR" || level === "WARN") {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("DEBUG", message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("INFO", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("WARN", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("ERROR", message, metadata);
  }

  /**
   * Log an error with full stack trace.
   */
  errorWithStack(error: Error, message?: string): void {
    this.log("ERROR", message ?? error.message, {
      stack: error.stack,
      name: error.name,
    });
  }
}

/**
 * Default logger instance for application-wide use.
 * Configured via environment variables.
 */
export const logger = new StructuredLogger({
  service: "promo-flag-service",
  environment: process.env["NODE_ENV"] ?? "development",
  minLevel: (process.env["LOG_LEVEL"] as LogLevel) ?? "INFO",
});
