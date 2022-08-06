import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { VpcConstruct } from '../constructs/vpc-construct';
import { EcsConstruct } from '../constructs/ecs-construct';
import { Construct } from 'constructs';

export class SyntheticodeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // * Define resources
    const myVpc = new VpcConstruct(this, 'VPC');

    const ecs = new EcsConstruct(this, 'ecs', {
      vpc: myVpc.vpc,
    });

    // * Output Service Name
    new cdk.CfnOutput(this, 'Service Name', {
      value: ecs.service.serviceName,
    });
  }
}
