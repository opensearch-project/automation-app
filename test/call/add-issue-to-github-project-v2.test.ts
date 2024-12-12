/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import addIssueToGitHubProjectV2, { AddIssueToGitHubProjectV2Params } from '../../src/call/add-issue-to-github-project-v2';
import { validateProject } from '../../src/call/add-issue-to-github-project-v2';
import { Probot, Logger } from 'probot';

// Mock mutationId return
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => {
    return {
      toString: jest.fn().mockReturnValue('mutation-id'),
    };
  }),
}));

describe('addIssueToGitHubProjectV2Functions', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let params: AddIssueToGitHubProjectV2Params;

  beforeEach(() => {
    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    context = {
      payload: {
        label: { name: 'Meta' },
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
            projects: new Map([[222, { nodeId: 'project-222-nodeid' }]]),
            repositories: new Map([['test-repo', 'repo object']]),
          },
        ],
      ]),
    };

    params = {
      labels: ['Meta', 'RFC'],
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

  describe('addIssueToGitHubProjectV2', () => {
    it('should print error and return null if it is not a issues.labeled event', async () => {
      context.payload.label = undefined;

      const result = await addIssueToGitHubProjectV2(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith("Only 'issues.labeled' event is supported on this call.");
      expect(result).toBe(null);
    });

    it('should print error if context label does not match the ones in resource config', async () => {
      context.payload.label.name = 'enhancement';

      const result = await addIssueToGitHubProjectV2(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith('"enhancement" is not defined in call paramter "labels": Meta,RFC.');
      expect(result).toBe(null);
      expect(context.octokit.graphql).not.toHaveBeenCalled();
    });

    it('should add issue to project when conditions are met', async () => {
      const graphQLResponse = {
        addProjectV2ItemById: { item: { id: 'new-item-id' } },
      };

      context.octokit.graphql.mockResolvedValue(graphQLResponse);

      const result = await addIssueToGitHubProjectV2(app, context, resource, params);

      /* prettier-ignore-start */
      const graphQLCallStack = `
          mutation {
            addProjectV2ItemById(input: {
              clientMutationId: "mutation-id",
              contentId: "issue-111-nodeid",
              projectId: "project-222-nodeid",
            }) {
              item {
                id
              }
            }
          }
        `;
      /* prettier-ignore-end */

      expect(context.octokit.graphql).toHaveBeenCalledWith(graphQLCallStack);
      expect(result).toBe('new-item-id');
      expect(app.log.info).toHaveBeenCalledWith(graphQLResponse);
    });

    it('should print log error when GraphQL call fails', async () => {
      context.octokit.graphql.mockRejectedValue(new Error('GraphQL request failed'));

      const result = await addIssueToGitHubProjectV2(app, context, resource, params);

      expect(context.octokit.graphql).rejects.toThrow('GraphQL request failed');
      expect(context.octokit.graphql).toHaveBeenCalled();
      expect(result).toBe(null);
      expect(app.log.error).toHaveBeenCalledWith('ERROR: Error: GraphQL request failed');
    });
  });
});
