// Name         : githubMergedPullsMonitor
// Description  : Monitors the CI workflows of merged pull requests, providing metrics that give an overview of whether pull requests were merged without passing CI checks.

import { Probot } from 'probot';
import { OpensearchClient } from '../utility/opensearchclient';

export default async function githubMergedPullsMonitor(app: Probot, context: any): Promise<void> {
  const pr = context.payload.pull_request;

  if (!pr.merged) {
    app.log.info('PR is closed but not merged. Skipping...');
    return;
  }

  const repoName = context.payload.repository?.name;
  const orgName = context.payload.organization?.login || context.payload.repository?.owner?.login;
  const headSha = pr.head.sha;

  const checkRuns = await context.octokit.checks.listForRef({
    owner: orgName,
    repo: repoName,
    ref: headSha,
  });

  const checksDetail = checkRuns.data.check_runs;

  const logDataArray: any[] = [];
  checksDetail.forEach(
    (check: { name: any; id: any; conclusion: any; status: any; started_at: any; completed_at: any; display_title: any; url: any; html_url: any }) => {
      const logData = {
        id: check.id,
        number: pr.number,
        html_url: pr.html_url,
        url: pr.url,
        user_login: pr.user.login,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        closed_at: pr.closed_at,
        merged_at: pr.merged_at,
        merged: pr.merged,
        merged_by: pr.merged_by.login,
        repository: repoName,
        organization: orgName,
        merge_commit_sha: pr.merge_commit_sha,
        head_sha: headSha,
        name: check.name,
        conclusion: check.conclusion,
        status: check.status,
        started_at: check.started_at,
        completed_at: check.completed_at,
        check_run_html_url: check.html_url,
        check_run_url: check.url,
      };

      logDataArray.push(logData);
    },
  );

  const [month, year] = [new Date().getMonth() + 1, new Date().getFullYear()].map((num) => String(num).padStart(2, '0'));

  try {
    await new OpensearchClient().bulkIndex(`github-pulls-ci-runs-checks-${month}-${year}`, logDataArray);
    app.log.info('All log data indexed successfully.');
  } catch (error) {
    app.log.error(`Error indexing log data: ${error}`);
  }
}
