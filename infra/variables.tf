variable "environment" {
  description = "Target environment: development, staging, production, disaster-recovery"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production", "disaster-recovery"], var.environment)
    error_message = "environment must be development, staging, production, or disaster-recovery"
  }
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "dr_region" {
  description = "Disaster recovery region"
  type        = string
  default     = "ap-southeast-4"
}

variable "domain_name" {
  description = "Public domain for DNS/CDN (no secrets)"
  type        = string
  default     = "mapable.com.au"
}

variable "instance_count" {
  description = "Application instance count"
  type        = number
  default     = 2
}

variable "enable_pitr" {
  description = "Enable PostgreSQL point-in-time recovery"
  type        = bool
  default     = true
}

variable "enable_object_versioning" {
  description = "Enable S3 object versioning"
  type        = bool
  default     = true
}
