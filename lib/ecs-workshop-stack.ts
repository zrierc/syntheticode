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
      serviceName: 'fe-services',
      // See reference below to see taskImageOptions properties
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedTaskImageOptions.html
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('xzrie/simple-next:1.1'),
        containerName: 'front-end_workshop',
        family: 'front-end-services',
        containerPort: 80,
        environment: {
          PORT: '80',
        },
      },
      taskSubnets: {
        subnetGroupName: 'private',
      },
    });

    // * Tagging resources
    cdk.Tags.of(network).add('Author', 'anak-magang');
    cdk.Tags.of(workshopcluster).add('Author', 'anak-magang');
    cdk.Tags.of(workshopService).add('Author', 'anak-magang');

    // * Output resources
    new cdk.CfnOutput(this, 'ALB Endpoint', {
      value: workshopService.workshopService.loadBalancer.loadBalancerDnsName,
    });

    /*
    TODO: Here's todo list that need to be done in 2 days
    - create scaling policy
    - change to port 3000
    - add up to 5 container but running only 2 fargate

    - add custom domain
    - add another service (with go/gin-gonic)
     */
  }
}
