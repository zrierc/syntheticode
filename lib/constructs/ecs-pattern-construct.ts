import { Construct } from 'constructs';
import { Vpc, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPattern from 'aws-cdk-lib/aws-ecs-patterns';
import { StackProps } from 'aws-cdk-lib';

export interface EcsPatternProps extends StackProps {
  /**
   * 	The VPC where the container instances will be launched.
   *
   * @type {Vpc}
   * @required
   */
  vpc: Vpc;

  /**
   * The name of the cluster that hosts the service.
   *
   * @type {ecs.Cluster}
   * @required
   */
  cluster: ecs.Cluster;

  /**
   * Properties for create new task definition.
   *
   * @type {ecsPattern.ApplicationLoadBalancedTaskImageOptions}
   * @required
   */
  taskImageOptions: ecsPattern.ApplicationLoadBalancedTaskImageOptions;

  /**
   * The name of the service.
   *
   * @type {string}
   */
  serviceName?: string;

  /**
   * Listener port of the application load balancer that will serve traffic to the service.
   *
   * @type {number}
   */
  listenerPort?: number;

  /**
   * The security groups to associate with the service.
   *
   * @type {ISecurityGroup[]}
   */
  securityGroup?: ISecurityGroup[];
}

export class EcsPattern extends Construct {
  public readonly workshopService: ecsPattern.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: EcsPatternProps) {
    super(scope, id);

    // * Define service with Fargate + Application Load Balancer
    this.workshopService = new ecsPattern.ApplicationLoadBalancedFargateService(
      this,
      'workshopService',
      {
        cluster: props.cluster,
        vpc: props.vpc,
        taskImageOptions: props.taskImageOptions,
        serviceName: props?.serviceName,
        loadBalancerName: `${props?.serviceName}-EcsLoadBalancer`,
        cpu: 512,
        memoryLimitMiB: 1024,
        listenerPort: props?.listenerPort,
        desiredCount: 2,
        enableECSManagedTags: true,
        enableExecuteCommand: true,
        securityGroups: props?.securityGroup,
      }
    );
  }
}
