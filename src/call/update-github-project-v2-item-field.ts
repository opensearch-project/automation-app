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
//   - itemId   : (string) the item Node Id when it gets added to a project.
//   - method   : (string) the method to update an item field in a given project, the item must have been already added to a project.
//              : - label: Adding `Roadmap:Releases/Project Health` label will update the `Roadmap` field value of an item to `Releases, Project Health`.
//              :          Field name and value separated by `:` and `/` replaced with `, `.
//   - project  : (string) the `<Organization Name>/<Project Number> where the item field belongs to.
//              : Ex: `opensearch-project/206` which is the OpenSearch Roadmap Project
// Return       : (string) `Item Node Id` if success, else `null`
// Requirements : ADDITIONAL_RESOURCE_CONTEXT=true

import { randomBytes } from 'crypto';
import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export interface UpdateGithubProjectV2ItemFieldParams {
  itemId: string;
  method: string;
  project: string;
}

export async function validateProject(app: Probot, resource: Resource, project: string): Promise<Boolean> {
  const projOrg = project.split('/')[0];
  const projNum = Number(project.split('/')[1]);
  const projRes = resource.organizations.get(projOrg)?.projects.get(projNum);

  if (!projRes) {
    app.log.error(`Project ${projNum} in organization ${projOrg} is not defined in resource config!`);
    return false;
  }

  return true;
}

export default async function updateGithubProjectV2ItemField(
  app: Probot,
  context: any,
  resource: Resource,
  { itemId, method, project }: UpdateGithubProjectV2ItemFieldParams,
): Promise<string | null> {
  if (!(await validateResourceConfig(app, context, resource))) return null;
  if (!(await validateProject(app, resource, project))) return null;

  // Verify triggered event
  if (!context.payload.label) {
    app.log.error("Only 'issues.labeled' event is supported on this call.");
    return null;
  }

  // Verify itemId present
  if (!itemId) {
    app.log.error('No Item Node Id provided in parameter.');
    return null;
  }

  // Verify update method
  if (method !== 'label') {
    app.log.error("Only 'label' method is supported in this call at the moment.");
    return null;
  }

  const projectSplit = project.split('/');
  const projectNode = resource.organizations.get(projectSplit[0])?.projects.get(Number(projectSplit[1]));
  const projectNodeId = projectNode?.nodeId;
  const labelName = context.payload.label.name;
  const labelSplit = labelName.split(':');

  // At the moment only labels has `:` as separator will be assigned to a field or update values
  if (!labelSplit[1]) {
    app.log.error(`Label '${labelName}' is invalid. Please make sure your label is formatted as '<FieldName>:<FieldValue>'.`);
    return null;
  }

  const fieldName = labelSplit[0];
  const fieldValue = labelSplit[1].replaceAll('/', ', ');
  const fieldNode = projectNode?.fields.get(fieldName);

  // Update item field
  try {
    app.log.info(`Attempt to update field '${fieldName}' with value '${fieldValue}' for item '${itemId}' in project ${project} ...`);
    const mutationId = await randomBytes(20).toString('hex');
    if (projectNode && fieldNode && fieldNode?.fieldType === 'SINGLE_SELECT') {
      const matchingFieldOption = fieldNode.context.options.find((fieldOption: any) => fieldOption.name === fieldValue);
      if (matchingFieldOption) {
        const updateItemFieldMutation = `
          mutation {
            updateProjectV2ItemFieldValue(
              input: {
                clientMutationId: "${mutationId}",
                projectId: "${projectNodeId}",
                itemId: "${itemId}",
                fieldId: "${fieldNode?.nodeId}",
                value: {
                  singleSelectOptionId: "${matchingFieldOption.id}"
                }
              }
            ) {
              projectV2Item {
                id
              }
            }
          }
        `;
        const responseUpdateItemField = await context.octokit.graphql(updateItemFieldMutation);
        app.log.info(responseUpdateItemField);
        return responseUpdateItemField.updateProjectV2ItemFieldValue.projectV2Item.id;
      }
    }
    app.log.error(`Either '${project}' / '${fieldName}' not exist, or '${fieldName}' has an unsupported field type (currently support: SINGLE_SELECT)`);
  } catch (e) {
    app.log.error(`ERROR: ${e}`);
    return null;
  }

  return null;
}
