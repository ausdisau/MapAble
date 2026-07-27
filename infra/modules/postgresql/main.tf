variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_db_subnet_group" "careos" {
  name       = "careos-pg-${var.environment}"
  subnet_ids = [] # populated by environment-specific overlay

  tags = var.tags
}

resource "aws_rds_cluster" "careos" {
  cluster_identifier      = "careos-pg-${var.environment}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  database_name           = "careos"
  master_username         = "careos_admin" # password from secrets module
  backup_retention_period = var.environment == "production" ? 35 : 7
  storage_encrypted       = true

  tags = merge(var.tags, { Component = "postgresql" })
}

output "endpoint" {
  value = aws_rds_cluster.careos.endpoint
}
