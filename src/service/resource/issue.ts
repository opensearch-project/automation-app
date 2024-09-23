import { ProbotOctokit } from 'probot';
import { Entity } from './entity';

export class Issue extends Entity {
  private issueNumber: number; // uid

  private repositoryName: string;

  private isPull: boolean;

  constructor(orgName: string, repoName: string, issueNumber: number, isPull: boolean = false) {
    super(orgName);
    this.issueNumber = issueNumber;
    this.repositoryName = repoName;
    this.isPull = isPull;
  }

  public async setContext(octokit: ProbotOctokit): Promise<void> {
    try {
      if (this.isPull) {
        this.context = await octokit.rest.issues.get({
          owner: this.orgName,
          repo: this.repositoryName,
          issue_number: this.issueNumber,
        });
        console.log(`Set pull context: ${this.orgName}/${this.repositoryName}#${this.issueNumber}`);
      } else {
        this.context = await octokit.rest.pulls.get({
          owner: this.orgName,
          repo: this.repositoryName,
          pull_number: this.issueNumber,
        });
        console.log(
          `Set issue context: ${this.orgName}/${this.repositoryName}#${this.issueNumber}`,
        );
      }
      this.nodeId = this.context.data.node_id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public getIssueNumber(): number {
    return this.issueNumber;
  }

  public getRepositoryName(): string {
    return this.repositoryName;
  }

  public IsPull(): boolean {
    return this.isPull;
  }
}
