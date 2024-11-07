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

describe('githubEventsToS3', () => {
  let app: Probot;
  let context: any;
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
          private: false,
        },
      },
    };

    mockS3Client = {
      send: jest.fn(),
    };
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload to S3 on event listened', async () => {
    mockS3Client.send.mockResolvedValue({});

    await githubEventsToS3(app, context);

    expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(app.log.info).toHaveBeenCalledWith('GitHub Event uploaded to S3 successfully.');
  });

  it('should not upload to S3 on event listened on private repo', async () => {
    context = {
      name: 'name',
      id: 'id',
      payload: {
        repository: {
          name: 'repo',
          owner: { login: 'org' },
          private: true,
        },
      },
    };
    mockS3Client.send.mockResolvedValue({});

    await githubEventsToS3(app, context);

    expect(mockS3Client.send).not.toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(app.log.error).toHaveBeenCalledWith('Event from repo skipped because it is a private repository.');
  });

  it('should log an error if S3 upload fails', async () => {
    mockS3Client.send.mockRejectedValue(new Error('S3 error'));

    await githubEventsToS3(app, context);

    expect(app.log.error).toHaveBeenCalledWith('Error uploading GitHub Event to S3 : Error: S3 error');
  });

  it('S3 key name set with action', async () => {
    context = {
      name: 'name',
      id: 'id',
      payload: {
        repository: {
          name: 'repo',
          owner: { login: 'org' },
          private: false,
        },
        action: 'action',
      },
    };

    jest.spyOn(Date.prototype, 'getDate').mockReturnValue(4);
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(8);
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-10-04T21:00:06.875Z');

    await githubEventsToS3(app, context);

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Body: expect.stringMatching('"uploaded_at":"2024-10-04T21:00:06.875Z"'),
        Key: expect.stringMatching(`name.action/2024-09-04/repo-id`),
      }),
    );
  });

  it('S3 key name set without action', async () => {
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

    jest.spyOn(Date.prototype, 'getDate').mockReturnValue(4);
    jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(8);
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-10-04T21:00:06.875Z');

    await githubEventsToS3(app, context);

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Body: expect.stringMatching('"uploaded_at":"2024-10-04T21:00:06.875Z"'),
        Key: expect.stringMatching(`name/2024-09-04/repo-id`),
      }),
    );
  });
});
