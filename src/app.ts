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

// TODO: Move Probot to the workflow folder and make it server
export default async (app: Probot) => {
  app.log.info('OpenSearch Automation App is starting now......');

  const srvObj = new Service('Hello World Service');
  const resourceConfig: string = process.env.RESOURCE_CONFIG || 'configs/resources/sample-resource.yml';
  const processConfig: string = process.env.OPERATION_CONFIG || 'configs/operations/sample-operation.yml';

  if (resourceConfig === '' || processConfig === '') {
    throw new Error(`Invalid config path: RESOURCE_CONFIG=${resourceConfig} or OPERATION_CONFIG=${processConfig}`);
  }
  await srvObj.initService(app, resourceConfig, processConfig);

  app.log.info('All objects initialized, start listening events......');
};
