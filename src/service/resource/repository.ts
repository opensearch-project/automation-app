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

export class Repository extends Entity {
  private readonly _repositoryName: string; // uid

  constructor(orgName: string, repoName: string) {
    super(orgName);
    this._repositoryName = repoName;
  }

  public async setContext(octokit: ProbotOctokit): Promise<void> {
    try {
      this._context = await octokit.rest.repos.get({
        owner: this.orgName,
        repo: this.repositoryName,
      });
      console.log(`Set repository context: ${this.orgName}/${this.repositoryName}`);
      this._nodeId = this.context.data.node_id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }

  public get repositoryName(): string {
    return this._repositoryName;
  }
}
