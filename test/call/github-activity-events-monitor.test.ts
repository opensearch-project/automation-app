/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Logger, Probot } from 'probot';
import { OpensearchClient } from '../../src/utility/opensearch/opensearch-client';
import githubActivityEventsMonitor from '../../src/call/github-activity-events-monitor';

jest.mock('../../src/utility/opensearch/opensearch-client');

describe('githubActivityEventsMonitor', () => {
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
      name: 'eventType',
      id: 'id',
      payload: {
        repository: {
          name: 'repo',
          owner: { login: 'org' },
        },
        action: 'action',
        sender: {
          login: 'sender',
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

  it('should index events', async () => {
    const mockClient = {
      index: jest.fn().mockResolvedValue({}),
    };
    (OpensearchClient as jest.Mock).mockImplementation(() => {
      return { getClient: jest.fn().mockResolvedValue(mockClient) };
    });
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-10-04T21:00:06.875Z');
    await githubActivityEventsMonitor(app, context, resource);
    expect(mockClient.index).toHaveBeenCalledWith({
      index: expect.stringMatching(/^github-activity-events-\d{2}-\d{4}$/),
      body: expect.objectContaining({
        id: 'id',
        organization: 'org',
        repository: 'repo',
        type: 'eventType',
        action: 'action',
        sender: 'sender',
        created_at: '2024-10-04T21:00:06.875Z',
      }),
    });
    expect(app.log.info).toHaveBeenCalledWith('Event indexed successfully.');
  });

  it('should log an error if indexing fails', async () => {
    const mockClient = {
      index: jest.fn().mockRejectedValue(new Error('Indexing failed')),
    };
    (OpensearchClient as jest.Mock).mockImplementation(() => {
      return { getClient: jest.fn().mockResolvedValue(mockClient) };
    });
    await githubActivityEventsMonitor(app, context, resource);
    expect(app.log.error).toHaveBeenCalledWith('Error indexing event: Error: Indexing failed');
  });
});
