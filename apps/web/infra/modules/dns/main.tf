variable "environment" { type = string }
variable "domain_name" { type = string }
variable "tags" { type = map(string) }

resource "aws_route53_zone" "careos" {
  count = var.environment == "production" ? 1 : 0
  name  = var.domain_name

  tags = merge(var.tags, { Component = "dns" })
}

resource "aws_route53_health_check" "primary" {
  count             = var.environment == "production" ? 1 : 0
  fqdn              = "api.${var.domain_name}"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(var.tags, { Component = "dns-health" })
}

output "zone_id" {
  value = try(aws_route53_zone.careos[0].zone_id, "")
}
