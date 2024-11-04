/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { validateResourceConfig } from '../../../src/utility/verification/verify-resource';
import { Probot, Logger } from 'probot';

describe('verifyResourceFunctions', () => {
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
      payload: {},
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

  describe('validateResourceConfig', () => {
    it('should fail if no org or repo data in payload', async () => {
      const result = await validateResourceConfig(app, context, resource);
      expect(app.log.error).toHaveBeenCalledWith('undefined/undefined is not defined in resource config!');
      expect(result).toBe(false);
    });

    it('should fail if organization exist but repo not exist', async () => {
      context.payload = {
        organization: {
          login: 'org',
        },
      };
      const result = await validateResourceConfig(app, context, resource);
      expect(app.log.error).toHaveBeenCalledWith('org/undefined is not defined in resource config!');
      expect(result).toBe(false);
    });

    it('should fail if repository/owner exist but repo not exist', async () => {
      context.payload = {
        repository: {
          owner: {
            login: 'org',
          },
        },
      };
      const result = await validateResourceConfig(app, context, resource);
      expect(app.log.error).toHaveBeenCalledWith('org/undefined is not defined in resource config!');
      expect(result).toBe(false);
    });

    it('should fail if repo exist but organization or repository/owner not exist', async () => {
      context.payload = {
        repository: {
          name: 'repo',
        },
      };
      const result = await validateResourceConfig(app, context, resource);
      expect(app.log.error).toHaveBeenCalledWith('undefined/repo is not defined in resource config!');
      expect(result).toBe(false);
    });

    it('should pass if both organization/login and repository/name match respectively', async () => {
      context.payload = {
        organization: {
          login: 'org',
        },
        repository: {
          name: 'repo',
        },
      };
      const result = await validateResourceConfig(app, context, resource);
      expect(result).toBe(true);
    });

    it('should pass if both repository/owner/login and repository/name match respectively', async () => {
      context.payload = {
        organization: {
          login: 'org',
        },
        repository: {
          name: 'repo',
        },
      };
      const result = await validateResourceConfig(app, context, resource);
      expect(result).toBe(true);
    });
  });
});
