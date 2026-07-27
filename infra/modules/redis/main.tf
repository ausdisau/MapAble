variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_elasticache_replication_group" "careos" {
  replication_group_id       = "careos-redis-${var.environment}"
  description                = "CareOS cache ${var.environment}"
  node_type                  = var.environment == "production" ? "cache.r6g.large" : "cache.t4g.micro"
  num_cache_clusters         = var.environment == "production" ? 2 : 1
  automatic_failover_enabled = var.environment == "production"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = merge(var.tags, { Component = "redis" })
}

output "endpoint" {
  value = aws_elasticache_replication_group.careos.primary_endpoint_address
}
