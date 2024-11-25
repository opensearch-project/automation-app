/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Logger, Probot } from 'probot';
import githubLabelCanaryMonitor, { LabelCanaryMonitorParams } from '../../src/call/github-label-canary-monitor';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

jest.mock('@aws-sdk/client-cloudwatch');

describe('githubEventsToS3', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let mockCloudWatchClient: any;
  let args: LabelCanaryMonitorParams;

  beforeEach(() => {
    args = {
      nameSpace: 'testNameSpace',
      metricName: 'testMetric',
      value: '1',
      unit: 'Count',
    };

    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    context = {
      name: 'name',
      id: 'id',
      payload: {
        repository: {
          name: 'repo',
          owner: { login: 'org' },
          private: false,
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

    mockCloudWatchClient = {
      send: jest.fn(),
    };
    (CloudWatchClient as jest.Mock).mockImplementation(() => mockCloudWatchClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should publish CloudWatch metric if event is label canary', async () => {
    context = {
      name: 'label',
      id: 'id',
      payload: {
        action: 'deleted',
        label: {
          name: 's3-data-lake-app-canary-label',
        },
        repository: {
          name: 'opensearch-metrics',
          private: false,
        },
      },
    };

    mockCloudWatchClient.send.mockResolvedValue({});

    await githubLabelCanaryMonitor(app, context, resource, args);

    expect(mockCloudWatchClient.send).toHaveBeenCalledWith(expect.any(PutMetricDataCommand));
    expect(app.log.info).toHaveBeenCalledWith('CloudWatch metric for monitoring published.');
  });

  it('should not publish CloudWatch metric if event is not label canary', async () => {
    context = {
      name: 'label',
      id: 'id',
      payload: {
        label: {
          name: 'normal-label',
        },
        repository: {
          name: 'opensearch-metrics',
          private: false,
        },
      },
    };

    mockCloudWatchClient.send.mockResolvedValue({});

    await githubLabelCanaryMonitor(app, context, resource, args);

    expect(mockCloudWatchClient.send).not.toHaveBeenCalledWith(expect.any(PutMetricDataCommand));
    expect(app.log.info).not.toHaveBeenCalledWith('CloudWatch metric for monitoring published.');
  });

  it('should log an error if CloudWatch metric publishing fails', async () => {
    context = {
      name: 'label',
      id: 'id',
      payload: {
        action: 'deleted',
        label: {
          name: 's3-data-lake-app-canary-label',
        },
        repository: {
          name: 'opensearch-metrics',
          private: false,
        },
      },
    };

    mockCloudWatchClient.send.mockRejectedValue(new Error('CloudWatch error'));

    await githubLabelCanaryMonitor(app, context, resource, args);

    expect(app.log.error).toHaveBeenCalledWith('Error Publishing CloudWatch metric for monitoring : Error: CloudWatch error');
  });
});
