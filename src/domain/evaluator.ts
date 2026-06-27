/**
 * Stateless flag evaluation engine.
 * Pure function: same input always produces same output.
 * No side effects, no external dependencies.
 */

import type { FeatureFlag, EvaluationContext, TargetingRule } from "./types.js";

export class FlagEvaluator {
  /**
   * Evaluates a feature flag against the provided context.
   * Returns the fallbackValue if the flag is inactive or no rules match.
   */
  evaluate(flag: FeatureFlag, context: EvaluationContext): boolean {
    // Fail-secure: inactive flags always return fallback
    if (!flag.isActive) {
      return flag.fallbackValue;
    }

    // No rules means fallback value
    if (flag.rules.length === 0) {
      return flag.fallbackValue;
    }

    // Evaluate rules in order - first match wins
    for (const rule of flag.rules) {
      if (this.matchesRule(rule, context)) {
        return true;
      }
    }

    // No rules matched
    return flag.fallbackValue;
  }

  private matchesRule(rule: TargetingRule, context: EvaluationContext): boolean {
    const contextValue = (context as unknown as Record<string, string>)[rule.attribute];

    if (!contextValue) {
      return false;
    }

    switch (rule.operator) {
      case "EQUALS":
        return contextValue === rule.values[0];
      case "IN":
        return rule.values.includes(contextValue);
      default:
        return false;
    }
  }
}
