import { Probot, ProbotOctokit } from 'probot';

export async function octokitAuth(app: Probot, installationId: number): Promise<ProbotOctokit> {
  return app.auth(installationId);
}
