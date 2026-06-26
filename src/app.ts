import { ApolloServer } from "@apollo/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load our schema contract from disk natively
const typeDefs = readFileSync(
  join(process.cwd(), "src/graphql/schema.graphql"),
  "utf-8",
);

// Temporary structural resolvers to satisfy our compiler contract today
const resolvers = {
  Query: {
    evaluateFlag: () => true,
    getFlagDetails: () => null,
  },
  Mutation: {
    toggleFlag: () => ({
      id: "mock-1",
      key: "mock-flag",
      isActive: true,
      rules: [],
      fallbackValue: false,
    }),
  },
};

export const server = new ApolloServer({
  typeDefs,
  resolvers,
});
