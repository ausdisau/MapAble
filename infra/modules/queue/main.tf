variable "environment" { type = string }
variable "region" { type = string }
variable "tags" { type = map(string) }

resource "aws_sqs_queue" "events" {
  name                       = "careos-events-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  tags = merge(var.tags, { Component = "queue" })
}

resource "aws_sqs_queue" "events_dlq" {
  name = "careos-events-dlq-${var.environment}"

  tags = merge(var.tags, { Component = "queue-dlq" })
}

output "queue_url" {
  value = aws_sqs_queue.events.url
}

output "dlq_url" {
  value = aws_sqs_queue.events_dlq.url
}
