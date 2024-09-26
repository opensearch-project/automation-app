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
  private organizationName: string; // uid

  private projects: Map<number, Project>;

  private repositories: Map<string, Repository>;

  constructor(orgName: string, projs: Map<number, Project>, repos: Map<string, Repository>) {
    super(orgName);
    this.organizationName = orgName;
    this.projects = projs;
    this.repositories = repos;
  }

  public addProject(proj: Project): void {
    this.projects = this.projects || new Map<number, Project>();
    this.projects.set(proj.getProjectNumber(), proj);
  }

  public addRepository(repo: Repository): void {
    this.repositories = this.repositories || new Map<string, Repository>();
    this.repositories.set(repo.getRepositoryName(), repo);
  }

  public getOrganizationName(): string {
    return this.organizationName;
  }

  public getProjects(): Map<number, Project> {
    return this.projects;
  }

  public getRepositories(): Map<string, Repository> {
    return this.repositories;
  }

  public async setContext(octokit: ProbotOctokit): Promise<void> {
    try {
      this.context = await octokit.rest.orgs.get({
        org: this.orgName,
      });
      console.log(`Set organization context: ${this.organizationName}`);
      this.nodeId = this.context.data.node_id;
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  }
}
