/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import githubWorkflowRunsMonitor from '../../src/call/github-workflow-runs-monitor';
import { Probot, Logger } from 'probot';
import { OpensearchClient } from '../../src/utility/opensearch/opensearch-client';

jest.mock('../../src/utility/opensearch/opensearch-client');

describe('githubWorkflowRunsMonitor', () => {
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
        workflow_run: {
          event: 'push',
          id: 123,
          name: 'Publish snapshots to maven',
          head_branch: 'main',
          head_sha: 'abcdef123456',
          path: '/path/to/workflow',
          display_title: 'Publish snapshots to maven',
          created_at: '2023-09-25T12:00:00Z',
          run_started_at: '2023-09-26T12:00:00Z',
          updated_at: '2023-09-26T13:00:00Z',
          completed_at: '2023-09-26T14:00:00Z',
          triggering_actor: {
            login: 'test-user',
            type: 'User',
          },
          url: 'http://example.com',
          html_url: 'http://example.com/html',
          status: 'completed',
          conclusion: 'success',
          jobs_url: 'http://example.com/jobs',
        },
        repository: {
          name: 'repo',
          owner: { login: 'org' },
        },
        organization: {
          login: 'org',
        },
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

  it('should skip indexing when the event is not relevant', async () => {
    const events = ['pull_request', 'release'];
    const workflows = ['Publish snapshots to maven'];
    context.payload.workflow_run.event = 'push';

    await githubWorkflowRunsMonitor(app, context, resource, { events, workflows });

    expect(app.log.info).toHaveBeenCalledWith('Event not relevant. Not Indexing...');
  });

  it('should skip indexing when the workflow is not relevant', async () => {
    const events = ['pull_request', 'release'];
    const workflows = ['Publish snapshots to maven'];
    context.payload.workflow_run.name = 'Sample Workflow';
    context.payload.workflow_run.event = 'pull_request';

    await githubWorkflowRunsMonitor(app, context, resource, { events, workflows });

    expect(app.log.info).toHaveBeenCalledWith('Workflow not relevant. Not Indexing...');
  });

  it('should index log data when the event is relevant', async () => {
    const events = ['push', 'pull_request'];
    const workflows = ['Publish snapshots to maven'];

    const mockClient = {
      index: jest.fn().mockResolvedValue({}),
    };
    (OpensearchClient as jest.Mock).mockImplementation(() => {
      return { getClient: jest.fn().mockResolvedValue(mockClient) };
    });
    await githubWorkflowRunsMonitor(app, context, resource, { events, workflows });
    expect(mockClient.index).toHaveBeenCalledWith({
      index: expect.stringMatching(/^github-ci-workflow-runs-\d{2}-\d{4}$/),
      body: expect.objectContaining({
        event: 'push',
        repository: 'repo',
        organization: 'org',
        id: 123,
        name: 'Publish snapshots to maven',
        head_branch: 'main',
        head_sha: 'abcdef123456',
        triggering_actor_login: 'test-user',
        triggering_actor_type: 'User',
      }),
    });
    expect(app.log.info).toHaveBeenCalledWith('Log data indexed successfully.');
  });

  it('should log an error if indexing fails', async () => {
    const events = ['push', 'pull_request'];
    const workflows = ['Publish snapshots to maven'];

    const mockClient = {
      index: jest.fn().mockRejectedValue(new Error('Indexing failed')),
    };
    (OpensearchClient as jest.Mock).mockImplementation(() => {
      return { getClient: jest.fn().mockResolvedValue(mockClient) };
    });
    await githubWorkflowRunsMonitor(app, context, resource, { events, workflows });
    expect(app.log.error).toHaveBeenCalledWith('Error indexing log data: Error: Indexing failed');
  });
});
