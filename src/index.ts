/**
 * Server Lifecycle Bootstrapping - Main Entry Point.
 * Initializes the Promo Feature Flag Service and starts the GraphQL server.
 *
 * Uses Apollo Server 5.x standalone HTTP server for simplicity.
 */

import { server } from "./app.js";
import { config } from "../config/default.js";
import { FlagRepository } from "./infra/db.js";

/**
 * Bootstrap the application lifecycle.
 *
 * Responsibilities:
 * 1. Initialize the repository layer (seeds default flags)
 * 2. Start the Apollo GraphQL server
 * 3. Begin listening for incoming requests
 * 4. Log operational status
 */
async function bootstrap(): Promise<void> {
  try {
    // Initialize repository (seeds default flags)
    await FlagRepository.findByKey("promo-black-friday");
    console.log("[Bootstrap] Repository initialized with default flags");

    // Create standalone HTTP server using Apollo's built-in handler
    // Note: startStandaloneServer handles server.start() internally
    const { startStandaloneServer } = await import("@apollo/server/standalone");

    const { url } = await startStandaloneServer(server, {
      listen: { port: config.port },
    });

    console.log(`[Bootstrap] Server listening on port ${config.port}`);
    console.log(`[Bootstrap] Environment: ${config.env}`);
    console.log(`[Bootstrap] GraphQL endpoint: ${url}`);

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`[Bootstrap] Received ${signal}, shutting down gracefully...`);
      await server.stop();
      console.log("[Bootstrap] Server stopped");
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

  } catch (error) {
    console.error("[Bootstrap] Failed to start server:", error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
