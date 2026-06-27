# Terraform Infrastructure Definition - Google Cloud Platform
# Promo Feature Flag Service - Production Resources
#
# This manifest defines the cloud infrastructure for the feature flag service,
# including Pub/Sub topics for cache invalidation and downstream consumer subscriptions.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    # Backend configuration for remote state storage
    # bucket = "promo-flag-service-tfstate"
    # prefix = "terraform/state"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

# -----------------------------------------------------------------------------
# Pub/Sub Topic - Flag Invalidation Channel
# -----------------------------------------------------------------------------
# This topic serves as the central event bus for flag state changes.
# When a flag is toggled, an event is published here to notify all
# downstream consumers (CDN edge workers, mobile gateways, etc.)
# to invalidate their local caches.

resource "google_pubsub_topic" "flag_updates" {
  name = "${var.app_name}-${var.environment}-flag-updates"

  labels = merge(var.labels, {
    environment = var.environment
    application = var.app_name
    managed_by  = "terraform"
  })

  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

# -----------------------------------------------------------------------------
# Pub/Sub Subscription - Downstream Cache Listener
# -----------------------------------------------------------------------------
# Example subscription representing a downstream consumer that listens
# for flag updates to invalidate local caches. In production, multiple
# subscriptions would exist for different consumer groups:
# - CDN edge cache invalidation
# - Mobile app gateway cache refresh
# - Analytics event streaming

resource "google_pubsub_subscription" "store_app_cache_listener" {
  name  = "${var.app_name}-${var.environment}-store-cache-listener"
  topic = google_pubsub_topic.flag_updates.name

  labels = merge(var.labels, {
    environment = var.environment
    application = "store-app"
    managed_by  = "terraform"
  })

  # Message retention: configured via variable (default 7 days)
  message_retention_duration = "${var.message_retention_days * 86400}s"

  # Acknowledgement deadline: 30 seconds
  ack_deadline_seconds = 30

  # Enable exactly-once delivery for reliable cache invalidation
  enable_exactly_once_delivery = var.environment == "prod"

  # Dead letter policy for failed deliveries
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.flag_updates_dead_letter.id
    max_delivery_attempts = 5
  }

  # Retry policy for transient failures
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

# -----------------------------------------------------------------------------
# Dead Letter Topic - Failed Message Handling
# -----------------------------------------------------------------------------
# Messages that fail to process after max delivery attempts are routed
# here for manual inspection and replay. This ensures no cache invalidation
# events are silently dropped.

resource "google_pubsub_topic" "flag_updates_dead_letter" {
  name = "${var.app_name}-${var.environment}-flag-updates-dlq"

  labels = merge(var.labels, {
    environment = var.environment
    application = var.app_name
    purpose     = "dead-letter-queue"
    managed_by  = "terraform"
  })
}

# -----------------------------------------------------------------------------
# Cloud Monitoring Alert Policy - Pub/Sub Backlog
# -----------------------------------------------------------------------------
# Alerts when message backlog exceeds threshold, indicating consumers
# are not keeping up with cache invalidation events.

resource "google_monitoring_alert_policy" "pubsub_backlog" {
  count        = var.enable_monitoring ? 1 : 0
  display_name = "${var.app_name}-${var.environment} - Pub/Sub Backlog Alert"
  combiner     = "OR"

  conditions {
    display_name = "Pub/Sub Unacknowledged Message Count"
    condition_threshold {
      filter          = "resource.type=\"pubsub_topic\" AND resource.labels.topic_id=\"${google_pubsub_topic.flag_updates.name}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1000
      duration        = "300s"
    }
  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }
  }

  documentation {
    content = "Pub/Sub topic ${google_pubsub_topic.flag_updates.name} has accumulated unacknowledged messages. Check downstream cache invalidation consumers."
  }
}

# -----------------------------------------------------------------------------
# Outputs - Resource References
# -----------------------------------------------------------------------------

output "pubsub_topic_id" {
  description = "The ID of the Pub/Sub topic for flag updates"
  value       = google_pubsub_topic.flag_updates.id
}

output "pubsub_topic_name" {
  description = "The name of the Pub/Sub topic for flag updates"
  value       = google_pubsub_topic.flag_updates.name
}

output "store_cache_subscription_id" {
  description = "The ID of the store app cache listener subscription"
  value       = google_pubsub_subscription.store_app_cache_listener.id
}

output "dead_letter_topic_id" {
  description = "The ID of the dead letter topic"
  value       = google_pubsub_topic.flag_updates_dead_letter.id
}

output "pubsub_topic_resource_name" {
  description = "Full resource name of the Pub/Sub topic for use in publisher clients"
  value       = google_pubsub_topic.flag_updates.name
}
