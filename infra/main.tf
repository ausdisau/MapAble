# CareOS National Platform — root module
# OpenTofu/Terraform compatible HCL. No committed secrets.

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.primary_region
}

locals {
  common_tags = {
    Project     = "careos"
    Environment = var.environment
    ManagedBy   = "opentofu"
  }
}

module "application" {
  source      = "./modules/application"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}

module "postgresql" {
  source      = "./modules/postgresql"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}

module "redis" {
  source      = "./modules/redis"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}

module "object_storage" {
  source      = "./modules/object-storage"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}

module "queue" {
  source      = "./modules/queue"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}

module "secrets" {
  source      = "./modules/secrets"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}

module "monitoring" {
  source      = "./modules/monitoring"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}

module "dns" {
  source      = "./modules/dns"
  environment = var.environment
  domain_name = var.domain_name
  tags        = local.common_tags
}

module "cdn" {
  source      = "./modules/cdn"
  environment = var.environment
  domain_name = var.domain_name
  tags        = local.common_tags
}

module "waf" {
  source      = "./modules/waf"
  environment = var.environment
  tags        = local.common_tags
}

module "backups" {
  source      = "./modules/backups"
  environment = var.environment
  region      = var.primary_region
  tags        = local.common_tags
}
