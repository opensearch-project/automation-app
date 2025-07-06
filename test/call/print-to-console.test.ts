/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Probot, Logger } from 'probot';
import printToConsole, { PrintToConsoleParams, printToConsoleHelloWorld } from '../../src/call/print-to-console';
import { validateResourceConfig } from '../../src/utility/verification/verify-resource';

jest.mock('../../src/utility/verification/verify-resource', () => ({
  validateResourceConfig: jest.fn().mockResolvedValue(true),
}));

describe('printToConsoleFunctions', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let args: PrintToConsoleParams;

  beforeEach(() => {
    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
    context = {
      payload: {
        repository: {
          name: 'repo',
          owner: { login: 'org' },
        },
        organization: {
          login: 'org',
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
    args = {
      text: 'test message 123',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('printToConsole', () => {
    it('should print defined text in task', async () => {
      await printToConsole(app, context, resource, args);
      expect(app.log.info).toHaveBeenCalledWith('test message 123');
    });

    it('should not print if resource validation fails', async () => {
      (validateResourceConfig as jest.Mock).mockResolvedValue(false);
      await printToConsole(app, context, resource, args);
      expect(app.log.info).not.toHaveBeenCalled();
    });
  });

  describe('printToConsoleHelloWorld', () => {
    it('should print Hello World in task', async () => {
      (validateResourceConfig as jest.Mock).mockResolvedValue(true);
      await printToConsoleHelloWorld(app, context, resource);
      expect(app.log.info).toHaveBeenCalledWith('Hello World');
    });

    it('should not print if resource validation fails', async () => {
      (validateResourceConfig as jest.Mock).mockResolvedValue(false);
      await printToConsoleHelloWorld(app, context, resource);
      expect(app.log.info).not.toHaveBeenCalled();
    });
  });
});
