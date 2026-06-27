/**
 * Apollo Server Configuration.
 * Instantiates and configures the GraphQL server without opening a network socket.
 * This design enables in-memory integration testing via executeOperation().
 */

import { ApolloServer } from "@apollo/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolvers } from "./graphql/resolvers.js";

// Load schema contract from disk (single source of truth for API)
const typeDefs = readFileSync(
  join(process.cwd(), "src/graphql/schema.graphql"),
  "utf-8",
);

/**
 * ApolloServer instance configured for testing and production use.
 *
 * Note: No network listener is started here. The server is started
 * programmatically in src/index.ts for production, or via executeOperation()
 * for integration tests.
 */
export const server = new ApolloServer({
  typeDefs,
  resolvers,
});
