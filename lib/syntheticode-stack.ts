import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { KeyPair } from 'cdk-ec2-key-pair';
import { Construct } from 'constructs';

export class SyntheticodeStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // * Define vpc
    this.vpc = new ec2.Vpc(this, 'ec2-vpc', {
      cidr: '192.168.1.0/24',
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 26,
        },
      ],
    });

    // * Define security group
    const serverSG = new ec2.SecurityGroup(this, 'serverSG', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'Security Group for server',
    });

    serverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH Access'
    );
    serverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allo HTTP from IPv4'
    );
    serverSG.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(80),
      'Allow HTTP from IPv6'
    );

    // * define role for instance and key
    const role = new iam.Role(this, 'serverRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    // * Create keypair
    const keyPairName: string = 'keypair-anak-magang';
    const key = new KeyPair(this, 'key-pair-server', {
      name: keyPairName,
      description: 'keypair for server',
      storePublicKey: true,
    });
    key.grantReadOnPrivateKey(role);
    key.grantReadOnPublicKey(role);

    // * define image
    const image = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // * Define ec2
    const server = new ec2.Instance(this, 'ec2-server', {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.NANO
      ),
      machineImage: image,
      securityGroup: serverSG,
      keyName: key.keyPairName,
      role,
    });

    // * define asset for user-data server
    const asset = new Asset(this, 'asset-for-userdata', {
      path: path.join(__dirname, '../user-data/setup.sh'),
    });

    const localPath = server.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });

    server.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: '--verbose -y',
    });
    asset.grantRead(server.role);

    // * Tagging resources
    const tagProps: cdk.TagProps = {
      includeResourceTypes: [
        'AWS::EC2::VPC',
        'AWS::EC2::Instance',
        'AWS::EC2::SecurityGroup',
      ],
    };

    cdk.Tags.of(this.vpc).add('who', 'vpc-anak-magang');
    cdk.Tags.of(server).add('who', 'anak-magang');
    cdk.Tags.of(key).add('who', 'keyPair-anak-magang');
    cdk.Tags.of(this).add('build-with', 'aws-cdk', tagProps);

    // * Create outputs
    new cdk.CfnOutput(this, 'IP Address', {
      value: server.instancePublicIp,
    });
    new cdk.CfnOutput(this, 'Download Keypair command', {
      value: `aws secretsmanager get-secret-value --secret-id ec2-ssh-key/${keyPairName}/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem`,
    });
    new cdk.CfnOutput(this, 'SSH Command', {
      value: `ssh -i cdk-key.pem ec2-user@${server.instancePublicIp}`,
    });
  }
}
