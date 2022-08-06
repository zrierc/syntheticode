import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

export interface EcsConstructProps extends StackProps {
  /**
   * Vpc that used for this cluster.
   *
   * @type {Vpc}
   */
  vpc: Vpc;
}

export class EcsConstruct extends Construct {
  public readonly cluster: ecs.Cluster;

  public readonly service: ecs.FargateService;

  public taskDefinition: ecs.TaskDefinition;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    // * Define Cluster
    this.cluster = new ecs.Cluster(this, 'test-cluster', {
      vpc: props.vpc,
    });

    // * Define Serverless Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'FargateTaskDef',
      {
        cpu: 512,
        memoryLimitMiB: 1024,
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      }
    );

    // * Attach container to task definition
    this.taskDefinition.addContainer('webServer', {
      image: ecs.ContainerImage.fromRegistry('xzrie/sample-php-ecs:1.0'),
      portMappings: [
        {
          protocol: ecs.Protocol.TCP,
          containerPort: 80,
          hostPort: 8080, // ! Need to review
        },
      ],
    });

    // * Define serverless service
    this.service = new ecs.FargateService(this, 'test-service', {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: 2,
      circuitBreaker: { rollback: true },
    });
  }
}
