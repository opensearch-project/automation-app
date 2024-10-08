/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Logger, Probot } from 'probot';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import githubEventsToS3 from '../../src/call/github-events-to-s3';

jest.mock('@aws-sdk/client-s3');

describe('githubWorkflowRunsMonitor', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let mockS3Client: any;

  beforeEach(() => {
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

    mockS3Client = {
      send: jest.fn(),
    };
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);
  });

  it('should upload to S3 on event listened', async () => {
    mockS3Client.send.mockResolvedValue({});

    await githubEventsToS3(app, context, resource);

    expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(app.log.info).toHaveBeenCalledWith('GitHub Event uploaded to S3 successfully.');
  });

  it('should log an error if S3 upload fails', async () => {
    mockS3Client.send.mockRejectedValue(new Error('S3 error'));

    await githubEventsToS3(app, context, resource);

    expect(app.log.error).toHaveBeenCalledWith('Error uploading GitHub Event to S3 : Error: S3 error');
  });
});
