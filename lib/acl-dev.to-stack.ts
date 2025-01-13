import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { ClientAttributes, UserPool } from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class AclDevToStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'ACLDevTo', {
      userPoolName: 'aclDevTo',
    });

    userPool.addClient('graphql-acl', {
      userPoolClientName: 'Graphql ACL',
      generateSecret: true,
      authFlows: {
        userPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: ['https://oauth.pstmn.io/v1/browser-callback'],
      },
      readAttributes: new ClientAttributes()
        .withStandardAttributes({
          email: true,
          nickname: true,
        })
        .withCustomAttributes('action'),
      writeAttributes: new ClientAttributes()
        .withStandardAttributes({
          email: true,
          nickname: true,
        })
        .withCustomAttributes('action'),
      enablePropagateAdditionalUserContextData: true,
    });

    // Define the Lambda function resource
    const graphQlFunction = new NodejsFunction(this, 'GraphQlHandler', {
      runtime: Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      entry: './src/lambda/graphql.ts',
      handler: 'handler',
      description: 'graphql.ts',
      bundling: {
        target: 'node20',
        loader: {
          '.graphql': 'text',
        },
      },
    });

    const api = new RestApi(this, 'GraphQlApi');

    const auth = new CognitoUserPoolsAuthorizer(this, 'acl-dev-to-auth', {
      cognitoUserPools: [userPool],
    });

    api.root.addMethod('POST', new LambdaIntegration(graphQlFunction), {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    api.root.addMethod('GET', new LambdaIntegration(graphQlFunction));
  }
}
