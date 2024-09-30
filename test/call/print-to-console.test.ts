/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import printToConsole, { PrintToConsoleParams, printToConsoleHelloWorld } from '../../src/call/print-to-console';
import { Probot, Logger } from 'probot';

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

  describe('printToConsole', () => {
    it('should print defined text in task', async () => {
      await printToConsole(app, context, resource, args);
      expect(app.log.info).toHaveBeenCalledWith('test message 123');
    });
  });

  describe('printToConsoleHelloWorld', () => {
    it('should print Hello World in task', async () => {
      await printToConsoleHelloWorld(app, context, resource);
      expect(app.log.info).toHaveBeenCalledWith('Hello World');
    });
  });
});
