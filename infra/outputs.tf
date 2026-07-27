output "environment" {
  value = var.environment
}

output "primary_region" {
  value = var.primary_region
}

output "application_service_name" {
  value = module.application.service_name
}

output "postgresql_endpoint" {
  value     = module.postgresql.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value     = module.redis.endpoint
  sensitive = true
}

output "object_storage_bucket" {
  value = module.object_storage.bucket_name
}

output "queue_url" {
  value = module.queue.queue_url
}

output "cdn_distribution_id" {
  value = module.cdn.distribution_id
}

output "waf_web_acl_arn" {
  value = module.waf.web_acl_arn
}
