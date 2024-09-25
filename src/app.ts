import { Probot } from 'probot';
import { Service } from './service/service';

// TODO: Move Probot to the workflow folder and make it server
export default async (app: Probot) => {
  app.log.info('OpenSearch Automation App is starting now......');

  const srvObj = new Service('Hello World Service');
  const resourceConfig: string = process.env.RESOURCE_CONFIG || '';
  const processConfig: string = process.env.OPERATION_CONFIG || '';

  if (resourceConfig === '' || processConfig === '') {
    throw new Error(`Invalid config path: RESOURCE_CONFIG=${resourceConfig} or OPERATION_CONFIG=${processConfig}`);
  }
  await srvObj.initService(app, resourceConfig, processConfig);

  app.log.info('All objects initialized, start listening events......');
};
