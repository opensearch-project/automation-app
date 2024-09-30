/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ProbotOctokit } from 'probot';
import { Entity } from './entity';

export class Issue extends Entity {
  private readonly _issueNumber: number; // uid

  private _repositoryName: string;

  private readonly _isPull: boolean;

  constructor(orgName: string, repoName: string, issueNumber: number, isPull: boolean = false) {
    super(orgName);
    this._issueNumber = issueNumber;
    this._repositoryName = repoName;
    this._isPull = isPull;
  }

  public async setContext(octokit: ProbotOctokit): Promise<void> {
    try {
      if (this.isPull) {
        this._context = await octokit.rest.issues.get({
          owner: this.orgName,
          repo: this.repositoryName,
          issue_number: this.issueNumber,
        });
        console.log(`Set pull context: ${this.orgName}/${this.repositoryName}#${this.issueNumber}`);
      } else {
        this._context = await octokit.rest.pulls.get({
          owner: this.orgName,
          repo: this.repositoryName,
          pull_number: this.issueNumber,
        });
        console.log(`Set issue context: ${this.orgName}/${this.repositoryName}#${this.issueNumber}`);
      }
      this._nodeId = this.context.data.node_id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public get issueNumber(): number {
    return this._issueNumber;
  }

  public get repositoryName(): string {
    return this._repositoryName;
  }

  public get isPull(): boolean {
    return this._isPull;
  }
}
