/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import createIssueComment, { CreateIssueCommentParams } from '../../src/call/create-issue-comment';
import { Probot, Logger } from 'probot';

describe('createIssueCommentFunctions', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let args: CreateIssueCommentParams;
  let text: string;

  beforeEach(() => {
    text = 'is writing a comment in issue';
    args = {
      text: `${text}`,
    };
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
      issue: jest.fn().mockResolvedValue({
        body: `${args.text}`,
      }),
      octokit: {
        issues: {
          createComment: jest.fn().mockResolvedValue({
            data: {
              id: 1,
              user: {
                login: 'TestUser333',
              },
              body: `${text}`,
            },
          }),
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

  describe('createIssueComment', () => {
    it('should write comments based on user defined text', async () => {
      await createIssueComment(app, context, resource, args);
      expect(context.octokit.issues.createComment).toHaveBeenCalledWith({
        body: `${text}`,
      });
    });
  });
});
