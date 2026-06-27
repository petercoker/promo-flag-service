/**
 * Unit Test Suite - Flag Evaluation Engine.
 * Pure unit tests for the deterministic FlagEvaluator class.
 * No external dependencies - tests only the domain logic.
 */

import { describe, it, expect } from "vitest";
import { FlagEvaluator } from "../src/domain/evaluator.js";
import type { FeatureFlag, EvaluationContext } from "../src/domain/types.js";

describe("FlagEvaluator", () => {
  const evaluator = new FlagEvaluator();

  const createContext = (overrides?: Partial<EvaluationContext>): EvaluationContext => ({
    storeId: "TEST-01",
    userSegment: "standard",
    deviceType: "web",
    ...overrides,
  });

  const createFlag = (overrides?: Partial<FeatureFlag>): FeatureFlag => ({
    id: "test-flag-1",
    key: "test-flag",
    isActive: true,
    rules: [],
    fallbackValue: false,
    ...overrides,
  });

  describe("evaluate()", () => {
    describe("inactive flags", () => {
      it("returns fallbackValue when flag is inactive", () => {
        const flag = createFlag({ isActive: false, fallbackValue: false });
        const context = createContext();

        expect(evaluator.evaluate(flag, context)).toBe(false);
      });

      it("returns true fallbackValue when inactive flag has true fallback", () => {
        const flag = createFlag({ isActive: false, fallbackValue: true });
        const context = createContext();

        expect(evaluator.evaluate(flag, context)).toBe(true);
      });
    });

    describe("flags with no rules", () => {
      it("returns fallbackValue when flag has no rules", () => {
        const flag = createFlag({ isActive: true, rules: [], fallbackValue: false });
        const context = createContext();

        expect(evaluator.evaluate(flag, context)).toBe(false);
      });

      it("returns true fallbackValue when no rules and fallback is true", () => {
        const flag = createFlag({ isActive: true, rules: [], fallbackValue: true });
        const context = createContext();

        expect(evaluator.evaluate(flag, context)).toBe(true);
      });
    });

    describe("EQUALS operator", () => {
      it("returns true when context value equals rule value", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "EQUALS",
              values: ["BCN-01"],
            },
          ],
        });
        const context = createContext({ storeId: "BCN-01" });

        expect(evaluator.evaluate(flag, context)).toBe(true);
      });

      it("returns false when context value does not equal rule value", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "EQUALS",
              values: ["BCN-01"],
            },
          ],
        });
        const context = createContext({ storeId: "MAD-02" });

        expect(evaluator.evaluate(flag, context)).toBe(false);
      });
    });

    describe("IN operator", () => {
      it("returns true when context value is in rule values array", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "IN",
              values: ["BCN-01", "MAD-02", "VAL-03"],
            },
          ],
        });
        const context = createContext({ storeId: "MAD-02" });

        expect(evaluator.evaluate(flag, context)).toBe(true);
      });

      it("returns false when context value is not in rule values array", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "IN",
              values: ["BCN-01", "MAD-02"],
            },
          ],
        });
        const context = createContext({ storeId: "DUB-01" });

        expect(evaluator.evaluate(flag, context)).toBe(false);
      });
    });

    describe("multiple rules (first match wins)", () => {
      it("returns true when first rule matches", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "EQUALS",
              values: ["BCN-01"],
            },
            {
              attribute: "userSegment",
              operator: "EQUALS",
              values: ["premium"],
            },
          ],
        });
        const context = createContext({ storeId: "BCN-01", userSegment: "standard" });

        expect(evaluator.evaluate(flag, context)).toBe(true);
      });

      it("returns true when second rule matches (first does not)", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "EQUALS",
              values: ["MAD-02"],
            },
            {
              attribute: "userSegment",
              operator: "EQUALS",
              values: ["premium"],
            },
          ],
        });
        const context = createContext({ storeId: "BCN-01", userSegment: "premium" });

        expect(evaluator.evaluate(flag, context)).toBe(true);
      });

      it("returns fallbackValue when no rules match", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "EQUALS",
              values: ["MAD-02"],
            },
            {
              attribute: "userSegment",
              operator: "EQUALS",
              values: ["premium"],
            },
          ],
          fallbackValue: false,
        });
        const context = createContext({ storeId: "BCN-01", userSegment: "standard" });

        expect(evaluator.evaluate(flag, context)).toBe(false);
      });
    });

    describe("missing context attributes", () => {
      it("returns fallbackValue when context attribute is missing", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "missingAttribute",
              operator: "EQUALS",
              values: ["value"],
            },
          ],
          fallbackValue: false,
        });
        const context = createContext();

        expect(evaluator.evaluate(flag, context)).toBe(false);
      });
    });

    describe("unknown operator", () => {
      it("returns false for unknown operator", () => {
        const flag = createFlag({
          rules: [
            {
              attribute: "storeId",
              operator: "UNKNOWN_OP" as never,
              values: ["value"],
            },
          ],
          fallbackValue: false,
        });
        const context = createContext({ storeId: "BCN-01" });

        expect(evaluator.evaluate(flag, context)).toBe(false);
      });
    });
  });
});
