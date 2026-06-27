/**
 * Core domain types for the Promo Feature Flag Service.
 * These types define the immutable contract for feature flag evaluation.
 */

export type Operator = "EQUALS" | "IN";

export interface TargetingRule {
  attribute: string;
  operator: Operator;
  values: string[];
}

export interface FeatureFlag {
  id: string;
  key: string;
  isActive: boolean;
  rules: TargetingRule[];
  fallbackValue: boolean;
}

export interface EvaluationContext {
  storeId: string;
  userSegment: string;
  deviceType: string;
}
