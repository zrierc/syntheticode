import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoScaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as path from 'path';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

export class SyntheticodeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // * Define VPC
    const vpc = new ec2.Vpc(this, 'alb-vpc', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 26,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // * create image
    const image = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // * Define security group
    const serverSG = new ec2.SecurityGroup(this, 'serverSG', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group for Server',
    });

    serverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from public using IPv4'
    );
    serverSG.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(80),
      'Allow HTTP from public using IPv6'
    );

    // * Create target group instance
    const serverGroup = new autoScaling.AutoScalingGroup(this, 'targetALB', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: image,
      minCapacity: 2,
      maxCapacity: 3,
      securityGroup: serverSG,
    });

    // * Add launch script using user data
    const asset = new Asset(this, 'asset-user-data', {
      path: path.join(__dirname, '../user-data/setup.sh'),
    });

    const localPath = serverGroup.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });

    serverGroup.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: '--verbose -y',
    });
    asset.grantRead(serverGroup.role);

    // * Define app load balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
    });

    // * Add listener to LB and target
    const listener = alb.addListener('serverListener', {
      port: 80,
    });

    listener.addTargets('appServer', {
      port: 80,
      targets: [serverGroup],
    });

    listener.connections.allowDefaultPortFromAnyIpv4('open to the world');

    // * Create scaling rule (example)
    serverGroup.scaleOnCpuUtilization('scaleByCPU', {
      targetUtilizationPercent: 70,
    });

    // * Output LB endpoint
    new cdk.CfnOutput(this, 'ALB Endpoint', {
      value: alb.loadBalancerDnsName,
    });
  }
}
