import { ProbotOctokit } from 'probot';
import { Entity } from './entity';

export class Repository extends Entity {
  private repositoryName: string; // uid

  constructor(orgName: string, repoName: string) {
    super(orgName);
    this.repositoryName = repoName;
  }

  public async setContext(octokit: ProbotOctokit): Promise<void> {
    try {
      this.context = await octokit.rest.repos.get({
        owner: this.orgName,
        repo: this.repositoryName,
      });
      console.log(`Set repository context: ${this.orgName}/${this.repositoryName}`);
      this.nodeId = this.context.data.node_id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public getRepositoryName(): string {
    return this.repositoryName;
  }
}
