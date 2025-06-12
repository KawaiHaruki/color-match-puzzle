import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class ColorMatchPuzzleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, 'MyStaticSiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./src')],
      destinationBucket: siteBucket,
    });

    new CfnOutput(this, 'WebsiteURL', {
      value: siteBucket.bucketWebsiteUrl,
      description: 'S3静的ウェブサイトのURL',
    });
  }
}
