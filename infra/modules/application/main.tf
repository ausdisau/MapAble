variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_ecs_cluster" "careos" {
  name = "careos-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = var.tags
}

output "service_name" {
  value = "careos-app-${var.environment}"
}
