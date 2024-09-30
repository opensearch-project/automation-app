/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : createIssueComment
// Description  : create an issue comment as the app
// Arguments    :
//   - text     : (string) the text string to be written in comment
//   - tagUser  : (string) tag a specific user before the text

import { Probot } from 'probot';
import dedent from 'dedent';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export interface CreateIssueCommentParams {
  text: string;
}

export default async function createIssueComment(app: Probot, context: any, resource: Resource, { text }: CreateIssueCommentParams): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;
  const comment = await context.issue({ body: dedent`${text}` });
  await context.octokit.issues.createComment(comment);
}
