/**
 * Platform Observability - Metrics & Telemetry Layer.
 * Lightweight metrics logger for performance telemetry and system health monitoring.
 */

/**
 * EvaluationResult - Tracks the outcome of flag evaluations.
 * Used by product teams to measure feature adoption and system health.
 */
export interface EvaluationMetric {
  flagKey: string;
  result: boolean;
  timestamp: number;
}

/**
 * PlatformMetrics - Evaluation counter and telemetry collector.
 *
 * In production, this would integrate with:
 * - Prometheus for metrics scraping
 * - Google Cloud Monitoring for dashboards
 * - Grafana for visualization
 */
export class PlatformMetrics {
  private evaluationCounts: Map<string, { total: number; trueCount: number; falseCount: number }> = new Map();

  /**
   * Increment the evaluation counter for a specific flag.
   * Tracks total evaluations and breakdown by result (true/false).
   *
   * @param key - The feature flag key being evaluated
   * @param result - The evaluation result (true = flag matched, false = fallback)
   */
  incrementEvaluationCounter(key: string, result: boolean): void {
    const existing = this.evaluationCounts.get(key) ?? { total: 0, trueCount: 0, falseCount: 0 };

    existing.total++;
    if (result) {
      existing.trueCount++;
    } else {
      existing.falseCount++;
    }

    this.evaluationCounts.set(key, existing);

    // Log metric for observability (in production, this exports to Prometheus)
    console.log(`[Metrics] Flag "${key}" evaluated: ${result ? "MATCH" : "FALLBACK"} (total: ${existing.total})`);
  }

  /**
   * Retrieve current metrics for a specific flag.
   * Useful for debugging and health checks.
   */
  getMetrics(key: string): { total: number; trueCount: number; falseCount: number } | undefined {
    return this.evaluationCounts.get(key);
  }

  /**
   * Export all metrics in a format suitable for Prometheus scraping.
   */
  exportMetrics(): string {
    const lines: string[] = [];

    for (const [key, counts] of this.evaluationCounts.entries()) {
      lines.push(`# HELP promo_flag_evaluations_total Total flag evaluations`);
      lines.push(`# TYPE promo_flag_evaluations_total counter`);
      lines.push(`promo_flag_evaluations_total{flag="${key}",result="true"} ${counts.trueCount}`);
      lines.push(`promo_flag_evaluations_total{flag="${key}",result="false"} ${counts.falseCount}`);
    }

    return lines.join("\n");
  }

  /**
   * Reset all metrics. Used only in test teardown.
   */
  reset(): void {
    this.evaluationCounts.clear();
  }
}

/**
 * Singleton instance for application-wide metrics collection.
 */
export const platformMetrics = new PlatformMetrics();
