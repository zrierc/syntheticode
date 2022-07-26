import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { InstanceServer } from './constructs/instance-construct';
import { Rds } from './constructs/rds-construct';
import { Construct } from 'constructs';

export class SyntheticodeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // * Define ec2 instance
    const instanceServer = new InstanceServer(this, 'sourceTarget');

    // * Define Target RDS
    const rdsInstance = new Rds(this, 'targetSource', {
      vpc: instanceServer.vpc,
    });

    // * Tagging resources
    const tagProps: cdk.TagProps = {
      includeResourceTypes: [
        'AWS::EC2::VPC',
        'AWS::EC2::Instance',
        'AWS::EC2::SecurityGroup',
      ],
    };

    cdk.Tags.of(instanceServer.vpc).add('who', 'vpc-anak-magang');
    cdk.Tags.of(instanceServer.server).add('who', 'anak-magang');
    cdk.Tags.of(rdsInstance).add('who', 'keyPair-anak-magang');
    cdk.Tags.of(this).add('build-with', 'aws-cdk-anak-magang', tagProps);

    // * Create outputs
    new cdk.CfnOutput(this, 'Instance IP Address', {
      value: instanceServer.server.instancePublicIp,
    });
    new cdk.CfnOutput(this, 'Download Keypair command', {
      value: `aws secretsmanager get-secret-value --secret-id ec2-ssh-key/${instanceServer.keyPairName}/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem`,
    });
    new cdk.CfnOutput(this, 'SSH Command', {
      value: `ssh -i cdk-key.pem ec2-user@${instanceServer.server.instancePublicIp}`,
    });
    new cdk.CfnOutput(this, 'DB Cluster Endpoint', {
      value: rdsInstance.dbInstance.clusterEndpoint.socketAddress,
    });
    new cdk.CfnOutput(this, 'DB Secret Name', {
      value: rdsInstance.dbInstance.secret?.secretName!,
    });
    new cdk.CfnOutput(this, 'DB Get Auth', {
      value: `aws secretsmanager get-secret-value --secret-id ${rdsInstance
        .dbInstance.secret?.secretName!} --output json > dbAuthInfo.txt`,
    });
  }
}
