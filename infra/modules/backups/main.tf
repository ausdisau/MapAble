variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_backup_plan" "careos" {
  name = "careos-backup-${var.environment}"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.careos.name
    schedule          = "cron(0 5 * * ? *)"

    lifecycle {
      delete_after = var.environment == "production" ? 35 : 7
    }
  }

  tags = merge(var.tags, { Component = "backups" })
}

resource "aws_backup_vault" "careos" {
  name        = "careos-vault-${var.environment}"
  kms_key_arn = null # use default AWS managed key or external KMS ARN

  tags = var.tags
}

output "backup_plan_id" {
  value = aws_backup_plan.careos.id
}

output "backup_vault_name" {
  value = aws_backup_vault.careos.name
}
