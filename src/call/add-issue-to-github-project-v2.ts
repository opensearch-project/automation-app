/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : addIssueToGitHubProjectV2
// Description  : add issue to github project v2 based on labels
// Arguments    :
//   - labels   : (array) label name, add any of the listed labels on an issue will add the issue to project
//   - projects : (array) the list of `<Organization Name>/<Project Number> for the issues to be added to.
//              : Ex: `opensearch-project/206` which is the OpenSearch Roadmap Project

import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export interface AddIssueToGitHubProjectV2Params {
  labels: string[];
  projects: string[];
}

async function validateProject(app: Probot, resource: Resource, projectsArray: string[]): Promise<Boolean> {
  return projectsArray.every((proj) => {
    const projOrg = proj.split('/')[0];
    const projNum = Number(proj.split('/')[1]);
    const project = resource.organizations.get(projOrg)?.projects.get(projNum);

    if (!project) {
      app.log.error(`Project ${projNum} in organization ${projOrg} is not defined in resource config!`);
      return false;
    }

    return true;
  });
}

export default async function addIssueToGitHubProjectV2(
  app: Probot,
  context: any,
  resource: Resource,
  { labels, projects }: AddIssueToGitHubProjectV2Params,
): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;
  if (!(await validateProject(app, resource, projects))) return;
  console.log('pass');
}
