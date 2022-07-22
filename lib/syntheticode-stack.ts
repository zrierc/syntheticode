import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { Construct } from 'constructs';

export class SyntheticodeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // * Define Bucket
    const webBucket = new s3.Bucket(this, 'webBucket', {
      bucketName: 'static-web-cdk',
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // * Create distribution using cloud Front
    const cdn = new cloudFront.Distribution(this, 'webDist', {
      defaultBehavior: {
        origin: new origins.S3Origin(webBucket),
      },
      defaultRootObject: 'index.html',
    });

    // * Deploy S3 as static site
    new s3Deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3Deploy.Source.asset(path.join(__dirname, '../src'))],
      destinationBucket: webBucket,
      distributionPaths: ['/*'],
      distribution: cdn,
      retainOnDelete: false,
    });

    // * Output the Endpoint
    new cdk.CfnOutput(this, 'staticWebEndpoint', {
      value: webBucket.bucketWebsiteUrl,
    });
    new cdk.CfnOutput(this, 'CDNDomainName', {
      value: cdn.distributionDomainName,
    });
  }
}
