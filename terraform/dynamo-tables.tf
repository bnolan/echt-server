resource "aws_dynamodb_table" "users-table" {
  name           = "echt.users"
  read_capacity  = 2
  write_capacity = 1
  hash_key       = "uuid"
  range_key      = "userId"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  # ttl {
  #   attribute_name = "TimeToExist"
  #   enabled = false
  # }

  # global_secondary_index {
  #   name               = "GameTitleIndex"
  #   hash_key           = "GameTitle"
  #   range_key          = "TopScore"
  #   write_capacity     = 10
  #   read_capacity      = 10
  #   projection_type    = "INCLUDE"
  #   non_key_attributes = ["UserId"]
  # }

  # tags {
  #   Name        = "dynamodb-table-1"
  #   Environment = "production"
  # }
}
