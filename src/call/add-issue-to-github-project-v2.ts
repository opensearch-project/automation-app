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
//   - labels   : (array) label name, add any of the listed labels on an issue will add the issue to project listed in `projects` arg
//   - projects : (array) the list of `<Organization Name>/<Project Number> for the issues to be added to.
//              : Ex: `opensearch-project/206` which is the OpenSearch Roadmap Project
// Requirements : ADDITIONAL_RESOURCE_CONTEXT=true

import { randomBytes } from 'crypto';
import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export interface AddIssueToGitHubProjectV2Params {
  labels: string[];
  projects: string[];
}

export async function validateProjects(app: Probot, resource: Resource, projectsArray: string[]): Promise<Boolean> {
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
): Promise<string | null> {
  if (!(await validateResourceConfig(app, context, resource))) return null;
  if (!(await validateProjects(app, resource, projects))) return null;

  // Verify triggered event
  if (!context.payload.label) {
    app.log.error("Only 'issues.labeled' event is supported on this call.");
    return null;
  }

  // Verify triggered label
  const label = context.payload.label.name.trim();
  if (!labels.includes(label)) {
    app.log.error(`"${label}" is not defined in call paramter "labels": ${labels}.`);
    return null;
  }

  const orgName = context.payload.organization.login;
  const repoName = context.payload.repository.name;
  const issueNumber = context.payload.issue.number;
  const issueNodeId = context.payload.issue.node_id;
  let itemId = null;

  // Add to project
  try {
    await Promise.all(
      projects.map(async (project) => {
        app.log.info(`Attempt to add ${orgName}/${repoName}/${issueNumber} to project ${project}`);
        const mutationId = await randomBytes(20).toString('hex');
        const projectSplit = project.split('/');
        const projectNodeId = resource.organizations.get(projectSplit[0])?.projects.get(Number(projectSplit[1]))?.nodeId;
        const addToProjectMutation = `
          mutation {
            addProjectV2ItemById(input: {
              clientMutationId: "${mutationId}",
              contentId: "${issueNodeId}",
              projectId: "${projectNodeId}",
            }) {
              item {
                id
              }
            }
          }
        `;
        const responseAddToProject = await context.octokit.graphql(addToProjectMutation);
        app.log.info(responseAddToProject);
        itemId = responseAddToProject.addProjectV2ItemById.item.id;
      }),
    );
  } catch (e) {
    app.log.error(`ERROR: ${e}`);
    return null;
  }

  return itemId;
}
