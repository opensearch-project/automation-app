/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import labelByKeyword, { LabelByKeywordParams } from '../../src/call/label-by-keyword';
import { Probot, Logger } from 'probot';

// Mock mutationId return
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => {
    return {
      toString: jest.fn().mockReturnValue('mutation-id'),
    };
  }),
}));

describe('labelByKeywordFunctions', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let params: LabelByKeywordParams;

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
        repository: { owner: { login: 'test-org' }, name: 'test-repo' },
        issue: { number: 111, node_id: 'issue-111-nodeid', title: 'test-title', body: 'test-body' },
      },
      octokit: {
        graphql: jest.fn(),
        rest: {
          issues: {
            addLabels: jest.fn(),
          },
        },
      },
      name: 'issues',
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
      keyword: 'TEST',
      keywordIgnoreCase: 'true',
      label: 'test',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('labelByKeyword', () => {
    it('Print error and return if keyword and label is empty', async () => {
      await labelByKeyword(app, context, resource, {
        keyword: '',
        keywordIgnoreCase: '',
        label: '',
      });

      expect(app.log.error).toHaveBeenCalledWith("Invalid input, keyword: '', label: ''");
    });

    it('Set keywordIgnoreCase to true by default if user does not define', async () => {
      await labelByKeyword(app, context, resource, {
        keyword: 'Test',
        keywordIgnoreCase: '',
        label: 'test',
      });

      expect(app.log.info).toHaveBeenCalledWith("Keyword 'Test' found, keywordIgnoreCase = 'true', adding label 'test'");
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 111,
        labels: ['test'],
      });
    });

    it('Normal calling with defined parameters for all', async () => {
      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("Keyword 'TEST' found, keywordIgnoreCase = 'true', adding label 'test'");
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 111,
        labels: ['test'],
      });
    });

    it('If event name is not issue or pull_request, print error output', async () => {
      context = {
        payload: {
          label: { name: 'Meta' },
          organization: { login: 'test-org' },
          repository: { owner: { login: 'test-org' }, name: 'test-repo' },
          issue: { number: 111, node_id: 'issue-111-nodeid', title: 'test-title', body: 'test-body' },
        },
        name: 'project',
      };
      await labelByKeyword(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith("Only 'issues' and 'pull_request' events are accepted here!");
    });

    it('Octokit failed call with error msg', async () => {
      context.octokit.rest = {
        issues: {
          addLabels: jest.fn().mockRejectedValue(new Error('GitHub API failed')),
        },
      };
      await labelByKeyword(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith('ERROR: Error: GitHub API failed');
    });

    it('Use pr values when it is a pull_request', async () => {
      context.name = 'pull_request';
      delete context.payload.issue;

      (context.payload.pull_request = { number: 111, node_id: 'issue-111-nodeid', title: 'test-title', body: 'test-body' }),
        await labelByKeyword(app, context, resource, params);

      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 111,
        labels: ['test'],
      });
    });
  });
});
