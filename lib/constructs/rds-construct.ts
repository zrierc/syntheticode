import { StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface RdsProps extends StackProps {
  /**
   * Vpc that attach to this rds
   *
   * @type{ec2.Vpc}
   */
  vpc: ec2.Vpc;
}

export class Rds extends Construct {
  public readonly dbInstance: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id);

    const vpc = props.vpc;

    // * Define db cluster
    this.dbInstance = new rds.DatabaseCluster(this, 'dbInstance', {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      instanceProps: {
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.SMALL
        ),
        vpcSubnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
        }),
        publiclyAccessible: true,
      },
      defaultDatabaseName: 'DMSProject',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'DMSSecret',
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // ! Not for Prod
    });

    this.dbInstance.connections.allowDefaultPortFromAnyIpv4('open to world'); // ! Not for Prod
  }
}
