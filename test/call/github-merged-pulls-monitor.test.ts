/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import githubMergedPullsMonitor from '../../src/call/github-merged-pulls-monitor';
import { Probot, Logger } from 'probot';
import { OpensearchClient } from '../../src/utility/opensearch/opensearch-client';

jest.mock('../../src/utility/opensearch/opensearch-client');

describe('githubMergedPullsMonitor', () => {
  let app: Probot;
  let context: any;
  let resource: any;

  beforeEach(() => {
    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
    context = {
      payload: {
        pull_request: {
          merged: true,
          number: 123,
          html_url: 'https://github.com/org/repo/pull/123',
          url: 'https://api.github.com/repos/org/repo/pulls/123',
          user: { login: 'octocat' },
          created_at: '2023-09-25T12:00:00Z',
          updated_at: '2023-09-26T12:00:00Z',
          closed_at: '2023-09-26T13:00:00Z',
          merged_at: '2023-09-26T14:00:00Z',
          merged_by: { login: 'merger' },
          head: { sha: 'abcdef123456' },
          merge_commit_sha: 'fedcba654321',
        },
        repository: {
          name: 'repo',
          owner: { login: 'org' },
        },
      },
      octokit: {
        checks: {
          listForRef: jest.fn().mockResolvedValue({
            data: {
              check_runs: [
                {
                  id: 1,
                  name: 'Test Check',
                  conclusion: 'success',
                  status: 'completed',
                  started_at: '2023-09-26T13:00:00Z',
                  completed_at: '2023-09-26T14:00:00Z',
                  html_url: 'https://github.com/org/repo/checks/1',
                  url: 'https://api.github.com/repos/org/repo/check-runs/1',
                },
              ],
            },
          }),
        },
      },
      log: {
        info: jest.fn(),
        error: jest.fn(),
      },
    };
    resource = {
      organizations: new Map([
        [
          'org',
          {
            repositories: new Map([['repo', 'repo object']]),
          },
        ],
      ]),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should skip processing if the pull request is not merged', async () => {
    context.payload.pull_request.merged = false;
    await githubMergedPullsMonitor(app, context, resource);
    expect(app.log.info).toHaveBeenCalledWith('PR is closed but not merged. Skipping...');
  });

  it('should index merged pull request check runs', async () => {
    const mockBulkIndex = jest.spyOn(OpensearchClient.prototype, 'bulkIndex').mockResolvedValue();
    await githubMergedPullsMonitor(app, context, resource);
    expect(context.octokit.checks.listForRef).toHaveBeenCalledWith({
      owner: 'org',
      repo: 'repo',
      ref: 'abcdef123456',
    });
    expect(mockBulkIndex).toHaveBeenCalledWith(
      expect.stringMatching(/^github-pulls-ci-workflow-runs-\d{2}-\d{4}$/),
      expect.arrayContaining([
        expect.objectContaining({
          number: 123,
          merged: true,
          repository: 'repo',
          organization: 'org',
          name: 'Test Check',
          conclusion: 'success',
        }),
      ]),
    );
    expect(app.log.info).toHaveBeenCalledWith('All log data indexed successfully.');
  });

  it('should log an error if bulk indexing fails', async () => {
    jest.spyOn(OpensearchClient.prototype, 'bulkIndex').mockRejectedValue(new Error('Indexing failed'));
    await githubMergedPullsMonitor(app, context, resource);
    expect(app.log.error).toHaveBeenCalledWith('Error indexing log data: Error: Indexing failed');
  });
});
