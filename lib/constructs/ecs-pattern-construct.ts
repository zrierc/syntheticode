import { Construct } from 'constructs';
import { ISecurityGroup, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPattern from 'aws-cdk-lib/aws-ecs-patterns';
import { StackProps } from 'aws-cdk-lib';

export interface EcsPatternProps extends StackProps {
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
   * The subnets to associate with the service.
   *
   * @type {SubnetSelection}
   * @required
   */
  taskSubnets: SubnetSelection;

  /**
   * The name of the service.
   *
   * @type {string}
   * @required
   */
  serviceName: string;

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

  /**
   *	The domain name for the service.
   *
   * @type {string}
   */
  domainName?: string;

  /**
   * The Route53 hosted zone for the domain.
   *
   * @type {HostedZone}
   */
  domainZone?: IHostedZone;

  /**
   * 	Certificate Manager certificate to associate with the load balancer.
   *
   * @type {Certificate}
   */
  certificate?: ICertificate;

  /**
   * The security policy that defines which ciphers and protocols are supported by the ALB Listener.
   *
   * @type {SslPolicy}
   */
  sslPolicy?: SslPolicy;
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
        taskImageOptions: props.taskImageOptions,
        taskSubnets: props.taskSubnets,
        serviceName: props.serviceName,
        loadBalancerName: `${props?.serviceName}-EcsALB`,
        cpu: 512,
        memoryLimitMiB: 1024,
        listenerPort: props?.listenerPort,
        desiredCount: 2,
        enableECSManagedTags: true,
        enableExecuteCommand: true,
        securityGroups: props?.securityGroup,
        // (optional) Add domain and setup ssl
        domainName: props?.domainName,
        domainZone: props?.domainZone,
        certificate: props?.certificate,
        sslPolicy: props?.sslPolicy,
      }
    );
  }
}
