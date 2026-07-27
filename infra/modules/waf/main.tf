variable "environment" { type = string }
variable "tags" { type = map(string) }

resource "aws_wafv2_web_acl" "careos" {
  name  = "careos-waf-${var.environment}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.environment == "production" ? 2000 : 500
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "careos-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "careos-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, { Component = "waf" })
}

output "web_acl_arn" {
  value = aws_wafv2_web_acl.careos.arn
}
