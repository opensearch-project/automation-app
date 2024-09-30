/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { octokitAuth } from '../../../src/utility/probot/octokit';
import { Probot, Logger } from 'probot';

describe('octokitFunctions', () => {
  let app: Probot;
  let installationId: number;

  beforeEach(() => {
    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  describe('octokitAuth', () => {
    it('should fail if no installation id', async () => {
      await expect(octokitAuth(app, installationId)).rejects.toThrowError('Please provide installation id of your github app!');
    });
  });
});
