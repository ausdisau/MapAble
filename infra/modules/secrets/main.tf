variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_secretsmanager_secret" "database_url" {
  name        = "careos/${var.environment}/database-url"
  description = "PostgreSQL connection string — value set outside Terraform"

  tags = merge(var.tags, { Component = "secrets" })
}

resource "aws_secretsmanager_secret" "nextauth_secret" {
  name        = "careos/${var.environment}/nextauth-secret"
  description = "NextAuth secret — value set outside Terraform"

  tags = merge(var.tags, { Component = "secrets" })
}

output "database_secret_arn" {
  value = aws_secretsmanager_secret.database_url.arn
}
