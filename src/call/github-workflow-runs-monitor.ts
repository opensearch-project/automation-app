/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : githubWorkflowRunsMonitor
// Description  : prints the githubWorkflowRunsMonitor output and indexes logData to OpenSearch
// Arguments    :
//  - events     : The list of events to monitor and index, from https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows.

import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { OpensearchClient } from '../utility/opensearch/opensearch-client';
import { verifyOrgRepo } from '../utility/verification/verify-resource';

interface WorkflowRunMonitorArgs {
  events: string[];
}

export default async function githubWorkflowRunsMonitor(app: Probot, context: any, resource: Resource, { events }: WorkflowRunMonitorArgs): Promise<void> {
  if (!(await verifyOrgRepo(app, context, resource)) && !(await verifyOrgRepo(app, context, resource, true))) return;

  const job = context.payload.workflow_run;

  if (!events.includes(job?.event)) {
    app.log.info('Event not relevant. Not Indexing...');
    return;
  }

  const repoName = context.payload.repository?.name;
  const orgName = context.payload.organization?.login || context.payload.repository?.owner?.login;

  const logData = {
    event: job?.event,
    repository: repoName,
    organization: orgName,
    id: job?.id,
    name: job?.name,
    head_branch: job?.head_branch,
    head_sha: job?.head_sha,
    path: job?.path,
    display_title: job?.display_title,
    created_at: job?.created_at,
    run_started_at: job?.run_started_at,
    updated_at: job?.updated_at,
    completed_at: job?.completed_at,
    triggering_actor_login: job?.triggering_actor.login,
    triggering_actor_type: job?.triggering_actor.type,
    check_run_url: job?.url,
    check_run_html_url: job?.html_url,
    status: job?.status,
    conclusion: job?.conclusion,
    check_run_jobs_url: job?.jobs_url,
  };

  const client = await new OpensearchClient().getClient();

  const [month, year] = [new Date().getMonth() + 1, new Date().getFullYear()].map((num) => String(num).padStart(2, '0'));

  try {
    await client.index({
      index: `github-ci-workflow-runs-${month}-${year}`,
      body: logData,
    });
    app.log.info('Log data indexed successfully.');
  } catch (error) {
    app.log.error(`Error indexing log data: ${error}`);
  }
}
