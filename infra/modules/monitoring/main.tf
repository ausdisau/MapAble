variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_cloudwatch_log_group" "app" {
  name              = "/careos/${var.environment}/application"
  retention_in_days = var.environment == "production" ? 90 : 14

  tags = merge(var.tags, { Component = "monitoring" })
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "careos-api-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "CareOS API 5xx error rate elevated"

  tags = var.tags
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.app.name
}
