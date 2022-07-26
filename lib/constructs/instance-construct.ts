import { Construct } from 'constructs';
// import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { KeyPair } from 'cdk-ec2-key-pair';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
// import { StackProps } from 'aws-cdk-lib';

// export interface InstanceServerProps extends StackProps {
//   keyPairName?: string;

//   instanceInfo?: ec2.InstanceProps;
// }

export class InstanceServer extends Construct {
  /**
   * Vpc that attached to instance
   *
   * @type {ec2.Vpc}
   */
  public readonly vpc: ec2.Vpc;

  /**
   * keypair name
   *
   * @type {string}
   */
  public readonly keyPairName: string;

  /**
   * Instance server
   *
   * @type {ec2.Instance}
   */
  public readonly server: ec2.Instance;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // * Define vpc
    this.vpc = new ec2.Vpc(this, 'ec2-vpc', {
      cidr: '10.0.0.0/24',
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
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
      ec2.Port.tcp(3306),
      'Allow MySQL from IPv4'
    );
    serverSG.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(3306),
      'Allow MySQL from IPv6'
    );

    // * define role for instance and key
    const role = new iam.Role(this, 'serverRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    // * Create keypair
    this.keyPairName = 'keypair-anak-magang';
    const key = new KeyPair(this, 'key-pair-server', {
      name: this.keyPairName,
      description: 'keypair for server',
      storePublicKey: true,
    });
    key.grantReadOnPrivateKey(role);
    key.grantReadOnPublicKey(role);

    // * define image
    const image = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // * Define ec2
    this.server = new ec2.Instance(this, 'ec2-server', {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3A,
        ec2.InstanceSize.SMALL
      ),
      machineImage: image,
      securityGroup: serverSG,
      keyName: key.keyPairName,
      role,
    });

    // * define asset for user-data server
    const asset = new Asset(this, 'asset-for-userdata', {
      path: path.join(__dirname, '../../user-data/setup.sh'),
    });

    const localPath = this.server.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });

    this.server.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: '--verbose -y',
    });
    asset.grantRead(this.server.role);
  }
}
