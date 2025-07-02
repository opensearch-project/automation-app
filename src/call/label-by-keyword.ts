/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name                  : labelByKeyword
// Description           : label an issue or pr by keyword found in title/body of an issue or pull_request, assuming label exist
// Arguments             :
//   - keyword           : (string) the text string to be used as keyword, required parameter
//   - keywordIgnoreCase : (string) whether or not to ignore cases in keyword matching, default is 'false'
//   - llmPrompt         : (string) the prompt send to llm to improve semantic matching after simple text match of the keyword, default to '' which disables it
//   - llmProvider       : (string) which llm provider do you choose to use to process llmPrompt, default to 'ollama', supports 'ollama', 'bedrock'
//   - llmModel          : (string) which llm model do you choose to use to process llmPrompt with llmProvider,
//                       :          default to 'qwen2.5:3b' for 'ollama', and 'us.anthropic.claude-3-5-haiku-20241022-v1:0' for 'bedrock'
//   - label             : (string) the name of the label already created in corresponding repository

import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';
import { ollamaGenerate } from '../utility/llm/ollama-client';
import { bedrockInvoke } from '../utility/llm/bedrock-client';

export interface LabelByKeywordParams {
  keyword: string;
  keywordIgnoreCase: string;
  llmPrompt: string;
  llmProvider: string;
  llmModel: string;
  label: string;
}

export default async function labelByKeyword(
  app: Probot,
  context: any,
  resource: Resource,
  { keyword, keywordIgnoreCase, llmPrompt, llmProvider, llmModel, label }: LabelByKeywordParams,
): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;

  if (!keyword || !label) {
    app.log.error(`Invalid input, keyword: '${keyword}', label: '${label}'`);
    return;
  }

  const keywordIgnoreCaseProcess = keywordIgnoreCase?.trim() || 'false';
  const keywordProcess = keywordIgnoreCaseProcess === 'true' ? keyword.trim().toLowerCase() : keyword.trim();
  const llmProviderProcess = llmProvider?.trim() || 'ollama';
  const llmModelProcess = llmModel?.trim() || (llmProvider === 'ollama' ? 'qwen2.5:3b' : 'us.anthropic.claude-3-5-haiku-20241022-v1:0');
  const labelProcess = label.trim();

  const eventName = String(context.name);
  if (eventName !== 'issues' && eventName !== 'pull_request') {
    app.log.error("Only 'issues' and 'pull_request' events are accepted here!");
    return;
  }

  const title = context.payload.issue?.title ?? context.payload.pull_request.title;
  const body = context.payload.issue?.body ?? context.payload.pull_request.body;
  const text = `Title: ${title}\nBody: ${body}`;

  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const issue_number = context.payload.issue?.number ?? context.payload.pull_request.number; // eslint-disable-line

  const textProcess = keywordIgnoreCaseProcess === 'true' ? text.trim().toLowerCase() : text.trim();

  if (textProcess.includes(keywordProcess)) {
    let matchResponse = 'true';
    const useLLM = !!llmPrompt;

    app.log.info(`keyword '${keywordProcess}' found, keywordIgnoreCase = '${keywordIgnoreCaseProcess}', label = '${labelProcess}', useLLM = '${useLLM}'`);

    if (useLLM) {
      try {
        if (llmProviderProcess === 'ollama') {
          matchResponse = (await ollamaGenerate(`${text}. ${llmPrompt}`, llmModelProcess))
            .replaceAll(/[^a-zA-Z]/g, '')
            .trim()
            .toLowerCase();
          app.log.info(`Keyword semantic matching through llm analysis (ollama): '${matchResponse}'`);
        } else if (llmProviderProcess === 'bedrock') {
          matchResponse = (await bedrockInvoke(`${text}. ${llmPrompt}`, llmModelProcess, 3))
            .replaceAll(/[^a-zA-Z]/g, '')
            .trim()
            .toLowerCase();
          app.log.info(`Keyword semantic matching through llm analysis (bedrock): '${matchResponse}'`);
        } else {
          app.log.warn(`Not supporting ${llmProviderProcess} as llm provider, fallback to simple text matching now ...`);
          matchResponse = 'true';
        }
      } catch (e) {
        app.log.error(`ERROR: ${e}`);
        app.log.warn(`Error in ${llmProviderProcess}, fallback to simple text matching now ...`);
        matchResponse = 'true';
      }
    }

    if (matchResponse === 'false') {
      app.log.info(`Ignore issue update: ${owner}/${repo}/${issue_number}`);
    } else {
      app.log.info(`Updating label on: ${owner}/${repo}/${issue_number}`);
      try {
        await context.octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number,
          labels: [`${labelProcess}`],
        });
      } catch (e) {
        app.log.error(`ERROR: ${e}`);
      }
    }
  } else {
    app.log.info(`keyword ${keywordProcess} not found on: ${owner}/${repo}/${issue_number}`);
  }
}
