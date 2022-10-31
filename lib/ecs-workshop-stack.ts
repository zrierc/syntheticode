import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { VpcConstruct } from './constructs/network-construct';
import { EcsCluster } from './constructs/ecs-cluster-construct';
import { EcsPattern } from './constructs/ecs-pattern-construct';
import { Construct } from 'constructs';

export class EcsWorkshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // * Define VPC
    const network = new VpcConstruct(this, 'VpcWorkshop');

    // * Define Ecs Cluster
    const workshopcluster = new EcsCluster(this, 'clusterWorkshop', {
      vpc: network.vpc,
      clusterName: 'cluster-workshop',
    });

    // * Define service + load balancer
    const workshopService = new EcsPattern(this, 'workshopService', {
      cluster: workshopcluster.ecsCluster,
      vpc: network.vpc,
      // See reference below to see taskImageOptions properties
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedTaskImageOptions.html
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('lorem/ipsum'), // ! need to change to proper image
        containerName: 'front-end_workshop',
        family: 'front-end-services',
      },
    });

    // ! need to add output e.g alb endpoint, cluster name, etc
  }
}
