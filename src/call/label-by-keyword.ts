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
//   - keyword           : (string) the text string to be used as keyword
//   - keywordIgnoreCase : (string) whether or not to ignore cases in keyword matching, default is 'true'
//   - label             : (string) the name of the label already created in corresponding repository

import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export interface LabelByKeywordParams {
  keyword: string;
  keywordIgnoreCase: string;
  label: string;
}

export default async function labelByKeyword(
  app: Probot,
  context: any,
  resource: Resource,
  { keyword, keywordIgnoreCase, label }: LabelByKeywordParams,
): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;

  if (!keyword || !label) {
    app.log.error(`Invalid input, keyword: '${keyword}', label: '${label}'`);
    return;
  }

  const keywordIgnoreCaseProcess = keywordIgnoreCase?.trim() || 'true';
  const keywordProcess = keywordIgnoreCaseProcess === 'true' ? keyword.trim().toLowerCase() : keyword.trim();
  const labelProcess = label.trim();

  const eventName = String(context.name);
  if (eventName !== 'issues' && eventName !== 'pull_request') {
    app.log.error("Only 'issues' and 'pull_request' events are accepted here!");
    return;
  }

  const title = context.payload.issue?.title ?? context.payload.pull_request.title;
  const body = context.payload.issue?.body ?? context.payload.pull_request.body;

  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const issue_number = context.payload.issue?.number ?? context.payload.pull_request.number; // eslint-disable-line

  [title, body].forEach(async (text) => {
    const textProcess = keywordIgnoreCaseProcess === 'true' ? text.trim().toLowerCase() : text.trim();

    if (textProcess.includes(keywordProcess)) {
      app.log.info(`Keyword '${keyword}' found, keywordIgnoreCase = '${keywordIgnoreCaseProcess}', adding label '${labelProcess}'`);
      app.log.info(`Updating issue: ${owner}/${repo}/${issue_number}`);
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
  });
}
