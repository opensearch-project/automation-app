import { Probot } from 'probot';
import { Service } from './service/service';

// TODO: Move Probot to the workflow folder and make it server
export default async (app: Probot) => {
  app.log.info('OpenSearch Automation App is starting now......');

  const srvObj = new Service('Hello World Service');
  await srvObj.initService('configs/resources/peterzhu-organization.yml', 'configs/operations/hello-world.yml', app);
  await srvObj.registerEvents();

  app.log.info('All objects initialized, start listening events......');
};
