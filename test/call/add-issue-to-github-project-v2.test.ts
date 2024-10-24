//import * as crypto from 'crypto';
import addIssueToGitHubProjectV2, { AddIssueToGitHubProjectV2Params } from '../../src/call/add-issue-to-github-project-v2';
import { validateProjects } from '../../src/call/add-issue-to-github-project-v2';
import { Probot, Logger } from 'probot';

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
      projects: ['test-org/222'],
    };

    jest.mock('crypto', () => ({
      randomBytes: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('mocked-mutation-id'),
      }),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateProjects', () => {
    it('should print error if validateProjects returns false', async () => {
      resource.organizations.get('test-org').projects.delete(222);

      const result = await validateProjects(app, resource, params.projects);

      expect(app.log.error).toHaveBeenCalledWith('Project 222 in organization test-org is not defined in resource config!');
      expect(result).toBe(false);
      expect(context.octokit.graphql).not.toHaveBeenCalled();
    });
  });

  describe('addIssueToGitHubProjectV2', () => {
    it('should print error if context label does not match the ones in resource config', async () => {
      context.payload.label.name = 'enhancement';
  
      const result = await addIssueToGitHubProjectV2(app, context, resource, params);
  
      expect(app.log.error).toHaveBeenCalledWith('"enhancement" is not defined in call paramter "labels": Meta,RFC.');
      expect(result).toBe('none');
      expect(context.octokit.graphql).not.toHaveBeenCalled();
    });
  });
});
