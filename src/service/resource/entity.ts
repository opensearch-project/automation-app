import { ProbotOctokit } from 'probot';

export abstract class Entity {
  protected orgName: string;

  protected nodeId: string;

  protected context: any;

  constructor(orgName: string) {
    this.orgName = orgName;
  }

  public getOrgName(): string {
    return this.orgName;
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  public getContext(): any {
    return this.context;
  }

  // TODO: Pass func as argument to parent so octokit just declair once
  public abstract setContext(octokit: ProbotOctokit, ...params: string[]): void;
}
