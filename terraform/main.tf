variable "environment" {
  default = "test"
}

variable "region" {
  default = "us-west-2"
}

# variable "route53_domain_name" {}
# variable "route53_domain_zoneid" {}
# variable "route53_domain_alias_name" {}
# variable "route53_domain_alias_zoneid" {}

provider "aws" {
    region = "${var.region}"
}

resource "aws_s3_bucket" "site" {
    bucket = "echt.${var.environment}.${var.region}"
    acl = "public-read"
    policy = <<EOF
{
  "Id": "bucket_policy_site",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "bucket_policy_site_main",
      "Action": [
        "s3:GetObject"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:s3:::echt.${var.environment}.${var.region}/*",
      "Principal": "*"
    }
  ]
}
EOF
    force_destroy = true
}

# resource "aws_route53_record" "domain" {
#    name = "${var.route53_domain_name}"
#    zone_id = "${var.route53_domain_zoneid}"
#    type = "A"
#    alias {
#      name = "${var.route53_domain_alias_name}"
#      zone_id = "${var.route53_domain_alias_zoneid}"
#      evaluate_target_health = true
#    }
# }
