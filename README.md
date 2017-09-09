# Echt

[![CircleCI](https://circleci.com/gh/bnolan/echt-server.svg?style=svg&circle-token=c21a0d12bacd0d145ec76336424d901e163d7123)](https://circleci.com/gh/bnolan/echt-server)

Selfie app with face recognition.
Relies on https://github.com/bnolan/echt-client

### Installation

Run `yarn`

## Usage

You'll need to [configure AWS access credentials](https://claudiajs.com/tutorials/installing.html). In case you're not using the default profile,
remember to set the `AWS_PROFILE` environment variable accordingly.

Get your [credentials from aws](https://942514019561.signin.aws.amazon.com/console).

 * `yarn run start`: Initialise the app (not required in an existing AWS setup)
 * `yarn run release-dev`: Deploys the current code to dev
 * `yarn run release-uat`: Deploys the current code to UAT
 * `yarn run release-prod`: Deploys the current code to prod
 * `yarn run test`: Run all tests (interacts with AWS resources). You can run your own "stage" via `yarn run test -- --stage=<my-stage>` for integration tests.
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
By default, it's using the `uat` stage.
Force a different stage via `yarn run server -- --stage=dev-ingo`.

In order to use a local server in the app, adjust the `endpoint` URL in `config.js`
of the `echt-client` repo (set it to `http://localhost:3000`, without a trailing slash).

## Testing

By default, the client will add new faces to the `uat` stage when run on the simulator
or when connected to a local device. This stage is shared between developers,
with a single users and faces database. Previous face recognitions of the same
photo or person can mess up new signups. You can clear the `uat` database with
the following command (add the `YESIMSURE=1` parameter):

  node tasks/truncate-uat.js
