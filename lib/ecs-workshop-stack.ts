import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { VpcConstruct } from './constructs/network-construct';
import { EcsCluster } from './constructs/ecs-cluster-construct';
import { EcsPattern } from './constructs/ecs-pattern-construct';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

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

    // * Get Domain Zone
    const domainZone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: 'zrierc.systems',
    });
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Cert',
      'arn:aws:acm:us-east-1:838928449797:certificate/a26e792c-41e4-4375-b4ec-70c5b3fd22b6'
    );

    // * Define front-end service, load balancer, scaling policy
    const frontEndService = new EcsPattern(this, 'frontEndService', {
      cluster: workshopcluster.ecsCluster,
      serviceName: 'fe-service',
      // See reference below to see taskImageOptions properties
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedTaskImageOptions.html
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('xzrie/simple-next:1.1'),
        containerName: 'front-end_workshop',
        family: 'front-end-services',
        containerPort: 3000,
        environment: {
          PORT: '3000',
        },
      },
      taskSubnets: {
        subnetGroupName: 'private',
      },
      domainName: 'web.zrierc.systems',
      certificate,
      domainZone,
      sslPolicy: SslPolicy.RECOMMENDED_TLS,
    });

    const scalableFrontEndTarget =
      frontEndService.workshopService.service.autoScaleTaskCount({
        minCapacity: 1,
        maxCapacity: 5,
      });

    scalableFrontEndTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 30,
      scaleInCooldown: Duration.seconds(90),
      scaleOutCooldown: Duration.seconds(60),
    });

    // * Tagging resources
    cdk.Tags.of(network).add('Author', 'anak-magang');
    cdk.Tags.of(workshopcluster).add('Author', 'anak-magang');
    cdk.Tags.of(frontEndService).add('Author', 'anak-magang');

    // * Output resources
    new cdk.CfnOutput(this, 'ALB Front-End Endpoint', {
      value: frontEndService.workshopService.loadBalancer.loadBalancerDnsName,
    });
    /*
    TODO: Here's todo list that need to be done in 2 days
    - add up to 5 container but running only 2 fargate

    - add custom domain
    - add another service (with go/gin-gonic)
     */
  }
}
