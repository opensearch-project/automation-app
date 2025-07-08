/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import labelByKeyword, { LabelByKeywordParams } from '../../src/call/label-by-keyword';
import { Probot, Logger } from 'probot';
import { ollamaGenerate } from '../../src/utility/llm/ollama-client';
import { bedrockConverse } from '../../src/utility/llm/bedrock-client';

// Mock mutationId return
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => {
    return {
      toString: jest.fn().mockReturnValue('mutation-id'),
    };
  }),
}));

jest.mock('../../src/utility/llm/ollama-client', () => ({
  ollamaGenerate: jest.fn().mockResolvedValue('true'),
  isOllamaRunning: jest.fn().mockResolvedValue(true),
  ollamaPull: jest.fn().mockResolvedValue(undefined),
  ollamaList: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/utility/llm/bedrock-client', () => ({
  bedrockConverse: jest.fn().mockResolvedValue('true'),
  bedrockClient: {},
}));

describe('labelByKeywordFunctions', () => {
  let app: Probot;
  let context: any;
  let resource: any;
  let params: LabelByKeywordParams;

  beforeEach(() => {
    app = new Probot({ appId: 1, secret: 'test', privateKey: 'test' });
    app.log = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as Logger;

    context = {
      payload: {
        label: { name: 'Meta' },
        organization: { login: 'test-org' },
        repository: { owner: { login: 'test-org' }, name: 'test-repo' },
        issue: { number: 111, node_id: 'issue-111-nodeid', title: 'test-title', body: 'test-body' },
      },
      octokit: {
        graphql: jest.fn(),
        rest: {
          issues: {
            addLabels: jest.fn(),
          },
        },
      },
      name: 'issues',
    };

    resource = {
      organizations: new Map([
        [
          'test-org',
          {
            projects: new Map([[222, { nodeId: 'project-222-nodeid' }]]),
            repositories: new Map([['test-repo', 'repo object']]),
          },
        ],
      ]),
    };

    params = {
      keyword: 'TEST',
      keywordIgnoreCase: 'true',
      llmPrompt: '',
      llmProvider: 'ollama',
      llmModel: 'qwen2.5:3b',
      label: 'test',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('labelByKeyword', () => {
    it('Print error and return if keyword and label is empty', async () => {
      await labelByKeyword(app, context, resource, {
        keyword: '',
        keywordIgnoreCase: '',
        llmPrompt: '',
        llmProvider: '',
        llmModel: '',
        label: '',
      });

      expect(app.log.error).toHaveBeenCalledWith("Invalid input, keyword: '', label: ''");
    });

    it('Set keywordIgnoreCase to false by default if user does not define', async () => {
      await labelByKeyword(app, context, resource, {
        keyword: 'Test',
        keywordIgnoreCase: '',
        llmPrompt: '',
        llmProvider: '',
        llmModel: '',
        label: 'test',
      });

      expect(app.log.info).toHaveBeenCalledWith('keyword Test not found on: test-org/test-repo/111');
    });

    it('Normal calling with defined parameters for all', async () => {
      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'false'");
      expect(app.log.info).toHaveBeenCalledWith('Updating label on: test-org/test-repo/111');
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledTimes(1);
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 111,
        labels: ['test'],
      });
    });

    it('If event name is not issue or pull_request, print error output', async () => {
      context = {
        payload: {
          label: { name: 'Meta' },
          organization: { login: 'test-org' },
          repository: { owner: { login: 'test-org' }, name: 'test-repo' },
          issue: { number: 111, node_id: 'issue-111-nodeid', title: 'test-title', body: 'test-body' },
        },
        name: 'project',
      };
      await labelByKeyword(app, context, resource, params);

      expect(app.log.error).toHaveBeenCalledWith("Only 'issues' and 'pull_request' events are accepted here!");
    });

    it('Octokit failed call with error msg', async () => {
      context.octokit.rest = {
        issues: {
          addLabels: jest.fn().mockRejectedValue(new Error('GitHub API failed')),
        },
      };
      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'false'");
      expect(app.log.info).toHaveBeenCalledWith('Updating label on: test-org/test-repo/111');
      expect(app.log.error).toHaveBeenCalledWith('ERROR: Error: GitHub API failed');
    });

    it('Use pr values when it is a pull_request', async () => {
      context.name = 'pull_request';
      delete context.payload.issue;

      context.payload.pull_request = { number: 111, node_id: 'issue-111-nodeid', title: 'test-title', body: 'test-body' };
      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'false'");
      expect(app.log.info).toHaveBeenCalledWith('Updating label on: test-org/test-repo/111');
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 111,
        labels: ['test'],
      });
    });

    it('Use ollama for semantic matching when llmPrompt is provided', async () => {
      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'ollama',
        llmModel: 'qwen2.5:3b',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'true'");
      expect(ollamaGenerate).toHaveBeenCalledWith('Title: test-title\nBody: test-body. Is this related to testing?', 'qwen2.5:3b');
      expect(app.log.info).toHaveBeenCalledWith("Keyword semantic matching through llm analysis (ollama): 'true'");
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 111,
        labels: ['test'],
      });
    });

    it('Use LLM bedrock for semantic matching when llmPrompt is provided', async () => {
      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'bedrock',
        llmModel: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'true'");
      expect(bedrockConverse).toHaveBeenCalledWith(
        'Title: test-title\nBody: test-body. Is this related to testing?',
        'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        3,
        'us-east-1',
      );
      expect(app.log.info).toHaveBeenCalledWith("Keyword semantic matching through llm analysis (bedrock): 'true'");
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-org',
        repo: 'test-repo',
        issue_number: 111,
        labels: ['test'],
      });
    });

    it('Skip label update when ollama returns false', async () => {
      (ollamaGenerate as jest.Mock).mockResolvedValueOnce('false');

      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'ollama',
        llmModel: 'qwen2.5:3b',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(ollamaGenerate).toHaveBeenCalledWith('Title: test-title\nBody: test-body. Is this related to testing?', 'qwen2.5:3b');
      expect(app.log.info).toHaveBeenCalledWith("Keyword semantic matching through llm analysis (ollama): 'false'");
      expect(app.log.info).toHaveBeenCalledWith('Ignore issue update: test-org/test-repo/111');
      expect(context.octokit.rest.issues.addLabels).not.toHaveBeenCalled();
    });

    it('Skip label update when bedrock returns false', async () => {
      (bedrockConverse as jest.Mock).mockResolvedValueOnce('false');

      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'bedrock',
        llmModel: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(bedrockConverse).toHaveBeenCalledWith(
        'Title: test-title\nBody: test-body. Is this related to testing?',
        'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        3,
        'us-east-1',
      );
      expect(app.log.info).toHaveBeenCalledWith("Keyword semantic matching through llm analysis (bedrock): 'false'");
      expect(app.log.info).toHaveBeenCalledWith('Ignore issue update: test-org/test-repo/111');
      expect(context.octokit.rest.issues.addLabels).not.toHaveBeenCalled();
    });

    it('Falls back to simple matching when LLM provider is not supported', async () => {
      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'hellollama',
        llmModel: 'qwen2.5:3b',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'true'");
      expect(app.log.warn).toHaveBeenCalledWith('Not supporting hellollama as llm provider, fallback to simple text matching now ...');
      expect(app.log.info).toHaveBeenCalledWith('Updating label on: test-org/test-repo/111');
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalled();
    });

    it('Falls back to simple matching when ollama throws an error', async () => {
      (ollamaGenerate as jest.Mock).mockRejectedValueOnce(new Error('Ollama error'));

      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'ollama',
        llmModel: 'qwen2.5:3b',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'true'");
      expect(app.log.error).toHaveBeenCalledWith('ERROR: Error: Ollama error');
      expect(app.log.warn).toHaveBeenCalledWith('Error in ollama, fallback to simple text matching now ...');
      expect(app.log.info).toHaveBeenCalledWith('Updating label on: test-org/test-repo/111');
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalled();
    });

    it('Falls back to simple matching when bedrock throws an error', async () => {
      (bedrockConverse as jest.Mock).mockRejectedValueOnce(new Error('Bedrock error'));

      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'bedrock',
        llmModel: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'true'");
      expect(app.log.error).toHaveBeenCalledWith('ERROR: Error: Bedrock error');
      expect(app.log.warn).toHaveBeenCalledWith('Error in bedrock, fallback to simple text matching now ...');
      expect(app.log.info).toHaveBeenCalledWith('Updating label on: test-org/test-repo/111');
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalled();
    });

    it('Uses default modelId when not provided for ollama', async () => {
      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'ollama',
        llmModel: '',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'true'");
      expect(ollamaGenerate).toHaveBeenCalledWith('Title: test-title\nBody: test-body. Is this related to testing?', 'qwen2.5:3b');
      expect(app.log.info).toHaveBeenCalledWith("Keyword semantic matching through llm analysis (ollama): 'true'");
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalled();
    });

    it('Uses default modelId when not provided for bedrock', async () => {
      const params = {
        keyword: 'TEST',
        keywordIgnoreCase: 'true',
        llmPrompt: 'Is this related to testing?',
        llmProvider: 'bedrock',
        llmModel: '',
        label: 'test',
      };

      await labelByKeyword(app, context, resource, params);

      expect(app.log.info).toHaveBeenCalledWith("keyword 'test' found, keywordIgnoreCase = 'true', label = 'test', useLLM = 'true'");
      expect(bedrockConverse).toHaveBeenCalledWith(
        'Title: test-title\nBody: test-body. Is this related to testing?',
        'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        3,
        'us-east-1',
      );
      expect(app.log.info).toHaveBeenCalledWith("Keyword semantic matching through llm analysis (bedrock): 'true'");
      expect(context.octokit.rest.issues.addLabels).toHaveBeenCalled();
    });
  });
});
