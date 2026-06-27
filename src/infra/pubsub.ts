/**
 * Event-Driven Pub/Sub Layer - Platform Event Publisher.
 * Decoupled event broadcasting for cache invalidation across distributed systems.
 */

/**
 * Event payload published when a flag's state changes.
 * Downstream consumers use this to invalidate local caches.
 */
export interface FlagUpdatedEvent {
  eventType: "FLAG_UPDATED";
  flagKey: string;
  isActive: boolean;
  timestamp: string;
}

/**
 * PubSubClient - Platform event publisher for flag state changes.
 *
 * In production, this would integrate with Google Cloud Pub/Sub or similar.
 * For now, it logs events to demonstrate the decoupled mechanics.
 *
 * Architecture Note: This event pattern allows downstream microservices
 * (e.g., storefront CDN edge workers, mobile app gateways) to instantly
 * invalidate their local flag caches without polling. This guarantees
 * sub-millisecond evaluation times across all storefront systems while
 * maintaining eventual consistency.
 */
export class PubSubClient {
  private readonly topicName: string;

  constructor(topicName: string = "flag-updates") {
    this.topicName = topicName;
  }

  /**
   * Publish a flag update event to all subscribed consumers.
   * In production, this serializes and sends to GCP Pub/Sub.
   *
   * @param event - The flag update event payload
   */
  async publish(event: FlagUpdatedEvent): Promise<void> {
    // Simulate async network call to Pub/Sub broker
    await this.simulateNetworkLatency();

    // Log the event payload to show decoupled mechanics
    // In production: await this.publisher.publishMessage({ data: Buffer.from(JSON.stringify(event)) });
    console.log(`[PubSub:${this.topicName}] Event published:`, JSON.stringify(event, null, 2));
  }

  private async simulateNetworkLatency(): Promise<void> {
    // Simulate minimal network latency for realistic async behavior
    return new Promise((resolve) => setTimeout(resolve, 1));
  }
}

/**
 * Singleton instance for application-wide use.
 * Configured via environment variables in production.
 */
export const pubSubClient = new PubSubClient();
