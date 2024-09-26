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
import { Project } from './project';
import { Repository } from './repository';

export class Organization extends Entity {
  private readonly _organizationName: string; // uid

  private _projects: Map<number, Project>;

  private _repositories: Map<string, Repository>;

  constructor(orgName: string, projs: Map<number, Project>, repos: Map<string, Repository>) {
    super(orgName);
    this._organizationName = orgName;
    this._projects = projs;
    this._repositories = repos;
  }

  public addProject(proj: Project): void {
    this._projects = this._projects || new Map<number, Project>();
    this._projects.set(proj.projectNumber, proj);
  }

  public addRepository(repo: Repository): void {
    this._repositories = this._repositories || new Map<string, Repository>();
    this._repositories.set(repo.repositoryName, repo);
  }

  public get organizationName(): string {
    return this._organizationName;
  }

  public get projects(): Map<number, Project> {
    return this._projects;
  }

  public get repositories(): Map<string, Repository> {
    return this._repositories;
  }

  public async setContext(octokit: ProbotOctokit): Promise<void> {
    try {
      this._context = await octokit.rest.orgs.get({
        org: this.orgName,
      });
      console.log(`Set organization context: ${this.organizationName}`);
      this._nodeId = this.context.data.node_id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }
}
