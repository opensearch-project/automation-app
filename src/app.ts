/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Probot } from 'probot';
import { Service } from './service/service';

export default async (app: Probot) => {
  app.log.info('OpenSearch Automation App is starting now......');

  // Env Vars
  const resourceConfig: string = String(process.env.RESOURCE_CONFIG) || '';
  const processConfig: string = String(process.env.OPERATION_CONFIG) || '';
  const additionalResourceContext: boolean = Boolean(process.env.ADDITIONAL_RESOURCE_CONTEXT) || false;
  const serviceName: string = process.env.SERVICE_NAME || 'default';

  // Start service
  const srvObj = new Service(serviceName);

  if (resourceConfig === '' || processConfig === '') {
    throw new Error(`Empty config path: RESOURCE_CONFIG='${resourceConfig}' or OPERATION_CONFIG='${processConfig}'`);
  }

  if (additionalResourceContext) {
    app.log.info('Start requesting additional resource context now, take a while......');
  }

  await srvObj.initService(app, resourceConfig, processConfig, additionalResourceContext);

  app.log.info('All objects initialized, start listening events......');
};
