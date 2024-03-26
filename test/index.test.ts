import { Service, EcrPublicSource } from '@aws-cdk/aws-apprunner-alpha';
import { App, SecretValue, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { CfnService } from 'aws-cdk-lib/aws-apprunner';
import { CfnGraphQLApi } from 'aws-cdk-lib/aws-appsync';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { OriginVerify } from '../src/index';

test('Allow ALB', () => {
  const app = new App();
  const stack = new Stack(app);

  const vpc = new Vpc(stack, 'Vpc');

  const alb = new ApplicationLoadBalancer(stack, 'ALB', {
    vpc,
    internetFacing: true,
  });

  const verification = new OriginVerify(stack, 'OriginVerify', {
    origin: alb,
  });

  expect(verification.headerName).toBe('x-origin-verify');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::WAFv2::WebACL', {
    DefaultAction: {
      Block: {},
    },
  });
});

test('Allow Stage', () => {
  const app = new App();
  const stack = new Stack(app);

  const api = new RestApi(stack, 'RestApi', {});
  api.root.addMethod('ANY');

  const verification = new OriginVerify(stack, 'OriginVerify', {
    origin: api.deploymentStage,
  });

  expect(verification.headerName).toBe('x-origin-verify');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::WAFv2::WebACL', {
    DefaultAction: {
      Block: {},
    },
  });
});

test('Allow AppSync', () => {
  const app = new App();
  const stack = new Stack(app);

  const api = new CfnGraphQLApi(stack, 'GraphQLApi', {
    name: 'test',
    authenticationType: 'API_KEY',
  });

  const verification = new OriginVerify(stack, 'OriginVerify', {
    origin: api,
  });

  expect(verification.headerName).toBe('x-origin-verify');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::WAFv2::WebACL', {
    DefaultAction: {
      Block: {},
    },
  });
});

test('Allow App Runner CfnService', () => {
  const app = new App();
  const stack = new Stack(app);

  const service = new CfnService(stack, 'Service', {
    sourceConfiguration: {},
  });

  const verification = new OriginVerify(stack, 'OriginVerify', {
    origin: service,
  });

  expect(verification.headerName).toBe('x-origin-verify');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::WAFv2::WebACL', {
    DefaultAction: {
      Block: {},
    },
  });
});

test('Allow App Runner Service', () => {
  const app = new App();
  const stack = new Stack(app);

  const service = new Service(stack, 'Service', {
    source: new EcrPublicSource({
      imageIdentifier: 'test',
    }),
  });

  const verification = new OriginVerify(stack, 'OriginVerify', {
    origin: service,
  });

  expect(verification.headerName).toBe('x-origin-verify');

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::WAFv2::WebACL', {
    DefaultAction: {
      Block: {},
    },
  });
});

test('Allow Custom Secret Value', () => {
  const app = new App();
  const stack = new Stack(app);

  const api = new RestApi(stack, 'RestApi', {});
  api.root.addMethod('ANY');

  const verification = new OriginVerify(stack, 'OriginVerify', {
    origin: api.deploymentStage,
    secretValue: SecretValue.unsafePlainText('foobar'),
  });

  expect(verification.headerName).toBe('x-origin-verify');
  expect(verification.headerValue).toBe('foobar');

});

