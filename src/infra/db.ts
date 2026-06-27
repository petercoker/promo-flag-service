/**
 * Storage Gateway - Repository Pattern Implementation.
 * In-memory datastore using JavaScript Map for high-fidelity mocking.
 * Decoupled from GraphQL layer via clean interface boundaries.
 */

import type { FeatureFlag } from "../domain/types.js";

/**
 * FlagRepository - Single source of truth for flag persistence.
 * Uses static in-memory Map to simulate database behavior.
 */
export class FlagRepository {
  private static datastore: Map<string, FeatureFlag> = new Map();
  private static isSeeded = false;

  /**
   * Seed the datastore with default mock flags.
   * Idempotent: only seeds once per runtime.
   */
  private static seed(): void {
    if (this.isSeeded) {
      return;
    }

    // Default live flag: Black Friday promotion targeting specific stores
    this.datastore.set("promo-black-friday", {
      id: "flag-001",
      key: "promo-black-friday",
      isActive: true,
      rules: [
        {
          attribute: "storeId",
          operator: "IN",
          values: ["BCN-01", "MAD-02"],
        },
      ],
      fallbackValue: false,
    });

    this.isSeeded = true;
  }

  /**
   * Fetch a feature flag by its unique key.
   * @param key - The flag's unique identifier key
   * @returns Promise resolving to the FeatureFlag or null if not found
   */
  static async findByKey(key: string): Promise<FeatureFlag | null> {
    FlagRepository.seed();
    const flag = FlagRepository.datastore.get(key);
    return flag ?? null;
  }

  /**
   * Update the active status of a feature flag.
   * @param key - The flag's unique identifier key
   * @param isActive - The new active state
   * @returns Promise resolving to the updated FeatureFlag or null if not found
   */
  static async updateStatus(key: string, isActive: boolean): Promise<FeatureFlag | null> {
    FlagRepository.seed();
    const flag = FlagRepository.datastore.get(key);

    if (!flag) {
      return null;
    }

    const updated: FeatureFlag = { ...flag, isActive };
    FlagRepository.datastore.set(key, updated);
    return updated;
  }

  /**
   * Internal test helper: clear the datastore.
   * Used only in test teardown scenarios.
   */
  static clearForTesting(): void {
    this.datastore.clear();
    this.isSeeded = false;
  }
}
