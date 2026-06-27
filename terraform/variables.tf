# -----------------------------------------------------------------------------
# Terraform Variables - Promo Feature Flag Service
# -----------------------------------------------------------------------------
# These variables configure the GCP infrastructure for the feature flag service.
# Override values via terraform.tfvars or environment variables (TF_VAR_*).
# -----------------------------------------------------------------------------

variable "gcp_project_id" {
  description = "Google Cloud Platform project ID where resources will be created"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.gcp_project_id))
    error_message = "GCP project ID must be 6-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "region" {
  description = "GCP region for resource deployment"
  type        = string
  default     = "europe-west1"

  validation {
    condition     = can(regex("^[a-z]+-[a-z]+[0-9]*$", var.region))
    error_message = "GCP region must be a valid region format (e.g., europe-west1)."
  }
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "app_name" {
  description = "Application name used as prefix for all resource names"
  type        = string
  default     = "promo-flags"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,60}$", var.app_name))
    error_message = "App name must be 3-63 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "enable_monitoring" {
  description = "Enable Cloud Monitoring and alerting for Pub/Sub resources"
  type        = bool
  default     = true
}

variable "message_retention_days" {
  description = "Number of days to retain messages in Pub/Sub subscriptions"
  type        = number
  default     = 7

  validation {
    condition     = var.message_retention_days >= 1 && var.message_retention_days <= 31
    error_message = "Message retention must be between 1 and 31 days."
  }
}

variable "labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default     = {}
}
