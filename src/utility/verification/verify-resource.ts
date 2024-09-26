/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Probot } from 'probot';
import { Resource } from '../../service/resource/resource';

export async function verifyOrgRepo(app: Probot, context: any, resource: Resource): Promise<boolean> {
  const contextOrgName = context.payload.organization?.login;
  const contextRepoName = context.payload.repository?.name;

  const org = resource.organizations.get(contextOrgName);
  const repo = org?.repositories.get(contextRepoName);

  if (!org || !repo) {
    app.log.error(`${contextOrgName}/${contextRepoName} is not defined in resource config!`);
    return false;
  }
  return true;
}
