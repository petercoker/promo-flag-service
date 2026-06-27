/**
 * Application Configuration - Default Values.
 * Strongly-typed configuration with environment variable overrides.
 *
 * Usage:
 *   import { config, type Config } from "../config/default.js";
 */

export const config = {
  env: "development",
  port: parseInt(process.env["PORT"] || "4000", 10),
  mongoUri: process.env["MONGO_URI"] || "mongodb://localhost:27017/promo-flags",
  gcpProjectId: process.env["GCP_PROJECT_ID"] || "media-markt-platform-dev",
  pubSubTopic: process.env["PUBSUB_TOPIC"] || "flag-updates",
  logLevel: (process.env["LOG_LEVEL"] as "DEBUG" | "INFO" | "WARN" | "ERROR") || "INFO",
};

export type Config = typeof config;
