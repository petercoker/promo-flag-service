/**
 * API Integration Test Suite - Feature Flag Service.
 * Tests GraphQL operations end-to-end using Apollo Server's inline executor.
 * High-fidelity scenarios validating repository, evaluator, metrics, and pubsub integration.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { server } from "../src/app.js";
import { FlagRepository } from "../src/infra/db.js";
import { pubSubClient } from "../src/infra/pubsub.js";
import { platformMetrics } from "../src/infra/metrics.js";

/**
 * Extract GraphQL data from Apollo Server executeOperation result.
 * Apollo Server 5.x wraps results in body.singleResult structure.
 */
function extractData<T>(result: unknown): T | null {
  const any = result as Record<string, unknown>;
  const body = any.body as Record<string, unknown> | undefined;
  const singleResult = body?.singleResult as Record<string, unknown> | undefined;
  return (singleResult?.data as T) ?? null;
}

/**
 * Extract errors from Apollo Server executeOperation result.
 */
function extractErrors(result: unknown): readonly any[] | undefined {
  const any = result as Record<string, unknown>;
  const body = any.body as Record<string, unknown> | undefined;
  const singleResult = body?.singleResult as Record<string, unknown> | undefined;
  return singleResult?.errors as readonly any[] | undefined;
}

describe("Feature Flag API Integration", () => {
  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    FlagRepository.clearForTesting();
    platformMetrics.reset();
  });

  describe("evaluateFlag query", () => {
    it("returns true when context matches targeting rules", async () => {
      const query = `
        query EvaluateFlag($key: String!, $storeId: String!, $userSegment: String!, $deviceType: String!) {
          evaluateFlag(key: $key, storeId: $storeId, userSegment: $userSegment, deviceType: $deviceType)
        }
      `;

      // Store BCN-01 is in the targeting list
      const result = await server.executeOperation({
        query,
        variables: {
          key: "promo-black-friday",
          storeId: "BCN-01",
          userSegment: "premium",
          deviceType: "mobile",
        },
      });

      expect(extractErrors(result)).toBeUndefined();
      expect(extractData<{ evaluateFlag: boolean }>(result)?.evaluateFlag).toBe(true);
    });

    it("returns false when context does not match targeting rules", async () => {
      const query = `
        query EvaluateFlag($key: String!, $storeId: String!, $userSegment: String!, $deviceType: String!) {
          evaluateFlag(key: $key, storeId: $storeId, userSegment: $userSegment, deviceType: $deviceType)
        }
      `;

      // Store DUB-01 is NOT in the targeting list
      const result = await server.executeOperation({
        query,
        variables: {
          key: "promo-black-friday",
          storeId: "DUB-01",
          userSegment: "premium",
          deviceType: "mobile",
        },
      });

      expect(extractErrors(result)).toBeUndefined();
      expect(extractData<{ evaluateFlag: boolean }>(result)?.evaluateFlag).toBe(false);
    });

    it("increments metrics counter on each evaluation", async () => {
      const query = `
        query EvaluateFlag($key: String!, $storeId: String!, $userSegment: String!, $deviceType: String!) {
          evaluateFlag(key: $key, storeId: $storeId, userSegment: $userSegment, deviceType: $deviceType)
        }
      `;

      // Reset metrics for clean test
      platformMetrics.reset();

      await server.executeOperation({
        query,
        variables: {
          key: "promo-black-friday",
          storeId: "BCN-01",
          userSegment: "premium",
          deviceType: "mobile",
        },
      });

      const metrics = platformMetrics.getMetrics("promo-black-friday");
      expect(metrics?.total).toBe(1);
      expect(metrics?.trueCount).toBe(1);
    });
  });

  describe("toggleFlag mutation", () => {
    it("updates flag status and publishes cache invalidation event", async () => {
      // Spy on the pubsub client to verify event publication
      const publishSpy = vi.spyOn(pubSubClient, "publish").mockResolvedValue(undefined);

      const mutation = `
        mutation ToggleFlag($key: String!, $isActive: Boolean!) {
          toggleFlag(key: $key, isActive: $isActive) {
            id
            key
            isActive
          }
        }
      `;

      const result = await server.executeOperation({
        query: mutation,
        variables: {
          key: "promo-black-friday",
          isActive: false,
        },
      });

      expect(extractErrors(result)).toBeUndefined();
      const data = extractData<{ toggleFlag: { key: string; isActive: boolean } }>(result);
      expect(data?.toggleFlag.isActive).toBe(false);

      // Verify the cache invalidation event was published
      expect(publishSpy).toHaveBeenCalledTimes(1);
      expect(publishSpy).toHaveBeenCalledWith({
        eventType: "FLAG_UPDATED",
        flagKey: "promo-black-friday",
        isActive: false,
        timestamp: expect.any(String),
      });

      // Cleanup spy
      publishSpy.mockRestore();
    });

    it("throws error when toggling non-existent flag", async () => {
      const mutation = `
        mutation ToggleFlag($key: String!, $isActive: Boolean!) {
          toggleFlag(key: $key, isActive: $isActive) {
            id
            key
            isActive
          }
        }
      `;

      const result = await server.executeOperation({
        query: mutation,
        variables: {
          key: "non-existent-flag",
          isActive: true,
        },
      });

      const errors = extractErrors(result);
      expect(errors).toBeDefined();
      expect(errors?.[0]?.message).toContain("Flag not found");
    });
  });
});
