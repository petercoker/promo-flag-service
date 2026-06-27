/**
 * Custom Domain Errors - Operational Error Mappings.
 * Strongly-typed error classes for feature flag operations.
 *
 * These errors provide clear boundaries for:
 * - API error handling
 * - Monitoring and alerting
 * - Client-facing error messages
 */

/**
 * Base error for all feature flag service exceptions.
 */
export abstract class FlagServiceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(code: string, statusCode: number, message: string) {
    super(message);
    this.name = "FlagServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a plain object for JSON serialization.
   * Useful for API responses and log entries.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      stack: this.stack,
    };
  }
}

/**
 * Thrown when a requested feature flag does not exist.
 * HTTP 404 - Not Found
 */
export class FlagNotFoundError extends FlagServiceError {
  constructor(flagKey: string) {
    super("FLAG_NOT_FOUND", 404, `Feature flag not found: ${flagKey}`);
    this.name = "FlagNotFoundError";
  }
}

/**
 * Thrown when a flag evaluation fails due to invalid input.
 * HTTP 400 - Bad Request
 */
export class InvalidEvaluationContextError extends FlagServiceError {
  constructor(reason: string) {
    super("INVALID_CONTEXT", 400, `Invalid evaluation context: ${reason}`);
    this.name = "InvalidEvaluationContextError";
  }
}

/**
 * Thrown when a mutation operation violates business rules.
 * HTTP 422 - Unprocessable Entity
 */
export class FlagValidationError extends FlagServiceError {
  constructor(reason: string) {
    super("FLAG_VALIDATION_ERROR", 422, `Flag validation failed: ${reason}`);
    this.name = "FlagValidationError";
  }
}

/**
 * Thrown when a repository operation fails.
 * HTTP 500 - Internal Server Error
 */
export class RepositoryError extends FlagServiceError {
  constructor(message: string, public readonly cause?: unknown) {
    super("REPOSITORY_ERROR", 500, `Repository operation failed: ${message}`);
    this.name = "RepositoryError";
  }
}

/**
 * Thrown when a Pub/Sub event publication fails.
 * HTTP 503 - Service Unavailable
 */
export class PubSubError extends FlagServiceError {
  constructor(message: string, public readonly cause?: unknown) {
    super("PUBSUB_ERROR", 503, `Pub/Sub operation failed: ${message}`);
    this.name = "PubSubError";
  }
}

/**
 * Thrown when an unexpected internal error occurs.
 * HTTP 500 - Internal Server Error
 *
 * Use this for truly unexpected errors that indicate a bug.
 */
export class InternalError extends FlagServiceError {
  constructor(message: string, public readonly cause?: unknown) {
    super("INTERNAL_ERROR", 500, `Internal error: ${message}`);
    this.name = "InternalError";
  }
}

/**
 * Type guard to check if an error is a FlagServiceError.
 */
export function isFlagServiceError(error: unknown): error is FlagServiceError {
  return error instanceof FlagServiceError;
}

/**
 * Error handler for GraphQL resolvers.
 * Converts errors to appropriate GraphQL error responses.
 */
export function handleGraphQLError(error: unknown): Error {
  if (isFlagServiceError(error)) {
    return error as Error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, error);
  }

  return new InternalError(String(error));
}
