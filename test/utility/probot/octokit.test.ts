/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { octokitAuth } from '../../../src/utility/probot/octokit';
import { Probot, ProbotOctokit, Logger } from 'probot';

describe('octokitFunctions', () => {
  let app: Probot;
  let installationId: number;
  let octokitMock: ProbotOctokit

  beforeEach(() => {
    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    octokitMock = {} as ProbotOctokit;
    app.auth = jest.fn().mockResolvedValue(octokitMock);

    installationId = 123;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('octokitAuth', () => {
    it('should fail if no installation id', async () => {
      await expect(octokitAuth(app, undefined as any)).rejects.toThrowError('Please provide installation id of your github app!');
    });

    it('should call app.auth if installationId present and return ProbotOctokit', async () => {
      const result = await octokitAuth(app, installationId);

      expect(app.auth).toHaveBeenCalledWith(installationId);
      expect(result).toBe(octokitMock);
    });
  });
});
