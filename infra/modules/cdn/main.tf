variable "environment" { type = string }
variable "domain_name" { type = string }
variable "tags" { type = map(string) }

resource "aws_cloudfront_distribution" "careos" {
  enabled = true
  comment = "CareOS CDN ${var.environment}"

  origin {
    domain_name = "origin-${var.environment}.${var.domain_name}"
    origin_id   = "careos-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "careos-origin"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(var.tags, { Component = "cdn" })
}

output "distribution_id" {
  value = aws_cloudfront_distribution.careos.id
}
