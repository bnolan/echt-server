# Echt

[![CircleCI](https://circleci.com/gh/bnolan/echt-server.svg?style=svg&circle-token=c21a0d12bacd0d145ec76336424d901e163d7123)](https://circleci.com/gh/bnolan/echt-server)

Selfie app with face recognition.
Relies on https://github.com/bnolan/echt-client

### Installation

Run `yarn`

## Terraform

Requires terraform 0.11.

First you need to create the s3 bucket that holds the terraform config (so that
we don't have to commit the config to git as tfstate files). The bucket name is 
here:

    terraform {
      backend "s3" {
        bucket = "echt-test-terraform"

You can create the bucket by hand in the AWS web console. Enable versioning, and
don't enable public access.

Now you can terraform:

    cd terraform
    AWS_PROFILE=echt-test terraform apply

## Usage

You'll need to [configure AWS access credentials](https://claudiajs.com/tutorials/installing.html). In case you're not using the default profile,
remember to set the `AWS_PROFILE` environment variable accordingly.

Get your [credentials from aws](https://942514019561.signin.aws.amazon.com/console).

 * `yarn run start`: Initialise the app (not required in an existing AWS setup)
 * `yarn run release-dev`: Deploys the current code to dev
 * `yarn run release-uat`: Deploys the current code to UAT
 * `yarn run release-prod`: Deploys the current code to prod
 * `yarn run test`: Run all tests (interacts with AWS resources). Make sure you run with AWS_PROFILE=echt-test
 * `yarn run test`: Run unit tests
 * `yarn run logs`: View Lambda logs

## Adding policies

If you need to add a policy to the lambda:

    cd policies
    aws iam put-role-policy --role-name test-executor --policy-name access-dynamodb --policy-document file://access-dynamodb.json

To update:

    cd policies
    aws iam update-assume-role-policy --role-name test-executor --policy-name access-dynamodb --policy-document file://access-dynamodb.json

## Local Server

You can run a simple local copy of the Lambda commands via `yarn run server`.
It'll use the ClaudiaJS proxying system to use locally executed handlers
instead of Lambda functions, but interact with the real AWS services.

In order to use a local server in the app, adjust the `endpoint` URL in `config.js`
of the `echt-client` repo (set it to `http://localhost:3000`, without a trailing slash).

## Testing

By default, the client will add new faces to the `uat` environment when run on the simulator
or when connected to a local device. This environment is shared between developers,
with a single users and faces database. Previous face recognitions of the same
photo or person can mess up new signups.

I added an assert so it checks you set an `AWS_PROFILE` before running the tests.
  
## Multiple AWS accounts
 
The intention is to move to seperate AWS accounts (all slaved to a master echt
account that pays the bill) for test, uat and production.

Test will be constantly modified and deleted by TravisCI or local end-to-end tests,
the UAT environment will be stable and not deleted, but will have only data by
Ingo and Ben. Beta users (of both the UAT and Prod iphone apps) will connect
to the production environment which must be treated carefully as it contains user
data.
