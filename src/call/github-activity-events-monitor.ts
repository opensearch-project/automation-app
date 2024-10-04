/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : githubActivityEventsMonitor
// Description  : Indexes events pertaining to user activity to OpenSearch

import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';
import { OpensearchClient } from '../utility/opensearch/opensearch-client';

export default async function githubActivityEventsMonitor(app: Probot, context: any, resource: Resource): Promise<void> {
  if (!(await validateResourceConfig(app, context, resource))) return;

  const repoName = context.payload.repository?.name;
  const orgName = context.payload.organization?.login || context.payload.repository?.owner?.login;

  const event = {
    id: context.id,
    organization: orgName,
    repository: repoName,
    type: context.name,
    action: context.payload.action,
    sender: context.payload.sender?.login,
    created_at: new Date().toISOString(),
  };

  const client = await new OpensearchClient().getClient();

  const [month, year] = [new Date().getMonth() + 1, new Date().getFullYear()].map((num) => String(num).padStart(2, '0'));

  try {
    await client.index({
      index: `github-activity-events-${month}-${year}`,
      body: event,
    });
    app.log.info('Event indexed successfully.');
  } catch (error) {
    app.log.error(`Error indexing event: ${error}`);
  }
}
