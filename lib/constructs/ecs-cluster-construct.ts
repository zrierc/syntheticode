import { Construct } from 'constructs';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { StackProps } from 'aws-cdk-lib';

export interface EcsClusterProps extends StackProps {
  /**
   * Default VPC for Cluster
   *
   * @type {Vpc}
   * @required
   */
  vpc: Vpc;

  /**
   * Name of the cluster
   *
   * @type {string}
   */
  clusterName?: string;
}

export class EcsCluster extends Construct {
  public readonly ecsCluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterProps) {
    super(scope, id);

    this.ecsCluster = new ecs.Cluster(this, 'ClusterWorkshop', {
      vpc: props.vpc,
      clusterName: props?.clusterName,
    });
  }
}
