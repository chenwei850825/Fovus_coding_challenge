import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';

export class FovusCodingChallengeStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3 bucket for storing input and output files
        const fovusBucket = new s3.Bucket(this, 'FovusBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Change as necessary for production
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });

        // DynamoDB table for storing metadata
        const metadataTable = new dynamodb.Table(this, 'MetadataTable', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY // Change as necessary for production
        });

        // IAM role for Lambda functions
        const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
            ]
        });

        // Lambda function to generate presigned URL
        const presignedUrlLambda = new lambda.Function(this, 'PresignedUrlLambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda/presignedUrl'),
            handler: 'presignedUrl.handler',
            environment: {
                BUCKET_NAME: fovusBucket.bucketName,
            },
            role: lambdaExecutionRole
        });

        // Lambda function to handle file processing and metadata
        const fileProcessorLambda = new lambda.Function(this, 'FileProcessorLambda', {
            runtime: lambda.Runtime.NODEJS_16_X, // Update to supported runtime,
            code: lambda.Code.fromAsset('lambda/processData'),
            handler: 'processData.handler',
            environment: {
                BUCKET_NAME: fovusBucket.bucketName,
                TABLE_NAME: metadataTable.tableName
            },
            role: lambdaExecutionRole
        });

        // API Gateway to expose the Lambda functions
        const api = new apigateway.RestApi(this, 'FovusApi', {
            restApiName: 'Fovus File Processor API',
            description: 'API for processing files and storing metadata.'
        });

        // Integration and resource setup for API Gateway
        const presignedUrlIntegration = new apigateway.LambdaIntegration(presignedUrlLambda);
        api.root.addResource('presigned-url').addMethod('GET', presignedUrlIntegration);

        const lambdaIntegration = new apigateway.LambdaIntegration(fileProcessorLambda);
        api.root.addResource('process-data').addMethod('POST', lambdaIntegration);

      //   // EC2 Instance to run scripts (dynamically created)
      //   const ec2Instance = new ec2.Instance(this, 'FovusInstance', {
      //     instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      //     machineImage: ec2.MachineImage.latestAmazonLinux(),
      //     vpc: new ec2.Vpc(this, 'FovusVpc'), // Create a new VPC or use an existing one
      //     role: lambdaExecutionRole, // Assuming this role has permissions to access S3
      //     userData: ec2.UserData.custom(`
      //         #!/bin/bash
      //         aws s3 cp s3://${fovusBucket.bucketName}/your-script.sh /home/ec2-user/your-script.sh
      //         chmod +x /home/ec2-user/your-script.sh
      //         /home/ec2-user/your-script.sh
      //     `) // UserData commands to download and execute the script
      // });
      

        // Output the names and ARNs for reference
        new cdk.CfnOutput(this, 'BucketNameOutput', { value: fovusBucket.bucketName });
        new cdk.CfnOutput(this, 'TableNameOutput', { value: metadataTable.tableName });
        new cdk.CfnOutput(this, 'PresignedUrlLambdaArnOutput', { value: presignedUrlLambda.functionArn });
        new cdk.CfnOutput(this, 'FileProcessorLambdaArnOutput', { value: fileProcessorLambda.functionArn });
        new cdk.CfnOutput(this, 'ApiUrlOutput', { value: api.url });
    }
}
