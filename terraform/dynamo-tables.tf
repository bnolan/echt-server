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

resource "aws_dynamodb_table" "photos-table" {
  name           = "echt.photos"
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

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name               = "echt.photosByUserId"
    hash_key           = "userId"
    range_key          = "createdAt"
    write_capacity     = 2
    read_capacity      = 1
    projection_type    = "ALL"
    # non_key_attributes = ["UserId"]
  }
}

resource "aws_dynamodb_table" "faces-table" {
  name           = "echt.faces"
  read_capacity  = 2
  write_capacity = 1
  hash_key       = "faceId"
  range_key      = "userId"

  attribute {
    name = "faceId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "friends-table" {
  name           = "echt.friends"
  read_capacity  = 2
  write_capacity = 1
  hash_key       = "fromId"
  range_key      = "toId"

  attribute {
    name = "fromId"
    type = "S"
  }

  attribute {
    name = "toId"
    type = "S"
  }
}