variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_s3_bucket" "documents" {
  bucket = "careos-documents-${var.environment}"

  tags = merge(var.tags, { Component = "object-storage" })
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

output "bucket_name" {
  value = aws_s3_bucket.documents.id
}
