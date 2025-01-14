/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import updateGithubProjectV2ItemField, { UpdateGithubProjectV2ItemFieldParams } from '../../src/call/update-github-project-v2-item-field';
import { validateProject } from '../../src/call/update-github-project-v2-item-field';
import { Probot, Logger } from 'probot';

// Mock mutationId return
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => {
    return {
      toString: jest.fn().mockReturnValue('mutation-id'),
    };
  }),
}));

describe('updateGithubProjectV2ItemFieldFunctions', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let params: UpdateGithubProjectV2ItemFieldParams;

  beforeEach(() => {
    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    context = {
      payload: {
        label: { name: 'Roadmap:Ease of Use' },
        organization: { login: 'test-org' },
        repository: { name: 'test-repo' },
        issue: { number: 111, node_id: 'issue-111-nodeid' },
      },
      octokit: {
        graphql: jest.fn(),
      },
    };

    resource = {
      organizations: new Map([
        [
          'test-org',
          {
            repositories: new Map([['test-repo', 'repo object']]),
            projects: new Map([
              [
                222,
                {
                  nodeId: 'project-222-nodeid',
                  fields: new Map([
                    [
                      'Roadmap',
                      {
                        nodeId: 'field-333-nodeid',
                        fieldType: 'SINGLE_SELECT',
                        context: {
                          options: [
                            { id: 'option-666-nodeid', name: 'Ease of Use' },
                            { id: 'option-777-nodeid', name: 'Security' },
                          ],
                        },
                      },
                    ],
                  ]),
                },
              ],
            ]),
          },
        ],
      ]),
    };

    params = {
      itemId: 'item-111-nodeid',
      method: 'label',
      project: 'test-org/222',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateProjects', () => {
    it('should print error if validateProjects returns false', async () => {
      resource.organizations.get('test-org').projects.delete(222);

      const result = await validateProject(app, resource, params.project);

      expect(app.log.error).toHaveBeenCalledWith('Project 222 in organization test-org is not defined in resource config!');
      expect(result).toBe(false);
      expect(context.octokit.graphql).not.toHaveBeenCalled();
    });
  });

  describe('updateGithubProjectV2ItemField', () => {
    it('should print error and return null if it is not a issues.labeled event', async () => {
      context.payload.label = undefined;

      const result = await updateGithubProjectV2ItemField(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith("Only 'issues.labeled' event is supported on this call.");
      expect(result).toBe(null);
    });

    it('should print error and return null if itemId is not present', async () => {
      params.itemId = '';

      const result = await updateGithubProjectV2ItemField(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith('No Item Node Id provided in parameter.');
      expect(result).toBe(null);
    });

    it("should print error and return null if method is not 'label'", async () => {
      params.method = 'otherMethod';

      const result = await updateGithubProjectV2ItemField(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith("Only 'label' method is supported in this call at the moment.");
      expect(result).toBe(null);
    });

    it("should print error and return null if label does not match '<FieldName>:<Field>'", async () => {
      context.payload.label.name = 'Enhancement';

      const result = await updateGithubProjectV2ItemField(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith("Label 'Enhancement' is invalid. Please make sure your label is formatted as '<FieldName>:<FieldValue>'.");
      expect(result).toBe(null);
    });

    it('should print error and return null if field does not exist or field value / type not found', async () => {
      context.payload.label.name = 'Release:Access';

      const result = await updateGithubProjectV2ItemField(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith(
        "Either 'test-org/222' / 'Release' not exist, or 'Release' has an unsupported field type (currently support: SINGLE_SELECT)",
      );
      expect(result).toBe(null);
    });

    it('should print error and return null if graphql failed the call', async () => {
      context.octokit.graphql.mockRejectedValue(new Error('GraphQL request failed'));

      const result = await updateGithubProjectV2ItemField(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith('ERROR: Error: GraphQL request failed');
      expect(result).toBe(null);
    });

    it('should update field value when conditions are met', async () => {
      const graphQLResponse = {
        updateProjectV2ItemFieldValue: { projectV2Item: { id: 'update-item-id' } },
      };

      context.octokit.graphql.mockResolvedValue(graphQLResponse);

      const result = await updateGithubProjectV2ItemField(app, context, resource, params);

      /* prettier-ignore-start */
      const graphQLCallStack = `
          mutation {
            updateProjectV2ItemFieldValue(
              input: {
                clientMutationId: "mutation-id",
                projectId: "project-222-nodeid",
                itemId: "item-111-nodeid",
                fieldId: "field-333-nodeid",
                value: {
                  singleSelectOptionId: "option-666-nodeid"
                }
              }
            ) {
              projectV2Item {
                id
              }
            }
          }
        `;
      /* prettier-ignore-end */

      expect(context.octokit.graphql).toHaveBeenCalledWith(graphQLCallStack);
      expect(result).toBe('update-item-id');
      expect(app.log.info).toHaveBeenCalledWith(graphQLResponse);
    });
  });
});
