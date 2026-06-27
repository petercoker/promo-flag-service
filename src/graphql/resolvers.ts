/**
 * Orchestration Resolvers - GraphQL to Domain Layer Bridge.
 * Wires GraphQL operations to repository, evaluator, metrics, and pubsub components.
 * Enforces strict type boundaries, fail-secure defaults, and full observability.
 */

import { FlagRepository } from "../infra/db.js";
import { FlagEvaluator } from "../domain/evaluator.js";
import { pubSubClient } from "../infra/pubsub.js";
import { platformMetrics } from "../infra/metrics.js";
import type { EvaluationContext, FeatureFlag } from "../domain/types.js";

const flagEvaluator = new FlagEvaluator();

export const resolvers = {
  Query: {
    /**
     * Evaluate a feature flag for the given context.
     *
     * Flow:
     * 1. Fetch flag from repository
     * 2. Evaluate against context using domain engine
     * 3. Increment metrics counter for observability
     * 4. Return boolean result
     *
     * Fail-secure: missing flags evaluate to false
     */
    evaluateFlag: async (
      _: unknown,
      args: { key: string; context: EvaluationContext },
    ): Promise<boolean> => {
      const flag = await FlagRepository.findByKey(args.key);

      // Fail-secure: missing flags evaluate to false
      if (!flag) {
        platformMetrics.incrementEvaluationCounter(args.key, false);
        return false;
      }

      // Pass context directly from input object
      const result = flagEvaluator.evaluate(flag, args.context);

      // Increment metrics for observability
      platformMetrics.incrementEvaluationCounter(args.key, result);

      return result;
    },

    /**
     * Fetch full flag details by key.
     */
    getFlagDetails: async (_: unknown, args: { key: string }): Promise<FeatureFlag | null> => {
      return FlagRepository.findByKey(args.key);
    },
  },

  Mutation: {
    /**
     * Toggle a flag's active state.
     *
     * Flow:
     * 1. Update flag status in repository
     * 2. Publish cache invalidation event via Pub/Sub
     * 3. Return updated flag entity
     *
     * The published event triggers downstream cache invalidation
     * across all storefront systems for sub-millisecond consistency.
     */
    toggleFlag: async (
      _: unknown,
      args: { key: string; isActive: boolean },
    ): Promise<FeatureFlag> => {
      const updated = await FlagRepository.updateStatus(args.key, args.isActive);

      if (!updated) {
        throw new Error(`Flag not found: ${args.key}`);
      }

      // Publish cache invalidation event to downstream consumers
      await pubSubClient.publish({
        eventType: "FLAG_UPDATED",
        flagKey: updated.key,
        isActive: updated.isActive,
        timestamp: new Date().toISOString(),
      });

      return updated;
    },
  },
};
